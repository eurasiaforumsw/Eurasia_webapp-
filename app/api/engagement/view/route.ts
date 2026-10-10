import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ViewRecord = {
  id: string;
  content_id: string;
  visitor_id: string;
  viewed_at: string;
};

/** Run a Supabase thenable with a 10s timeout so we fail fast when the table
 *  doesn't exist yet (instead of hanging the request forever). */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out — check that content_views table exists`)), 10_000),
    ),
  ]);

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Engagement service is not configured" }, { status: 503 });
  }

  let body: { visitorId?: string; contentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const visitorId = String(body.visitorId ?? "").trim();
  const contentId = String(body.contentId ?? "").trim();

  if (!visitorId || !contentId) {
    return NextResponse.json({ error: "visitorId and contentId are required" }, { status: 400 });
  }

  try {
    // Check if view exists within last 30 minutes to prevent double-counting
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentView, error: checkError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("content_views")
          .select("id")
          .eq("content_id", contentId)
          .eq("visitor_id", visitorId)
          .gte("viewed_at", thirtyMinutesAgo)
          .maybeSingle(),
      "recentViewCheck",
    );

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    // If no recent view exists, record a new one
    if (!recentView) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      const userAgent = request.headers.get("user-agent") || undefined;
      const referrer = request.headers.get("referer") || undefined;

      const { error: insertError } = await withTimeout(
        () =>
          supabaseAdmin!.from("content_views").insert({
            content_id: contentId,
            visitor_id: visitorId,
            ip_address: ip,
            user_agent: userAgent,
            referrer: referrer,
          }),
        "insertView",
      );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Get total view count for this content
    const { count, error: countError } = await withTimeout(
      () => supabaseAdmin!.from("content_views").select("*", { count: "exact", head: true }).eq("content_id", contentId),
      "viewCount",
    );

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    return NextResponse.json({
      viewCount: count ?? 0,
      recorded: !recentView,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
