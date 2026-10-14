import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView, { type ArticleSeed } from "@/components/efsw/ArticleView";
import { initialContent } from "@/lib/admin-data";
import { findPublicContent } from "@/lib/public-content-server";

type PageProps = { params: { slug: string } };

const seeds = initialContent.filter((item) => item.kind === "news");

const findSeed = (slug: string): ArticleSeed | undefined | Promise<ArticleSeed | undefined> => {
  if (process.env.DATABASE_URL) {
    return findPublicContent("news", slug);
  }
  return seeds.find((item) => item.id === slug);
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const seed = await findSeed(params.slug);
  if (!seed) return { title: "Story not found | EFSW" };

  return {
    title: `${seed.title} | EFSW Newsroom`,
    description: seed.summary,
    openGraph: {
      type: "article",
      title: seed.title,
      description: seed.summary,
      images: seed.coverImage ? [seed.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seed.title,
      description: seed.summary,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const seed = await findSeed(params.slug);
  if (!seed) notFound();

  return (
    <ArticleView
      kind="news"
      slug={params.slug}
      seed={seed}
      backHref="/news"
      contentSource="public"
    />
  );
}
