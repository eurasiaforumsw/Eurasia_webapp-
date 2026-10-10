import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  has_link: boolean;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor'); // created_at timestamp

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get authenticated user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, is_admin')
      .eq('auth_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member is suspended
    const { data: activeSuspension } = await supabase
      .from('member_suspensions')
      .select('*')
      .eq('member_id', member.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();

    if (activeSuspension) {
      return NextResponse.json(
        {
          error: 'Access denied - Account suspended',
          suspension: {
            reason: activeSuspension.reason_category,
            detail: activeSuspension.reason_detail,
            expires_at: activeSuspension.expires_at,
            is_permanent: activeSuspension.suspension_type === 'permanent',
          },
        },
        { status: 403 }
      );
    }

    // Verify user is participant of this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('member_id', member.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Access denied - Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Build messages query with pagination
    let messagesQuery = supabase
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        has_link,
        created_at,
        sender:members!sender_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `
      )
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor-based pagination
    if (cursor) {
      messagesQuery = messagesQuery.gt('created_at', cursor);
    }

    const { data: messages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Get the last message's created_at as the next cursor
    const nextCursor =
      hasMore && paginatedMessages.length > 0
        ? paginatedMessages[paginatedMessages.length - 1].created_at
        : null;

    // Update last_read_at for the requester
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('member_id', member.id);

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
