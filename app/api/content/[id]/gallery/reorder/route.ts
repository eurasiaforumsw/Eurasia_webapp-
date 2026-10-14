import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { CONTENT_ROLES } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole(req, CONTENT_ROLES); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
  const body = await req.json().catch(() => null);
  const imageIds = body?.imageIds;
  if (!Array.isArray(imageIds) || imageIds.length > 20 || new Set(imageIds).size !== imageIds.length ||
      imageIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
    return NextResponse.json({ error: "Invalid imageIds" }, { status: 400 });
  }
  let client;
  try { client = await pool.connect(); }
  catch { return NextResponse.json({ error: "Failed to reorder gallery" }, { status: 500 }); }
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM content WHERE id = $1 FOR UPDATE", [params.id]);
    const { rows } = await client.query("SELECT id FROM content_gallery WHERE content_id = $1", [params.id]);
    if (rows.length !== imageIds.length || imageIds.some((id) => !rows.some((row) => row.id === id))) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "imageIds must include each image belonging to this content once" }, { status: 400 });
    }
    await client.query(
      `UPDATE content_gallery AS g SET display_order = ordered.position - 1, updated_at = now()
       FROM unnest($1::uuid[]) WITH ORDINALITY AS ordered(id, position)
       WHERE g.id = ordered.id AND g.content_id = $2`, [imageIds, params.id],
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, updated: imageIds.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Gallery reorder failed:", error);
    return NextResponse.json({ error: "Failed to reorder gallery" }, { status: 500 });
  } finally { client.release(); }
}
