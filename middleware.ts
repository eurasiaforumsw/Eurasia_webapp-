import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and return payload if valid
 * Uses jose library which is Edge Runtime compatible
 */
async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to protect admin routes with JWT authentication
 * BLOCKS unauthorized access on the server - no client-side bypass possible
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // ADMIN PAGE ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith('/admin')) {
    // Allow login page without auth
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Get JWT token from cookie
    const token = request.cookies.get('admin_token')?.value;

    // No token = BLOCK immediately
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Invalid token = BLOCK immediately
    const payload = await verifyToken(token);
    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    // Valid token = allow access
    return NextResponse.next();
  }

  // ============================================
  // ADMIN API ROUTES PROTECTION
  // ============================================
  if (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/content') ||
    pathname.startsWith('/api/members')
  ) {
    // Allow public endpoints without auth
    if (
      pathname === '/api/admin/auth/login' ||
      pathname === '/api/admin/auth/register' ||
      pathname === '/api/members' ||  // Allow POST /api/members (registration)
      pathname === '/api/members/login' ||
      pathname === '/api/members/register' ||
      pathname === '/api/members/verify-email' ||
      pathname === '/api/members/resend-verification' ||
      pathname === '/api/members/forgot-password' ||
      pathname === '/api/members/reset-password' ||
      pathname === '/api/content/public' ||
      pathname.startsWith('/api/engagement/') // Allow engagement tracking for anonymous users
    ) {
      return NextResponse.next();
    }

    // Get JWT token from cookie
    const token = request.cookies.get('admin_token')?.value;

    // No token = BLOCK with 401
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Invalid token = BLOCK with 401
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Valid token = allow API access
    return NextResponse.next();
  }

  // ============================================
  // MEMBER PAGE ROUTES PROTECTION
  // ============================================
  if (pathname.startsWith('/member')) {
    // Allow public member pages without auth
    if (
      pathname === '/member/login' ||
      pathname === '/member/register' ||
      pathname === '/member/forgot-password' ||
      pathname === '/member/reset-password'
    ) {
      return NextResponse.next();
    }

    // Get JWT token from cookie
    const memberToken = request.cookies.get('member_token')?.value;

    // No token = BLOCK immediately
    if (!memberToken) {
      const loginUrl = new URL('/member/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Invalid token = BLOCK immediately
    const payload = await verifyToken(memberToken);
    if (!payload) {
      const loginUrl = new URL('/member/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    // Valid token = allow access
    return NextResponse.next();
  }

  // All other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths that need protection:
     * - /admin/* (except /admin/login)
     * - /api/admin/*
     * - /api/content*
     * - /api/members*
     * - /member/* (for future upgrade)
     *
     * Exclude:
     * - /_next/* (Next.js internals)
     * - Static files (files with extensions like .png, .css, .js)
     * - /api/public/* (if you add public APIs)
     */
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/content/:path*',
    '/api/members/:path*',
    '/member/:path*',
  ],
};
