import type { Metadata } from "next";
import { ArrowUpRight, Sparkles, Target, Zap, Users, Lightbulb, Code } from "lucide-react";
import { ArrowButton } from "@/components/axion/ArrowButton";
import { SiteHeader } from "@/components/axion/SiteHeader";
import { studioImages } from "@/lib/axion-data";

export const metadata: Metadata = {
  title: "Studio | Axion Studio",
  description: "Learn how Axion Studio turns complex ideas into clear digital experiences.",
};

const principles = [
  { icon: Target, title: "Strategy First", description: "Every pixel serves a purpose. We start with your goals and work backward to craft experiences that deliver measurable results." },
  { icon: Sparkles, title: "Craft & Detail", description: "Obsessive attention to typography, motion, and interaction design. We believe great design is felt, not just seen." },
  { icon: Zap, title: "Performance Matters", description: "Beautiful experiences that load instantly. We optimize for speed without compromising on visual quality." },
];

const services = [
  { icon: Lightbulb, title: "Brand Strategy", list: ["Brand positioning", "Visual identity", "Design systems", "Content strategy"] },
  { icon: Code, title: "Digital Products", list: ["Web applications", "Interactive experiences", "Motion & animation", "Technical consulting"] },
  { icon: Users, title: "Experience Design", list: ["User research", "Interface design", "Prototyping", "Usability testing"] },
];

export default function StudioPage() {
  return (
    <main className="axion-page axion-subpage">
      <section className="subpage-hero subpage-hero--studio">
        <SiteHeader subpage />
        <div className="section-shell subpage-hero__inner">
          <a className="subpage-back" href="/">
            Back to Axion <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="eyebrow">Introducing Axion</p>
          <h1>Strategy-led creatives, delivering results in digital and beyond.</h1>
          <p className="subpage-lede">
            Through research, creative thinking and iteration we help growing brands realize their full digital potential.
          </p>
        </div>
      </section>

      <section className="studio-detail" aria-labelledby="studio-detail-title">
        <div className="section-shell studio-detail__grid">
          <figure className="studio-detail__image studio-detail__image--small">
            <img src={studioImages.small} alt="Axion digital art study in warm orange tones" />
          </figure>
          <div className="studio-detail__copy">
            <p className="section-kicker"><span>01</span><span>How we work</span></p>
            <h2 id="studio-detail-title">Strategy first. Details always.</h2>
            <p>
              Axion works with ambitious teams to turn complex ideas into clear, memorable digital experiences.
              We believe in the power of simplicity—stripping away the unnecessary to reveal what truly matters.
            </p>
            <p>
              From brand strategy to interactive prototypes, we partner with forward-thinking organizations
              to build digital products that people actually want to use.
            </p>
            <ArrowButton href="/projects">See selected work</ArrowButton>
          </div>
          <figure className="studio-detail__image studio-detail__image--large">
            <img src={studioImages.large} alt="Axion brand experience study in soft lilac tones" />
          </figure>
        </div>
      </section>

      <section className="studio-principles" aria-labelledby="principles-title">
        <div className="section-shell">
          <p className="section-kicker"><span>02</span><span>Our approach</span></p>
          <h2 id="principles-title">Three principles guide every project.</h2>
          <div className="studio-principles__grid">
            {principles.map((principle, index) => (
              <article key={index} className="studio-principle-card">
                <principle.icon size={32} strokeWidth={1.5} aria-hidden="true" />
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-services" aria-labelledby="services-title">
        <div className="section-shell">
          <p className="section-kicker"><span>03</span><span>What we do</span></p>
          <h2 id="services-title">End-to-end design and development.</h2>
          <div className="studio-services__grid">
            {services.map((service, index) => (
              <article key={index} className="studio-service-card">
                <service.icon size={28} strokeWidth={1.5} aria-hidden="true" />
                <h3>{service.title}</h3>
                <ul>
                  {service.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-process" aria-labelledby="process-title">
        <div className="section-shell">
          <p className="section-kicker"><span>04</span><span>Our process</span></p>
          <h2 id="process-title">From brief to launch in four phases.</h2>
          <div className="studio-process__timeline">
            <div className="studio-process__phase">
              <span className="studio-process__phase-number">01</span>
              <h3>Discover</h3>
              <p>Understand your goals, audience, and competitive landscape through research and stakeholder interviews.</p>
            </div>
            <div className="studio-process__phase">
              <span className="studio-process__phase-number">02</span>
              <h3>Define</h3>
              <p>Synthesize insights into a clear strategy, information architecture, and design direction.</p>
            </div>
            <div className="studio-process__phase">
              <span className="studio-process__phase-number">03</span>
              <h3>Design</h3>
              <p>Craft high-fidelity designs and interactive prototypes, iterating based on feedback and testing.</p>
            </div>
            <div className="studio-process__phase">
              <span className="studio-process__phase-number">04</span>
              <h3>Deliver</h3>
              <p>Build, test, and launch your product with detailed documentation and ongoing support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="subpage-cta" aria-labelledby="studio-cta-title">
        <div className="section-shell">
          <p className="section-kicker"><span>05</span><span>Start a project</span></p>
          <h2 id="studio-cta-title">Let's build something meaningful together.</h2>
          <ArrowButton href="/projects">View our work</ArrowButton>
        </div>
      </section>
    </main>
  );
}
