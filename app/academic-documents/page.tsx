import type { Metadata } from "next";
import LibraryPage from "@/components/efsw/LibraryPage";
import { type PublicContentItem } from "@/components/efsw/PublicContentFeed";

export const metadata: Metadata = {
  title: "Academic Documents | Eurasia Forum for Social Workers",
  description: "A shared hub for research papers, field manuals, and policy briefings from the EFSW network.",
};

const documents: PublicContentItem[] = [
  {
    id: "document-research",
    category: "Research",
    title: "Research papers and articles",
    summary: "A home for academic writing, field research, and lessons drawn from practice across the region.",
  },
  {
    id: "document-practice",
    category: "Practice",
    title: "Field manuals and practice guides",
    summary: "Resources that help social workers adapt shared knowledge to the realities of their own context.",
  },
  {
    id: "document-briefings",
    category: "Briefings",
    title: "Policy briefings",
    summary: "Short, clear perspectives ready to bring into conversations about policy and collaboration.",
  },
];

export default function Page() {
  return <LibraryPage initialItems={documents} />;
}
