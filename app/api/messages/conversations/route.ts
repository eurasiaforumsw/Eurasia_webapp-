import { NextRequest, NextResponse } from "next/server";
import pool, { db, query } from "@/lib/db";
import { verifyMemberToken, checkMemberSuspension } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages/conversations
 * Get all conversations for the logged-in member
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  const memberId = payload.memberId;

  // Check if member is suspended
  const suspension = await checkMemberSuspension(db, memberId);
  if (suspension.suspended) {
    const message = suspension.expiresAt
      ? `Your account is suspended until ${new Date(suspension.expiresAt).toLocaleString()}. Reason: ${suspension.reason}`
      : `Your account is permanently suspended. Reason: ${suspension.reason}`;
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    // Get all conversations where the member is a participant
    const { data: participants, error: participantsError } = await db
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("member_id", memberId)
      .execute();

    if (participantsError) {
      return NextResponse.json({ error: participantsError.message }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversationIds = participants.map((p) => p.conversation_id);

    // Get conversation details with last message
    const { data: conversations, error: conversationsError } = await db
      .from("conversations")
      .select("id, created_at, last_message_at")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .execute();

    if (conversationsError) {
      return NextResponse.json({ error: conversationsError.message }, { status: 500 });
    }

    // Build response with full conversation data
    const conversationData = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get the other participant(s) in the conversation
        const { rows: otherParticipants } = await query(`SELECT participant.member_id,
          json_build_object('id', member.id, 'full_name', member.full_name,
            'avatar_url', (to_jsonb(member)->>'avatar_url'), 'role', member.role) AS members
          FROM conversation_participants participant
          JOIN members member ON member.id = participant.member_id
          WHERE participant.conversation_id = $1 AND participant.member_id != $2`, [conv.id, memberId]);

        // Get last message preview
        const { data: lastMessage } = await db
          .from("messages")
          .select("id, content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .is("deleted_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const currentParticipant = participants.find((p) => p.conversation_id === conv.id);
        const lastReadAt = currentParticipant?.last_read_at;

        let unreadCount = 0;
        if (lastReadAt) {
          const { count } = await db
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", memberId)
            .gt("created_at", lastReadAt)
            .is("deleted_at", null)
          .gt("expires_at", new Date().toISOString())
            .execute();

          unreadCount = count || 0;
        } else {
          // If never read, count all messages from others
          const { count } = await db
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", memberId)
            .is("deleted_at", null)
          .gt("expires_at", new Date().toISOString())
            .execute();

          unreadCount = count || 0;
        }

        return {
          id: conv.id,
          createdAt: conv.created_at,
          lastMessageAt: conv.last_message_at,
          participants: (otherParticipants || []).map((p: any) => ({
            id: p.members.id,
            fullName: p.members.full_name,
            avatarUrl: p.members.avatar_url,
            role: p.members.role,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.created_at,
                senderId: lastMessage.sender_id,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationData.sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/messages/conversations
 * Create a new conversation with another member
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  const senderId = payload.memberId;

  // Check if sender is suspended
  const suspension = await checkMemberSuspension(db, senderId);
  if (suspension.suspended) {
    const message = suspension.expiresAt
      ? `Your account is suspended until ${new Date(suspension.expiresAt).toLocaleString()}. Reason: ${suspension.reason}`
      : `Your account is permanently suspended. Reason: ${suspension.reason}`;
    return NextResponse.json({ error: message }, { status: 403 });
  }

  // Parse request body
  let body: { recipientMemberId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const recipientMemberId = body.recipientMemberId;

  if (typeof recipientMemberId !== "string" || !recipientMemberId) {
    return NextResponse.json({ error: "recipientMemberId is required" }, { status: 400 });
  }

  if (recipientMemberId === senderId) {
    return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize creation for this member pair so simultaneous requests reuse one conversation.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [JSON.stringify([senderId, recipientMemberId].sort())]);
    const { rows: recipients } = await client.query(`SELECT id, status FROM members
      WHERE id = $1 AND status = 'active' AND NOT EXISTS (
        SELECT 1 FROM member_suspensions WHERE member_id = $1 AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW()))`, [recipientMemberId]);
    if (!recipients.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Recipient is unavailable" }, { status: 404 });
    }
    const { rows: existing } = await client.query(`SELECT conversation_id FROM conversation_participants
      GROUP BY conversation_id HAVING COUNT(*) = 2
      AND COUNT(*) FILTER (WHERE member_id = ANY($1::text[])) = 2 LIMIT 1`, [[senderId, recipientMemberId]]);
    if (existing.length) {
      await client.query("COMMIT");
      return NextResponse.json({ conversationId: existing[0].conversation_id, existed: true });
    }
    const { rows: conversations } = await client.query("INSERT INTO conversations DEFAULT VALUES RETURNING id");
    const conversationId = conversations[0].id;
    await client.query(`INSERT INTO conversation_participants (conversation_id, member_id)
      VALUES ($1, $2), ($1, $3)`, [conversationId, senderId, recipientMemberId]);
    await client.query("COMMIT");
    return NextResponse.json({ conversationId, existed: false });
  } catch (err) {
    await client.query("ROLLBACK");
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
