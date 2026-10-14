import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPresignedUploadUrl, inspectR2Upload, publishR2Upload, deleteFromR2 } from "@/lib/r2";
import { verifyRequestSession, CONTENT_ROLES } from "@/lib/auth/session";
import { matchesFileSignature } from "@/lib/security/uploads";
import { issueUploadToken, verifyUploadToken } from "@/lib/r2-upload-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/x-matroska": "mkv",
  "application/pdf": "pdf", "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
function validBytes(bytes: Uint8Array, mime: string) {
  const buffer = Buffer.from(bytes);
  if (mime === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (mime === "application/msword") return buffer.subarray(0, 8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return buffer.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
  return matchesFileSignature(bytes, mime);
}

export async function POST(request: NextRequest) {
  const session = await verifyRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  try {
    if (body?.action === "presign") {
      const mime = body.contentType;
      const size = body.size;
      const purpose = body.purpose;
      const ceiling = mime?.startsWith("video/") ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
      if (!["media", "document", "gallery", "avatar"].includes(purpose) || typeof mime !== "string" || !types[mime] ||
          !Number.isSafeInteger(size) || size <= 0 || size > ceiling) return NextResponse.json({ error: "Invalid upload type or size" }, { status: 400 });
      if (purpose !== "avatar" && !CONTENT_ROLES.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if ((purpose === "document") !== mime.startsWith("application/") ||
          (["gallery", "avatar"].includes(purpose) && (!mime.startsWith("image/") || size > 5 * 1024 * 1024))) {
        return NextResponse.json({ error: "File does not match upload purpose" }, { status: 400 });
      }
      const id = randomUUID();
      const key = `uploads/pending/${id}.${types[mime]}`;
      const prefix = purpose === "document" ? "academic" : purpose === "gallery" ? "gallery" : purpose === "avatar" ? "avatars" : "content";
      const claim = { key, destination: `${prefix}/${id}.${types[mime]}`, contentType: mime, size, purpose, user: session.id, expires: Date.now() + 15 * 60_000 };
      const token = issueUploadToken(claim);
      const uploadUrl = await getPresignedUploadUrl(key, 900, mime, size);
      return NextResponse.json({ uploadUrl, token });
    }
    if (body?.action !== "finalize" || typeof body.token !== "string") return NextResponse.json({ error: "Invalid upload action" }, { status: 400 });
    const claim = verifyUploadToken(body.token, session.id);
    if (!claim) return NextResponse.json({ error: "Invalid or expired upload token" }, { status: 403 });
    if (claim.purpose !== "avatar" && !CONTENT_ROLES.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const object = await inspectR2Upload(claim.key);
    if (object.size !== claim.size || object.contentType !== claim.contentType || !validBytes(object.bytes, claim.contentType)) {
      await deleteFromR2(claim.key);
      return NextResponse.json({ error: "File content does not match its declared type or size" }, { status: 415 });
    }
    const url = await publishR2Upload(claim.key, claim.destination, claim.contentType);
    return NextResponse.json({ url, key: claim.destination, uploadToken: body.token, sizeBytes: object.size, mimeType: claim.contentType,
      originalSizeBytes: object.size, kind: claim.contentType.startsWith("video/") ? "video" : claim.contentType.startsWith("image/") ? "image" : "document" });
  } catch (error) {
    console.error("Direct upload failed:", error);
    return NextResponse.json({ error: "Upload failed; check R2 connection and CORS configuration" }, { status: 500 });
  }
}
