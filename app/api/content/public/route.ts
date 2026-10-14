import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadContent, contentViewer } from "@/lib/content-access";
import type { CoverImageCrop } from "@/lib/admin-data";

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
  cover_image_crop: CoverImageCrop | null;
  image_caption: string | null;
  author: string | null;
  author_image: string | null;
  featured: boolean;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  page_count: number | null;
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
    coverImageCrop: row.cover_image_crop ?? undefined,
    imageCaption: row.image_caption ?? "",
    author: row.author ?? "",
    authorImage: row.author_image ?? undefined,
    featured: row.featured ?? false,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    fileSize: row.file_size ?? undefined,
    fileType: row.file_type ?? undefined,
    pageCount: row.page_count ?? undefined,
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const kind = searchParams.get("kind");
    const slug = searchParams.get("slug");
    const viewer = await contentViewer(req);

    let contentQuery = db
      .from("content")
      .select("*")
      .eq("status", "published");
    if (kind) contentQuery = contentQuery.eq("kind", kind);
    if (slug) contentQuery = contentQuery.eq("id", slug);
    const { data, error } = await contentQuery.order("updated_at", { ascending: false });

    if (error) throw error;

    const items = (data ?? [])
      .filter((row: ContentRow) => canReadContent(row, viewer, false))
      .map((row: ContentRow) => payloadFromRow(row));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("/api/content/public GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load content" },
      { status: 500 }
    );
  }
}
