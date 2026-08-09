import type { Metadata } from "next";
import { ArrowUpRight, Network, BookOpen, Globe, Users } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";

export const metadata: Metadata = {
  title: "Organization | Eurasia Forum for Social Workers",
  description: "The structure and roles that hold the EFSW network together.",
};

const branches = [
  {
    num: "02",
    tag: "Knowledge",
    Icon: BookOpen,
    title: "Academic & Practice Network",
    body: "Connects academics, practitioners, and learners so knowledge moves in both directions — from theory into field, and from field back into learning.",
  },
  {
    num: "03",
    tag: "Partnerships",
    Icon: Globe,
    title: "Regional Partnerships",
    body: "Works alongside universities, NGOs, government bodies, and partners across the region to build bridges and open new pathways for collaboration.",
  },
  {
    num: "04",
    tag: "Community",
    Icon: Users,
    title: "Member Community",
    body: "Where members build collaborations, share opportunities, and scale their impact — the open space where the network actually lives.",
  },
];

const membershipTypes = [
  {
    type: "Professional",
    body: "Practitioners and social work professionals contributing knowledge from the field.",
  },
  {
    type: "Student",
    body: "Emerging social workers and academic learners shaping the next generation of practice.",
  },
  {
    type: "Institutional",
    body: "Universities, NGOs, government bodies, and partner organisations working at scale.",
  },
];

export default function OrganizationPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-org-page">

        {/* ── Masthead ── */}
        <header className="efsw-org-masthead" id="org-top">
          <div className="efsw-org-masthead__inner">
            <p className="efsw-section-label" data-reveal="fade">
              <Network size={14} aria-hidden /> Organization / โครงสร้างองค์กร
            </p>
            <h1 data-reveal="clip" data-reveal-slow>
              Four bodies.<br /><span>One direction.</span>
            </h1>
            <p data-reveal="slide">
              EFSW is held together by four interconnected bodies — from strategic governance to active community practice across the region.
            </p>
          </div>
        </header>

        {/* ── Org Structure ── */}
        <section className="efsw-org-structure" id="structure" aria-labelledby="structure-label">
          <p id="structure-label" className="efsw-visually-hidden">Organizational structure</p>
          <div className="efsw-org-structure__inner">

            {/* Executive Council — primary node */}
            <article className="efsw-org-node efsw-org-node--primary" data-reveal="scale">
              <div className="efsw-org-node__header">
                <span className="efsw-org-node__num">01</span>
                <span className="efsw-org-node__tag">Leadership</span>
              </div>
              <h2>Executive Council</h2>
              <p>Sets strategic direction and keeps the work of the network anchored to its mission — ensuring every initiative serves the communities we exist for.</p>
            </article>

            {/* Visual connector */}
            <div className="efsw-org-connector" aria-hidden="true">
              <span className="efsw-org-connector__stem" />
              <span className="efsw-org-connector__bar" />
            </div>

            {/* Three branches */}
            <div className="efsw-org-branches" data-reveal-group>
              {branches.map(({ num, tag, Icon, title, body }) => (
                <article key={num} className="efsw-org-node efsw-org-node--branch" data-reveal="slide">
                  <div className="efsw-org-node__header">
                    <span className="efsw-org-node__num">{num}</span>
                    <span className="efsw-org-node__tag">{tag}</span>
                  </div>
                  <Icon size={22} className="efsw-org-node__icon" aria-hidden />
                  <h2>{title}</h2>
                  <p>{body}</p>
                </article>
              ))}
            </div>

          </div>
        </section>

        {/* ── Membership ── */}
        <section className="efsw-org-membership" id="membership" aria-labelledby="membership-title">
          <div className="efsw-org-membership__inner">
            <p className="efsw-section-label" data-reveal="fade">Who can join / สมาชิกภาพ</p>
            <h2 id="membership-title" data-reveal="clip" data-reveal-slow>
              Open to<br /><span>every voice.</span>
            </h2>
            <div className="efsw-org-membership__grid" data-reveal-group>
              {membershipTypes.map(({ type, body }) => (
                <div key={type} className="efsw-membership-type" data-reveal="slide">
                  <strong>{type}</strong>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="efsw-content-cta" id="org-cta" data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">Work with EFSW</p>
          <h2 data-reveal="clip" data-reveal-slow>
            Our network is open<br /><span>to collaboration.</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">
            Whether you're an individual practitioner, a student, or an institution — there's a place in this network for the work you do.
          </p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="slide"
          >
            Contact the team <ArrowUpRight size={17} aria-hidden />
          </a>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
          <span>English · 한국어 · ไทย</span>
        </footer>
      </main>
    </>
  );
}
