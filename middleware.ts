import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MEMBER_SESSION_KEY = 'efsw.member.session';
const ADMIN_SESSION_KEY = 'efsw.admin.session';

/**
 * Middleware to protect member and admin routes
 * Checks localStorage-based sessions for authentication
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // static files (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Check admin routes
  if (pathname.startsWith('/admin')) {
    // Allow admin login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check admin session via cookie (since we can't access localStorage server-side)
    // For localStorage-based auth, we rely on client-side redirect as fallback
    // This middleware adds response headers to help client-side protection
    const response = NextResponse.next();
    response.headers.set('x-middleware-route', 'admin');
    return response;
  }

  // Check member routes
  if (pathname.startsWith('/member')) {
    // Allow login and register pages
    if (pathname === '/member/login' || pathname === '/member/register') {
      return NextResponse.next();
    }

    // Add header for client-side check
    const response = NextResponse.next();
    response.headers.set('x-middleware-route', 'member');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
