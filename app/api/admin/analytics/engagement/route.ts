import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { analyticsError, analyticsRows, analyticsWindow } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const window = analyticsWindow(request);
    const sources = [
      ["content_likes", "created_at"], ["member_interests", "created_at"],
      ["content_views", "viewed_at"], ["members", "joined_at"],
    ];
    const data = await Promise.all(sources.map(([table, timestamp]) =>
      analyticsRows<Record<string, string>>(() => db.from(table)
        .select(timestamp).gte(timestamp, window.start.toISOString())
        .lte(timestamp, window.now.toISOString()).order("id"), table),
    ));
    const academicEvents = await analyticsRows<{ event_type: string; occurred_at: string }>(() => db
      .from("academic_document_engagement").select("event_type, occurred_at")
      .gte("occurred_at", window.start.toISOString()).lte("occurred_at", window.now.toISOString()).order("id"), "Academic engagement");
    academicEvents.forEach((event) => {
      if (event.event_type === "like") data[0].push({ created_at: event.occurred_at });
      if (event.event_type === "view") data[2].push({ viewed_at: event.occurred_at });
    });
    const aggregate = (rows: Record<string, string>[], timestamp: string) => {
      const counts: Record<string, number> = {};
      rows.forEach((row) => {
        const date = row[timestamp].slice(0, 10);
        counts[date] = (counts[date] || 0) + 1;
      });
      return Array.from({ length: window.days }, (_, index) => {
        const date = new Date(window.start);
        date.setUTCDate(date.getUTCDate() + index);
        const day = date.toISOString().slice(0, 10);
        return { date: day, value: counts[day] || 0 };
      });
    };
    return NextResponse.json({
      range: window.range,
      likes: aggregate(data[0], "created_at"),
      saves: aggregate(data[1], "created_at"),
      views: aggregate(data[2], "viewed_at"),
      newMembers: aggregate(data[3], "joined_at"),
    });
  } catch (error) {
    return analyticsError(error, "Analytics engagement error");
  }
}
