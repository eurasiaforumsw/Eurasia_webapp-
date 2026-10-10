import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting map: key = memberId:contentId, value = { count, resetAt }
const LIKE_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

const checkRateLimit = (key: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();

  // Clean up expired entries
  for (const [k, record] of LIKE_ATTEMPTS) {
    if (now > record.resetAt) LIKE_ATTEMPTS.delete(k);
  }

  const record = LIKE_ATTEMPTS.get(key);
  if (!record) return { allowed: true, remaining: MAX_ATTEMPTS };

  if (now > record.resetAt) {
    LIKE_ATTEMPTS.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
};

const recordAttempt = (key: string) => {
  const now = Date.now();
  const record = LIKE_ATTEMPTS.get(key);

  if (record && now <= record.resetAt) {
    record.count += 1;
    return;
  }

  LIKE_ATTEMPTS.set(key, { count: 1, resetAt: now + WINDOW_MS });
};

type LikeToggleInput = {
  memberId: string;
  contentId: string;
};

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Engagement service is not configured" },
      { status: 503 }
    );
  }

  let body: Partial<LikeToggleInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { memberId, contentId } = body;

  if (!memberId || !contentId) {
    return NextResponse.json(
      { error: "memberId and contentId are required" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(memberId) || !uuidRegex.test(contentId)) {
    return NextResponse.json(
      { error: "Invalid UUID format for memberId or contentId" },
      { status: 400 }
    );
  }

  // Rate limiting
  const rateLimitKey = `${memberId}:${contentId}`;
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many like/unlike attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    // Check if like exists
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from("content_likes")
      .select("id")
      .eq("member_id", memberId)
      .eq("content_id", contentId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: `Database error: ${checkError.message}` },
        { status: 500 }
      );
    }

    let liked: boolean;
    let actionType: "like" | "unlike";

    if (existingLike) {
      // Unlike: Delete the like
      const { error: deleteError } = await supabaseAdmin
        .from("content_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        return NextResponse.json(
          { error: `Failed to unlike: ${deleteError.message}` },
          { status: 500 }
        );
      }

      liked = false;
      actionType = "unlike";
    } else {
      // Like: Insert new like
      const { error: insertError } = await supabaseAdmin
        .from("content_likes")
        .insert({
          member_id: memberId,
          content_id: contentId,
        });

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to like: ${insertError.message}` },
          { status: 500 }
        );
      }

      liked = true;
      actionType = "like";
    }

    // Get total like count for this content
    const { count: likeCount, error: countError } = await supabaseAdmin
      .from("content_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_id", contentId);

    if (countError) {
      console.error("Failed to count likes:", countError);
    }

    // Record activity in member_activity table
    const { error: activityError } = await supabaseAdmin
      .from("member_activity")
      .insert({
        member_id: memberId,
        action_type: actionType,
        content_id: contentId,
        metadata: {
          timestamp: new Date().toISOString(),
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      });

    if (activityError) {
      console.error("Failed to record activity:", activityError);
      // Don't fail the request if activity logging fails
    }

    recordAttempt(rateLimitKey);

    return NextResponse.json({
      liked,
      likeCount: likeCount ?? 0,
      action: actionType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Like toggle error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
