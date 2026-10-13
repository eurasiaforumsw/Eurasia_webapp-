import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ADMIN_ROLES } from "@/lib/auth/session";
import { suspendMember, liftSuspension, getMemberSuspensionHistory } from "@/lib/member-suspension";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 :
    /Cannot suspend/.test(message) ? 403 : message === "Member not found" ? 404 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireRole(request, ADMIN_ROLES);
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
    const memberId = body?.memberId;
    const suspensionType = body?.suspensionType === "temp_24h" ? "temporary_24h" :
      body?.suspensionType === "temp_custom" ? "temporary_custom" : body?.suspensionType;
    const reasonCategory = body?.reasonCategory === "tos_violation" ? "terms_violation" : body?.reasonCategory;
    if (typeof memberId !== "string" || !memberId ||
      !["temporary_24h", "temporary_custom", "permanent"].includes(suspensionType) ||
      !["spam_flooding", "abusive_language", "harassment", "inappropriate_content", "terms_violation", "other"].includes(reasonCategory)) {
      return NextResponse.json({ error: "Invalid suspension request" }, { status: 400 });
    }
    if (suspensionType === "temporary_custom" && (!Number.isInteger(body.customDays) || body.customDays < 1 || body.customDays > 3650)) {
      return NextResponse.json({ error: "Custom days must be between 1 and 3650" }, { status: 400 });
    }
    const result = await suspendMember({ memberId, suspendedBy: actor.id, suspensionType, reasonCategory,
      reasonDetails: body.reasonDetails ?? body.reasonDetail, customDays: body.customDays });
    return NextResponse.json({ success: true, suspension_id: result.suspensionId });
  } catch (error) { return failure(error); }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ADMIN_ROLES);
    const memberId = request.nextUrl.searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    const suspensions = await getMemberSuspensionHistory(memberId);
    return NextResponse.json({ suspensions: (suspensions || []).map((entry: any) => ({
      id: entry.id, memberId: entry.member_id, suspendedBy: entry.suspended_by,
      reasonCategory: entry.reason_category, reasonDetail: entry.reason_details, suspensionType: entry.suspension_type,
      suspendedAt: entry.suspended_at, expiresAt: entry.expires_at, isActive: entry.is_active,
    })) });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireRole(request, ADMIN_ROLES);
    const memberId = request.nextUrl.searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    const suspensions = await getMemberSuspensionHistory(memberId);
    for (const entry of suspensions || []) {
      if (entry.is_active) await liftSuspension(String(entry.id), actor.id);
    }
    return NextResponse.json({ success: true, message: "Suspension lifted successfully" });
  } catch (error) { return failure(error); }
}
