import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

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

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      memberId: payload.memberId as string,
      email: payload.email as string,
      role: payload.role as string,
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
  supabase: any,
  memberId: string
): Promise<{ suspended: boolean; reason?: string; expiresAt?: string }> {
  const { data, error } = await supabase
    .from("member_suspensions")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { suspended: false };
  }

  // Check if temporary suspension has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Deactivate the expired suspension
    await supabase
      .from("member_suspensions")
      .update({ is_active: false })
      .eq("id", data.id);

    return { suspended: false };
  }

  return {
    suspended: true,
    reason: data.reason_category,
    expiresAt: data.expires_at,
  };
}
