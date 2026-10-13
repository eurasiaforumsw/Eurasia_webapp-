import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { analyticsCount, analyticsError, analyticsRows, analyticsWindow } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const window = analyticsWindow(request);
    const count = (table: string, timestamp?: string, start?: Date, end?: Date, event?: string) => {
      let query = supabaseAdmin.from(table).select("id", { count: "exact", head: true });
      if (timestamp && start) query = query.gte(timestamp, start.toISOString());
      if (timestamp && end) query = query.lt(timestamp, end.toISOString());
      if (event) query = query.eq("event_type", event);
      return analyticsCount(query, table);
    };
    const today = new Date(window.now);
    today.setUTCHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setUTCDate(week.getUTCDate() - 6);
    const month = new Date(today);
    month.setUTCDate(month.getUTCDate() - 29);
    const metrics = async (table: string, timestamp: string, event?: string) => {
      const metricCount = (start?: Date, end?: Date) => count(table, timestamp, start, end, event);
      const [total, day, lastWeek, lastMonth, period, previous] = await Promise.all([
        metricCount(), metricCount(today), metricCount(week), metricCount(month),
        metricCount(window.start), metricCount(window.previousStart, window.start),
      ]);
      return { total, today: day, week: lastWeek, month: lastMonth, period, previous };
    };
    const [totalMembers, newMembers, membersBefore, content, likes, saves, views, shares, activeSessions, academicLikes, academicViews] = await Promise.all([
      count("members"), count("members", "joined_at", window.start),
      count("members", "joined_at", undefined, window.start),
      analyticsRows<{ kind: string }>(() => supabaseAdmin.from("content")
        .select("kind").eq("status", "published").order("id"), "Published content"),
      metrics("content_likes", "created_at"), metrics("member_interests", "created_at"),
      metrics("content_views", "viewed_at"), metrics("content_shares", "shared_at"),
      analyticsCount(supabaseAdmin.from("member_sessions").select("id", { count: "exact", head: true })
        .eq("is_active", true).gte("expires_at", window.now.toISOString()), "Active sessions"),
      metrics("academic_document_engagement", "occurred_at", "like"),
      metrics("academic_document_engagement", "occurred_at", "view"),
    ]);
    for (const metric of ["total", "today", "week", "month", "period", "previous"] as const) {
      likes[metric] += academicLikes[metric];
      views[metric] += academicViews[metric];
    }
    return NextResponse.json({ range: window.range,
      members: { total: totalMembers, growth: membersBefore > 0 ? newMembers / membersBefore * 100 : 0, newInPeriod: newMembers },
      content: { total: content.length, news: content.filter((item) => item.kind === "news").length,
        events: content.filter((item) => item.kind === "event").length,
        academic: content.filter((item) => item.kind === "academic" || item.kind === "document").length },
      engagement: { likes, saves, views, shares }, sessions: { active: activeSessions }, timestamp: window.now.toISOString() });
  } catch (error) {
    return analyticsError(error, "Analytics overview error");
  }
}
