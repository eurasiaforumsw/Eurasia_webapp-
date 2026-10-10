import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CropData = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

function validateCropData(data: unknown): CropData | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;
  const x = Number(obj.x);
  const y = Number(obj.y);
  const width = Number(obj.width);
  const height = Number(obj.height);
  const scale = Number(obj.scale);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(scale)
  ) {
    return null;
  }

  if (width <= 0 || height <= 0 || scale <= 0) {
    return null;
  }

  return { x, y, width, height, scale };
}

// POST /api/content/[id]/cover-crop — save cover image crop settings (admin only)
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

    // Verify content exists
    const { data: content, error: contentError } = await supabaseAdmin
      .from("content")
      .select("id, cover_image")
      .eq("id", contentId)
      .maybeSingle();

    if (contentError) throw contentError;
    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (!content.cover_image) {
      return NextResponse.json(
        { error: "Content has no cover image" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const cropData = validateCropData(body);

    if (!cropData) {
      return NextResponse.json(
        { error: "Invalid crop data. Required: x, y, width, height, scale (all numbers)" },
        { status: 400 }
      );
    }

    // Update content.cover_image_crop column
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("content")
      .update({
        cover_image_crop: cropData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .select("id, cover_image_crop")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      contentId: updated.id,
      crop: updated.cover_image_crop,
    });
  } catch (err: any) {
    console.error("/api/content/[id]/cover-crop POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save crop settings" },
      { status: 500 }
    );
  }
}

// GET /api/content/[id]/cover-crop — fetch current crop settings (public)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id;

    const { data, error } = await supabaseAdmin
      .from("content")
      .select("id, cover_image_crop")
      .eq("id", contentId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      contentId: data.id,
      crop: data.cover_image_crop,
    });
  } catch (err: any) {
    console.error("/api/content/[id]/cover-crop GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch crop settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id]/cover-crop — remove crop settings (admin only)
export async function DELETE(
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

    const { error } = await supabaseAdmin
      .from("content")
      .update({
        cover_image_crop: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("/api/content/[id]/cover-crop DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to remove crop settings" },
      { status: 500 }
    );
  }
}
