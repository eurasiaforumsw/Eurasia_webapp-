import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { CONTENT_ROLES, verifyRequestSession } from "@/lib/auth/session";

export async function contentViewer(request: Request) {
  const session = await verifyRequestSession(request instanceof NextRequest ? request : new NextRequest(request));
  if (session && CONTENT_ROLES.includes(session.role)) return { editor: true, membership: null, groups: [] as string[] };
  if (session?.role === "member") {
    const { rows } = await query("SELECT membership_type, target_groups FROM members WHERE id = $1 AND status = 'active'", [session.id]);
    if (rows[0]) return { editor: false, membership: rows[0].membership_type as string, groups: (rows[0].target_groups || []) as string[] };
  }
  return { editor: false, membership: null, groups: [] as string[] };
}

export function canReadContent(row: any, viewer: Awaited<ReturnType<typeof contentViewer>>, allowEditor = true) {
  if (allowEditor && viewer.editor) return true;
  if (row.status !== "published" || (row.publish_at && Date.parse(row.publish_at) > Date.now()) ||
      (row.expires_at && Date.parse(row.expires_at) < Date.now())) return false;
  const memberships: string[] = row.target_membership_types || [];
  const groups: string[] = row.target_groups || [];
  return (!memberships.length || !!viewer.membership && memberships.includes(viewer.membership)) &&
    (!groups.length || viewer.groups.some((group) => groups.includes(group)));
}
