// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find member by email
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !member) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, member.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check account status
    if (member.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      );
    }

    if (member.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending approval' },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      id: member.id,
      email: member.email,
      role: 'member',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Log activity
    await supabase.from('activity_logs').insert({
      actor_id: member.id,
      actor_name: `${member.first_name} ${member.last_name}`,
      action: 'member_login',
      resource_type: 'member',
      resource_id: member.id,
    });

    const response = NextResponse.json({
      success: true,
      member: {
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        memberType: member.member_type,
        status: member.status,
        avatarUrl: member.avatar_url,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
