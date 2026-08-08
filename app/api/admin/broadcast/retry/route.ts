// app/api/admin/broadcast/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, createBroadcastEmail } from '@/lib/resend-email';

const MAX_RETRY_COUNT = 3;

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

    // Get failed recipients with retry count < 3
    const { data: failedRecipients, error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .select('id, member_id, email, retry_count')
      .eq('broadcast_id', broadcastId)
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRY_COUNT);

    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    if (!failedRecipients || failedRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No failed recipients to retry' },
        { status: 400 }
      );
    }

    // Prepare email HTML
    const emailHtml = createBroadcastEmail(broadcast.subject, broadcast.body);

    let sentCount = 0;
    let stillFailedCount = 0;

    for (const recipient of failedRecipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: broadcast.subject,
          html: emailHtml,
        });

        // Update recipient status to sent
        await supabase
          .from('broadcast_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error: null,
            retry_count: recipient.retry_count + 1,
          })
          .eq('id', recipient.id);

        sentCount++;
      } catch (error) {
        console.error(`Retry failed for ${recipient.email}:`, error);

        // Update retry count and error
        await supabase
          .from('broadcast_recipients')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            retry_count: recipient.retry_count + 1,
          })
          .eq('id', recipient.id);

        stillFailedCount++;
      }

      // Small delay between individual sends
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update broadcast counts
    await supabase
      .from('broadcasts')
      .update({
        sent_count: broadcast.sent_count + sentCount,
        failed_count: broadcast.failed_count - sentCount,
      })
      .eq('id', broadcastId);

    // Log activity
    await supabase.from('activity_logs').insert({
      actor_id: admin.id,
      actor_name: admin.email,
      action: 'broadcast_retry',
      resource_type: 'broadcast',
      resource_id: broadcastId,
      details: {
        retried: failedRecipients.length,
        sent: sentCount,
        still_failed: stillFailedCount,
      },
    });

    return NextResponse.json({
      success: true,
      retried: failedRecipients.length,
      sent: sentCount,
      failed: stillFailedCount,
    });

  } catch (error) {
    console.error('Broadcast retry error:', error);

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
      { error: 'Broadcast retry failed' },
      { status: 500 }
    );
  }
}
