import { NextRequest, NextResponse } from "next/server";
import { db, query } from "@/lib/db";
import { broadcastActor } from "./_auth";

export const runtime = "nodejs";

const KINDS = new Set(["news", "event", "document", "academic", "custom"]);
const AUDIENCES = new Set(["all", "professional", "student", "institutional"]);
const STATUSES = new Set(["active", "pending", "suspended"]);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function textField(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return textField(value, max) || undefined;
}

function stringList(value: unknown, allowed?: Set<string>): string[] | null {
  if (!Array.isArray(value) || value.length > 100 || value.some((item) => typeof item !== "string" || item.length > 120 || (allowed && !allowed.has(item)))) return null;
  return [...new Set(value)];
}

function campaignFields(input: Record<string, unknown>): Record<string, unknown> | null {
  const title = textField(input.title, 240);
  const subject = textField(input.subject, 240);
  const body = textField(input.body_html, 500000);
  const preheader = optionalText(input.preheader, 500);
  const cover = optionalText(input.cover_image, 2000);
  const contentId = optionalText(input.content_id, 200);
  const contentKind = input.content_kind ?? "custom";
  const audience = input.audience ?? "all";
  const groups = stringList(input.target_groups ?? []);
  const statuses = stringList(input.target_statuses ?? ["active"], STATUSES);
  if (!title || !subject || !body || preheader === undefined || cover === undefined || contentId === undefined ||
      typeof contentKind !== "string" || !KINDS.has(contentKind) || typeof audience !== "string" || !AUDIENCES.has(audience) ||
      !groups || !statuses || statuses.length === 0 || input.scheduled_at || (input.status && input.status !== "draft")) return null;
  return {
    title, subject, body_html: body, preheader, cover_image: cover,
    content_id: contentId, content_kind: contentKind, audience,
    target_groups: groups, target_statuses: statuses, status: "draft", scheduled_at: null,
  };
}

export async function GET(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const page = Math.max(1, Math.min(10000, Number(req.nextUrl.searchParams.get("page")) || 1));
  const pageSize = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("pageSize")) || 20));
  const status = req.nextUrl.searchParams.get("status");
  if (status && status !== "all" && !["draft", "scheduled", "sending", "sent", "failed"].includes(status)) return fail("Invalid status", 400);

  let query = db.from("email_campaigns").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const result = await query.range((page - 1) * pageSize, page * pageSize - 1).execute();
  if (result.error) return fail("Failed to fetch campaigns", 500);

  // Count the same filtered query so pagination remains correct when a
  // status filter is active. The previous implementation counted every
  // campaign, which could report `hasMore` after the filtered result ended.
  let countQuery = db.from("email_campaigns").select("*", { count: "exact", head: true });
  if (status && status !== "all") countQuery = countQuery.eq("status", status);
  const countResult = await countQuery.execute();
  if (countResult.error) return fail("Failed to count campaigns", 500);
  const count = countResult.count || 0;

  return NextResponse.json({ campaigns: result.data || [], total: count, page, pageSize, hasMore: page * pageSize < count });
}

export async function POST(req: NextRequest) {
  const actor = await broadcastActor(req);
  if (!actor) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Invalid campaign", 400);
  const fields = campaignFields(input);
  if (!fields) return fail("Invalid campaign fields", 400);
  try {
    if (fields.content_id) {
      const source = await db.from("content")
        .select("id").eq("id", fields.content_id).maybeSingle();
      if (!source.data) return fail("Source content not found", 400);
    }
    const result = await db.from("email_campaigns")
      .insert({ ...fields, created_by: actor.memberId || null, created_by_actor: actor.email })
      .select("*");
    return NextResponse.json({ campaign: result.data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/broadcast] Database error:", error);
    return fail("Failed to create campaign", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.campaignId !== "string") return fail("Invalid campaign", 400);
  const fields = campaignFields(input);
  if (!fields) return fail("Invalid campaign fields", 400);
  try {
    if (fields.content_id) {
      const source = await db.from("content")
        .select("id").eq("id", fields.content_id).maybeSingle();
      if (!source.data) return fail("Source content not found", 400);
    }
    const result = await db.from("email_campaigns")
      .update(fields).match({ id: input.campaignId, status: "draft" });
    if (!result.data || result.data.length === 0) return fail("Campaign not found or no longer editable", 409);
    return NextResponse.json({ campaign: result.data[0] });
  } catch (error) {
    console.error("[PATCH /api/broadcast] Database error:", error);
    return fail("Failed to update campaign", 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input.campaignId !== "string") return fail("Invalid campaign ID", 400);

  try {
    const { rows } = await query(
      `DELETE FROM email_campaigns WHERE id = $1 AND status = $2 RETURNING id`,
      [input.campaignId, "draft"]
    );
    if (rows.length === 0) return fail("Campaign not found or no longer deletable", 409);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/broadcast] Database error:", error);
    return fail("Failed to delete campaign", 500);
  }
}
