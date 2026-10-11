import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { verifyRequestSession, CONTENT_ROLES } from "@/lib/auth/session";
import { matchesFileSignature } from "@/lib/security/uploads";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

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
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

function isVideo(mime: string) {
  return mime.startsWith("video/");
}

async function optimizeImage(
  buf: Buffer,
  mimeType: string
): Promise<{ buf: Buffer; contentType: string; ext: string }> {
  if (isVideo(mimeType)) {
    const ext = mimeType.split("/")[1].replace("quicktime", "mov").replace("x-matroska", "mkv");
    return { buf, contentType: mimeType, ext };
  }

  // Re-encoding strips metadata and prevents HTML/SVG content from being served raw.
  const out = await sharp(buf, { animated: false, limitInputPixels: 20_000_000 })
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return { buf: out, contentType: "image/webp", ext: "webp" };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CONTENT_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    const ceiling = isVideo(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > ceiling) {
      return NextResponse.json(
        {
          error: `File is larger than ${formatBytes(ceiling)} (${formatBytes(
            file.size
          )} received).`,
        },
        { status: 413 }
      );
    }
    const raw = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(raw, file.type)) {
      return NextResponse.json({ error: "File content does not match its type" }, { status: 415 });
    }

    let optimized: Awaited<ReturnType<typeof optimizeImage>>;
    try { optimized = await optimizeImage(raw, file.type); }
    catch { return NextResponse.json({ error: "Invalid or oversized image" }, { status: 415 }); }
    const { buf, contentType, ext } = optimized;
    const id = randomUUID();
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
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
