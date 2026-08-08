import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { ArrowButton } from "@/components/axion/ArrowButton";
import { SiteHeader } from "@/components/axion/SiteHeader";
import { workItems } from "@/lib/axion-data";

type ProjectPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: ProjectPageProps): Metadata {
  const project = workItems.find((item) => item.slug === params.slug);
  return {
    title: project ? project.title + " | Axion Studio" : "Project | Axion Studio",
    description: project?.description,
  };
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = workItems.find((item) => item.slug === params.slug);
  if (!project) notFound();

  return (
    <main className="axion-page axion-subpage">
      <section className={"subpage-hero subpage-hero--project " + project.tone}>
        <SiteHeader subpage />
        <div className="section-shell subpage-hero__inner">
          <a className="subpage-back" href="/projects">
            <ArrowLeft size={15} aria-hidden="true" /> All projects
          </a>
          <p className="eyebrow">{project.category}</p>
          <h1>{project.title}</h1>
          <p className="subpage-lede">{project.description}</p>
        </div>
      </section>

      <section className="project-detail" aria-labelledby="project-overview-title">
        <div className="section-shell project-detail__grid">
          <div className="project-detail__media">
            <video
              src={project.video}
              poster={project.poster}
              muted
              loop
              playsInline
              controls
              preload="metadata"
              aria-label={project.title + " project film"}
            />
          </div>
          <div className="project-detail__copy">
            <p className="section-kicker"><span>01</span><span>Project overview</span></p>
            <h2 id="project-overview-title">{project.category}</h2>
            <p>{project.description}</p>
            <ArrowButton href="/projects">Back to projects</ArrowButton>
          </div>
        </div>
      </section>

      <section className="subpage-cta" aria-labelledby="project-next-title">
        <div className="section-shell">
          <p className="section-kicker"><span>02</span><span>Continue browsing</span></p>
          <h2 id="project-next-title">See how the rest of the work comes together.</h2>
          <a className="subpage-back" href="/studio">
            Visit the studio <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}
