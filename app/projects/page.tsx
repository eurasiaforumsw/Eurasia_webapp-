import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ArrowButton } from "@/components/axion/ArrowButton";
import { SiteHeader } from "@/components/axion/SiteHeader";
import { workItems } from "@/lib/axion-data";

export const metadata: Metadata = {
  title: "Projects | Axion Studio",
  description: "Selected digital experiences by Axion Studio.",
};

export default function ProjectsPage() {
  return (
    <main className="axion-page axion-subpage">
      <section className="subpage-hero">
        <SiteHeader subpage />
        <div className="section-shell subpage-hero__inner">
          <a className="subpage-back" href="/">
            Back to Axion <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="eyebrow">Featured client work</p>
          <h1>Projects with a point of view.</h1>
          <p className="subpage-lede">
            A small selection of digital experiences shaped through strategy, creative thinking and iteration.
          </p>
        </div>
      </section>

      <section className="subpage-projects" aria-labelledby="projects-title">
        <div className="section-shell">
          <div className="subpage-section-head">
            <p className="section-kicker"><span>01</span><span>Selected work</span></p>
            <h2 id="projects-title">Make the complex feel clear.</h2>
          </div>
          <div className="subpage-project-grid">
            {workItems.map((item) => (
              <article className={"subpage-project-card " + item.tone} key={item.slug}>
                <a className="subpage-project-card__media" href={"/projects/" + item.slug}>
                  <img src={item.poster} alt={item.title + " project preview"} />
                  <span className="subpage-project-card__view">
                    View case <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </a>
                <div className="subpage-project-card__body">
                  <p>{item.category}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="subpage-cta" aria-labelledby="projects-cta-title">
        <div className="section-shell">
          <p className="section-kicker"><span>02</span><span>Keep exploring</span></p>
          <h2 id="projects-cta-title">The right next step starts with a useful question.</h2>
          <ArrowButton href="/studio">Meet the studio</ArrowButton>
        </div>
      </section>
    </main>
  );
}
