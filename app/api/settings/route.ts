import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { ADMIN_ROLES } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings
 * Fetch site settings from Supabase
 */
export async function GET() {
  try {
    const { data, error } = await db
      .from('site_settings')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('[GET /api/settings] Database error:', error);
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
    let admin;
    try {
      admin = await requireRole(req, ADMIN_ROLES);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
    }

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    const settings = body?.settings;

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid settings object' },
        { status: 400 }
      );
    }

    // 3. Update settings in database
    const { error } = await db
      .from('site_settings')
      .upsert({
        id: 'default',
        config: settings,
        updated_by: admin.memberId ?? null,
        updated_at: new Date().toISOString(),
      })
      .execute();

    if (error) {
      console.error('[POST /api/settings] Database error:', error);
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
