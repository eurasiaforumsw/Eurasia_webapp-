"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, BookmarkX, ArrowUpRight } from "lucide-react";
import { getSessionMember } from "@/lib/member-auth";
import { initialContent, getAdminContent, type AdminContentItem } from "@/lib/admin-data";
import { EngagementRow } from "@/components/efsw/EngagementRow";

/* /user/interest - saved-content page.
 *
 * Renders every news/event/document the current member saved, fetched from
 * the database via API. Includes click-to-open route and inline unsave action.
 * For anonymous visitors the page explains the login requirement.
 */

type Interest = {
  id: string;
  memberId: string;
  contentId: string;
  createdAt: string;
  notes: string | null;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Fetch saved items from database on mount */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // Load content items
      setItems(getAdminContent() || initialContent);

      // Get member ID
      const member = getSessionMember();
      const currentMemberId = member?.id ?? null;
      setMemberId(currentMemberId);

      // Fetch interests from API if logged in
      if (currentMemberId) {
        try {
          const response = await fetch(`/api/engagement/interest?memberId=${currentMemberId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch interests: ${response.statusText}`);
          }
          const data = await response.json();
          setInterests(data.interests || []);
        } catch (err) {
          console.error("Error fetching interests:", err);
          setError(err instanceof Error ? err.message : "Failed to load saved items");
        }
      }

      setLoading(false);
    };

    loadData();
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

  const handleUnheart = async (contentId: string) => {
    if (!memberId) return;

    try {
      const response = await fetch("/api/engagement/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, contentId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to unsave: ${response.statusText}`);
      }

      const data = await response.json();

      // If unsaved successfully, remove from local state
      if (!data.saved) {
        setInterests((prev) => prev.filter((interest) => interest.contentId !== contentId));
      }
    } catch (err) {
      console.error("Error unsaving item:", err);
      alert("Failed to remove item. Please try again.");
    }
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

  if (loading) {
    return (
      <main className="efsw-interest-page">
        <header className="efsw-interest-page__head">
          <div>
            <h1 className="efsw-interest-page__title">Saved items</h1>
            <p className="efsw-interest-page__lede">Loading your saved content...</p>
          </div>
        </header>
      </main>
    );
  }

  if (error) {
    return (
      <main className="efsw-interest-page">
        <header className="efsw-interest-page__head">
          <div>
            <h1 className="efsw-interest-page__title">Saved items</h1>
            <p className="efsw-interest-page__lede" style={{ color: "#ef4444" }}>
              {error}
            </p>
          </div>
        </header>
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