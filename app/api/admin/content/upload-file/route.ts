import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { uploadToR2 } from '@/lib/r2';
import { requireRole } from '@/lib/api-auth';
import { CONTENT_ROLES } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stay below Vercel's 4.5 MB function request-body ceiling, including multipart data.
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const FILE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function matchesDocumentSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-';
  if (mime === 'application/msword') {
    return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  return mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
}

export async function POST(request: NextRequest) {
  try { await requireRole(request, CONTENT_ROLES); }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const contentId = formData.get('contentId') as string | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID required' },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = FILE_EXTENSIONS[file.type];
    if (typeof extension !== 'string') {
      return NextResponse.json(
        { error: 'Only PDF and Word documents are allowed' },
        { status: 415 }
      );
    }

    // Validate file size
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Upload a non-empty document of 4 MB or less, or use a hosted document URL.' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesDocumentSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'File content does not match its document type' }, { status: 415 });
    }
    const key = `academic/${randomUUID()}.${extension}`;
    const fileUrl = await uploadToR2(key, buffer, file.type);

    // Return file metadata
    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
