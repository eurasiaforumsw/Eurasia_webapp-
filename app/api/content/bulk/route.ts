import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminContentStatus = "draft" | "published" | "archived";
const VALID_STATUSES: AdminContentStatus[] = ["draft", "published", "archived"];

type BulkAction = "delete" | "updateStatus" | "updateCategory";

type BulkDeletePayload = {
  action: "delete";
  ids: string[];
};

type BulkUpdateStatusPayload = {
  action: "updateStatus";
  ids: string[];
  status: AdminContentStatus;
};

type BulkUpdateCategoryPayload = {
  action: "updateCategory";
  ids: string[];
  category: string;
};

type BulkPayload = BulkDeletePayload | BulkUpdateStatusPayload | BulkUpdateCategoryPayload;

function sanitizeIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids)) return null;
  const sanitized = ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  return sanitized.length > 0 ? sanitized : null;
}

function sanitizeStatus(status: unknown): AdminContentStatus | null {
  return VALID_STATUSES.includes(status as AdminContentStatus)
    ? (status as AdminContentStatus)
    : null;
}

function sanitizeCategory(category: unknown): string | null {
  return typeof category === "string" && category.trim().length > 0
    ? category.trim()
    : null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<BulkPayload>;

    // Validate action
    const action = payload.action;
    if (!action || !["delete", "updateStatus", "updateCategory"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'delete', 'updateStatus', or 'updateCategory'" },
        { status: 400 }
      );
    }

    // Validate and sanitize IDs
    const ids = sanitizeIds(payload.ids);
    if (!ids) {
      return NextResponse.json(
        { error: "ids is required and must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    // Handle bulk delete
    if (action === "delete") {
      const { error, count } = await supabaseAdmin
        .from("content")
        .delete()
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action: "delete",
        affected: count ?? ids.length,
        ids,
      });
    }

    // Handle bulk status update
    if (action === "updateStatus") {
      const typedPayload = payload as Partial<BulkUpdateStatusPayload>;
      const status = sanitizeStatus(typedPayload.status);

      if (!status) {
        return NextResponse.json(
          { error: "status is required and must be 'draft', 'published', or 'archived'" },
          { status: 400 }
        );
      }

      const { error, count } = await supabaseAdmin
        .from("content")
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action: "updateStatus",
        affected: count ?? ids.length,
        ids,
        status,
      });
    }

    // Handle bulk category update
    if (action === "updateCategory") {
      const typedPayload = payload as Partial<BulkUpdateCategoryPayload>;
      const category = sanitizeCategory(typedPayload.category);

      if (!category) {
        return NextResponse.json(
          { error: "category is required and must be a non-empty string" },
          { status: 400 }
        );
      }

      const { error, count } = await supabaseAdmin
        .from("content")
        .update({
          category,
          updated_at: new Date().toISOString()
        })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action: "updateCategory",
        affected: count ?? ids.length,
        ids,
        category,
      });
    }

    return NextResponse.json(
      { error: "Unhandled action" },
      { status: 400 }
    );

  } catch (err: any) {
    console.error("/api/content/bulk POST error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to perform bulk operation"
      },
      { status: 500 }
    );
  }
}
