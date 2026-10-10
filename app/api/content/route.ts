import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminContentKind = "news" | "document" | "event" | "academic";
type AdminContentStatus = "draft" | "published" | "archived";
type ContentLocale = "en" | "th" | "ko";

// Column → row mapping. The localStorage model uses camelCase keys; we keep
// camelCase columns in Supabase too so this is mostly a 1:1 copy. Optional
// fields (event metadata, registration URL) can be null.
type ContentRow = {
  id: string;
  kind: AdminContentKind;
  category: string;
  title: string;
  summary: string;
  body: string;
  cover_image: string | null;
  image_caption: string | null;
  author: string | null;
  tags: string[] | null;
  status: AdminContentStatus;
  locale: ContentLocale;
  updated_at: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  format: string | null;
  registration_url: string | null;
  publish_at: string | null;
  expires_at: string | null;
  target_membership_types: string[] | null;
  target_groups: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  og_image: string | null;
  canonical_url: string | null;
  show_in_hero_slider: boolean;
  slider_duration: number | null;
  slider_order: number | null;
  created_at: string;
};

const VALID_KINDS: AdminContentKind[] = ["news", "document", "event", "academic"];
const VALID_STATUSES: AdminContentStatus[] = ["draft", "published", "archived"];
const VALID_LOCALES: ContentLocale[] = ["en", "th", "ko"];
const VALID_MEMBERSHIP_TYPES = ["professional", "student", "institutional"] as const;
type MembershipType = (typeof VALID_MEMBERSHIP_TYPES)[number];

function sanitizeKind(value: unknown): AdminContentKind | null {
  return VALID_KINDS.includes(value as AdminContentKind) ? (value as AdminContentKind) : null;
}
function sanitizeStatus(value: unknown): AdminContentStatus {
  return VALID_STATUSES.includes(value as AdminContentStatus)
    ? (value as AdminContentStatus)
    : "draft";
}
function sanitizeLocale(value: unknown): ContentLocale {
  return VALID_LOCALES.includes(value as ContentLocale) ? (value as ContentLocale) : "en";
}
function sanitizeMembershipTypes(value: unknown): MembershipType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is MembershipType =>
    VALID_MEMBERSHIP_TYPES.includes(v as MembershipType),
  );
}
function sanitizeTargetGroups(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function sanitizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeBoolean(value: unknown): boolean {
  return value === true;
}

function sanitizeInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function rowFromPayload(payload: Record<string, unknown>, existingId?: string): ContentRow | null {
  const kind = sanitizeKind(payload.kind);
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!kind || !title) return null;

  const id =
    existingId ||
    (typeof payload.id === "string" && payload.id
      ? payload.id
      : `${kind}-${Date.now().toString(36)}`);

  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter((t): t is string => typeof t === "string").slice(0, 30)
    : null;

  return {
    id,
    kind,
    category:
      typeof payload.category === "string" && payload.category.trim()
        ? payload.category.trim()
        : "General",
    title,
    summary: typeof payload.summary === "string" ? payload.summary : "",
    body: typeof payload.body === "string" ? payload.body : "",
    cover_image:
      typeof payload.coverImage === "string" && payload.coverImage
        ? payload.coverImage
        : null,
    image_caption:
      typeof payload.imageCaption === "string" && payload.imageCaption
        ? payload.imageCaption
        : null,
    author:
      typeof payload.author === "string" && payload.author ? payload.author : null,
    tags,
    status: sanitizeStatus(payload.status),
    locale: sanitizeLocale(payload.locale),
    updated_at: new Date().toISOString(),
    starts_at:
      typeof payload.startsAt === "string" && payload.startsAt ? payload.startsAt : null,
    ends_at:
      typeof payload.endsAt === "string" && payload.endsAt ? payload.endsAt : null,
    venue: typeof payload.venue === "string" && payload.venue ? payload.venue : null,
    format: typeof payload.format === "string" && payload.format ? payload.format : null,
    registration_url:
      typeof payload.registrationUrl === "string" && payload.registrationUrl
        ? payload.registrationUrl
        : null,
    publish_at:
      typeof payload.publishAt === "string" && payload.publishAt
        ? new Date(payload.publishAt).toISOString()
        : null,
    expires_at:
      typeof payload.expiresAt === "string" && payload.expiresAt
        ? new Date(payload.expiresAt).toISOString()
        : null,
    target_membership_types: sanitizeMembershipTypes(payload.targetMembershipTypes),
    target_groups: sanitizeTargetGroups(payload.targetGroups),
    seo_title: sanitizeNullableString(payload.seoTitle),
    seo_description: sanitizeNullableString(payload.seoDescription),
    seo_keywords: sanitizeTargetGroups(payload.seoKeywords),
    og_image: sanitizeNullableString(payload.ogImage),
    canonical_url: sanitizeNullableString(payload.canonicalUrl),
    show_in_hero_slider: sanitizeBoolean(payload.showInHeroSlider),
    slider_duration: sanitizeInteger(payload.sliderDuration),
    slider_order: sanitizeInteger(payload.sliderOrder),
    created_at: new Date().toISOString(),
  };
}

