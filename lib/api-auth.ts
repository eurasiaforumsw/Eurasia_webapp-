import { NextRequest } from "next/server";
import { verifyRequestSession } from "./auth/session";
import type { Session, UserRole } from "./auth/session";

export type { UserRole } from "./auth/session";
export type TokenPayload = Session;

/**
 * Verify JWT token from request cookies
 */
export async function verifyRequestToken(request: NextRequest): Promise<TokenPayload | null> {
  return verifyRequestSession(request);
}

/**
 * Check if user has required role
 * @param userRole - The user's actual role
 * @param allowedRoles - Roles that are allowed to access this resource
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole) ||
    (userRole === "super-admin" && allowedRoles.includes("admin"));
}

/**
 * Get authenticated user from request or throw 401
 */
export async function requireAuth(request: NextRequest): Promise<TokenPayload> {
  const payload = await verifyRequestToken(request);
  if (!payload) {
    throw new Error("Unauthorized");
  }
  return payload;
}

/**
 * Get authenticated user with required role or throw 403
 */
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<TokenPayload> {
  const payload = await requireAuth(request);
  if (!hasRole(payload.role, allowedRoles)) {
    throw new Error("Forbidden");
  }
  return payload;
}
