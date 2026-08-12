// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, validateFile, FILE_CONFIGS } from '@/lib/r2-storage';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'avatar' | 'news' | 'document';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['avatar', 'news', 'document'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file
    const config = FILE_CONFIGS[type];
    const validation = validateFile(file, {
      maxSize: config.maxSize,
      allowedTypes: config.allowedTypes,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const result = await uploadToR2(
      buffer,
      file.name,
      file.type,
      config.folder
    );

    // If avatar, update member profile
    if (type === 'avatar') {
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: result.url })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update avatar_url:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
