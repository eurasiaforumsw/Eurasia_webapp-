"use client";

import { Heart, Eye, ThumbsUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  formatCount,
  getSessionVisitorId,
  useEngagementCounts,
} from "@/lib/member-engagement";

/* Engagement row (heart / like / view) — lives in content card footers
 * and on the detail page header. Members can toggle heart + like;
 * the view counter is read-only and auto-increments via `recordView`
 * on mount of an article page.
 *
 * Now uses API endpoints instead of localStorage:
 * - POST /api/engagement/interest (toggle save/heart)
 * - POST /api/engagement/like (toggle like)
 * - POST /api/engagement/view (record view)
 *
 * For anonymous visitors, the heart and like are disabled with a
 * tooltip-like aria-hint pointing to the login route.
 */

type EngagementRowProps = {
  contentId: string;
  memberId: string | null;
  /** When true, render only the read-only counts (no buttons). */
  readonly?: boolean;
};

export function EngagementRow({ contentId, memberId, readonly }: EngagementRowProps) {
  const counts = useEngagementCounts(contentId, memberId);
  const [isTogglingInterest, setIsTogglingInterest] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleInterest = async () => {
    if (!memberId || isTogglingInterest) return;

    setIsTogglingInterest(true);
    setError(null);

    try {
      const response = await fetch("/api/engagement/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, contentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle interest");
      }

      // Trigger storage event to update counts
      window.dispatchEvent(new CustomEvent("efsw:engagement-changed", { detail: { key: "interests" } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      console.error("Toggle interest error:", err);
    } finally {
      setIsTogglingInterest(false);
    }
  };

  const handleToggleLike = async () => {
    if (!memberId || isTogglingLike) return;

    setIsTogglingLike(true);
    setError(null);

    try {
      const response = await fetch("/api/engagement/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, contentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle like");
      }

      // Trigger storage event to update counts
      window.dispatchEvent(new CustomEvent("efsw:engagement-changed", { detail: { key: "likes" } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      console.error("Toggle like error:", err);
    } finally {
      setIsTogglingLike(false);
    }
  };

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="efsw-engagement" data-readonly={readonly ? "true" : undefined}>
      {/* Error toast */}
      {error && (
        <div className="efsw-engagement__error" role="alert">
          {error}
        </div>
      )}

      {/* Interest (heart) */}
      <button
        type="button"
        className="efsw-engagement__btn"
        aria-pressed={counts.isInterested}
        disabled={!memberId || isTogglingInterest}
        title={!memberId ? "Log in to save" : undefined}
        onClick={handleToggleInterest}
      >
        {isTogglingInterest ? (
          <Loader2 size={15} className="efsw-engagement__spinner" />
        ) : (
          <Heart
            size={15}
            strokeWidth={2}
            className="efsw-engagement__heart"
            data-on={counts.isInterested}
            fill={counts.isInterested ? "currentColor" : "none"}
          />
        )}
        <span className="efsw-engagement__count">{formatCount(counts.interests)}</span>
      </button>

      {/* Like (thumbs-up) */}
      <button
        type="button"
        className="efsw-engagement__btn"
        aria-pressed={counts.isLiked}
        disabled={!memberId || isTogglingLike}
        title={!memberId ? "Log in to like" : undefined}
        onClick={handleToggleLike}
      >
        {isTogglingLike ? (
          <Loader2 size={15} className="efsw-engagement__spinner" />
        ) : (
          <ThumbsUp
            size={15}
            strokeWidth={2}
            className="efsw-engagement__like"
            data-on={counts.isLiked}
            fill={counts.isLiked ? "currentColor" : "none"}
          />
        )}
        <span className="efsw-engagement__count">{formatCount(counts.likes)}</span>
      </button>

      {/* View count — read-only */}
      <span className="efsw-engagement__btn efsw-engagement__view" aria-label={`${counts.views} views`}>
        <Eye size={15} strokeWidth={2} />
        <span className="efsw-engagement__count">{formatCount(counts.views)}</span>
      </span>
    </div>
  );
}

/* Helper for article pages to bump the view counter on first render. */
export function RecordView({ contentId }: { contentId: string }) {
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (recorded) return;

    const recordView = async () => {
      const visitorId = getSessionVisitorId();

      try {
        const response = await fetch("/api/engagement/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, contentId }),
        });

        if (response.ok) {
          setRecorded(true);
          // Trigger storage event to update counts
          window.dispatchEvent(new CustomEvent("efsw:engagement-changed", { detail: { key: "views" } }));
        }
      } catch (err) {
        console.error("Record view error:", err);
      }
    };

    recordView();
  }, [contentId, recorded]);

  return null;
}