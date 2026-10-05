import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView, { type ArticleSeed } from "@/components/efsw/ArticleView";
import { initialContent } from "@/lib/admin-data";

type PageProps = { params: { slug: string } };

/* Mirrors /news/[slug] — seeds come from bundled content so each route
   prerenders with real copy, then ArticleView swaps in localStorage on mount. */
const seeds = initialContent.filter((item) => item.kind === "event") as ArticleSeed[];

const findSeed = (slug: string): ArticleSeed | undefined => seeds.find((item) => item.id === slug);

export function generateStaticParams() {
  return seeds.map((item) => ({ slug: item.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const seed = findSeed(params.slug);
  if (!seed) return { title: "Event not found | EFSW" };

  return {
    title: `${seed.title} | EFSW Events`,
    description: seed.summary,
    openGraph: {
      type: "website",
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

export default function EventDetailPage({ params }: PageProps) {
  const seed = findSeed(params.slug);
  if (!seed) notFound();

  return (
    <ArticleView
      kind="event"
      slug={params.slug}
      seed={seed}
      backHref="/events"
    />
  );
}
