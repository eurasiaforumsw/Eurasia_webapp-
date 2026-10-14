import { verifySessionToken } from "./session";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export interface JWTPayload {
  memberId: string;
  email: string;
  role: string;
}

/**
 * Verify JWT token from cookie and return payload
 * Returns null if token is invalid or expired
 */
export async function verifyMemberToken(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get("member_token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifySessionToken(token);
    if (!payload?.memberId) return null;

    return {
      memberId: payload.memberId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    // Token expired or invalid
    return null;
  }
}

/**
 * Check if member is currently suspended
 */
export async function checkMemberSuspension(
  _db: any,
  memberId: string
): Promise<{ suspended: boolean; reason?: string; expiresAt?: string }> {
  const { data, error } = await db
    .from("member_suspensions")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Unable to verify account status");
  if (!data) {
    return { suspended: false };
  }

  // Check if temporary suspension has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    const { data: status, error: expiryError } = await db
      .rpc("expire_member_suspensions", { p_member_id: memberId });
    if (expiryError) throw new Error("Unable to verify account status");
    return { suspended: status === "suspended" };
  }

  return {
    suspended: true,
    reason: data.reason_category,
    expiresAt: data.expires_at,
  };
}
