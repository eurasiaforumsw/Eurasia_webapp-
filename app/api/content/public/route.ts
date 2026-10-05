import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentRow = {
  id: string;
  kind: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  cover_image: string | null;
  image_caption: string | null;
  author: string | null;
  tags: string[] | null;
  status: string;
  locale: string;
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
};

function payloadFromRow(row: ContentRow) {
  return {
    id: row.id,
    kind: row.kind as "news" | "document" | "event" | "academic",
    category: row.category,
    title: row.title,
    summary: row.summary,
    body: row.body ?? "",
    coverImage: row.cover_image ?? "",
    imageCaption: row.image_caption ?? "",
    author: row.author ?? "",
    tags: row.tags ?? [],
    status: row.status as "draft" | "published" | "archived",
    locale: row.locale as "en" | "th" | "ko",
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

function isAudienceMatch(
  row: ContentRow,
  viewerMembershipType: string | null,
  viewerGroups: string[],
): boolean {
  const mems = row.target_membership_types ?? [];
  const groups = row.target_groups ?? [];
  if (mems.length === 0 && groups.length === 0) return true;
  if (mems.length > 0) {
    if (!viewerMembershipType) return false;
    if (!mems.includes(viewerMembershipType)) return false;
  }
  if (groups.length > 0) {
    if (viewerGroups.length === 0) return false;
    const hasOverlap = viewerGroups.some((g) => groups.includes(g));
    if (!hasOverlap) return false;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let query = supabase.from("content").select("*").eq("status", "published");

    const kind = searchParams.get("kind");
    if (kind) query = query.eq("kind", kind);
    const slug = searchParams.get("slug");
    if (slug) query = query.eq("id", slug);

    const viewerMembershipType = searchParams.get("membership");
    const viewerGroupsParam = searchParams.get("groups");
    const viewerGroups = viewerGroupsParam ? viewerGroupsParam.split(",").filter(Boolean) : [];

    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw error;

    const now = Date.now();
    const items = (data ?? [])
      .map((row: ContentRow) => ({ row, payload: payloadFromRow(row) }))
      // Filter by display window — items outside their window never ship
      .filter(({ payload }) => {
        if (payload.publishAt && Date.parse(payload.publishAt) > now) return false;
        if (payload.expiresAt && Date.parse(payload.expiresAt) < now) return false;
        return true;
      })
      // Filter by audience — unless the viewer explicitly asks to see
      // everything (`viewerMembershipType` empty + no `groups`).
      .filter(({ row }) => {
        if (!viewerMembershipType && viewerGroups.length === 0) {
          const mems = row.target_membership_types ?? [];
          const groups = row.target_groups ?? [];
          return mems.length === 0 && groups.length === 0;
        }
        return isAudienceMatch(row, viewerMembershipType, viewerGroups);
      })
      .map(({ payload }) => payload);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("/api/content/public GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load content" },
      { status: 500 }
    );
  }
}
