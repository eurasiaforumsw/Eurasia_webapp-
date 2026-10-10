import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyMemberToken, checkMemberSuspension } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages/conversations
 * Get all conversations for the logged-in member
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  const memberId = payload.memberId;

  // Check if member is suspended
  const suspension = await checkMemberSuspension(supabaseAdmin, memberId);
  if (suspension.suspended) {
    const message = suspension.expiresAt
      ? `Your account is suspended until ${new Date(suspension.expiresAt).toLocaleString()}. Reason: ${suspension.reason}`
      : `Your account is permanently suspended. Reason: ${suspension.reason}`;
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    // Get all conversations where the member is a participant
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("member_id", memberId);

    if (participantsError) {
      return NextResponse.json({ error: participantsError.message }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversationIds = participants.map((p) => p.conversation_id);

    // Get conversation details with last message
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from("conversations")
      .select("id, created_at, last_message_at")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (conversationsError) {
      return NextResponse.json({ error: conversationsError.message }, { status: 500 });
    }

    // Build response with full conversation data
    const conversationData = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get the other participant(s) in the conversation
        const { data: otherParticipants } = await supabaseAdmin
          .from("conversation_participants")
          .select(`
            member_id,
            members:member_id (
              id,
              full_name,
              avatar_url,
              role
            )
          `)
          .eq("conversation_id", conv.id)
          .neq("member_id", memberId);

        // Get last message preview
        const { data: lastMessage } = await supabaseAdmin
          .from("messages")
          .select("id, content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const currentParticipant = participants.find((p) => p.conversation_id === conv.id);
        const lastReadAt = currentParticipant?.last_read_at;

        let unreadCount = 0;
        if (lastReadAt) {
          const { count } = await supabaseAdmin
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", memberId)
            .gt("created_at", lastReadAt)
            .is("deleted_at", null);

          unreadCount = count || 0;
        } else {
          // If never read, count all messages from others
          const { count } = await supabaseAdmin
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", memberId)
            .is("deleted_at", null);

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
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  const senderId = payload.memberId;

  // Check if sender is suspended
  const suspension = await checkMemberSuspension(supabaseAdmin, senderId);
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

  if (!recipientMemberId) {
    return NextResponse.json({ error: "recipientMemberId is required" }, { status: 400 });
  }

  if (recipientMemberId === senderId) {
    return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
  }

  // Check if recipient exists and is active
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("members")
    .select("id, status")
    .eq("id", recipientMemberId)
    .maybeSingle();

  if (recipientError || !recipient) {
    return NextResponse.json({ error: "Recipient member not found" }, { status: 404 });
  }

  if (recipient.status === "suspended") {
    return NextResponse.json({ error: "Cannot message suspended members" }, { status: 400 });
  }

  try {
    // Check if conversation already exists between these two members
    const { data: existingParticipants } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .in("member_id", [senderId, recipientMemberId]);

    if (existingParticipants && existingParticipants.length > 0) {
      // Find conversation where both members are participants
      const conversationCounts = new Map<string, number>();
      existingParticipants.forEach((p) => {
        conversationCounts.set(p.conversation_id, (conversationCounts.get(p.conversation_id) || 0) + 1);
      });

      for (const [convId, count] of conversationCounts) {
        if (count === 2) {
          // Conversation already exists
          return NextResponse.json({
            conversationId: convId,
            existed: true,
          });
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabaseAdmin
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (createError || !newConversation) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    // Add both members as participants
    const { error: participantsError } = await supabaseAdmin.from("conversation_participants").insert([
      {
        conversation_id: newConversation.id,
        member_id: senderId,
      },
      {
        conversation_id: newConversation.id,
        member_id: recipientMemberId,
      },
    ]);

    if (participantsError) {
      // Rollback: delete the conversation
      await supabaseAdmin.from("conversations").delete().eq("id", newConversation.id);
      return NextResponse.json({ error: "Failed to add participants" }, { status: 500 });
    }

    return NextResponse.json({
      conversationId: newConversation.id,
      existed: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
