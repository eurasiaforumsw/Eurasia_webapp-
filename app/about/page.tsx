import type { Metadata } from "next";
import { ArrowUpRight, Globe2, UsersRound } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { OrganizationHistory } from "@/components/efsw/OrganizationHistory";

export const metadata: Metadata = {
  title: "About Us | Eurasia Forum for Social Workers",
  description: "The vision, mission, and network behind the Eurasia Forum for Social Workers.",
};

const principles = [
  {
    number: "01",
    title: "Connect",
    body: "Building safe spaces where social workers, researchers, educators, and partners from across the region can exchange experience openly.",
  },
  {
    number: "02",
    title: "Empower",
    body: "Supporting learning, tools, and professional development so knowledge becomes action that fits the reality of each community.",
  },
  {
    number: "03",
    title: "Advocate",
    body: "Standing up for social justice, human rights, and the dignity of the people behind every policy and every programme.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-about-page">
      <section className="efsw-about-hero" id="about-top" aria-labelledby="about-title">
        <div className="efsw-section-label" data-reveal="fade"><Globe2 size={15} /> About EFSW</div>
        <div className="efsw-about-hero__grid" data-reveal-group>
          <h1 id="about-title" data-reveal="clip" data-reveal-slow>
            A regional network<br /><span>with a human centre.</span>
          </h1>
          <div data-reveal="slide">
            <p>The Eurasia Forum for Social Workers is an international space for practitioners, academics, students, and organisations who believe that lasting change comes from working together.</p>
            <p>We help knowledge travel from one place to another, where it becomes inspiration and new options, while keeping context, language, and community voices at the centre.</p>
          </div>
        </div>
      </section>

      <nav className="efsw-about-subnav" aria-label="About EFSW sections">
        <a href="#about-top" data-active="true">About us</a>
        <a href="#direction">Our direction</a>
        <a href="#history">Our story</a>
        <a href="#principles">Our commitments</a>
        <a href="#membership">Membership</a>
      </nav>

      <section className="efsw-about-statement" id="direction" aria-labelledby="vision-title">
        <div className="efsw-section-label" data-reveal="fade">Our direction</div>
        <div className="efsw-about-statement__grid" data-reveal-group>
          <h2 id="vision-title" data-reveal="clip" data-reveal-slow>Social change has no borders.</h2>
          <div data-reveal="slide">
            <p>Our vision is a regional network that raises the standard of social work practice and creates social change through genuine solidarity between countries.</p>
            <div className="efsw-about-stat"><UsersRound size={19} /><span>Professionals · Students · Institutions</span></div>
          </div>
        </div>
      </section>

      <section className="efsw-about-reach" id="reach" aria-label="Network at a glance">
        <div className="efsw-about-reach__inner" data-reveal-group>
          {([
            { value: "3", label: "Languages", note: "English · Korean · Thai" },
            { value: "4", label: "Member pathways", note: "Professional · Student · Institutional · Partner" },
            { value: "1", label: "Regional network", note: "Connecting practitioners across Eurasia" },
          ] as const).map(({ value, label, note }) => (
            <div key={label} className="efsw-reach-stat" data-reveal="scale">
              <strong>{value}</strong>
              <span>{label}</span>
              <small>{note}</small>
            </div>
          ))}
        </div>
      </section>

      <OrganizationHistory />

      <section className="efsw-principles" id="principles" aria-labelledby="principles-title">
        <div className="efsw-section-label" data-reveal="fade">The three commitments</div>
        <h2 id="principles-title" data-reveal="clip" data-reveal-slow>What we practice<br /><span>together.</span></h2>
        <div className="efsw-principles__grid" data-reveal-group>
          {principles.map((principle) => (
            <article key={principle.number} className="efsw-principle-card" data-reveal="scale">
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="efsw-about-cta" id="membership" aria-labelledby="about-cta-title">
        <div data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">Join the network</p>
          <h2 id="about-cta-title" data-reveal="clip" data-reveal-slow>Bring your work<br /><span>into the conversation.</span></h2>
          <p data-reveal="slide">Join a network that opens space for knowledge, experience, and collaboration to travel across borders.</p>
          <a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--light" data-reveal="slide">Contact the EFSW team <ArrowUpRight size={17} /></a>
        </div>
      </section>

      <footer className="efsw-about-footer"><span>© 2026 EFSW</span><a href="/">Eurasia Forum for Social Workers</a><span>English · Korean · Thai</span></footer>
      </main>
    </>
  );
}
