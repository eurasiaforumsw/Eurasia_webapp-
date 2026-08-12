import type { Metadata } from "next";
import { ArrowUpRight, Network, BookOpen, Globe, Users, Handshake, CornerDownRight } from "lucide-react";
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

/* Working groups — placeholder seed data awaiting EFSW confirmation.
   Roles are described by function, not by named individuals, so nothing
   here misrepresents a real appointment before the network confirms it. */
const workingGroups = [
  {
    id: "WG-01",
    name: "Research & Publication",
    reportsTo: "Academic & Practice Network",
    focus:
      "Coordinates joint studies, peer review, and the shared citation library so findings reach practice quickly.",
    composition: ["Academics", "Field researchers", "Postgraduate students"],
    cadence: "Monthly",
    seats: 12,
  },
  {
    id: "WG-02",
    name: "Field Practice Exchange",
    reportsTo: "Member Community",
    focus:
      "Runs case clinics and peer supervision across borders, turning individual casework into transferable method.",
    composition: ["Licensed practitioners", "Supervisors", "NGO field leads"],
    cadence: "Fortnightly",
    seats: 18,
  },
  {
    id: "WG-03",
    name: "Curriculum & Training",
    reportsTo: "Academic & Practice Network",
    focus:
      "Builds shared teaching material and a common competency baseline across partner programmes.",
    composition: ["Faculty", "Curriculum designers", "Training officers"],
    cadence: "Quarterly",
    seats: 9,
  },
  {
    id: "WG-04",
    name: "Policy & Advocacy",
    reportsTo: "Regional Partnerships",
    focus:
      "Translates the network's evidence into submissions, briefings, and positions for public partners.",
    composition: ["Policy analysts", "Institutional delegates", "Advocacy leads"],
    cadence: "Quarterly",
    seats: 10,
  },
];

/* Collaboration reach — indicative figures, pending confirmation */
const collabReach = [
  { value: "4", label: "Working groups", note: "Standing, cross-border" },
  { value: "49", label: "Group seats", note: "Held across the network" },
  { value: "3", label: "Working languages", note: "English · 한국어 · ไทย" },
  { value: "2026", label: "Current cycle", note: "Reviewed annually" },
];

/* How a collaboration moves through the network */
const collabStages = [
  {
    step: "01",
    title: "Proposal",
    body: "Any member or partner institution can open a proposal to the relevant working group.",
  },
  {
    step: "02",
    title: "Group review",
    body: "The working group tests scope, ethics, and capacity, then assigns a lead and co-lead.",
  },
  {
    step: "03",
    title: "Joint work",
    body: "Teams form across countries and disciplines, working in the language that fits the field site.",
  },
  {
    step: "04",
    title: "Return to practice",
    body: "Findings publish to the resource hub and feed back into curriculum and policy work.",
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

        {/* ── Team collaboration ── */}
        <section className="efsw-org-collab" id="collaboration" aria-labelledby="collab-title">
          <div className="efsw-org-collab__inner">

            <div className="efsw-org-collab__head">
              <div>
                <p className="efsw-section-label" data-reveal="fade">
                  <Handshake size={14} aria-hidden /> Team collaboration / การทำงานร่วมกัน
                </p>
                <h2 id="collab-title" data-reveal="clip" data-reveal-slow>
                  Standing groups,<br /><span>shared work.</span>
                </h2>
              </div>
              <p className="efsw-org-collab__lede" data-reveal="slide">
                The four bodies meet in practice through standing working groups. Each group
                draws members from more than one country and reports back into the structure
                above.
              </p>
            </div>

            {/* Reach strip */}
            <div className="efsw-org-collab__reach" data-reveal-group>
              {collabReach.map(({ value, label, note }) => (
                <div key={label} className="efsw-collab-stat" data-reveal="scale">
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{note}</small>
                </div>
              ))}
            </div>

            {/* Working groups */}
            <div className="efsw-org-collab__grid" data-reveal-group>
              {workingGroups.map(({ id, name, reportsTo, focus, composition, cadence, seats }) => (
                <article key={id} className="efsw-collab-card" data-reveal="slide">
                  <div className="efsw-collab-card__top">
                    <span className="efsw-collab-card__id">{id}</span>
                    <span className="efsw-collab-card__cadence">{cadence}</span>
                  </div>

                  <h3>{name}</h3>
                  <p className="efsw-collab-card__reports">
                    <CornerDownRight size={13} aria-hidden /> Reports to {reportsTo}
                  </p>
                  <p className="efsw-collab-card__focus">{focus}</p>

                  <ul className="efsw-collab-card__roles">
                    {composition.map((role) => <li key={role}>{role}</li>)}
                  </ul>

                  <div className="efsw-collab-card__foot">
                    <span><Users size={13} aria-hidden /> {seats} seats</span>
                    <span className="efsw-collab-card__status">Open to members</span>
                  </div>
                </article>
              ))}
            </div>

            {/* How collaboration moves */}
            <div className="efsw-org-collab__flow">
              <p className="efsw-section-label" data-reveal="fade">How a collaboration moves</p>
              <ol className="efsw-collab-flow" data-reveal-group>
                {collabStages.map(({ step, title, body }) => (
                  <li key={step} className="efsw-collab-step" data-reveal="slide">
                    <span className="efsw-collab-step__num">{step}</span>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="efsw-org-collab__note" data-reveal="fade">
              Group names, cadences, and seat counts are placeholder values for layout review.
              Confirmed appointments will replace them once EFSW ratifies the 2026 cycle.
            </p>

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
