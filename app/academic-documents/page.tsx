import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, FileText, FileBarChart2 } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";

export const metadata: Metadata = {
  title: "Academic Documents | Eurasia Forum for Social Workers",
  description: "A shared hub for research papers, field manuals, and policy briefings from the EFSW network.",
};

const documents: PublicContentItem[] = [
  {
    id: "document-research",
    category: "Research",
    title: "Research papers and articles",
    summary: "A home for academic writing, field research, and lessons drawn from practice across the region.",
  },
  {
    id: "document-practice",
    category: "Practice",
    title: "Field manuals and practice guides",
    summary: "Resources that help social workers adapt shared knowledge to the realities of their own context.",
  },
  {
    id: "document-briefings",
    category: "Briefings",
    title: "Policy briefings",
    summary: "Short, clear perspectives ready to bring into conversations about policy and collaboration.",
  },
];

const categoryCards = [
  {
    Icon: BookOpen,
    label: "Research",
    sublabel: "Papers & Articles",
    description: "Academic writing, field studies, and cross-regional analysis from the EFSW network.",
    mod: "research",
  },
  {
    Icon: FileText,
    label: "Practice",
    sublabel: "Manuals & Guides",
    description: "Practical resources designed to translate shared knowledge into real community contexts.",
    mod: "practice",
  },
  {
    Icon: FileBarChart2,
    label: "Briefings",
    sublabel: "Policy & Analysis",
    description: "Concise perspectives on policy and collaboration — ready for professional conversations.",
    mod: "briefings",
  },
];

export default function AcademicDocumentsPage() {
  return (
    <>
      <SiteNav />
      <main className="efsw-library-page">

        {/* ── Hero ── */}
        <header className="efsw-library-hero" id="resources-intro">
          <div className="efsw-library-hero__text">
            <p className="efsw-section-label" data-reveal="fade">
              <FileText size={14} aria-hidden /> Open Library / คลังความรู้
            </p>
            <h1 data-reveal="clip" data-reveal-slow>
              Knowledge that<br /><span>travels across borders.</span>
            </h1>
            <p data-reveal="slide">
              A shared library for social workers, researchers, students, and institutions who want to
              learn from one another&rsquo;s context.
            </p>
          </div>

          {/* Category cards */}
          <div className="efsw-library-cats" data-reveal-group aria-label="Document categories">
            {categoryCards.map(({ Icon, label, sublabel, description, mod }) => (
              <div
                key={label}
                className={`efsw-library-cat efsw-library-cat--${mod}`}
                data-reveal="scale"
              >
                <div className="efsw-library-cat__icon">
                  <Icon size={20} aria-hidden />
                </div>
                <strong>{label}</strong>
                <span>{sublabel}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </header>

        {/* ── Document list ── */}
        <PublicContentFeed
          kind="document"
          initialItems={documents}
          linkLabel="Request more information"
        />

        {/* ── Contribute CTA ── */}
        <section className="efsw-content-cta" id="contribute" data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">Contribute knowledge</p>
          <h2 data-reveal="clip" data-reveal-slow>
            Have research or<br /><span>a story from the field?</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">
            We welcome papers, case studies, and practice notes that help the region learn faster together.
          </p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="scale"
          >
            Contact the academic team <ArrowUpRight size={17} aria-hidden />
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
