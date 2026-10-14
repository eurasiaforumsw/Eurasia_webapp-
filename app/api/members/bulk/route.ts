import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { ADMIN_ROLES, MEMBER_REVIEW_ROLES } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation schemas
const BulkApproveSchema = z.object({
  action: z.literal("approve"),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

const BulkDeleteSchema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

const BulkUpdateStatusSchema = z.object({
  action: z.literal("updateStatus"),
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["pending", "active", "suspended"]),
});

const BulkRequestSchema = z.discriminatedUnion("action", [
  BulkApproveSchema,
  BulkDeleteSchema,
  BulkUpdateStatusSchema,
]);

type OperationResult = {
  id: string;
  success: boolean;
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, MEMBER_REVIEW_ROLES);
    if (!supabaseAdmin) return NextResponse.json({ error: "Supabase is not configured on the server" }, { status: 503 });
    const validation = BulkRequestSchema.safeParse(await request.json());
    if (!validation.success) return NextResponse.json({ error: "Invalid request format", details: validation.error.issues }, { status: 400 });
    const body = validation.data;
    if (body.action === "delete" && !ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const ids = [...new Set(body.ids)];
    const { data: members, error: readError } = await supabaseAdmin.from("members").select("id, role").in("id", ids);
    if (readError) throw new Error(readError.message);
    const results: OperationResult[] = [];
    const allowedIds: string[] = [];
    for (const id of ids) {
      const member = members?.find((item: { id: string }) => item.id === id);
      if (!member) results.push({ id, success: false, error: "Member not found" });
      else if (id === session.id || ADMIN_ROLES.includes(member.role)) results.push({ id, success: false, error: "Cannot modify your own account or an administrator" });
      else allowedIds.push(id);
    }
    if (allowedIds.length) {
      if (body.action === "delete") {
        const { data, error } = await supabaseAdmin.from("members").delete().in("id", allowedIds).select("id").execute();
        for (const id of allowedIds) results.push({ id, success: !error && !!data?.some((item: { id: string }) => item.id === id), ...(error ? { error: error.message } : {}) });
      } else {
        const status = body.action === "approve" ? "active" : body.status;
        for (const id of allowedIds) {
          try {
            const { error } = await supabaseAdmin.rpc("admin_review_member", {
              p_member_id: id, p_status: status, p_actor_id: session.id,
              p_review_note: null,
            });
            results.push({ id, success: !error, ...(error ? { error: error.message } : {}) });
          } catch (error) {
            results.push({ id, success: false, error: error instanceof Error ? error.message : "Member review failed" });
          }
        }
      }
    }
    const succeeded = results.filter((result) => result.success).length;
    return NextResponse.json({ success: succeeded === results.length, summary: { total: results.length, succeeded, failed: results.length - succeeded }, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk operation failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : error instanceof SyntaxError ? 400 : 500 });
  }
}
