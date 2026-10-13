import { ADMIN_ROLES, CONSOLE_ROLES, CONTENT_ROLES, MEMBER_REVIEW_ROLES } from "../auth/session";
import type { UserRole } from "../auth/session";

const PUBLIC_API_METHODS: Record<string, string[]> = {
  "/api/admin/auth/login": ["POST"],
  "/api/admin/auth/logout": ["POST"],
  "/api/members": ["POST"],
  "/api/members/login": ["POST"],
  "/api/members/logout": ["POST"],
  "/api/members/verify-email": ["POST"],
  "/api/members/resend-verification": ["POST"],
  "/api/members/forgot-password": ["POST"],
  "/api/members/reset-password": ["POST"],
  "/api/auth/status": ["GET"],
  "/api/content/public": ["GET"],
  "/api/content/categories": ["GET"],
  "/api/layout": ["GET"],
  "/api/settings": ["GET"],
  "/api/translate": ["POST"],
  "/api/engagement": ["GET"],
  "/api/engagement/view": ["POST"],
  "/api/engagement/share": ["POST"],
  "/api/academic/engagement": ["GET", "POST"],
};

// null = public, [] = authenticated, otherwise one of the listed roles.
export function apiRoles(path: string, method: string): UserRole[] | null {
  if (PUBLIC_API_METHODS[path]?.includes(method)) return null;
  if (path === "/api/admin/auth/verify" && method === "GET") return CONSOLE_ROLES;
  if (/^\/api\/events\/[^/]+\/registration-(settings|fields)$/.test(path) && method === "GET") return null;
  if (path.startsWith("/api/content/") || path === "/api/content" || path === "/api/upload" || path === "/api/admin/content/upload-file") return CONTENT_ROLES;
  if (path === "/api/layout" || path === "/api/settings") return ADMIN_ROLES;
  if (path === "/api/admin/categories") return CONTENT_ROLES;
  if (path === "/api/admin/activity") return CONSOLE_ROLES;
  if (path === "/api/announcements") return method === "GET" || method === "PATCH" ? [] : [...ADMIN_ROLES, "pr"];
  if (path.startsWith("/api/broadcast")) return [...ADMIN_ROLES, "pr"];
  if (path.startsWith("/api/admin/members/") || path === "/api/admin/suspensions" || path === "/api/members/bulk") return MEMBER_REVIEW_ROLES;
  if (path.startsWith("/api/admin/") || path === "/api/messages/suspend") return ADMIN_ROLES;
  if (path === "/api/members" && method === "DELETE") return ADMIN_ROLES;
  return [];
}

export function isMutation(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

export function isSafeOrigin(request: Request): boolean {
  if (!isMutation(request.method)) return true;
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  // This also protects login and requests using Bearer tokens in a browser.
  if (site === "cross-site") return false;
  const expected = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (origin) {
    try { return new URL(origin).origin === new URL(expected).origin && origin !== "null"; }
    catch { return false; }
  }
  // Cookies are ambient credentials; require Origin or same-origin Fetch Metadata.
  if (request.headers.get("cookie")) return site === "same-origin";
  // Non-browser API clients do not send Origin/Fetch Metadata.
  return !site || site === "same-origin" || site === "none";
}

export function ratePolicy(path: string): { scope: string; limit: number; windowMs: number } {
  if (/\/(login|reset-password|forgot-password|resend-verification|verify-email)$/.test(path)) {
    return { scope: "authentication", limit: 10, windowMs: 15 * 60 * 1000 };
  }
  if (path === "/api/upload" || path === "/api/admin/content/upload-file" || /^\/api\/content\/[^/]+\/gallery$/.test(path)) {
    return { scope: "upload", limit: 10, windowMs: 60 * 1000 };
  }
  if (path === "/api/translate") return { scope: "translate", limit: 20, windowMs: 60 * 1000 };
  return { scope: "api", limit: 120, windowMs: 60 * 1000 };
}

export function maxBodyBytes(path: string): number {
  if (path === "/api/admin/content/upload-file") return 4 * 1024 * 1024 + 128 * 1024;
  if (path === "/api/upload") return 201 * 1024 * 1024;
  if (/^\/api\/content\/[^/]+\/gallery$/.test(path)) return 6 * 1024 * 1024;
  return 1024 * 1024;
}
