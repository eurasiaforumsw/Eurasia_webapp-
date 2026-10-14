import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { stringifySetCookie } from 'cookie';
import { getJwtSecret } from '@/lib/auth/session';
import { consumeRateLimit } from '@/lib/security/rate-limit';

interface LoginRequest {
  email: string;
  password: string;
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    let body: LoginRequest;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string' ||
        body.email.length > 254 || !body.password || Buffer.byteLength(body.password, 'utf8') > 72) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@efsw.local').trim().toLowerCase();
    if (email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    try {
      const rate = await consumeRateLimit(`admin-login:${email}`, 5, 15 * 60 * 1000);
      if (!rate.allowed) {
        return NextResponse.json({ error: 'Too many sign-in attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
      }
    } catch {
      return NextResponse.json({ error: 'Security service temporarily unavailable' }, { status: 503 });
    }

    // Get environment variables
    const JWT_SECRET = getJwtSecret();
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_PASSWORD_HASH) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT payload
    const payload: JWTPayload = {
      id: adminEmail,
      email: adminEmail,
      role: 'super-admin',
      name: 'EFSW Administrator'
    };

    // Sign JWT token with 24 hour expiration
    const token = jwt.sign(payload, Buffer.from(JWT_SECRET), {
      expiresIn: '24h', algorithm: 'HS256'
    });

    // Serialize cookie with security settings
    const cookie = stringifySetCookie({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours in seconds
      path: '/'
    });

    // Create response with Set-Cookie header
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', cookie);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
