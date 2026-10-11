import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth/session';
import { sendCampaignEmails, generateEmailTemplate } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/broadcast/send
 * Send email campaign to target audience via Resend
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin token required' },
        { status: 401 }
      );
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    // Get campaign ID from request
    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    // 1. Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // 2. Validate campaign status
    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Campaign has already been sent' },
        { status: 400 }
      );
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Campaign is currently being sent' },
        { status: 400 }
      );
    }

    // 3. Update campaign status to 'sending'
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // 4. Build recipient query based on target criteria
    let recipientsQuery = supabaseAdmin
      .from('members')
      .select('id, email, full_name');

    // Filter by status (default to 'active' if not specified)
    const targetStatuses = campaign.target_statuses?.length > 0
      ? campaign.target_statuses
      : ['active'];
    recipientsQuery = recipientsQuery.in('status', targetStatuses);

    // Filter by target groups if specified
    if (campaign.target_groups?.length > 0) {
      recipientsQuery = recipientsQuery.contains('target_groups', campaign.target_groups);
    }

    const { data: members, error: membersError } = await recipientsQuery;

    if (membersError || !members || members.length === 0) {
      await supabaseAdmin
        .from('email_campaigns')
        .update({
          status: 'failed',
          error_message: 'No recipients found matching criteria',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return NextResponse.json(
        { error: 'No recipients found matching criteria' },
        { status: 400 }
      );
    }

    // 5. Update recipient count
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        recipient_count: members.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // 6. Create recipient records
    const recipientRecords = members.map((member) => ({
      campaign_id: campaignId,
      member_id: member.id,
      email: member.email,
      full_name: member.full_name,
      status: 'pending',
    }));

    await supabaseAdmin
      .from('campaign_recipients')
      .insert(recipientRecords);

    // 7. Generate email HTML
    const emailHtml = generateEmailTemplate(
      campaign.body_html,
      campaign.preheader,
      campaign.cover_image
    );

    // 8. Send emails via Resend
    const recipients = members.map((member) => ({
      email: member.email,
      name: member.full_name || 'Member',
    }));

    const sendResult = await sendCampaignEmails(
      recipients,
      campaign.subject,
      emailHtml,
      campaign.body_text,
      async (sent, total) => {
        // Progress callback - update campaign stats
        console.log(`Campaign ${campaignId}: Sent ${sent}/${total} emails`);
      }
    );

    // 9. Update recipient records with send results
    for (const result of sendResult.results) {
      const member = members.find((m) => m.email === result.email);
      if (!member) continue;

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (result.emailId) {
        updateData.status = 'sent';
        updateData.sent_at = new Date().toISOString();
        updateData.resend_email_id = result.emailId;
      } else {
        updateData.status = 'failed';
        updateData.error_message = result.error;
      }

      await supabaseAdmin
        .from('campaign_recipients')
        .update(updateData)
        .eq('campaign_id', campaignId)
        .eq('member_id', member.id);
    }

    // 10. Update campaign final status
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: sendResult.totalFailed === 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: sendResult.totalFailed > 0
          ? `Failed to send ${sendResult.totalFailed} emails`
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      totalRecipients: members.length,
      totalSent: sendResult.totalSent,
      totalFailed: sendResult.totalFailed,
      message: sendResult.totalFailed === 0
        ? `Campaign sent successfully to ${sendResult.totalSent} recipients`
        : `Campaign partially sent: ${sendResult.totalSent} succeeded, ${sendResult.totalFailed} failed`,
    });
  } catch (error) {
    console.error('[POST /api/broadcast/send] Error:', error);

    // Try to update campaign status to failed
    try {
      const { campaignId } = await req.json();
      if (campaignId) {
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
      }
    } catch (updateError) {
      console.error('[POST /api/broadcast/send] Failed to update campaign status:', updateError);
    }

    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
