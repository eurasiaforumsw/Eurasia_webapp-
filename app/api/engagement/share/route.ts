import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SharePlatform =
  | "facebook"
  | "line"
  | "kakao"
  | "whatsapp"
  | "telegram"
  | "email"
  | "twitter"
  | "linkedin"
  | "copy_link";

interface ShareRequestBody {
  contentId: string;
  platform: SharePlatform;
  memberId?: string;
}

const VALID_PLATFORMS: SharePlatform[] = [
  "facebook",
  "line",
  "kakao",
  "whatsapp",
  "telegram",
  "email",
  "twitter",
  "linkedin",
  "copy_link",
];

const getClientInfo = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
};

/** Run a Supabase thenable with a 10s timeout */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), 10_000),
    ),
  ]);

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database service is not configured" }, { status: 503 });
  }

  let body: Partial<ShareRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { contentId, platform, memberId } = body;

  // Validate required fields
  if (!contentId || typeof contentId !== "string") {
    return NextResponse.json({ error: "contentId is required and must be a string" }, { status: 400 });
  }

  if (!platform || typeof platform !== "string") {
    return NextResponse.json({ error: "platform is required and must be a string" }, { status: 400 });
  }

  if (!VALID_PLATFORMS.includes(platform as SharePlatform)) {
    return NextResponse.json(
      {
        error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate memberId if provided
  if (memberId !== undefined && typeof memberId !== "string") {
    return NextResponse.json({ error: "memberId must be a string if provided" }, { status: 400 });
  }

  const { ipAddress } = getClientInfo(request);

  try {
    // Verify content exists
    const { data: content, error: contentError } = await withTimeout(
      () => supabaseAdmin!.from("content").select("id").eq("id", contentId).maybeSingle(),
      "contentCheck",
    );

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 });
    }

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify member exists if memberId provided
    if (memberId) {
      const { data: member, error: memberError } = await withTimeout(
        () => supabaseAdmin!.from("members").select("id").eq("id", memberId).maybeSingle(),
        "memberCheck",
      );

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
    }

    // Insert share record
    const { error: insertError } = await withTimeout(
      () =>
        supabaseAdmin!.from("content_shares").insert({
          content_id: contentId,
          platform,
          member_id: memberId || null,
          ip_address: ipAddress,
          shared_at: new Date().toISOString(),
        }),
      "insertShare",
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert member activity if memberId present
    if (memberId) {
      await withTimeout(
        () =>
          supabaseAdmin!.from("member_activity").insert({
            member_id: memberId,
            action_type: "share",
            content_id: contentId,
            metadata: { platform },
            ip_address: ipAddress,
            created_at: new Date().toISOString(),
          }),
        "insertActivity",
      ).catch(() => {
        // Activity logging is non-critical, log but don't fail the request
        console.warn("Failed to log member activity for share event");
      });
    }

    return NextResponse.json({
      success: true,
      message: "Share event recorded successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
