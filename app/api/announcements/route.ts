import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession, type Session } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";

const MANAGERS = new Set(["super-admin", "admin", "pr"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(error: string, status: number) { return NextResponse.json({ error }, { status }); }
function canManage(session: Session) { return MANAGERS.has(session.role); }

function mapAnnouncement(row: Record<string, any>, readBy: string[] = [], readAt: string | null = null) {
  return {
    id: row.id, subject: row.subject, body: row.body,
    recipientType: row.recipient_type, recipientIds: row.recipient_ids || [],
    createdAt: row.created_at, expiresAt: row.expires_at,
    status: new Date(row.expires_at).getTime() > Date.now() ? "active" : "expired",
    readBy, readAt,
  };
}

async function existingRecipientIds(ids: string[]): Promise<boolean> {
  if (!ids.length) return false;
  const { data, error } = await supabaseAdmin.from("members").select("id").in("id", ids);
  return !error && (data || []).length === ids.length;
}

async function validatedAudience(input: any): Promise<{ recipientType: "all" | "individual"; recipientIds: string[] } | null> {
  const recipientType = input?.recipientType;
  const recipientIds = input?.recipientIds || [];
  if (!["all", "individual"].includes(recipientType) || !Array.isArray(recipientIds) || recipientIds.length > 100 ||
      recipientIds.some((id: unknown) => typeof id !== "string" || id.length > 200) ||
      (recipientType === "all" && recipientIds.length > 0)) return null;
  const uniqueIds = [...new Set(recipientIds)] as string[];
  if (recipientType === "individual" && (!uniqueIds.length || !await existingRecipientIds(uniqueIds))) return null;
  return { recipientType, recipientIds: uniqueIds };
}

export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return fail("Unauthorized", 401);
  const inbox = req.nextUrl.searchParams.get("inbox") === "true";
  if (canManage(session) && !inbox) {
    const { data, error } = await supabaseAdmin.from("admin_announcements").select("*")
      .order("created_at", { ascending: false }).limit(200);
    if (error) return fail("Failed to load announcements", 500);
    const ids = (data || []).map((item) => item.id);
    const reads = ids.length ? await supabaseAdmin.from("admin_announcement_reads")
      .select("announcement_id, member_id").in("announcement_id", ids) : { data: [], error: null };
    if (reads.error) return fail("Failed to load announcement reads", 500);
    const readMap = new Map<string, string[]>();
    for (const read of reads.data || []) readMap.set(read.announcement_id, [...(readMap.get(read.announcement_id) || []), read.member_id]);
    return NextResponse.json({ announcements: (data || []).map((row) => mapAnnouncement(row, readMap.get(row.id) || [])) });
  }
  if (!session.memberId) return fail("Forbidden", 403);
  const now = new Date().toISOString();
  const [allResult, personalResult] = await Promise.all([
    supabaseAdmin.from("admin_announcements").select("*").eq("recipient_type", "all").gt("expires_at", now).order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("admin_announcements").select("*").eq("recipient_type", "individual").contains("recipient_ids", [session.memberId]).gt("expires_at", now).order("created_at", { ascending: false }).limit(100),
  ]);
  if (allResult.error || personalResult.error) return fail("Failed to load announcements", 500);
  const rows = [...(allResult.data || []), ...(personalResult.data || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const ids = rows.map((row) => row.id);
  const reads = ids.length ? await supabaseAdmin.from("admin_announcement_reads")
    .select("announcement_id, read_at").eq("member_id", session.memberId).in("announcement_id", ids) : { data: [], error: null };
  if (reads.error) return fail("Failed to load announcement reads", 500);
  const readMap = new Map((reads.data || []).map((row) => [row.announcement_id, row.read_at]));
  return NextResponse.json({ announcements: rows.map((row) => mapAnnouncement(row, [], readMap.get(row.id) || null)) });
}

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return fail("Unauthorized", 401);
  if (!canManage(session)) return fail("Forbidden", 403);
  const input = await req.json().catch(() => null);
  const subject = typeof input?.subject === "string" ? input.subject.trim() : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  const audience = await validatedAudience(input);
  if (!subject || subject.length > 200 || !body || body.length > 20000 ||
      !audience) return fail("Invalid announcement fields", 400);
  const now = new Date();
  const expires = new Date(now.getTime() + 120 * 86400000);
  const { data, error } = await supabaseAdmin.from("admin_announcements").insert({
    subject, body, recipient_type: audience.recipientType,
    recipient_ids: audience.recipientIds,
    created_by: session.memberId || null, created_by_actor: session.email,
    created_at: now.toISOString(), expires_at: expires.toISOString(),
  }).select("*").single();
  if (error) return fail("Failed to create announcement", 500);
  return NextResponse.json({ announcement: mapAnnouncement(data) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (typeof input?.announcementId !== "string" || !uuid.test(input.announcementId)) return fail("Invalid announcement ID", 400);
  if (session.memberId && input.read === true) {
    const { data: announcement, error } = await supabaseAdmin.from("admin_announcements")
      .select("id, recipient_type, recipient_ids, expires_at").eq("id", input.announcementId).maybeSingle();
    if (error) return fail("Failed to load announcement", 500);
    if (!announcement || new Date(announcement.expires_at).getTime() <= Date.now() ||
        (announcement.recipient_type !== "all" && !announcement.recipient_ids?.includes(session.memberId))) return fail("Announcement not found", 404);
    const { data, error: readError } = await supabaseAdmin.from("admin_announcement_reads")
      .upsert({ announcement_id: announcement.id, member_id: session.memberId }, { onConflict: "announcement_id,member_id", ignoreDuplicates: true })
      .select("read_at").maybeSingle();
    if (readError) return fail("Failed to mark announcement read", 500);
    return NextResponse.json({ readAt: data?.read_at || new Date().toISOString() });
  }
  if (!canManage(session)) return fail("Forbidden", 403);
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const audience = await validatedAudience(input);
  if (!subject || subject.length > 200 || !body || body.length > 20000 || !audience) return fail("Invalid announcement fields", 400);
  const { data: edited, error } = await supabaseAdmin.rpc("edit_admin_announcement", {
    p_id: input.announcementId,
    p_subject: subject,
    p_body: body,
    p_recipient_type: audience.recipientType,
    p_recipient_ids: audience.recipientIds,
  });
  if (error) return fail("Failed to update announcement", 500);
  if (!edited) return fail("Announcement not found", 404);
  const { data, error: loadError } = await supabaseAdmin.from("admin_announcements")
    .select("*").eq("id", input.announcementId).single();
  if (loadError) return fail("Announcement updated but could not be loaded", 500);
  return NextResponse.json({ announcement: mapAnnouncement(data) });
}

export async function DELETE(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return fail("Unauthorized", 401);
  if (!canManage(session)) return fail("Forbidden", 403);
  const input = await req.json().catch(() => null);
  if (typeof input?.announcementId !== "string" || !uuid.test(input.announcementId)) return fail("Invalid announcement ID", 400);
  const { data, error } = await supabaseAdmin.from("admin_announcements")
    .delete().eq("id", input.announcementId).select("id").maybeSingle();
  if (error) return fail("Failed to delete announcement", 500);
  if (!data) return fail("Announcement not found", 404);
  return NextResponse.json({ success: true });
}
