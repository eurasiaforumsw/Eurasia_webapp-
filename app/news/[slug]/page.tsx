import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView, { type ArticleSeed } from "@/components/efsw/ArticleView";
import { initialContent } from "@/lib/admin-data";

type PageProps = { params: { slug: string } };

/* Seeds come from the bundled content so each route prerenders with real copy;
   ArticleView swaps in the admin's localStorage version on mount. */
const seeds = initialContent.filter((item) => item.kind === "news");

const findSeed = (slug: string): ArticleSeed | undefined => seeds.find((item) => item.id === slug);

export function generateStaticParams() {
  return seeds.map((item) => ({ slug: item.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const seed = findSeed(params.slug);
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

export default function NewsArticlePage({ params }: PageProps) {
  const seed = findSeed(params.slug);
  if (!seed) notFound();

  return (
    <ArticleView
      kind="news"
      slug={params.slug}
      seed={seed}
      backHref="/news"
    />
  );
}
