import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { stringifySetCookie } from 'cookie';

interface LoginRequest {
  email: string;
  password: string;
}

interface JWTPayload {
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email
    if (email !== 'admin@efsw.local') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get environment variables
    const JWT_SECRET = process.env.JWT_SECRET;
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!JWT_SECRET || !ADMIN_PASSWORD_HASH) {
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
      email: 'admin@efsw.local',
      role: 'super-admin',
      name: 'EFSW Administrator'
    };

    // Sign JWT token with 24 hour expiration
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h'
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
