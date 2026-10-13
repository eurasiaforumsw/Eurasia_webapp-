import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { CONTENT_ROLES } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkAction = "delete" | "updateStatus" | "updateCategory";

export async function POST(req: NextRequest) {
  try { await requireRole(req, CONTENT_ROLES); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const action = payload.action as BulkAction;
  if (!["delete", "updateStatus", "updateCategory"].includes(action)) {
    return NextResponse.json({ error: "Invalid bulk action" }, { status: 400 });
  }
  if (!Array.isArray(payload.ids) || !payload.ids.length || payload.ids.length > 100
      || payload.ids.some((id) => typeof id !== "string" || !id.trim() || id.trim().length > 200)) {
    return NextResponse.json({ error: "ids must contain between 1 and 100 non-empty strings, each at most 200 characters" }, { status: 400 });
  }
  const ids = [...new Set((payload.ids as string[]).map((id) => id.trim()))];
  const status = payload.status;
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  if (action === "updateStatus" && (typeof status !== "string" || !["draft", "published", "archived"].includes(status))) {
    return NextResponse.json({ error: "Invalid content status" }, { status: 400 });
  }
  if (action === "updateCategory" && (!category || category.length > 100)) {
    return NextResponse.json({ error: "category must contain between 1 and 100 characters" }, { status: 400 });
  }
  try {
    const query = supabaseAdmin.from("content");
    const mutation = action === "delete" ? query.delete() : query.update({
      ...(action === "updateStatus" ? { status } : { category }), updated_at: new Date().toISOString(),
    });
    const { data, error } = await mutation.in("id", ids).select("id");
    if (error) throw new Error(error.message);
    const affected = new Set((data || []).map((item: { id: string }) => item.id));
    const actualIds = ids.filter((id) => affected.has(id));
    const missingIds = ids.filter((id) => !affected.has(id));
    return NextResponse.json({ success: missingIds.length === 0, action, affected: actualIds.length,
      ids: actualIds, missingIds, ...(action === "updateStatus" ? { status } : {}),
      ...(action === "updateCategory" ? { category } : {}),
      results: ids.map((id) => ({ id, success: affected.has(id),
        ...(!affected.has(id) ? { error: "Content not found or no longer available" } : {}) })),
    });
  } catch (error) {
    console.error("/api/content/bulk POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to perform bulk operation";
    return NextResponse.json({ success: false, affected: 0, ids: [], error: message,
      results: ids.map((id) => ({ id, success: false, error: message })) }, { status: 500 });
  }
}