function payloadFromRow(row: ContentRow) {
  return {
    id: row.id,
    kind: row.kind,
    category: row.category,
    title: row.title,
    summary: row.summary,
    body: row.body ?? "",
    coverImage: row.cover_image ?? "",
    imageCaption: row.image_caption ?? "",
    author: row.author ?? "",
    tags: row.tags ?? [],
    status: row.status,
    locale: row.locale,
    updatedAt: row.updated_at,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    venue: row.venue ?? undefined,
    format: row.format ?? undefined,
    registrationUrl: row.registration_url ?? undefined,
    publishAt: row.publish_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    targetMembershipTypes: row.target_membership_types ?? [],
    targetGroups: row.target_groups ?? [],
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoKeywords: row.seo_keywords ?? [],
    ogImage: row.og_image ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    showInHeroSlider: row.show_in_hero_slider,
    sliderDuration: row.slider_duration ?? undefined,
    sliderOrder: row.slider_order ?? undefined,
  };
}

// GET /api/content?kind=news&status=published
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = sanitizeKind(searchParams.get("kind"));
    const status = searchParams.get("status");

    let query = supabaseAdmin.from("content").select("*");
    if (kind) query = query.eq("kind", kind);
    if (status && VALID_STATUSES.includes(status as AdminContentStatus)) {
      query = query.eq("status", status as AdminContentStatus);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw error;

    const items = (data ?? []).map((row: ContentRow) => payloadFromRow(row));
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("/api/content GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load content" },
      { status: 500 }
    );
  }
}

// POST /api/content — create one item (admin or pr role)
export async function POST(req: NextRequest) {
  try {
    // Check role permission - both admin and pr can create content
    try {
      await requireRole(req, ["admin", "pr"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: message }, { status });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const row = rowFromPayload(payload);
    if (!row) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Idempotency: if a row with this id already exists, update it instead.
    const { data: existing } = await supabaseAdmin
      .from("content")
      .select("id")
      .eq("id", row.id)
      .maybeSingle();

    const query = existing
      ? supabaseAdmin.from("content").update(row).eq("id", row.id).select().single()
      : supabaseAdmin.from("content").insert(row).select().single();

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ item: payloadFromRow(data as ContentRow) });
  } catch (err: any) {
    console.error("/api/content POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save content" },
      { status: 500 }
    );
  }
}

// PATCH /api/content/:id — partial update (admin or pr role)
export async function PATCH(req: NextRequest) {
  try {
    // Check role permission - both admin and pr can edit content
    try {
      await requireRole(req, ["admin", "pr"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: message }, { status });
    }

    const body = (await req.json()) as { id?: string } & Record<string, unknown>;
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const patch = rowFromPayload(body, body.id);
    if (!patch) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("content")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: payloadFromRow(data as ContentRow) });
  } catch (err: any) {
    console.error("/api/content PATCH error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update content" },
      { status: 500 }
    );
  }
}

// DELETE /api/content?id=xxx — hard delete (admin or pr role)
export async function DELETE(req: NextRequest) {
  try {
    // Check role permission - both admin and pr can delete content
    try {
      await requireRole(req, ["admin", "pr"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: message }, { status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("content").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("/api/content DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete content" },
      { status: 500 }
    );
  }
}
