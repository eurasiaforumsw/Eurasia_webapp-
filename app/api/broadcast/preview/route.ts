import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth/session';
import { generateEmailTemplate } from '@/lib/email';

/**
 * POST /api/broadcast/preview
 * Generate email preview HTML
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

    // Get email content from request
    const { body_html, preheader, cover_image } = await req.json();

    if (!body_html) {
      return NextResponse.json(
        { error: 'Missing body_html' },
        { status: 400 }
      );
    }

    // Generate preview HTML
    const previewHtml = generateEmailTemplate(body_html, preheader, cover_image);

    return NextResponse.json({
      success: true,
      html: previewHtml,
    });
  } catch (error) {
    console.error('[POST /api/broadcast/preview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
