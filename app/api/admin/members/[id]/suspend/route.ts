import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { MEMBER_REVIEW_ROLES } from "@/lib/auth/session";
import { suspendMember, liftSuspension } from "@/lib/member-suspension";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 :
    /Cannot suspend/.test(message) ? 403 : message === "Member not found" ? 404 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireRole(request, MEMBER_REVIEW_ROLES);
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
    const { suspension_type, suspension_reason, additional_notes, days_count } = body || {};
    if (!["temporary_24h", "temporary_custom", "permanent"].includes(suspension_type) ||
      typeof suspension_reason !== "string" || !suspension_reason.trim()) {
      return NextResponse.json({ error: "Suspension type and reason are required" }, { status: 400 });
    }
    if (suspension_type === "temporary_custom" && (!Number.isInteger(days_count) || days_count < 1 || days_count > 3650)) {
      return NextResponse.json({ error: "Custom days must be between 1 and 3650" }, { status: 400 });
    }
    const reasonMap: Record<string, "spam_flooding" | "abusive_language" | "harassment" | "inappropriate_content" | "terms_violation" | "other"> = {
      "Spam or flooding": "spam_flooding", "Abusive language": "abusive_language", "Harassment": "harassment",
      "Inappropriate content": "inappropriate_content", "Terms of service violation": "terms_violation", "Other": "other",
    };
    const reasonCategory = reasonMap[suspension_reason] || "other";
    const reasonDetails = typeof additional_notes === "string" && additional_notes ? additional_notes : suspension_reason;
    const result = await suspendMember({ memberId: params.id, suspendedBy: actor.id, suspensionType: suspension_type,
      reasonCategory, reasonDetails, customDays: days_count });
    return NextResponse.json({ success: true, suspension: { id: result.suspensionId, member_id: params.id,
      suspension_type, reason_category: reasonCategory, reason_details: reasonDetails } });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireRole(request, MEMBER_REVIEW_ROLES);
    const id = request.nextUrl.searchParams.get("suspension_id");
    if (!id) return NextResponse.json({ error: "suspension_id is required" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("member_suspensions").select("id")
      .eq("id", id).eq("member_id", params.id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Suspension not found" }, { status: 404 });
    const result = await liftSuspension(id, actor.id);
    if (!result.success) return NextResponse.json({ error: "Suspension not found or already lifted" }, { status: 404 });
    return NextResponse.json({ success: true, suspension_id: id });
  } catch (error) { return failure(error); }
}
