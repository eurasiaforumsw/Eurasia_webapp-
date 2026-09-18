import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView, { type ArticleSeed } from "@/components/efsw/ArticleView";
import { initialContent } from "@/lib/admin-data";

type PageProps = { params: { slug: string } };

const seeds = initialContent.filter((item) => item.kind === "document");

const findSeed = (slug: string): ArticleSeed | undefined => seeds.find((item) => item.id === slug);

export function generateStaticParams() {
  return seeds.map((item) => ({ slug: item.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const seed = findSeed(params.slug);
  if (!seed) return { title: "Document not found | EFSW" };

  return {
    title: `${seed.title} | EFSW Academic Documents`,
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

export default function DocumentPage({ params }: PageProps) {
  const seed = findSeed(params.slug);
  if (!seed) notFound();

  return (
    <ArticleView
      kind="document"
      slug={params.slug}
      seed={seed}
      backHref="/academic-documents"
    />
  );
}
