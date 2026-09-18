import type { Metadata } from "next";
import NewsroomPage from "@/components/efsw/NewsroomPage";
import { type PublicContentItem } from "@/components/efsw/PublicContentFeed";

export const metadata: Metadata = {
  title: "Newsroom | Eurasia Forum for Social Workers",
  description: "News, announcements, and updates from the Eurasia Forum for Social Workers.",
};

const newsItems: PublicContentItem[] = [
  {
    id: "news-platform",
    category: "Platform",
    title: "A trilingual platform for regional exchange",
    summary: "EFSW connects English, Korean, and Thai resources so professional knowledge can move more freely across Eurasia.",
  },
  {
    id: "news-membership",
    category: "Membership",
    title: "A network for professionals, students, and institutions",
    summary: "Three membership pathways make room for practitioners, emerging social workers, universities, NGOs, and public partners.",
  },
  {
    id: "news-resources",
    category: "Resources",
    title: "Research and practice belong in the same conversation",
    summary: "The resource hub brings research papers, case studies, field manuals, and regional learning into one shared place.",
  },
];

export default function Page() {
  return <NewsroomPage initialItems={newsItems} />;
}
