import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyAdminToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({
      id: decoded.email,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      signedInAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
