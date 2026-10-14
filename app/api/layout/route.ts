import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { ADMIN_ROLES } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/layout
 * Fetch the current layout configuration from Supabase
 */
export async function GET() {
  try {
    const { data, error } = await db
      .from('layout_config')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('Database error fetching layout:', error);
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
    try {
      await requireRole(req, ADMIN_ROLES);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
    }

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    const config = body?.config;

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      );
    }

    // Upsert layout config
    const { data, error } = await db
      .from('layout_config')
      .upsert({
        id: 'default',
        config,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Database error saving layout:', error);
      return NextResponse.json(
        { error: 'Failed to save layout config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: Array.isArray(data) ? data[0]?.config : data?.config
    });
  } catch (err) {
    console.error('Error saving layout:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
