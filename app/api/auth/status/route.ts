import { NextRequest, NextResponse } from "next/server";
import { verifyMemberToken } from "@/lib/auth/jwt";

/**
 * GET /api/auth/status
 * Check if user is authenticated
 */
export async function GET(request: NextRequest) {
  const payload = await verifyMemberToken(request);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      memberId: payload.memberId,
      email: payload.email,
      role: payload.role,
    },
    { status: 200 }
  );
}
