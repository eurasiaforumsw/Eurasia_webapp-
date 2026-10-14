import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession, type Session } from "@/lib/auth/session";
import { db, sql } from "@/lib/db";

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
  const result = await db.from("members").select("id").in("id", ids).execute();
  return !result.error && (result.data || []).length === ids.length;
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
  try {
    const session = await verifyRequestSession(req);
    if (!session) return fail("Unauthorized", 401);
    const inbox = req.nextUrl.searchParams.get("inbox") === "true";
    if (canManage(session) && !inbox) {
      const result = await db.from("admin_announcements").select("*")
        .order("created_at", { ascending: false }).limit(200).execute();
      if (result.error) return fail("Failed to load announcements", 500);
      const ids = (result.data || []).map((item) => item.id);
      const reads = ids.length ? await db.from("admin_announcement_reads")
        .select("announcement_id, member_id").in("announcement_id", ids).execute() : { data: [], error: null };
      if (reads.error) return fail("Failed to load announcement reads", 500);
      const readMap = new Map<string, string[]>();
      for (const read of reads.data || []) readMap.set(read.announcement_id, [...(readMap.get(read.announcement_id) || []), read.member_id]);
      return NextResponse.json({ announcements: (result.data || []).map((row) => mapAnnouncement(row, readMap.get(row.id) || [])) });
    }
    if (!session.memberId) return fail("Forbidden", 403);
    const now = new Date().toISOString();
    const [allResult, personalResult] = await Promise.all([
      db.from("admin_announcements").select("*").eq("recipient_type", "all").gt("expires_at", now).order("created_at", { ascending: false }).limit(100).execute(),
      db.from("admin_announcements").select("*").eq("recipient_type", "individual").where(sql`recipient_ids @> ARRAY[${session.memberId}]::text[]`).gt("expires_at", now).order("created_at", { ascending: false }).limit(100).execute(),
    ]);
    if (allResult.error || personalResult.error) return fail("Failed to load announcements", 500);
    const rows = [...(allResult.data || []), ...(personalResult.data || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const ids = rows.map((row) => row.id);
    const reads = ids.length ? await db.from("admin_announcement_reads")
      .select("announcement_id, read_at").eq("member_id", session.memberId).in("announcement_id", ids).execute() : { data: [], error: null };
    if (reads.error) return fail("Failed to load announcement reads", 500);
    const readMap = new Map((reads.data || []).map((row) => [row.announcement_id, row.read_at]));
    return NextResponse.json({ announcements: rows.map((row) => mapAnnouncement(row, [], readMap.get(row.id) || null)) });
  } catch (error) {
    console.error("announcements GET error:", error);
    return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const result = await db.from("admin_announcements").insert({
      subject, body, recipient_type: audience.recipientType,
      recipient_ids: audience.recipientIds,
      created_by: session.memberId || null, created_by_actor: session.email,
      created_at: now.toISOString(), expires_at: expires.toISOString(),
    }).select("*");
    if (result.error) return fail("Failed to create announcement", 500);
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!data) return fail("Failed to create announcement", 500);
    return NextResponse.json({ announcement: mapAnnouncement(data) }, { status: 201 });
  } catch (error) {
    console.error("announcements POST error:", error);
    return NextResponse.json({ error: "Failed to save announcements" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyRequestSession(req);
    if (!session) return fail("Unauthorized", 401);
    const input = await req.json().catch(() => null);
    if (typeof input?.announcementId !== "string" || !uuid.test(input.announcementId)) return fail("Invalid announcement ID", 400);
    if (session.memberId && input.read === true) {
      const announcementResult = await db.from("admin_announcements")
        .select("id, recipient_type, recipient_ids, expires_at").eq("id", input.announcementId).execute();
      if (announcementResult.error) return fail("Failed to load announcement", 500);
      const announcement = announcementResult.data?.[0];
      if (!announcement || new Date(announcement.expires_at).getTime() <= Date.now() ||
          (announcement.recipient_type !== "all" && !announcement.recipient_ids?.includes(session.memberId))) return fail("Announcement not found", 404);
      const readResult = await db.from("admin_announcement_reads")
        .upsert({ announcement_id: announcement.id, member_id: session.memberId }, { onConflict: "announcement_id,member_id", ignoreDuplicates: true })
        .select("read_at");
      if (readResult.error) return fail("Failed to mark announcement read", 500);
      const data = Array.isArray(readResult.data) ? readResult.data[0] : readResult.data;
      return NextResponse.json({ readAt: data?.read_at || new Date().toISOString() });
    }
    if (!canManage(session)) return fail("Forbidden", 403);
    const subject = typeof input.subject === "string" ? input.subject.trim() : "";
    const body = typeof input.body === "string" ? input.body.trim() : "";
    const audience = await validatedAudience(input);
    if (!subject || subject.length > 200 || !body || body.length > 20000 || !audience) return fail("Invalid announcement fields", 400);
    const rpcResult = await db.rpc("edit_admin_announcement", {
      p_id: input.announcementId,
      p_subject: subject,
      p_body: body,
      p_recipient_type: audience.recipientType,
      p_recipient_ids: audience.recipientIds,
    });
    if (rpcResult.error) return fail("Failed to update announcement", 500);
    if (!rpcResult.data) return fail("Announcement not found", 404);
    const loadResult = await db.from("admin_announcements")
      .select("*").eq("id", input.announcementId).execute();
    if (loadResult.error) return fail("Announcement updated but could not be loaded", 500);
    const data = loadResult.data?.[0];
    if (!data) return fail("Announcement not found", 404);
    return NextResponse.json({ announcement: mapAnnouncement(data) });
  } catch (error) {
    console.error("announcements PATCH error:", error);
    return NextResponse.json({ error: "Failed to save announcements" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyRequestSession(req);
    if (!session) return fail("Unauthorized", 401);
    if (!canManage(session)) return fail("Forbidden", 403);
    const input = await req.json().catch(() => null);
    if (typeof input?.announcementId !== "string" || !uuid.test(input.announcementId)) return fail("Invalid announcement ID", 400);

    // Check if exists first
    const checkResult = await db.from("admin_announcements")
      .select("id").eq("id", input.announcementId).execute();
    if (checkResult.error) return fail("Failed to delete announcement", 500);
    if (!checkResult.data?.[0]) return fail("Announcement not found", 404);

    // Then delete
    const result = await db.from("admin_announcements")
      .delete().eq("id", input.announcementId).execute();
    if (result.error) return fail("Failed to delete announcement", 500);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("announcements DELETE error:", error);
    return NextResponse.json({ error: "Failed to save announcements" }, { status: 500 });
  }
}
