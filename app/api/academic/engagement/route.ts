import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { academicEngagement } from "@/app/api/admin/analytics/academic/_data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentRow = { id: string; kind: string; status: string; file_url: string | null; publish_at: string | null;
  expires_at: string | null; target_membership_types: string[] | null; target_groups: string[] | null };

function isPublicDocument(document: DocumentRow) {
  const now = Date.now();
  return ["academic", "document"].includes(document.kind) && document.status === "published"
    && (!document.publish_at || Date.parse(document.publish_at) <= now)
    && (!document.expires_at || Date.parse(document.expires_at) >= now)
    && !document.target_membership_types?.length && !document.target_groups?.length;
}

async function publicDocuments(ids: string[]) {
  const { data, error } = await supabaseAdmin.from("content")
    .select("id, kind, status, file_url, publish_at, expires_at, target_membership_types, target_groups").in("id", ids);
  if (error) throw new Error(error.message);
  return (data as DocumentRow[] || []).filter(isPublicDocument);
}

function isVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.has("id") ? request.nextUrl.searchParams.getAll("id")
    : request.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const visitorId = request.nextUrl.searchParams.get("visitorId");
  if (!ids.length || ids.length > 100 || ids.some((id) => !id || id.length > 200)) {
    return NextResponse.json({ error: "Provide between 1 and 100 document IDs" }, { status: 400 });
  }
  try {
    const documents = await publicDocuments(ids);
    const stats = await academicEngagement(documents.map((document) => document.id), isVisitorId(visitorId) ? visitorId : undefined);
    return NextResponse.json({ items: Object.values(stats) });
  } catch (error) {
    console.error("Academic engagement read failed:", error);
    return NextResponse.json({ error: "Document statistics could not be loaded" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: { contentId?: unknown; visitorId?: unknown; action?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { contentId, visitorId, action } = body;
  if (typeof contentId !== "string" || !contentId || contentId.length > 200 || !isVisitorId(visitorId)
      || typeof action !== "string" || !["view", "download", "like", "unlike"].includes(action)) {
    return NextResponse.json({ error: "Invalid document engagement" }, { status: 400 });
  }
  try {
    const [document] = await publicDocuments([contentId]);
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    if (action === "download" && !document.file_url) {
      return NextResponse.json({ error: "Document has no attachment" }, { status: 400 });
    }
    if (action === "unlike") {
      const { error } = await supabaseAdmin.from("academic_document_engagement").delete()
        .eq("content_id", contentId).eq("visitor_id", visitorId).eq("event_type", "like");
      if (error) throw new Error(error.message);
    } else {
      const interval = action === "view" ? 30 * 60 * 1000 : 60 * 1000;
      const bucket = action === "like" ? "like" : String(Math.floor(Date.now() / interval));
      const { error } = await supabaseAdmin.from("academic_document_engagement").upsert({
        content_id: contentId, visitor_id: visitorId, event_type: action, bucket_key: bucket,
      }, { onConflict: "content_id,visitor_id,event_type,bucket_key", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    const stats = await academicEngagement([contentId], visitorId);
    return NextResponse.json({ item: stats[contentId] });
  } catch (error) {
    console.error("Academic engagement write failed:", error);
    return NextResponse.json({ error: "Document activity could not be saved" }, { status: 500 });
  }
}
