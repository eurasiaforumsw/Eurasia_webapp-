import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import ArticleView from "@/components/efsw/ArticleView";
import LocalDocumentView from "@/components/academic/LocalDocumentView";
import type { AdminContentItem } from "@/lib/admin-data";
import "./detail.css";

type PageProps = { params: { slug: string } };

const hasRemoteContent = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Call the public handler directly so detail pages share its publication,
// scheduling and audience rules without relying on a deployment hostname.
const findDocument = cache(async (slug: string): Promise<AdminContentItem | undefined> => {
  const { GET: getPublicContent } = await import("@/app/api/content/public/route");
  const url = new URL("https://eurasiaforumsw.org/api/content/public");
  url.searchParams.set("slug", slug);
  const response = await getPublicContent(new Request(url));
  if (!response.ok) throw new Error("Failed to load academic document");
  const { items } = await response.json() as { items: AdminContentItem[] };
  return items.find((item) => item.id === slug && (item.kind === "academic" || item.kind === "document"));
});

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!hasRemoteContent()) return { title: "Academic Documents | EFSW" };
  const seed = await findDocument(params.slug);
  if (!seed) return { title: "Document not found | EFSW" };

  const title = seed.seoTitle || seed.title;
  const description = seed.seoDescription || seed.summary;
  const image = seed.ogImage || seed.coverImage;
  return {
    title: `${title} | EFSW Academic Documents`,
    description,
    keywords: seed.seoKeywords,
    alternates: seed.canonicalUrl ? { canonical: seed.canonicalUrl } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DocumentPage({ params }: PageProps) {
  if (!hasRemoteContent()) return <LocalDocumentView slug={params.slug} />;
  const seed = await findDocument(params.slug);
  if (!seed) notFound();

  return (
    <ArticleView
      kind={seed.kind}
      slug={params.slug}
      seed={seed}
      backHref="/academic-documents"
      contentSource="public"
    />
  );
}
