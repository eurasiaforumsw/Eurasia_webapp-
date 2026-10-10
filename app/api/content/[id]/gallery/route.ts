import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function optimizeImage(
  buf: Buffer,
  mimeType: string
): Promise<{ buf: Buffer; contentType: string; ext: string }> {
  try {
    let sharpModule: any;
    try {
      sharpModule = require("sharp");
    } catch {
      const ext = mimeType.split("/")[1].replace("jpeg", "jpg") || "bin";
      return { buf, contentType: mimeType, ext };
    }
    const sharp = sharpModule.default ?? sharpModule;

    const input = sharp(buf, { animated: false });
    const meta = await input.metadata();

    const isLarge =
      (meta.width ?? 0) > 1600 || (meta.height ?? 0) > 1600 || mimeType !== "image/webp";

    if (isLarge) {
      const out = await input
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return { buf: out, contentType: "image/webp", ext: "webp" };
    }

    const ext = mimeType.split("/")[1].replace("jpeg", "jpg") || "bin";
    return { buf, contentType: mimeType, ext };
  } catch {
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg") || "bin";
    return { buf, contentType: mimeType, ext };
  }
}

type GalleryImage = {
  id: string;
  content_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

// GET /api/content/[id]/gallery — fetch all gallery images (public)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id;

    const { data, error } = await supabaseAdmin
      .from("content_gallery")
      .select("*")
      .eq("content_id", contentId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ images: data ?? [] });
  } catch (err: any) {
    console.error("/api/content/[id]/gallery GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load gallery images" },
      { status: 500 }
    );
  }
}

// POST /api/content/[id]/gallery — upload new gallery image (admin only)
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
      .select("id")
      .eq("id", contentId)
      .maybeSingle();

    if (contentError) throw contentError;
    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const caption = form.get("caption") as string | null;
    const displayOrder = form.get("displayOrder") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: jpg, png, webp, gif` },
        { status: 415 }
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    if (raw.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: `File is larger than ${formatBytes(MAX_IMAGE_BYTES)} (${formatBytes(
            raw.byteLength
          )} received).`,
        },
        { status: 413 }
      );
    }

    const { buf, contentType, ext } = await optimizeImage(raw, file.type);
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `gallery/${contentId}/${id}.${ext}`;

    const imageUrl = await uploadToR2(key, buf, contentType);

    // Get next display_order if not provided
    let order = displayOrder ? parseInt(displayOrder, 10) : null;
    if (order === null || !Number.isFinite(order)) {
      const { data: lastImage } = await supabaseAdmin
        .from("content_gallery")
        .select("display_order")
        .eq("content_id", contentId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      order = lastImage ? lastImage.display_order + 1 : 0;
    }

    const { data: galleryImage, error: insertError } = await supabaseAdmin
      .from("content_gallery")
      .insert({
        content_id: contentId,
        image_url: imageUrl,
        caption: caption || null,
        display_order: order,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      image: galleryImage,
      url: imageUrl,
      id: (galleryImage as GalleryImage).id,
    });
  } catch (err: any) {
    console.error("/api/content/[id]/gallery POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id]/gallery?imageId=xxx — delete gallery image (admin only)
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

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId query parameter is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("content_gallery")
      .delete()
      .eq("id", imageId)
      .eq("content_id", params.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("/api/content/[id]/gallery DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete gallery image" },
      { status: 500 }
    );
  }
}
