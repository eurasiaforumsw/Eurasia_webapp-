import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/settings
 * Fetch site settings from Supabase
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('config')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('[GET /api/settings] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data?.config || {},
    });
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Save site settings to Supabase (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin authentication
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

    // 2. Get settings from request body
    const { settings } = await req.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings object' },
        { status: 400 }
      );
    }

    // 3. Update settings in Supabase
    const { error } = await supabaseAdmin
      .from('site_settings')
      .update({
        config: settings,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      console.error('[POST /api/settings] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('[POST /api/settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
