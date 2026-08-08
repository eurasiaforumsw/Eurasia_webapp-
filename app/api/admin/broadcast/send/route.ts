// app/api/admin/broadcast/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, createBroadcastEmail } from '@/lib/resend-email';

const BATCH_SIZE = 50; // Resend batch limit
const RATE_LIMIT_DELAY = 1000; // 1 second between batches

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdmin(request);

    const body = await request.json();
    const { broadcastId } = body;

    if (!broadcastId) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get broadcast
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

    if (broadcast.status === 'completed') {
      return NextResponse.json(
        { error: 'Broadcast already completed' },
        { status: 400 }
      );
    }

    // Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .select('id, member_id, email')
      .eq('broadcast_id', broadcastId)
      .eq('status', 'pending');

    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No pending recipients found' },
        { status: 400 }
      );
    }

    // Update broadcast status to 'sending'
    await supabase
      .from('broadcasts')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
      })
      .eq('id', broadcastId);

    // Prepare email HTML
    const emailHtml = createBroadcastEmail(broadcast.subject, broadcast.body);

    // Send emails in batches
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      for (const recipient of batch) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: broadcast.subject,
            html: emailHtml,
          });

          // Update recipient status
          await supabase
            .from('broadcast_recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', recipient.id);

          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);

          // Update recipient status
          await supabase
            .from('broadcast_recipients')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', recipient.id);

          failedCount++;
        }
      }

      // Rate limiting: wait between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    // Update broadcast with final counts
    const pendingCount = recipients.length - sentCount - failedCount;
    const status = pendingCount === 0 && failedCount === 0 ? 'completed' :
                   failedCount > 0 ? 'failed' : 'sending';

    await supabase
      .from('broadcasts')
      .update({
        sent_count: broadcast.sent_count + sentCount,
        failed_count: broadcast.failed_count + failedCount,
        pending_count: pendingCount,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', broadcastId);

    // Log activity
    await supabase.from('activity_logs').insert({
      actor_id: admin.id,
      actor_name: admin.email,
      action: 'broadcast_sent',
      resource_type: 'broadcast',
      resource_id: broadcastId,
      details: {
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
      },
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      pending: pendingCount,
      status,
    });

  } catch (error) {
    console.error('Broadcast send error:', error);

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
      { error: 'Broadcast send failed' },
      { status: 500 }
    );
  }
}
