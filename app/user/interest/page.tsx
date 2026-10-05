"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, BookmarkX, ArrowUpRight } from "lucide-react";
import { getInterests, toggleInterest, type Interest } from "@/lib/member-engagement";
import { getSessionMember } from "@/lib/member-auth";
import { initialContent, getAdminContent, type AdminContentItem } from "@/lib/admin-data";
import { EngagementRow } from "@/components/efsw/EngagementRow";

/* /user/interest - saved-content page.
 *
 * Renders every news/event/document the current member hearted, with a
 * click-to-open route and an inline un-heart action. Falls back to the
 * shared AdminContent list (loaded from localStorage / API). For
 * anonymous visitors the page explains the login requirement.
 */

const contentLink = (item: AdminContentItem): string => {
  if (item.kind === "event") return `/events/${item.id}`;
  if (item.kind === "document") return `/academic-documents/${item.id}`;
  return `/news/${item.id}`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
};

export default function InterestPage() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);

  /* Hydrate once: combine admin-managed content list with the localStorage
     memberId + interest rows. Re-runs on storage / engagement events so
     un-hearting from the page removes the row immediately. */
  useEffect(() => {
    const refresh = () => {
      setItems(getAdminContent() || initialContent);
      setInterests(getInterests());
      const member = getSessionMember();
      setMemberId(member?.id ?? null);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("efsw:engagement-changed", refresh as EventListener);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("efsw:engagement-changed", refresh as EventListener);
    };
  }, []);

  const memberInterests = useMemo(
    () => (memberId ? interests.filter((row) => row.memberId === memberId) : []),
    [interests, memberId],
  );

  const savedItems = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return memberInterests
      .map((row) => ({ row, item: byId.get(row.contentId) }))
      .filter((entry): entry is { row: Interest; item: AdminContentItem } => Boolean(entry.item))
      .sort((a, b) => Date.parse(b.row.createdAt) - Date.parse(a.row.createdAt));
  }, [memberInterests, items]);

  const handleUnheart = (contentId: string) => {
    if (!memberId) return;
    toggleInterest(memberId, contentId);
  };

  if (!memberId) {
    return (
      <main className="efsw-interest-page">
        <header className="efsw-interest-page__head">
          <div>
            <h1 className="efsw-interest-page__title">Saved items</h1>
            <p className="efsw-interest-page__lede">
              Sign in as a member to keep articles and events you care about in one place.
            </p>
          </div>
        </header>
        <div className="efsw-interest-page__empty">
          <span className="efsw-interest-page__empty-icon" aria-hidden="true">
            <Heart size={22} strokeWidth={1.9} />
          </span>
          <p className="efsw-interest-page__empty-title">Log in to save content</p>
          <p className="efsw-interest-page__empty-body">
            Tap the heart icon on any article to add it here.
          </p>
          <Link href="/member/login" className="efsw-interest-page__cta">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="efsw-interest-page">
      <header className="efsw-interest-page__head">
        <div>
          <h1 className="efsw-interest-page__title">Saved items</h1>
          <p className="efsw-interest-page__lede">
            News, events, and documents you hearted. Pick up where you left off - saved items stay private to your account.
          </p>
        </div>
        <span className="efsw-interest-page__count">
          <Heart size={13} strokeWidth={2.2} aria-hidden="true" fill="currentColor" />
          {savedItems.length} saved
        </span>
      </header>

      {savedItems.length === 0 ? (
        <div className="efsw-interest-page__empty">
          <span className="efsw-interest-page__empty-icon" aria-hidden="true">
            <Heart size={22} strokeWidth={1.9} />
          </span>
          <p className="efsw-interest-page__empty-title">Nothing saved yet</p>
          <p className="efsw-interest-page__empty-body">
            Tap the heart icon on articles or events you want to revisit.
          </p>
          <Link href="/news" className="efsw-interest-page__cta efsw-interest-page__cta--ghost">
            Browse the newsroom →
          </Link>
        </div>
      ) : (
        <div className="efsw-interest-page__grid">
          {savedItems.map(({ row, item }) => (
            <article key={row.contentId} className="efsw-interest-page__card">
              <header className="efsw-interest-page__card-head">
                <span className="efsw-interest-page__kind">{item.kind}</span>
                <button
                  type="button"
                  onClick={() => handleUnheart(row.contentId)}
                  aria-label="Remove from saved"
                  className="efsw-interest-page__remove"
                >
                  <BookmarkX size={16} strokeWidth={1.9} aria-hidden="true" />
                </button>
              </header>

              <Link href={contentLink(item)} className="efsw-interest-page__card-title">
                <span>{item.title}</span>
                <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" className="efsw-interest-page__card-arrow" />
              </Link>

              {item.summary && (
                <p className="efsw-interest-page__card-summary">{item.summary}</p>
              )}

              <footer className="efsw-interest-page__card-foot">
                <span className="efsw-interest-page__saved-date">Saved {formatDate(row.createdAt)}</span>
                <EngagementRow contentId={row.contentId} memberId={memberId} />
              </footer>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}