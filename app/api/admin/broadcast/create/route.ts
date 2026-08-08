// app/api/admin/broadcast/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdmin(request);

    const body = await request.json();
    const { type, contentId, subject, body: emailBody, recipientType } = body;

    // Validation
    if (!type || !subject || !emailBody || !recipientType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['news', 'document', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid broadcast type' },
        { status: 400 }
      );
    }

    if (!['all', 'professional', 'student', 'institutional'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'Invalid recipient type' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get recipients based on type
    let query = supabase
      .from('members')
      .select('id, email, first_name, last_name')
      .eq('status', 'active');

    if (recipientType !== 'all') {
      query = query.eq('member_type', recipientType);
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Create broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        type,
        content_id: contentId || null,
        subject,
        body: emailBody,
        recipient_type: recipientType,
        total_recipients: recipients.length,
        sent_count: 0,
        failed_count: 0,
        pending_count: recipients.length,
        status: 'draft',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Failed to create broadcast:', broadcastError);
      return NextResponse.json(
        { error: 'Failed to create broadcast' },
        { status: 500 }
      );
    }

    // Create broadcast recipients
    const broadcastRecipients = recipients.map(recipient => ({
      broadcast_id: broadcast.id,
      member_id: recipient.id,
      email: recipient.email,
      status: 'pending' as const,
      retry_count: 0,
    }));

    const { error: recipientsInsertError } = await supabase
      .from('broadcast_recipients')
      .insert(broadcastRecipients);

    if (recipientsInsertError) {
      console.error('Failed to create broadcast recipients:', recipientsInsertError);
      return NextResponse.json(
        { error: 'Failed to create broadcast recipients' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      actor_id: admin.id,
      actor_name: admin.email,
      action: 'broadcast_created',
      resource_type: 'broadcast',
      resource_id: broadcast.id,
      details: {
        type,
        recipient_type: recipientType,
        total_recipients: recipients.length,
      },
    });

    return NextResponse.json({
      success: true,
      broadcast: {
        id: broadcast.id,
        type: broadcast.type,
        subject: broadcast.subject,
        recipientType: broadcast.recipient_type,
        totalRecipients: broadcast.total_recipients,
        status: broadcast.status,
      },
    });

  } catch (error) {
    console.error('Broadcast creation error:', error);

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
      { error: 'Broadcast creation failed' },
      { status: 500 }
    );
  }
}
