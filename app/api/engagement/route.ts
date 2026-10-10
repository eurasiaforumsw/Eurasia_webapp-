import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngagementSummary = {
  likeCount: number;
  saveCount: number;
  viewCount: number;
  shareCount: number;
  userEngagement: {
    liked: boolean;
    saved: boolean;
  };
};

/**
 * GET /api/engagement?contentId=xxx&memberId=yyy
 * Returns engagement summary for a content item, including:
 * - Total counts (likes, saves, views, shares)
 * - User-specific engagement status (liked/saved)
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const contentId = searchParams.get("contentId");
  const memberId = searchParams.get("memberId");

  if (!contentId) {
    return NextResponse.json({ error: "contentId is required" }, { status: 400 });
  }

  try {
    // Query the content_engagement_summary view
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from("content_engagement_summary")
      .select("total_likes, total_saves, total_views, total_shares")
      .eq("content_id", contentId)
      .maybeSingle();

    if (summaryError) throw summaryError;

    // Default counts if content has no engagement yet
    const likeCount = summary?.total_likes ?? 0;
    const saveCount = summary?.total_saves ?? 0;
    const viewCount = summary?.total_views ?? 0;
    const shareCount = summary?.total_shares ?? 0;

    // Check user's personal engagement (if memberId provided)
    let liked = false;
    let saved = false;

    if (memberId) {
      // Check if user liked this content
      const { data: likeData } = await supabaseAdmin
        .from("content_likes")
        .select("id")
        .eq("content_id", contentId)
        .eq("member_id", memberId)
        .maybeSingle();

      liked = !!likeData;

      // Check if user saved this content
      const { data: saveData } = await supabaseAdmin
        .from("member_interests")
        .select("id")
        .eq("content_id", contentId)
        .eq("member_id", memberId)
        .maybeSingle();

      saved = !!saveData;
    }

    const response: EngagementSummary = {
      likeCount,
      saveCount,
      viewCount,
      shareCount,
      userEngagement: {
        liked,
        saved,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
