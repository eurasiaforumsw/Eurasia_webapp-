import type { Metadata } from "next";
import { ArrowUpRight, Radio } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";

export const metadata: Metadata = {
  title: "Newsroom | Eurasia Forum for Social Workers",
  description: "News, announcements, and updates from the Eurasia Forum for Social Workers.",
};

const newsItems: PublicContentItem[] = [
  {
    id: "news-platform",
    category: "Platform",
    title: "A trilingual platform for regional exchange",
    summary: "EFSW connects English, Korean, and Thai resources so professional knowledge can move more freely across Eurasia.",
  },
  {
    id: "news-membership",
    category: "Membership",
    title: "A network for professionals, students, and institutions",
    summary: "Three membership pathways make room for practitioners, emerging social workers, universities, NGOs, and public partners.",
  },
  {
    id: "news-resources",
    category: "Resources",
    title: "Research and practice belong in the same conversation",
    summary: "The resource hub brings research papers, case studies, field manuals, and regional learning into one shared place.",
  },
];

const filterLabels = ["All", "Platform", "Membership", "Resources", "Events"];

export default function NewsPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-newsroom-page">

        {/* ── Masthead ── */}
        <header className="efsw-newsroom-masthead" id="news-top">
          <div className="efsw-newsroom-masthead__meta" data-reveal="fade">
            <Radio size={12} aria-hidden />
            <span>Newsroom</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>EFSW</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>2026</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>English · 한국어 · ไทย</span>
          </div>

          <div className="efsw-newsroom-masthead__body" data-reveal-group>
            <h1 data-reveal="clip" data-reveal-slow>
              Stories moving<br /><span>the network forward.</span>
            </h1>
            <p data-reveal="slide">
              News, announcements, and updates from the work of connecting social workers across Eurasia.
            </p>
          </div>
        </header>

        {/* ── Articles & Interactive News Feed ── */}
        <PublicContentFeed
          kind="news"
          initialItems={newsItems}
          linkLabel="Contact for details"
        />

        {/* ── CTA ── */}
        <section className="efsw-content-cta" id="news-cta" data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">Stay connected</p>
          <h2 data-reveal="clip" data-reveal-slow>
            Follow what is<br /><span>happening at EFSW.</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">
            Reach out to the team for updates on events, academic work, and new opportunities to collaborate.
          </p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="slide"
          >
            Contact the EFSW team <ArrowUpRight size={17} aria-hidden />
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
