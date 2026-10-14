import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { CONTENT_ROLES } from "@/lib/auth/session";
import { uploadToR2, publicUrl, inspectR2Upload, deleteFromR2 } from "@/lib/r2";
import { verifyUploadToken } from "@/lib/r2-upload-token";
import { matchesFileSignature } from "@/lib/security/uploads";
import { canReadContent, contentViewer } from "@/lib/content-access";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize(req: NextRequest) {
  try { return await requireRole(req, CONTENT_ROLES); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { rows: content } = await query("SELECT * FROM content WHERE id = $1", [params.id]);
    if (!content[0] || !canReadContent(content[0], await contentViewer(req))) return NextResponse.json({ error: "Content not found" }, { status: 404 });
    const { rows } = await query("SELECT * FROM content_gallery WHERE content_id = $1 ORDER BY display_order ASC, created_at ASC", [params.id]);
    return NextResponse.json({ images: rows });
  } catch (error) {
    console.error("Gallery read failed:", error);
    return NextResponse.json({ error: "Failed to load gallery images" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await authorize(req);
  if (actor instanceof NextResponse) return actor;
  try {
    const { rows: content } = await query("SELECT id FROM content WHERE id = $1", [params.id]);
    if (!content.length) return NextResponse.json({ error: "Content not found" }, { status: 404 });
    let imageUrl: string, caption: string, order: number | null;
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => null);
      const claim = typeof body?.uploadToken === "string" ? verifyUploadToken(body.uploadToken, actor.id) : null;
      if (!claim || claim.purpose !== "gallery") return NextResponse.json({ error: "Invalid or expired gallery upload" }, { status: 400 });
      const object = await inspectR2Upload(claim.destination);
      if (object.size !== claim.size || object.contentType !== claim.contentType) return NextResponse.json({ error: "Gallery upload is incomplete" }, { status: 400 });
      imageUrl = `${publicUrl}/${claim.destination}`;
      caption = typeof body.caption === "string" ? body.caption.trim().slice(0, 1000) : "";
      order = Number.isInteger(body.displayOrder) && body.displayOrder >= 0 ? body.displayOrder : null;
    } else {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "Use direct upload for images up to 5 MB" }, { status: 413 });
      }
      const raw = Buffer.from(await file.arrayBuffer());
      if (!matchesFileSignature(raw, file.type)) return NextResponse.json({ error: "Invalid image content" }, { status: 415 });
      let optimized: Buffer;
      try { optimized = await sharp(raw, { animated: false, limitInputPixels: 20_000_000 }).resize(1600,1600,{fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer(); }
      catch { return NextResponse.json({ error: "Invalid or oversized image" }, { status: 415 }); }
      imageUrl = await uploadToR2(`gallery/${randomUUID()}.webp`, optimized, "image/webp");
      caption = String(form.get("caption") || "").slice(0,1000);
      const supplied = form.get("displayOrder");
      order = supplied !== null && Number.isInteger(Number(supplied)) && Number(supplied) >= 0 ? Number(supplied) : null;
    }
    // A retried request may reuse the same signed upload receipt. Keep the
    // gallery write idempotent so a lost response does not create duplicates.
    const { rows: existing } = await query(
      "SELECT * FROM content_gallery WHERE content_id = $1 AND image_url = $2 LIMIT 1",
      [params.id, imageUrl],
    );
    const duplicate = existing.find((row: { image_url?: string }) => row.image_url === imageUrl);
    if (duplicate) return NextResponse.json({ image: duplicate, url: imageUrl, id: duplicate.id });

    const { rows } = await query(
      `INSERT INTO content_gallery (content_id, image_url, caption, display_order)
       SELECT $1,$2,$3,COALESCE($4::int, COALESCE(MAX(display_order),-1)+1)
       FROM content_gallery WHERE content_id = $1 RETURNING *`, [params.id, imageUrl, caption || null, order],
    );
    return NextResponse.json({ image: rows[0], url: imageUrl, id: rows[0].id });
  } catch (error) {
    console.error("Gallery create failed:", error);
    return NextResponse.json({ error: "Failed to save gallery image" }, { status: 500 });
  }
}

/** Persist removals, captions and order together, including an empty gallery. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await authorize(req);
  if (actor instanceof NextResponse) return actor;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.images) || body.images.length > 20 || body.images.some((image: any) =>
      typeof image?.id !== "string" || !uuid.test(image.id) || typeof image.caption !== "string" || image.caption.length > 1000) ||
      new Set(body.images.map((image: any) => image.id)).size !== body.images.length) {
    return NextResponse.json({ error: "Invalid gallery images" }, { status: 400 });
  }
  let client;
  try { client = await pool.connect(); }
  catch { return NextResponse.json({ error: "Failed to save gallery" }, { status: 500 }); }
  try {
    await client.query("BEGIN");
    const { rows: content } = await client.query("SELECT id FROM content WHERE id = $1 FOR UPDATE", [params.id]);
    if (!content.length) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Content not found" }, { status: 404 }); }
    const { rows: existing } = await client.query("SELECT id FROM content_gallery WHERE content_id = $1", [params.id]);
    const ids = body.images.map((image: any) => image.id);
    if (ids.some((id: string) => !existing.some((row) => row.id === id))) {
      await client.query("ROLLBACK"); return NextResponse.json({ error: "Image does not belong to this content" }, { status: 400 });
    }
    const { rows: removed } = await client.query("DELETE FROM content_gallery WHERE content_id = $1 AND NOT (id = ANY($2::uuid[])) RETURNING image_url", [params.id, ids]);
    for (let index = 0; index < body.images.length; index++) {
      const image = body.images[index];
      await client.query("UPDATE content_gallery SET caption = $1, display_order = $2, updated_at = now() WHERE id = $3 AND content_id = $4", [image.caption.trim() || null, index, image.id, params.id]);
    }
    await client.query("COMMIT");
    // Deleted rows no longer reference their unique gallery objects.
    for (const row of removed) {
      if (row.image_url.startsWith(`${publicUrl}/gallery/`)) {
        try { await deleteFromR2(row.image_url.slice(publicUrl.length + 1)); }
        catch (error) { console.error("Gallery storage cleanup failed:", error); }
      }
    }
    return NextResponse.json({ ok: true, updated: body.images.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Gallery save failed:", error);
    return NextResponse.json({ error: "Failed to save gallery" }, { status: 500 });
  } finally { client.release(); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await authorize(req);
  if (actor instanceof NextResponse) return actor;
  const imageId = req.nextUrl.searchParams.get("imageId");
  if (!imageId || !uuid.test(imageId)) return NextResponse.json({ error: "Valid imageId is required" }, { status: 400 });
  try {
    const { rows } = await query("DELETE FROM content_gallery WHERE id = $1 AND content_id = $2 RETURNING image_url", [imageId, params.id]);
    if (!rows.length) return NextResponse.json({ error: "Gallery image not found" }, { status: 404 });
    if (rows[0].image_url.startsWith(`${publicUrl}/gallery/`)) {
      try { await deleteFromR2(rows[0].image_url.slice(publicUrl.length + 1)); }
      catch (error) { console.error("Gallery storage cleanup failed:", error); }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gallery delete failed:", error);
    return NextResponse.json({ error: "Failed to delete gallery image" }, { status: 500 });
  }
}
