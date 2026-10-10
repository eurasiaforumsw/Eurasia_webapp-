import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyMemberToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASON_CATEGORIES = [
  "spam_flooding",
  "abusive_language",
  "harassment",
  "inappropriate_content",
  "tos_violation",
  "other",
];

const SUSPENSION_TYPES = ["temp_24h", "temp_custom", "permanent"];

/**
 * POST /api/messages/suspend
 * Suspend a member (admin only)
 */
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  // Check if user is admin
  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can suspend members" }, { status: 403 });
  }

  const adminId = payload.memberId;

  // Parse request body
  let body: {
    memberId?: string;
    reasonCategory?: string;
    reasonDetail?: string;
    suspensionType?: string;
    customDays?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { memberId, reasonCategory, reasonDetail, suspensionType, customDays } = body;

  if (!memberId || !reasonCategory || !suspensionType) {
    return NextResponse.json(
      { error: "memberId, reasonCategory, and suspensionType are required" },
      { status: 400 }
    );
  }

  if (!REASON_CATEGORIES.includes(reasonCategory)) {
    return NextResponse.json({ error: "Invalid reasonCategory" }, { status: 400 });
  }

  if (!SUSPENSION_TYPES.includes(suspensionType)) {
    return NextResponse.json({ error: "Invalid suspensionType" }, { status: 400 });
  }

  if (suspensionType === "temp_custom" && (!customDays || customDays < 1)) {
    return NextResponse.json({ error: "customDays must be at least 1 for temp_custom suspension" }, { status: 400 });
  }

  // Cannot suspend yourself
  if (memberId === adminId) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
  }

  try {
    // Check if member exists
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .select("id, status, role")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot suspend another admin
    if (member.role === "admin") {
      return NextResponse.json({ error: "Cannot suspend another administrator" }, { status: 403 });
    }

    // Deactivate any existing active suspensions
    await supabaseAdmin
      .from("member_suspensions")
      .update({ is_active: false })
      .eq("member_id", memberId)
      .eq("is_active", true);

    // Calculate expiration
    let expiresAt: string | null = null;
    if (suspensionType === "temp_24h") {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      expiresAt = expires.toISOString();
    } else if (suspensionType === "temp_custom" && customDays) {
      const expires = new Date();
      expires.setDate(expires.getDate() + customDays);
      expiresAt = expires.toISOString();
    }
    // permanent suspension has no expiration

    // Create suspension record
    const { data: suspension, error: suspensionError } = await supabaseAdmin
      .from("member_suspensions")
      .insert({
        member_id: memberId,
        suspended_by: adminId,
        reason_category: reasonCategory,
        reason_detail: reasonDetail || null,
        suspension_type: suspensionType,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (suspensionError || !suspension) {
      return NextResponse.json({ error: "Failed to create suspension" }, { status: 500 });
    }

    // Update member status to suspended
    await supabaseAdmin.from("members").update({ status: "suspended" }).eq("id", memberId);

    return NextResponse.json({
      success: true,
      suspension: {
        id: suspension.id,
        memberId: suspension.member_id,
        suspendedBy: suspension.suspended_by,
        reasonCategory: suspension.reason_category,
        reasonDetail: suspension.reason_detail,
        suspensionType: suspension.suspension_type,
        expiresAt: suspension.expires_at,
        suspendedAt: suspension.suspended_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/messages/suspend?memberId=xxx
 * Get suspension history for a member (admin only)
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  // Check if user is admin
  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can view suspension history" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId query parameter is required" }, { status: 400 });
  }

  try {
    // Get all suspensions for this member
    const { data: suspensions, error: suspensionsError } = await supabaseAdmin
      .from("member_suspensions")
      .select(`
        *,
        suspended_by_member:suspended_by (
          id,
          full_name
        )
      `)
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (suspensionsError) {
      return NextResponse.json({ error: suspensionsError.message }, { status: 500 });
    }

    return NextResponse.json({
      suspensions: (suspensions || []).map((s: any) => ({
        id: s.id,
        memberId: s.member_id,
        suspendedBy: s.suspended_by_member
          ? {
              id: s.suspended_by_member.id,
              fullName: s.suspended_by_member.full_name,
            }
          : null,
        reasonCategory: s.reason_category,
        reasonDetail: s.reason_detail,
        suspensionType: s.suspension_type,
        suspendedAt: s.suspended_at,
        expiresAt: s.expires_at,
        isActive: s.is_active,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/messages/suspend?memberId=xxx
 * Lift suspension for a member (admin only)
 */
export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Messaging service is not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
  }

  // Check if user is admin
  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can lift suspensions" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId query parameter is required" }, { status: 400 });
  }

  try {
    // Deactivate all active suspensions
    await supabaseAdmin
      .from("member_suspensions")
      .update({ is_active: false })
      .eq("member_id", memberId)
      .eq("is_active", true);

    // Update member status back to active
    await supabaseAdmin.from("members").update({ status: "active" }).eq("id", memberId);

    return NextResponse.json({
      success: true,
      message: "Suspension lifted successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
