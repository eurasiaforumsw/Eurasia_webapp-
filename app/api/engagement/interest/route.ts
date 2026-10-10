import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InterestRow = {
  id: string;
  member_id: string;
  content_id: string;
  created_at: string;
  notes: string | null;
};

/** Run a Supabase thenable with a 10s timeout so we fail fast when the table
 *  doesn't exist yet (instead of hanging the request forever). */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out — check that the member_interests table exists`)), 10_000),
    ),
  ]);

/** Log member activity to audit trail */
const logActivity = async (
  memberId: string,
  actionType: "save" | "unsave",
  contentId: string,
  ipAddress?: string,
) => {
  try {
    await withTimeout(
      () =>
        supabaseAdmin!.from("member_activity").insert({
          member_id: memberId,
          action_type: actionType,
          content_id: contentId,
          ip_address: ipAddress || null,
          created_at: new Date().toISOString(),
        }),
      "logActivity",
    );
  } catch (error) {
    // Non-critical - log but don't fail the request
    console.error("Failed to log activity:", error);
  }
};

/** Get client IP address from request headers */
const getClientIP = (request: NextRequest): string | undefined => {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || undefined;
};

/**
 * POST /api/engagement/interest
 *
 * Toggle save/bookmark for a member on a content item.
 *
 * Request body:
 * {
 *   memberId: string (UUID)
 *   contentId: string (UUID)
 * }
 *
 * Response:
 * {
 *   saved: boolean (true if saved, false if unsaved)
 *   saveCount: number (total saves for this content)
 * }
 */
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const memberId = String(payload.memberId ?? "").trim();
    const contentId = String(payload.contentId ?? "").trim();
    const clientIP = getClientIP(request);

    // Validate required fields
    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }
    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 });
    }

    // Basic UUID validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(memberId)) {
      return NextResponse.json({ error: "Invalid memberId format" }, { status: 400 });
    }
    if (!uuidPattern.test(contentId)) {
      return NextResponse.json({ error: "Invalid contentId format" }, { status: 400 });
    }

    // Check if member exists
    const { data: memberExists, error: memberError } = await withTimeout(
      () => supabaseAdmin!.from("members").select("id").eq("id", memberId).maybeSingle(),
      "checkMember",
    );
    if (memberError) {
      throw new Error(`Member check failed: ${memberError.message}`);
    }
    if (!memberExists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if content exists
    const { data: contentExists, error: contentError } = await withTimeout(
      () => supabaseAdmin!.from("content").select("id").eq("id", contentId).maybeSingle(),
      "checkContent",
    );
    if (contentError) {
      throw new Error(`Content check failed: ${contentError.message}`);
    }
    if (!contentExists) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check if interest already exists
    const { data: existingInterest, error: checkError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("member_interests")
          .select("*")
          .eq("member_id", memberId)
          .eq("content_id", contentId)
          .maybeSingle(),
      "checkInterest",
    );

    if (checkError) {
      throw new Error(`Interest check failed: ${checkError.message}`);
    }

    let saved: boolean;

    if (existingInterest) {
      // Interest exists - DELETE it (unsave)
      const { error: deleteError } = await withTimeout(
        () =>
          supabaseAdmin!
            .from("member_interests")
            .delete()
            .eq("member_id", memberId)
            .eq("content_id", contentId),
        "deleteInterest",
      );

      if (deleteError) {
        throw new Error(`Failed to unsave: ${deleteError.message}`);
      }

      saved = false;

      // Log unsave activity
      await logActivity(memberId, "unsave", contentId, clientIP);
    } else {
      // Interest doesn't exist - INSERT it (save)
      const { error: insertError } = await withTimeout(
        () =>
          supabaseAdmin!.from("member_interests").insert({
            member_id: memberId,
            content_id: contentId,
            created_at: new Date().toISOString(),
          }),
        "insertInterest",
      );

      if (insertError) {
        throw new Error(`Failed to save: ${insertError.message}`);
      }

      saved = true;

      // Log save activity
      await logActivity(memberId, "save", contentId, clientIP);
    }

    // Count total saves for this content
    const { count: saveCount, error: countError } = await withTimeout(
      () => supabaseAdmin!.from("member_interests").select("*", { count: "exact", head: true }).eq("content_id", contentId),
      "countInterests",
    );

    if (countError) {
      throw new Error(`Failed to count saves: ${countError.message}`);
    }

    return NextResponse.json({
      saved,
      saveCount: saveCount ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Interest toggle error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/engagement/interest
 *
 * Two modes:
 * 1. Get all saved items for a member: ?memberId=xxx
 * 2. Check specific save status: ?memberId=xxx&contentId=yyy
 *
 * Query params:
 * - memberId: string (UUID, required)
 * - contentId: string (UUID, optional)
 *
 * Response (all items):
 * {
 *   interests: Array<{
 *     id: string
 *     memberId: string
 *     contentId: string
 *     createdAt: string
 *     notes: string | null
 *   }>
 * }
 *
 * Response (single check):
 * {
 *   saved: boolean
 *   saveCount: number
 * }
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const memberId = searchParams.get("memberId")?.trim();
    const contentId = searchParams.get("contentId")?.trim();

    // Validate required fields
    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // MODE 1: Get all saved items for member
    if (!contentId) {
      const { data: interests, error: fetchError } = await withTimeout(
        () =>
          supabaseAdmin!
            .from("member_interests")
            .select("id, member_id, content_id, created_at, notes")
            .eq("member_id", memberId)
            .order("created_at", { ascending: false }),
        "fetchAllInterests",
      );

      if (fetchError) {
        throw new Error(`Failed to fetch interests: ${fetchError.message}`);
      }

      // Transform to camelCase
      const transformed = (interests || []).map((row: InterestRow) => ({
        id: row.id,
        memberId: row.member_id,
        contentId: row.content_id,
        createdAt: row.created_at,
        notes: row.notes,
      }));

      return NextResponse.json({ interests: transformed });
    }

    // MODE 2: Check if specific content is saved
    const { data: interest, error: checkError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("member_interests")
          .select("*")
          .eq("member_id", memberId)
          .eq("content_id", contentId)
          .maybeSingle(),
      "checkInterest",
    );

    if (checkError) {
      throw new Error(`Interest check failed: ${checkError.message}`);
    }

    // Count total saves for this content
    const { count: saveCount, error: countError } = await withTimeout(
      () => supabaseAdmin!.from("member_interests").select("*", { count: "exact", head: true }).eq("content_id", contentId),
      "countInterests",
    );

    if (countError) {
      throw new Error(`Failed to count saves: ${countError.message}`);
    }

    return NextResponse.json({
      saved: !!interest,
      saveCount: saveCount ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Interest check error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
