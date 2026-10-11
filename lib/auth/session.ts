import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export type UserRole = "super-admin" | "admin" | "pr" | "content-editor" | "member-reviewer" | "member";
export type Session = {
  id: string;
  memberId?: string;
  email: string;
  role: UserRole;
  name?: string;
};

export const ADMIN_ROLES: UserRole[] = ["super-admin", "admin"];
export const CONTENT_ROLES: UserRole[] = [...ADMIN_ROLES, "pr", "content-editor"];
export const MEMBER_REVIEW_ROLES: UserRole[] = [...ADMIN_ROLES, "member-reviewer"];
export const CONSOLE_ROLES: UserRole[] = [...CONTENT_ROLES, "member-reviewer"];

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32 || /your-|fallback|change-in-production/i.test(secret)) {
    throw new Error("A strong JWT_SECRET of at least 32 bytes is required");
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      requiredClaims: ["exp", "iat", "email", "role"],
    });
    const roles: UserRole[] = [...CONSOLE_ROLES, "member"];
    if (typeof payload.role !== "string" || !roles.includes(payload.role as UserRole) ||
        typeof payload.email !== "string" || !payload.email ||
        typeof payload.iat !== "number" || payload.iat > Date.now() / 1000 + 30) return null;
    const memberId = typeof payload.memberId === "string" && payload.memberId ? payload.memberId : undefined;
    // Existing administrator tokens use email as their identity.
    const id = memberId || (typeof payload.id === "string" && payload.id) ||
      (payload.role === "super-admin" && payload.email === "admin@efsw.local" ? payload.email : "");
    if (!id || (payload.role === "member" && !memberId)) return null;
    return { id, memberId, email: payload.email, role: payload.role as UserRole,
      name: typeof payload.name === "string" ? payload.name : undefined };
  } catch {
    return null;
  }
}

export async function verifyRequestSession(request: NextRequest): Promise<Session | null> {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    return match ? verifySessionToken(match[1]) : null;
  }
  for (const name of ["admin_token", "member_token"]) {
    const token = request.cookies.get(name)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) return session;
    }
  }
  return null;
}

export async function verifyAdminToken(token: string): Promise<Session | null> {
  const session = await verifySessionToken(token);
  return session && CONTENT_ROLES.includes(session.role) ? session : null;
}

export async function verifyAdminRequest(request: NextRequest): Promise<Session | null> {
  const session = await verifyRequestSession(request);
  return session && ADMIN_ROLES.includes(session.role) ? session : null;
}
