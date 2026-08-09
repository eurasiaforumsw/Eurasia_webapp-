import type { Metadata } from "next";
import { ArrowUpRight, Globe2, UsersRound } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | Eurasia Forum for Social Workers",
  description: "รู้จักวิสัยทัศน์ พันธกิจ และเครือข่ายของ Eurasia Forum for Social Workers.",
};

const principles = [
  {
    number: "01",
    title: "Connect",
    thai: "เชื่อมโยง",
    body: "สร้างพื้นที่ปลอดภัยสำหรับนักสังคมสงเคราะห์ นักวิจัย นักการศึกษา และภาคีจากหลากหลายประเทศได้แลกเปลี่ยนประสบการณ์",
  },
  {
    number: "02",
    title: "Empower",
    thai: "เสริมพลัง",
    body: "สนับสนุนการเรียนรู้ เครื่องมือ และโอกาสพัฒนาวิชาชีพ เพื่อให้ความรู้เปลี่ยนเป็นการลงมือทำที่เหมาะกับแต่ละชุมชน",
  },
  {
    number: "03",
    title: "Advocate",
    thai: "เป็นกระบอกเสียง",
    body: "ยืนหยัดเพื่อความยุติธรรมทางสังคม สิทธิมนุษยชน และศักดิ์ศรีของผู้คนที่อยู่เบื้องหลังทุกนโยบายและโครงการ",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-about-page">
      <section className="efsw-about-hero" aria-labelledby="about-title">
        <div className="efsw-section-label"><Globe2 size={15} /> About EFSW / เกี่ยวกับเรา</div>
        <div className="efsw-about-hero__grid">
          <h1 id="about-title">A regional network<br /><span>with a human centre.</span></h1>
          <div>
            <p>Eurasia Forum for Social Workers คือพื้นที่ความร่วมมือระดับนานาชาติสำหรับผู้ทำงานด้านสังคมสงเคราะห์ นักวิชาการ นักศึกษา และองค์กรที่เชื่อว่าการเปลี่ยนแปลงที่ยั่งยืนเกิดจากการลงมือทำร่วมกัน</p>
            <p>เราช่วยให้ความรู้จากพื้นที่หนึ่งเดินทางไปสร้างแรงบันดาลใจและทางเลือกใหม่ในอีกพื้นที่หนึ่ง โดยให้ความสำคัญกับบริบท ภาษา และเสียงของชุมชน</p>
          </div>
        </div>
      </section>

      <section className="efsw-about-statement" aria-labelledby="vision-title">
        <div className="efsw-section-label">Our direction / ทิศทางของเรา</div>
        <div className="efsw-about-statement__grid">
          <h2 id="vision-title">Social change has no borders.</h2>
          <div>
            <p>วิสัยทัศน์ของเราคือเครือข่ายระดับภูมิภาคที่ยกระดับการทำงานด้านสังคมสงเคราะห์ และสร้างความเปลี่ยนแปลงทางสังคมผ่านความเป็นน้ำหนึ่งใจเดียวกันระหว่างประเทศ</p>
            <div className="efsw-about-stat"><UsersRound size={19} /><span>Professionals · Students · Institutions</span></div>
          </div>
        </div>
      </section>

      <section className="efsw-principles" aria-labelledby="principles-title">
        <div className="efsw-section-label">The three commitments / พันธกิจหลัก</div>
        <h2 id="principles-title">What we practice<br /><span>together.</span></h2>
        <div className="efsw-principles__grid">
          {principles.map((principle) => (
            <article key={principle.number} className="efsw-principle-card">
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <small>{principle.thai}</small>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="efsw-about-cta" id="membership" aria-labelledby="about-cta-title">
        <div>
          <p className="efsw-section-label">Join the network / เข้าร่วมเครือข่าย</p>
          <h2 id="about-cta-title">Bring your work<br /><span>into the conversation.</span></h2>
          <p>เข้าร่วมเครือข่ายที่เปิดพื้นที่ให้ความรู้ ประสบการณ์ และความร่วมมือเดินทางข้ามพรมแดน</p>
          <a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--light">ติดต่อทีม EFSW <ArrowUpRight size={17} /></a>
        </div>
      </section>

      <footer className="efsw-about-footer"><span>© 2026 EFSW</span><a href="/">Eurasia Forum for Social Workers</a><span>English · 한국어 · ไทย</span></footer>
      </main>
    </>
  );
}
