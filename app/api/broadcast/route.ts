import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastActor } from "./_auth";

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
  let query = supabaseAdmin.from("email_campaigns").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return fail("Failed to fetch campaigns", 500);
  return NextResponse.json({ campaigns: data || [], total: count || 0, page, pageSize, hasMore: page * pageSize < (count || 0) });
}

export async function POST(req: NextRequest) {
  const actor = await broadcastActor(req);
  if (!actor) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Invalid campaign", 400);
  const fields = campaignFields(input);
  if (!fields) return fail("Invalid campaign fields", 400);
  if (fields.content_id) {
    const { data: source, error: sourceError } = await supabaseAdmin.from("content")
      .select("id").eq("id", fields.content_id).maybeSingle();
    if (sourceError) return fail("Failed to verify source content", 500);
    if (!source) return fail("Source content not found", 400);
  }
  const { data, error } = await supabaseAdmin.from("email_campaigns")
    .insert({ ...fields, created_by: actor.memberId || null, created_by_actor: actor.email })
    .select("*").single();
  if (error) return fail("Failed to create campaign", 500);
  return NextResponse.json({ campaign: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.campaignId !== "string") return fail("Invalid campaign", 400);
  const fields = campaignFields(input);
  if (!fields) return fail("Invalid campaign fields", 400);
  if (fields.content_id) {
    const { data: source, error: sourceError } = await supabaseAdmin.from("content")
      .select("id").eq("id", fields.content_id).maybeSingle();
    if (sourceError) return fail("Failed to verify source content", 500);
    if (!source) return fail("Source content not found", 400);
  }
  const { data, error } = await supabaseAdmin.from("email_campaigns")
    .update(fields).eq("id", input.campaignId).eq("status", "draft").select("*").maybeSingle();
  if (error) return fail("Failed to update campaign", 500);
  if (!data) return fail("Campaign not found or no longer editable", 409);
  return NextResponse.json({ campaign: data });
}

export async function DELETE(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  if (!input || typeof input.campaignId !== "string") return fail("Invalid campaign ID", 400);
  const { data, error } = await supabaseAdmin.from("email_campaigns")
    .delete().eq("id", input.campaignId).eq("status", "draft").select("id").maybeSingle();
  if (error) return fail("Failed to delete campaign", 500);
  if (!data) return fail("Campaign not found or no longer deletable", 409);
  return NextResponse.json({ success: true });
}
