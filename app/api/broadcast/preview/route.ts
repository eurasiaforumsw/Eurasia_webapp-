import { NextRequest, NextResponse } from 'next/server';
import { generateEmailTemplate } from '@/lib/email';
import { broadcastActor } from '../_auth';

/**
 * POST /api/broadcast/preview
 * Generate email preview HTML
 */
export async function POST(req: NextRequest) {
  try {
    if (!await broadcastActor(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
