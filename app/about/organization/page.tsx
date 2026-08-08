import type { Metadata } from "next";
import { ArrowUpRight, Building2, MoveLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "โครงสร้างองค์กร | Eurasia Forum for Social Workers",
  description: "โครงสร้างองค์กรและบทบาทของเครือข่าย EFSW.",
};

const roles = [
  ["01", "Executive Council", "กำหนดทิศทางเชิงกลยุทธ์และดูแลให้การทำงานของเครือข่ายยึดอยู่กับพันธกิจ"],
  ["02", "Academic & Practice Network", "เชื่อมโยงนักวิชาการ ผู้ปฏิบัติงาน และผู้เรียนรู้เพื่อแลกเปลี่ยนองค์ความรู้"],
  ["03", "Regional Partnerships", "ทำงานร่วมกับมหาวิทยาลัย องค์กรพัฒนาเอกชน หน่วยงานรัฐ และภาคีในภูมิภาค"],
  ["04", "Member Community", "พื้นที่ของสมาชิกในการสร้างความร่วมมือ แบ่งปันโอกาส และขยายผลการทำงานในพื้นที่"],
];

export default function OrganizationPage() {
  return (
    <main className="efsw-content-page">
      <nav className="efsw-about-nav" aria-label="Organization navigation">
        <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
        <a href="/about" className="efsw-text-link"><MoveLeft size={16} /> เกี่ยวกับเรา</a>
      </nav>
      <section className="efsw-content-hero">
        <p className="efsw-section-label">About EFSW / เกี่ยวกับเรา</p>
        <h1>โครงสร้างองค์กร<br /><span>ที่ทำงานร่วมกัน</span></h1>
        <p>การเปลี่ยนแปลงระดับภูมิภาคเกิดขึ้นได้เมื่อบทบาทต่าง ๆ เชื่อมต่อกันอย่างชัดเจน และเปิดพื้นที่ให้เสียงจากการทำงานจริงมีส่วนร่วม</p>
      </section>
      <section className="efsw-org-list" aria-label="Organization roles">
        {roles.map(([number, title, body]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{body}</p><ArrowUpRight size={18} /></article>)}
      </section>
      <section className="efsw-content-cta"><p className="efsw-section-label">Work with EFSW</p><h2>เครือข่ายของเรา<br /><span>เปิดรับความร่วมมือ</span></h2><a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--dark">ติดต่อทีมงาน <ArrowUpRight size={17} /></a></section>
      <footer className="efsw-about-footer"><span>© 2026 EFSW</span><a href="/">Eurasia Forum for Social Workers</a><span>English · 한국어 · ไทย</span></footer>
    </main>
  );
}
