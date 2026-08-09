import type { Metadata } from "next";
import { ArrowUpRight, FileText } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";

export const metadata: Metadata = {
  title: "เอกสารวิชาการ | Eurasia Forum for Social Workers",
  description: "ศูนย์รวมเอกสารวิชาการ งานวิจัย และคู่มือการปฏิบัติงานของ EFSW.",
};

const documents: PublicContentItem[] = [
  { id: "document-research", category: "Research", title: "คลังงานวิจัยและบทความ", summary: "พื้นที่สำหรับบทความวิชาการ งานวิจัยเชิงพื้นที่ และบทเรียนจากการทำงานระดับภูมิภาค" },
  { id: "document-practice", category: "Practice", title: "คู่มือการปฏิบัติงาน", summary: "ทรัพยากรที่ช่วยให้นักสังคมสงเคราะห์นำความรู้ไปปรับใช้ในบริบทของตนเอง" },
  { id: "document-briefings", category: "Briefings", title: "เอกสารสรุปเชิงนโยบาย", summary: "มุมมองสั้น กระชับ และพร้อมใช้สำหรับการพูดคุยเรื่องนโยบายและความร่วมมือ" },
];

export default function AcademicDocumentsPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-content-page">
      <section className="efsw-content-hero"><p className="efsw-section-label"><FileText size={15} /> Resources / เอกสารวิชาการ</p><h1>ความรู้ที่เดินทาง<br /><span>ข้ามพรมแดน</span></h1><p>ศูนย์รวมเอกสารสำหรับนักสังคมสงเคราะห์ นักวิจัย นักศึกษา และองค์กรที่ต้องการเรียนรู้จากบริบทของกันและกัน</p></section>
      <PublicContentFeed kind="document" initialItems={documents} linkLabel="ขอข้อมูลเพิ่มเติม" />
      <section className="efsw-content-cta"><p className="efsw-section-label">Contribute knowledge</p><h2>มีงานวิจัยหรือ<br /><span>เรื่องราวจากพื้นที่?</span></h2><a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--dark">ติดต่อทีมวิชาการ <ArrowUpRight size={17} /></a></section>
        <footer className="efsw-about-footer"><span>© 2026 EFSW</span><a href="/">Eurasia Forum for Social Workers</a><span>English · 한국어 · ไทย</span></footer>
      </main>
    </>
  );
}
