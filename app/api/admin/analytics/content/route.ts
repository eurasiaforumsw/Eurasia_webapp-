import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentAnalytics = {
  topLiked: ContentItem[];
  topViewed: ContentItem[];
  topSaved: ContentItem[];
  byType: TypeDistribution[];
  byStatus: StatusDistribution[];
};

type ContentItem = {
  id: string;
  title: string;
  kind: string;
  author: string | null;
  count: number;
  status: string;
  created_at: string;
};

type TypeDistribution = {
  kind: string;
  count: number;
};

type StatusDistribution = {
  status: string;
  count: number;
};

/**
 * GET /api/admin/analytics/content
 * Returns content analytics for admin dashboard
 * Requires admin role
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role
    await requireRole(req, ["admin"]);

    // Top 10 most liked content
    const { data: topLiked, error: likedError } = await supabaseAdmin.rpc(
      "get_top_liked_content",
      { limit_count: 10 }
    );

    if (likedError) {
      console.error("Error fetching top liked content:", likedError);
    }

    // Top 10 most viewed content
    const { data: topViewed, error: viewedError } = await supabaseAdmin.rpc(
      "get_top_viewed_content",
      { limit_count: 10 }
    );

    if (viewedError) {
      console.error("Error fetching top viewed content:", viewedError);
    }

    // Top 10 most saved content
    const { data: topSaved, error: savedError } = await supabaseAdmin.rpc(
      "get_top_saved_content",
      { limit_count: 10 }
    );

    if (savedError) {
      console.error("Error fetching top saved content:", savedError);
    }

    // Content by type distribution
    const { data: byType, error: typeError } = await supabaseAdmin
      .from("content")
      .select("kind")
      .then(({ data, error }) => {
        if (error) return { data: null, error };

        const distribution = data?.reduce((acc: Record<string, number>, item) => {
          acc[item.kind] = (acc[item.kind] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          data: Object.entries(distribution || {}).map(([kind, count]) => ({
            kind,
            count,
          })),
          error: null,
        };
      });

    if (typeError) {
      console.error("Error fetching type distribution:", typeError);
    }

    // Content by status distribution
    const { data: byStatus, error: statusError } = await supabaseAdmin
      .from("content")
      .select("status")
      .then(({ data, error }) => {
        if (error) return { data: null, error };

        const distribution = data?.reduce((acc: Record<string, number>, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          data: Object.entries(distribution || {}).map(([status, count]) => ({
            status,
            count,
          })),
          error: null,
        };
      });

    if (statusError) {
      console.error("Error fetching status distribution:", statusError);
    }

    const analytics: ContentAnalytics = {
      topLiked: topLiked || [],
      topViewed: topViewed || [],
      topSaved: topSaved || [],
      byType: byType || [],
      byStatus: byStatus || [],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    console.error("/api/admin/analytics/content error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
