import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/layout
 * Fetch the current layout configuration from Supabase
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('layout_config')
      .select('config')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('Supabase error fetching layout:', error);
      return NextResponse.json(
        { error: 'Failed to fetch layout config' },
        { status: 500 }
      );
    }

    // If no config exists yet, return empty object
    if (!data) {
      return NextResponse.json({ config: {} });
    }

    return NextResponse.json({ config: data.config });
  } catch (err) {
    console.error('Error fetching layout:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/layout
 * Save layout configuration to Supabase (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    // Verify admin role (we trust the middleware already checked this)
    // Parse request body
    const body = await req.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      );
    }

    // Upsert layout config
    const { data, error } = await supabaseAdmin
      .from('layout_config')
      .upsert({
        id: 'default',
        config,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving layout:', error);
      return NextResponse.json(
        { error: 'Failed to save layout config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: data.config
    });
  } catch (err) {
    console.error('Error saving layout:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
