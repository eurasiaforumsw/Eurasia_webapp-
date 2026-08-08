// app/api/admin/broadcast/status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const broadcastId = params.id;

    if (!broadcastId) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Get recipient breakdown
    const { data: recipients, error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .select('id, member_id, email, status, sent_at, error, retry_count')
      .eq('broadcast_id', broadcastId)
      .order('sent_at', { ascending: false, nullsFirst: false });

    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const sentRecipients = recipients?.filter(r => r.status === 'sent') || [];
    const failedRecipients = recipients?.filter(r => r.status === 'failed') || [];
    const pendingRecipients = recipients?.filter(r => r.status === 'pending') || [];

    return NextResponse.json({
      success: true,
      broadcast: {
        id: broadcast.id,
        type: broadcast.type,
        subject: broadcast.subject,
        body: broadcast.body,
        recipientType: broadcast.recipient_type,
        totalRecipients: broadcast.total_recipients,
        sentCount: broadcast.sent_count,
        failedCount: broadcast.failed_count,
        pendingCount: broadcast.pending_count,
        status: broadcast.status,
        createdAt: broadcast.created_at,
        startedAt: broadcast.started_at,
        completedAt: broadcast.completed_at,
      },
      statistics: {
        sent: sentRecipients.length,
        failed: failedRecipients.length,
        pending: pendingRecipients.length,
        total: recipients?.length || 0,
        successRate: recipients?.length ?
          Math.round((sentRecipients.length / recipients.length) * 100) : 0,
      },
      recipients: recipients?.map(r => ({
        id: r.id,
        email: r.email,
        status: r.status,
        sentAt: r.sent_at,
        error: r.error,
        retryCount: r.retry_count,
      })),
    });

  } catch (error) {
    console.error('Broadcast status error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch broadcast status' },
      { status: 500 }
    );
  }
}
