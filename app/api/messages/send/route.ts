import { NextRequest, NextResponse } from "next/server";
import { verifyMemberToken, checkMemberSuspension } from "@/lib/auth/jwt";
import { supabaseAdmin } from "@/lib/supabase";
import {
  checkMessageRateLimit,
  recordMessageAttempt,
} from "@/lib/messaging/rate-limit";
import {
  moderateMessage,
  containsLinks,
  canSendLinks,
} from "@/lib/messaging/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SendMessageBody {
  conversation_id: string;
  content: string;
}

/**
 * POST /api/messages/send
 * Send a new message to a conversation
 *
 * Validation steps:
 * 1. Check if sender is suspended
 * 2. Verify sender is participant of conversation
 * 3. Check rate limit
 * 4. Detect if message contains links (only admins can send links)
 * 5. Basic profanity/spam filter
 * 6. Insert message with 180-day expiration
 * 7. Update conversation metadata
 * 8. Record rate limit attempt
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json(
      { error: "Authentication required. Please log in." },
      { status: 401 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Messaging service is not configured" },
      { status: 503 }
    );
  }

  // Parse request body
  let body: SendMessageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { conversation_id, content } = body;

  if (!conversation_id || !content) {
    return NextResponse.json(
      { error: "conversation_id and content are required" },
      { status: 400 }
    );
  }

  const senderId = payload.memberId;
  const senderRole = payload.role;

  try {
    // ==========================================
    // STEP 1: Check if sender is suspended
    // ==========================================
    const suspensionCheck = await checkMemberSuspension(supabaseAdmin, senderId);
    if (suspensionCheck.suspended) {
      return NextResponse.json(
        {
          error: "Your account has been suspended and cannot send messages",
          suspended: true,
          reason: suspensionCheck.reason,
          expiresAt: suspensionCheck.expiresAt,
        },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 2: Verify sender is participant
    // ==========================================
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("member_id", senderId)
      .maybeSingle();

    if (participantError) {
      console.error("Participant check error:", participantError);
      return NextResponse.json(
        { error: "Failed to verify conversation access" },
        { status: 500 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this conversation" },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Check rate limit
    // ==========================================
    const rateLimitCheck = await checkMessageRateLimit(senderId);
    if (!rateLimitCheck.allowed) {
      // Record failed attempt (escalate delay)
      await recordMessageAttempt(senderId, false);

      return NextResponse.json(
        {
          error: `You are sending messages too quickly. Please wait ${rateLimitCheck.retryAfter} seconds before sending another message.`,
          rateLimited: true,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // ==========================================
    // STEP 4: Check if message contains links
    // ==========================================
    if (containsLinks(content)) {
      if (!canSendLinks(senderRole)) {
        return NextResponse.json(
          {
            error: "Only administrators can send messages with links",
            reason: "links_not_allowed",
          },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // STEP 5: Basic profanity/spam filter
    // ==========================================
    const moderationResult = moderateMessage(content);
    if (!moderationResult.allowed) {
      return NextResponse.json(
        {
          error: moderationResult.reason,
          flags: moderationResult.flags,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 6: Insert message with 180-day expiration
    // ==========================================
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);

    const { data: message, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id,
        sender_id: senderId,
        content,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Message insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // ==========================================
    // STEP 7: Update conversation metadata
    // ==========================================
    const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;

    const { error: updateError } = await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
      })
      .eq("id", conversation_id);

    if (updateError) {
      console.error("Conversation update error:", updateError);
      // Don't fail the request, message was sent successfully
    }

    // ==========================================
    // STEP 8: Record successful send (rate limit tracking)
    // ==========================================
    await recordMessageAttempt(senderId, true);

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        messageId: message.id,
        expiresAt: message.expires_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the message" },
      { status: 500 }
    );
  }
}
