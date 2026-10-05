import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for large file upload

// Two ceilings: images stay small (auto-compressed to WebP), videos need
// room for short hero clips. The form value can override the cap per
// scene type so the admin UI can show a tighter limit for images.
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

function isVideo(mime: string) {
  return mime.startsWith("video/");
}

// Tries to import sharp at runtime. If not installed, we fall back to
// uploading the raw file as-is (the admin already compresses via canvas,
// so this is belt-and-braces).
async function optimizeImage(
  buf: Buffer,
  mimeType: string
): Promise<{ buf: Buffer; contentType: string; ext: string }> {
  if (isVideo(mimeType)) {
    const ext = mimeType.split("/")[1].replace("quicktime", "mov") || "bin";
    return { buf, contentType: mimeType, ext };
  }

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const ceiling = isVideo(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (raw.byteLength > ceiling) {
      return NextResponse.json(
        {
          error: `File is larger than ${formatBytes(ceiling)} (${formatBytes(
            raw.byteLength
          )} received).`,
        },
        { status: 413 }
      );
    }

    const { buf, contentType, ext } = await optimizeImage(raw, file.type);
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `content/${id}.${ext}`;

    const url = await uploadToR2(key, buf, contentType);
    return NextResponse.json({
      url,
      key,
      // ── Asset summary (used by admin to display size/MIME) ──
      sizeBytes: buf.byteLength,
      mimeType: contentType,
      originalSizeBytes: raw.byteLength,
      humanSize: formatBytes(buf.byteLength),
      originalHumanSize: formatBytes(raw.byteLength),
      bucket: process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || null,
      kind: isVideo(file.type) ? "video" : "image",
    });
  } catch (err: any) {
    console.error("/api/upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}