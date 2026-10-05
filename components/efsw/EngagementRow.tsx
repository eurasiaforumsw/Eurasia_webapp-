"use client";

import { Heart, Eye, ThumbsUp } from "lucide-react";
import {
  formatCount,
  getSessionVisitorId,
  toggleInterest,
  toggleLike,
  useEngagementCounts,
} from "@/lib/member-engagement";

/* Engagement row (heart / like / view) — lives in content card footers
 * and on the detail page header. Members can toggle heart + like;
 * the view counter is read-only and auto-increments via `recordView`
 * on mount of an article page.
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

const handleViewRecord = (contentId: string) => {
  /* Lazy import to avoid SSR cycles — local-storage helpers are
     client-only. We increment the view as a side effect of mount. */
  import("@/lib/member-engagement").then(({ recordView }) => {
    recordView(getSessionVisitorId(), contentId);
  });
};

export function EngagementRow({ contentId, memberId, readonly }: EngagementRowProps) {
  const counts = useEngagementCounts(contentId, memberId);

  return (
    <div className="efsw-engagement" data-readonly={readonly ? "true" : undefined}>
      {/* Interest (heart) */}
      <button
        type="button"
        className="efsw-engagement__btn"
        aria-pressed={counts.isInterested}
        disabled={!memberId}
        title={!memberId ? "Log in to save" : undefined}
        onClick={() => {
          if (!memberId) return;
          toggleInterest(memberId, contentId);
        }}
      >
        <Heart
          size={15}
          strokeWidth={2}
          className="efsw-engagement__heart"
          data-on={counts.isInterested}
          fill={counts.isInterested ? "currentColor" : "none"}
        />
        <span className="efsw-engagement__count">{formatCount(counts.interests)}</span>
      </button>

      {/* Like (thumbs-up) */}
      <button
        type="button"
        className="efsw-engagement__btn"
        aria-pressed={counts.isLiked}
        disabled={!memberId}
        title={!memberId ? "Log in to like" : undefined}
        onClick={() => {
          if (!memberId) return;
          toggleLike(memberId, contentId);
        }}
      >
        <ThumbsUp
          size={15}
          strokeWidth={2}
          className="efsw-engagement__like"
          data-on={counts.isLiked}
          fill={counts.isLiked ? "currentColor" : "none"}
        />
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
  if (typeof window !== "undefined") {
    handleViewRecord(contentId);
  }
  return null;
}