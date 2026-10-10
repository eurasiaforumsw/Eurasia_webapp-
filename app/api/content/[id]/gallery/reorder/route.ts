import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReorderItem = {
  id: string;
  display_order: number;
};

// POST /api/content/[id]/gallery/reorder — reorder gallery images (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin or pr role
    try {
      await requireRole(req, ["admin", "pr"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: message }, { status });
    }

    const contentId = params.id;
    const body = await req.json();
    const { imageIds } = body as { imageIds: string[] };

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: "imageIds array is required" },
        { status: 400 }
      );
    }

    // Verify all images belong to this content
    const { data: existingImages, error: fetchError } = await supabaseAdmin
      .from("content_gallery")
      .select("id")
      .eq("content_id", contentId);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingImages ?? []).map((img) => img.id));
    const invalidIds = imageIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid image IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Update display_order for each image
    const updates = imageIds.map((id, index) => ({
      id,
      display_order: index,
    }));

    // Execute updates in a transaction-like batch
    const updatePromises = updates.map(({ id, display_order }) =>
      supabaseAdmin
        .from("content_gallery")
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("content_id", contentId)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} image(s)`);
    }

    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (err: any) {
    console.error("/api/content/[id]/gallery/reorder POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to reorder gallery images" },
      { status: 500 }
    );
  }
}
