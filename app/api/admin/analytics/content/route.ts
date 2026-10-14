import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { analyticsError, analyticsRows, analyticsWindow } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentRow = { id: string; title: string; kind: string; author: string | null; status: string; created_at: string };

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const window = analyticsWindow(request);
    const [content, likes, views, saves] = await Promise.all([
      analyticsRows<ContentRow>(() => db.from("content")
        .select("id, title, kind, author, status, created_at").order("id"), "Content"),
      ...[["content_likes", "created_at"], ["content_views", "viewed_at"], ["member_interests", "created_at"]]
        .map(([table, timestamp]) => analyticsRows<{ content_id: string }>(() => db.from(table)
          .select("content_id").gte(timestamp, window.start.toISOString())
          .lte(timestamp, window.now.toISOString()).order("id"), table)),
    ]);
    const academicEvents = await analyticsRows<{ content_id: string; event_type: string }>(() => db
      .from("academic_document_engagement").select("content_id, event_type")
      .gte("occurred_at", window.start.toISOString()).lte("occurred_at", window.now.toISOString()).order("id"), "Academic engagement");
    academicEvents.forEach((event) => {
      if (event.event_type === "like") likes.push(event);
      if (event.event_type === "view") views.push(event);
    });
    const ranked = (events: { content_id: string }[]) => {
      const counts = new Map<string, number>();
      events.forEach((event) => counts.set(event.content_id, (counts.get(event.content_id) || 0) + 1));
      return content.filter((item) => counts.has(item.id))
        .map((item) => ({ ...item, count: counts.get(item.id)! }))
        .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)).slice(0, 10);
    };
    const distribution = (field: "kind" | "status") => {
      const counts: Record<string, number> = {};
      content.forEach((item) => { counts[item[field]] = (counts[item[field]] || 0) + 1; });
      return Object.entries(counts).map(([value, count]) => ({ [field]: value, count }));
    };
    return NextResponse.json({ range: window.range, topLiked: ranked(likes), topViewed: ranked(views),
      topSaved: ranked(saves), byType: distribution("kind"), byStatus: distribution("status") });
  } catch (error) {
    return analyticsError(error, "Analytics content error");
  }
}
