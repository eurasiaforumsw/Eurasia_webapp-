import { NextRequest, NextResponse } from "next/server";
import { verifyMemberToken, checkMemberSuspension } from "@/lib/auth/jwt";
import { db, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await verifyMemberToken(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const suspension = await checkMemberSuspension(db, session.memberId);
    if (suspension.suspended) return NextResponse.json({ error: "Account is suspended" }, { status: 403 });
    const { rows } = await query<{ count: string }>(`SELECT COUNT(*) AS count
      FROM messages message
      JOIN conversation_participants participant ON participant.conversation_id = message.conversation_id
      WHERE participant.member_id = $1 AND message.sender_id != $1
        AND message.deleted_at IS NULL AND message.expires_at > NOW()
        AND (participant.last_read_at IS NULL OR message.created_at > participant.last_read_at)`, [session.memberId]);
    return NextResponse.json({ unreadCount: Number(rows[0]?.count || 0) });
  } catch (error) {
    console.error("Unable to load unread message count:", error);
    return NextResponse.json({ error: "Unable to load unread message count" }, { status: 500 });
  }
}
