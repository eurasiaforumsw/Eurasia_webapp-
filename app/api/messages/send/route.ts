import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, detectSpam, validateMessageLength } from '@/lib/message-rate-limit';
import { checkMemberSuspension } from '@/lib/member-suspension';
import { verifyRequestSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session?.memberId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const conversationId = body.conversationId ?? body.conversation_id;
  const { content } = body;
  const senderId = session.memberId;
  if (body.senderId !== undefined && body.senderId !== senderId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    // 1. Validate required fields
    if (typeof conversationId !== 'string' || !conversationId ||
        typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Check if member is suspended
    const suspensionCheck = await checkMemberSuspension(senderId);
    if (suspensionCheck.isSuspended) {
      return NextResponse.json(
        {
          error: 'Member is suspended',
          suspension: suspensionCheck.details,
        },
        { status: 403 }
      );
    }

    // 3. Validate message length
    const lengthValidation = validateMessageLength(content);
    if (!lengthValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid message length',
          length: lengthValidation.length,
          maxLength: lengthValidation.maxLength,
        },
        { status: 400 }
      );
    }

    // 4. Check for spam
    if (detectSpam(content)) {
      return NextResponse.json(
        { error: 'Message detected as spam' },
        { status: 400 }
      );
    }

    // 5. Check rate limit
    const rateLimitCheck = await checkRateLimit(senderId);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          message: `You can send another message in ${rateLimitCheck.retryAfter} seconds`,
        },
        { status: 429 }
      );
    }

    // 6. Verify sender is a participant in the conversation
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('member_id', senderId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Sender is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // 7. Check messaging rules (Member → Admin: text only)
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if sender is admin
    const { data: senderMember } = await supabaseAdmin
      .from('members')
      .select('role')
      .eq('id', senderId)
      .single();

    const isAdmin = senderMember?.role === 'admin';

    // If not admin, validate message doesn't contain links
    if (!isAdmin) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      if (urlRegex.test(content)) {
        return NextResponse.json(
          { error: 'Members can only send text messages. Links are not allowed.' },
          { status: 400 }
        );
      }
    }

    // 8. Insert the message
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });

  } catch (error) {
    console.error('Error in send message API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
