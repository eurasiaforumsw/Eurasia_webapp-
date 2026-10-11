import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface AdminMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  conversation_id: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  content: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
  contains_link: boolean;
  is_flagged: boolean;
}

interface AdminMessagesResponse {
  messages: AdminMessage[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats: {
    total_today: number;
    with_links: number;
    flagged: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';
    const filterType = searchParams.get('filterType') || 'all'; // all, with_links, flagged
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate pagination
    const offset = Math.max(0, (page - 1) * pageSize);
    const limit = Math.min(pageSize, 100);

    // Build base query
    let query = supabaseAdmin
      .from('messages')
      .select(
        `
        id,
        sender_id,
        conversation_id,
        content,
        created_at,
        read_at,
        deleted_at,
        conversations!inner(id),
        sender:members!messages_sender_id_fkey(id, full_name, email),
        conversation_participants(member_id)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null) // Only show non-deleted messages
      .order('created_at', { ascending: false });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `sender_id.ilike.%${searchLower}%,content.ilike.%${searchLower}%`
      );
    }

    // Get total count before pagination
    const countQuery = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact' })
      .is('deleted_at', null);

    if (countQuery.error) {
      return NextResponse.json(
        { error: 'Failed to fetch message count' },
        { status: 500 }
      );
    }

    const totalCount = countQuery.count || 0;

    // Apply pagination
    const { data: messages, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const statsQuery = await supabaseAdmin
      .from('messages')
      .select('content, created_at', { count: 'exact' })
      .is('deleted_at', null);

    const withLinksQuery = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact' })
      .is('deleted_at', null)
      .or('content.ilike.%http://%,content.ilike.%https://%');

    const todayQuery = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact' })
      .is('deleted_at', null)
      .gte('created_at', todayIso);

    // Check for flagged messages (basic spam detection)
    let flaggedCount = 0;
    if (messages) {
      flaggedCount = messages.filter((m: any) => {
        const content = m.content || '';
        // Simple spam detection
        const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        const hasExcessivePunctuation = /[!?]{3,}/.test(content);
        const hasRepeatingChars = /(.)\1{4,}/.test(content);
        const isTooShort = content.trim().length < 5;

        return (
          upperCaseRatio > 0.7 ||
          hasExcessivePunctuation ||
          hasRepeatingChars ||
          isTooShort
        );
      }).length;
    }

    // Process messages to include sender/recipient info
    const processedMessages: AdminMessage[] = (messages || []).map((msg: any) => {
      const hasLinks = /https?:\/\//.test(msg.content || '');
      const content = msg.content || '';
      const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
      const hasExcessivePunctuation = /[!?]{3,}/.test(content);
      const hasRepeatingChars = /(.)\1{4,}/.test(content);
      const isTooShort = content.trim().length < 5;

      const isFlagged =
        upperCaseRatio > 0.7 ||
        hasExcessivePunctuation ||
        hasRepeatingChars ||
        isTooShort;

      return {
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.full_name || 'Unknown',
        sender_email: msg.sender?.email || 'unknown@example.com',
        conversation_id: msg.conversation_id,
        content: msg.content,
        created_at: msg.created_at,
        read_at: msg.read_at,
        deleted_at: msg.deleted_at,
        contains_link: hasLinks,
        is_flagged: isFlagged,
        recipient_name: 'Conversation',
        recipient_email: msg.conversation_id,
      };
    });

    // Apply filter type after processing
    let filteredMessages = processedMessages;
    if (filterType === 'with_links') {
      filteredMessages = filteredMessages.filter((m) => m.contains_link);
    } else if (filterType === 'flagged') {
      filteredMessages = filteredMessages.filter((m) => m.is_flagged);
    }

    const response: AdminMessagesResponse = {
      messages: filteredMessages,
      total: count || 0,
      page,
      pageSize: limit,
      hasMore: offset + limit < (count || 0),
      stats: {
        total_today: todayQuery.count || 0,
        with_links: withLinksQuery.count || 0,
        flagged: flaggedCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
