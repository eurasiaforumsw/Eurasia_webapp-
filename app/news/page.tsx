import type { Metadata } from "next";
import { ArrowUpRight, MoveLeft } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";

export const metadata: Metadata = {
  title: "ข่าวประชาสัมพันธ์ | Eurasia Forum for Social Workers",
  description: "ข่าวสาร ประกาศ และความเคลื่อนไหวจาก Eurasia Forum for Social Workers.",
};

const newsItems: PublicContentItem[] = [
  { id: "news-platform", category: "Platform update", title: "A trilingual platform for regional exchange", summary: "EFSW connects English, Korean, and Thai resources so professional knowledge can move more freely across Eurasia." },
  { id: "news-membership", category: "Membership", title: "A network for professionals, students, and institutions", summary: "Three membership pathways make room for practitioners, emerging social workers, universities, NGOs, and public partners." },
  { id: "news-resources", category: "Resources", title: "Research and practice belong in the same conversation", summary: "The resource hub brings research papers, case studies, field manuals, and regional learning into one shared place." },
];

export default function NewsPage() {
  return (
    <main className="efsw-content-page">
      <nav className="efsw-about-nav" aria-label="News navigation">
        <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
        <a href="/" className="efsw-text-link"><MoveLeft size={16} /> หน้าหลัก</a>
      </nav>
      <section className="efsw-content-hero"><p className="efsw-section-label">Newsroom / ข่าวประชาสัมพันธ์</p><h1>เรื่องราวที่กำลัง<br /><span>ขับเคลื่อนเครือข่าย</span></h1><p>ข่าวสาร ประกาศ และข้อมูลจากการทำงานเพื่อเชื่อมโยงนักสังคมสงเคราะห์ทั่วภูมิภาคยูเรเชีย</p></section>
      <PublicContentFeed kind="news" initialItems={newsItems} linkLabel="ติดต่อเพื่อขอรายละเอียด" />
      <section className="efsw-content-cta"><p className="efsw-section-label">Stay connected</p><h2>ติดตามความเคลื่อนไหว<br /><span>จาก EFSW</span></h2><p className="efsw-content-cta__copy">ติดต่อทีมงานเพื่อรับข่าวสารเกี่ยวกับกิจกรรม งานวิชาการ และโอกาสความร่วมมือใหม่ ๆ</p><a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--dark">ติดต่อทีม EFSW <ArrowUpRight size={17} /></a></section>
      <footer className="efsw-about-footer"><span>© 2026 EFSW</span><a href="/">Eurasia Forum for Social Workers</a><span>English · 한국어 · ไทย</span></footer>
    </main>
  );
}
