import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ArrowButton } from "@/components/axion/ArrowButton";
import { SiteHeader } from "@/components/axion/SiteHeader";
import { studioImages } from "@/lib/axion-data";

export const metadata: Metadata = {
  title: "Studio | Axion Studio",
  description: "Learn how Axion Studio turns complex ideas into clear digital experiences.",
};

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
            </p>
            <ArrowButton href="/projects">See selected work</ArrowButton>
          </div>
          <figure className="studio-detail__image studio-detail__image--large">
            <img src={studioImages.large} alt="Axion brand experience study in soft lilac tones" />
          </figure>
        </div>
      </section>
    </main>
  );
}
