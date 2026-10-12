import { NextRequest, NextResponse } from 'next/server';
import { CONSOLE_ROLES, verifyRequestSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyRequestSession(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!CONSOLE_ROLES.includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.email,
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
