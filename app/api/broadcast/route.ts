import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/broadcast
 * Fetch email campaigns with pagination and filters
 */
export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status'); // 'draft', 'scheduled', 'sent', etc.

    // Build query
    let query = supabaseAdmin
      .from('email_campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/broadcast] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaigns: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: count ? (page * pageSize) < count : false,
    });
  } catch (error) {
    console.error('[GET /api/broadcast] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/broadcast
 * Create a new email campaign
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

    // Get campaign data from request
    const {
      title,
      subject,
      preheader,
      body_html,
      body_text,
      content_id,
      content_kind,
      cover_image,
      target_groups,
      target_statuses,
      status,
      scheduled_at,
    } = await req.json();

    // Validate required fields
    if (!title || !subject || !body_html) {
      return NextResponse.json(
        { error: 'Missing required fields: title, subject, body_html' },
        { status: 400 }
      );
    }

    // Insert campaign
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        title,
        subject,
        preheader,
        body_html,
        body_text,
        content_id,
        content_kind,
        cover_image,
        target_groups: target_groups || [],
        target_statuses: target_statuses || [],
        status: status || 'draft',
        scheduled_at,
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/broadcast] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data,
    });
  } catch (error) {
    console.error('[POST /api/broadcast] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/broadcast
 * Update an existing campaign
 */
export async function PATCH(req: NextRequest) {
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

    // Get update data
    const { campaignId, ...updates } = await req.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    // Check if campaign exists and is not sent yet
    const { data: existing } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', campaignId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'sent' || existing.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot update a campaign that is already sent or sending' },
        { status: 400 }
      );
    }

    // Update campaign
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/broadcast] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data,
    });
  } catch (error) {
    console.error('[PATCH /api/broadcast] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/broadcast
 * Delete a campaign (only if not sent)
 */
export async function DELETE(req: NextRequest) {
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

    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId' },
        { status: 400 }
      );
    }

    // Check if campaign can be deleted
    const { data: existing } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', campaignId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'sent' || existing.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot delete a campaign that is already sent or sending' },
        { status: 400 }
      );
    }

    // Delete campaign
    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('[DELETE /api/broadcast] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[DELETE /api/broadcast] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
