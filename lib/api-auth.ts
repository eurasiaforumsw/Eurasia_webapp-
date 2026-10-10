import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export type UserRole = "admin" | "pr" | "member";

export type TokenPayload = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

/**
 * Verify JWT token from request cookies
 */
export async function verifyRequestToken(request: NextRequest): Promise<TokenPayload | null> {
  const adminToken = request.cookies.get("admin_token")?.value;
  const memberToken = request.cookies.get("member_token")?.value;

  const token = adminToken || memberToken;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if user has required role
 * @param userRole - The user's actual role
 * @param allowedRoles - Roles that are allowed to access this resource
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
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
