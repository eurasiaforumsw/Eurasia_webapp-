import { supabaseAdmin } from "@/lib/supabase";
import { analyticsRows } from "../_shared";

type EventRow = { content_id: string; visitor_id: string; event_type: "view" | "download" | "like" };

export async function academicEngagement(ids: string[], visitorId?: string) {
  const stats = Object.fromEntries(ids.map((id) => [id, {
    contentId: id, viewCount: 0, downloadCount: 0, likeCount: 0, liked: false,
  }]));
  if (!ids.length) return stats;
  // Small batches keep the PostgREST URL below proxy length limits.
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100);
    const events = await analyticsRows<EventRow>(() => supabaseAdmin.from("academic_document_engagement")
      .select("content_id, visitor_id, event_type").in("content_id", batch).order("id"), "Academic engagement");
    events.forEach((event) => {
      const stat = stats[event.content_id];
      if (!stat) return;
      if (event.event_type === "view") stat.viewCount++;
      if (event.event_type === "download") stat.downloadCount++;
      if (event.event_type === "like") {
        stat.likeCount++;
        if (event.visitor_id === visitorId) stat.liked = true;
      }
    });
  }
  return stats;
}
