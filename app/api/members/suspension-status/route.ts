import { NextRequest, NextResponse } from "next/server";
import { checkMemberSuspension } from "@/lib/member-suspension";
import { verifyRequestToken } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/members/suspension-status
 * Check if the logged-in member is currently suspended
 * Returns suspension details if suspended, otherwise returns isSuspended: false
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication - member must be logged in
    const payload = await verifyRequestToken(request);

    if (!payload) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Extract member ID from token
    // The token payload has 'id' for admin tokens and 'memberId' for member tokens
    const memberId = (payload as any).memberId || payload.id;

    if (!memberId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Check suspension status
    const result = await checkMemberSuspension(memberId);

    if (result.isSuspended && result.details) {
      return NextResponse.json({
        isSuspended: true,
        suspensionType: result.details.type,
        reason: result.details.reasonCategory,
        reasonDetails: result.details.reasonDetails,
        suspendedAt: result.details.suspendedAt,
        expiresAt: result.details.expiresAt,
      });
    }

    // Not suspended
    return NextResponse.json({
      isSuspended: false,
    });
  } catch (error) {
    console.error("Error checking suspension status:", error);
    return NextResponse.json(
      { error: "Failed to check suspension status" },
      { status: 500 }
    );
  }
}
