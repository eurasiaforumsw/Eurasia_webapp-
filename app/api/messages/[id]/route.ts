import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyMemberToken, checkMemberSuspension } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/messages/[id]
 * Get all messages in a conversation
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  const memberId = payload.memberId;
  const conversationId = params.id;

  // Check if member is suspended
  const suspension = await checkMemberSuspension(supabaseAdmin, memberId);
  if (suspension.suspended) {
    const message = suspension.expiresAt
      ? `Your account is suspended until ${new Date(suspension.expiresAt).toLocaleString()}. Reason: ${suspension.reason}`
      : `Your account is permanently suspended. Reason: ${suspension.reason}`;
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    // Verify member is participant in this conversation
    const { data: participant } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this conversation" }, { status: 403 });
    }

    // Get messages with sender information
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select(`
        id,
        content,
        has_link,
        created_at,
        sender_id,
        sender:sender_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    // Update last_read_at for this member
    await supabaseAdmin
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("member_id", memberId);

    return NextResponse.json({
      messages: (messages || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        hasLink: msg.has_link,
        createdAt: msg.created_at,
        sender: {
          id: msg.sender.id,
          fullName: msg.sender.full_name,
          avatarUrl: msg.sender.avatar_url,
          role: msg.sender.role,
        },
        isOwn: msg.sender_id === memberId,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
