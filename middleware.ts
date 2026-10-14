import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { queryNeonJson } from './lib/db-edge';
import { verifyRequestSession, verifySessionToken, CONSOLE_ROLES } from './lib/auth/session';
import { apiRoles, isSafeOrigin, isMutation, ratePolicy, maxBodyBytes } from './lib/security/policy';
import { consumeRateLimit } from './lib/security/rate-limit';
import { contentSecurityPolicy } from './lib/security/headers';

function apiError(error: string, status: number) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function bodyTooLarge(request: NextRequest, maxBytes: number): Promise<boolean> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) return true;
  if (!request.body) return false;
  const reader = request.clone().body!.getReader();
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return false;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        return true;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function checkMemberSuspension(memberId: string): Promise<{
  isSuspended: boolean;
  details?: any;
}> {
  try {
    const [suspension] = await queryNeonJson<any>(
      'SELECT to_jsonb(s) AS result FROM public.is_member_suspended($1::text) AS s',
      [memberId]
    );

    return {
      isSuspended: suspension?.is_suspended || false,
      details: suspension?.is_suspended ? {
        type: suspension.suspension_type,
        reasonCategory: suspension.reason_category,
        reasonDetails: suspension.reason_details,
        suspendedAt: suspension.suspended_at,
        expiresAt: suspension.expires_at,
      } : null,
    };
  } catch (error) {
    console.error('Suspension check failed');
    throw new Error('Unable to verify suspension status');
  }
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/admin/test-setup' && process.env.NODE_ENV === 'production') {
      return apiError('Not found', 404);
    }
    if (!isSafeOrigin(request)) return apiError('Cross-site request rejected', 403);

    // Trust forwarded IPs only when an explicitly configured proxy overwrites them.
    const forwarded = process.env.SECURITY_TRUST_PROXY === 'true'
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
    const client = forwarded || request.ip || 'unknown-client';
    const policy = ratePolicy(pathname);
    try {
      const rate = await consumeRateLimit(`${policy.scope}:${client}`, policy.limit, policy.windowMs);
      if (!rate.allowed) {
        const response = apiError('Too many requests. Please try again later.', 429);
        response.headers.set('Retry-After', String(rate.retryAfter));
        return response;
      }
    } catch {
      // A database outage must not disable protection.
      return apiError('Security service temporarily unavailable', 503);
    }

    const roles = apiRoles(pathname, request.method);
    if (roles !== null) {
      const session = await verifyRequestSession(request);
      if (!session) return apiError('Authentication required', 401);
      if (roles.length && !roles.includes(session.role)) return apiError('Forbidden', 403);
    }
    if (isMutation(request.method)) {
      try {
        if (await bodyTooLarge(request, maxBodyBytes(pathname))) {
          return apiError('Request body too large', 413);
        }
      } catch {
        return apiError('Invalid request body', 400);
      }
    }
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname !== '/admin/login') {
      const session = await verifyRequestSession(request);
      if (!session) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (!CONSOLE_ROLES.includes(session.role)) {
        return NextResponse.redirect(new URL('/member/profile?error=no_access', request.url));
      }
    }
  }

  const publicMemberPages = ['/member/login', '/member/register', '/member/forgot-password',
    '/member/reset-password', '/member/suspended'];
  if ((pathname === '/member' || pathname.startsWith('/member/')) &&
      !publicMemberPages.includes(pathname) && !pathname.startsWith('/member/verify-email/')) {
    const memberToken = request.cookies.get('member_token')?.value;
    const session = memberToken ? await verifySessionToken(memberToken) : null;
    if (!session?.memberId) {
      const loginUrl = new URL('/member/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const suspension = await checkMemberSuspension(session.memberId);
      if (suspension.isSuspended && suspension.details) {
        const suspendedUrl = new URL('/member/suspended', request.url);
        suspendedUrl.searchParams.set('type', suspension.details.type);
        suspendedUrl.searchParams.set('reason', suspension.details.reasonCategory);
        if (suspension.details.reasonDetails) suspendedUrl.searchParams.set('details', suspension.details.reasonDetails);
        if (suspension.details.expiresAt) suspendedUrl.searchParams.set('expiresAt', suspension.details.expiresAt);
        suspendedUrl.searchParams.set('suspendedAt', suspension.details.suspendedAt);
        return NextResponse.redirect(suspendedUrl);
      }
    } catch {
      return new NextResponse('Unable to verify account status. Please try again later.', { status: 503 });
    }
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = contentSecurityPolicy(nonce);
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/member/:path*', '/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|css|js|woff2?|mp4|webm|glb)$).*)'],
};
