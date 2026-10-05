"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowUpRight, ChevronDown, MapPin } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import {
  type AdminBoardMember,
  type AdminLayoutConfig,
  defaultLayoutConfig,
  getAdminLayout,
} from "@/lib/admin-data";

/* Read board members at render time from the same admin layout the editor
   uses — additions / reorders / photo swaps in Admin → Layout → Executive
   Board show up here on the next page load, without a deploy. */
function readBoardMembers(): AdminLayoutConfig["boardMembers"] {
  try {
    return getAdminLayout().boardMembers || [];
  } catch {
    return defaultLayoutConfig.boardMembers;
  }
}

/* Avatar fallback — initials on a calm surface, used when no image is set. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* Whether the title marks the chair of the board (used to mark the card
   with a small "Chair" badge so visitors know who leads the meeting). */
function isChair(title: string): boolean {
  return /president|chair/i.test(title);
}

/* One entry in the 2-column grid. The disclosure keeps its own state so
   opening one card never reflows the others. */
function BoardCard({ member }: { member: AdminBoardMember }) {
  const [open, setOpen] = useState(false);
  const bio = member.bio?.trim();

  return (
    <article className="efsw-board-card" data-reveal="slide">
      <div className="efsw-board-portrait" aria-hidden="true">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.image} alt="" loading="lazy" />
        ) : (
          <span className="efsw-board-portrait__fallback">{initialsOf(member.name)}</span>
        )}
      </div>

      <div className="efsw-board-meta">
        <h3>{member.name}</h3>
        <span className="efsw-board-card__role">
          {member.title}
          {isChair(member.title) && (
            <span className="efsw-board-card__chair" aria-label="Chair">Chair</span>
          )}
        </span>
        {member.country && (
          <span className="efsw-board-card__country">
            <MapPin size={13} aria-hidden /> {member.country}
          </span>
        )}
      </div>

      {bio && (
        <>
          <div
            id={`bio-${member.id}`}
            className="efsw-board-card__bio"
            data-open={open ? "true" : "false"}
          >
            <div>
              <p>{bio}</p>
            </div>
          </div>

          <button
            type="button"
            className="efsw-board-card__cta"
            aria-expanded={open}
            aria-controls={`bio-${member.id}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Show less" : "Show more"}
            <ChevronDown size={15} aria-hidden />
          </button>
        </>
      )}
    </article>
  );
}

export default function ExecutiveBoardPage() {
  const { t } = useI18n();
  const members = readBoardMembers();

  return (
    <>
      <SiteNav />
      <main className="efsw-about-page efsw-board-page">
        {/* Hero — same eyebrow / headline / lede vocabulary as /about */}
        <section className="efsw-about-hero" aria-labelledby="board-hero-title">
          <div className="efsw-about-hero__grid" data-reveal-group>
            <h1 id="board-hero-title" data-reveal="clip" data-reveal-slow>
              Executive<br /><span>Board.</span>
            </h1>
            <div data-reveal="slide">
              <p>
                Our Executive Board brings regional perspective and professional depth to every decision the EFSW network makes — from membership pathways to event programming, research priorities to partnerships across borders.
              </p>
              <p>
                Members serve voluntarily and represent the three membership pathways: practitioners, students, and institutional partners.
              </p>
            </div>
          </div>
        </section>

        {/* Sub-nav (mirrors the one on /about and /organizations) */}
        <nav className="efsw-about-subnav" aria-label="Executive Board sections">
          <a href="#board" data-active="true">Board members</a>
          <a href="#contact">Get in touch</a>
        </nav>

        {/* Board members — unified 2-column grid */}
        <section className="efsw-board-grid-section" id="board" aria-labelledby="board-grid-title">
          <header className="efsw-board-section-head" data-reveal-group>
            <span className="efsw-board-eyebrow">Governance</span>
            <h2 id="board-grid-title" data-reveal="clip">Board members</h2>
            <p data-reveal="slide">
              {members.length} {members.length === 1 ? "member" : "members"} bringing regional perspective and professional depth to EFSW governance.
            </p>
          </header>

          {members.length > 0 ? (
            <div className="efsw-board-grid" data-reveal-group>
              {members.map((m) => (
                <BoardCard key={m.id} member={m} />
              ))}
            </div>
          ) : (
            <div className="efsw-board-empty" aria-live="polite">
              <p>No board members are listed yet. Add members in <a href="/admin/layout">Admin → Layout → Executive Board</a>.</p>
            </div>
          )}
        </section>

        {/* Contact / CTA — keeps the same close-the-loop footer rhythm as /about */}
        <section className="efsw-about-cta" id="contact" aria-labelledby="board-cta-title">
          <div data-reveal-group>
            <h2 id="board-cta-title" data-reveal="clip" data-reveal-slow>
              Reach the<br /><span>Executive Board.</span>
            </h2>
            <p data-reveal="slide">
              Member enquiries, partnership proposals, or governance questions — the board reviews each item at its quarterly meeting.
            </p>
            <a
              href="mailto:support@eurasiaforumsw.org"
              className="efsw-button efsw-button--light"
              data-reveal="slide"
            >
              Email the board secretariat <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
        </footer>
      </main>
    </>
  );
}