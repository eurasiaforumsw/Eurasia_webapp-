import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth/session';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  has_link: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface PaginatedResponse {
  messages: Message[];
  pagination: {
    limit: number;
    cursor: string | null;
    has_more: boolean;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit') || '50');
    const limit = Number.isInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 50;
    const cursor = searchParams.get('cursor'); // created_at timestamp
    if (cursor && !Number.isFinite(Date.parse(cursor))) {
      return NextResponse.json({ error: 'Invalid message cursor' }, { status: 400 });
    }

    // Get authenticated session
    const session = await verifyRequestSession(request);
    if (!session?.memberId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const memberId = session.memberId;

    // Check if member is suspended
    const { rows: suspensionRows } = await query(
      `SELECT reason_category, reason_details, expires_at, suspension_type
       FROM member_suspensions
       WHERE member_id = $1 AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [memberId]
    );

    if (suspensionRows.length > 0) {
      const suspension = suspensionRows[0];
      return NextResponse.json(
        {
          error: 'Access denied - Account suspended',
          suspension: {
            reason: suspension.reason_category,
            detail: suspension.reason_details,
            expires_at: suspension.expires_at,
            is_permanent: suspension.suspension_type === 'permanent',
          },
        },
        { status: 403 }
      );
    }

    // Verify user is participant of this conversation
    const { rows: participantRows } = await query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND member_id = $2',
      [conversationId, memberId]
    );

    if (participantRows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied - Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Build messages query with pagination
    let messagesQuery = `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.has_link,
        m.created_at,
        json_build_object(
          'id', mem.id,
          'full_name', mem.full_name,
          'email', mem.email,
          'avatar_url', (to_jsonb(mem)->>'avatar_url')
        ) as sender
      FROM messages m
      LEFT JOIN members mem ON m.sender_id = mem.id
      WHERE m.conversation_id = $1
        AND m.deleted_at IS NULL
        AND m.expires_at > NOW()
    `;

    const queryParams: any[] = [conversationId];

    if (cursor) {
      messagesQuery += ` AND m.created_at > $${queryParams.length + 1}`;
      queryParams.push(cursor);
    }

    messagesQuery += ` ORDER BY m.created_at ASC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit + 1);

    const { rows: messages } = await query(messagesQuery, queryParams);

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Get the last message's created_at as the next cursor
    const nextCursor =
      hasMore && paginatedMessages.length > 0
        ? paginatedMessages[paginatedMessages.length - 1].created_at
        : null;

    // Update last_read_at for the requester
    await query(
      `UPDATE conversation_participants
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND member_id = $2`,
      [conversationId, memberId]
    );

    // Format response
    const response: PaginatedResponse = {
      messages: paginatedMessages as any,
      pagination: {
        limit,
        cursor: nextCursor,
        has_more: hasMore,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Conversation messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
