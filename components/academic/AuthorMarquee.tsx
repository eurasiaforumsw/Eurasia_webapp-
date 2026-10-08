"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

type Author = {
  id: string;
  name: string;
  profileImage?: string;
  documentCount: number;
  totalViews: number;
  latestDate: string;
};

type SortMode = "latest" | "popular" | "prolific";

type AuthorMarqueeProps = {
  authors: Author[];
  sortMode?: SortMode;
  onAuthorClick?: (authorId: string) => void;
};

export function AuthorMarquee({
  authors,
  sortMode = "popular",
  onAuthorClick,
}: AuthorMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Sort authors based on mode
  const sortedAuthors = [...authors].sort((a, b) => {
    switch (sortMode) {
      case "latest":
        return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
      case "popular":
        return b.totalViews - a.totalViews;
      case "prolific":
        return b.documentCount - a.documentCount;
      default:
        return 0;
    }
  });

  // Duplicate array for seamless loop
  const displayAuthors = [...sortedAuthors, ...sortedAuthors];

  return (
    <div className="author-marquee">
      <div className="author-marquee__inner">
        <div
          className={`author-marquee__track ${isPaused ? "is-paused" : ""}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {displayAuthors.map((author, idx) => (
            <button
              key={`${author.id}-${idx}`}
              type="button"
              onClick={() => onAuthorClick?.(author.id)}
              className="author-marquee__item"
              aria-label={`View documents by ${author.name}`}
            >
              <div className="author-marquee__avatar">
                {author.profileImage ? (
                  <img
                    src={author.profileImage}
                    alt={author.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="author-marquee__avatar-placeholder">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="author-marquee__info">
                <span className="author-marquee__name">{author.name}</span>
                <span className="author-marquee__meta">
                  {author.documentCount} {author.documentCount === 1 ? "doc" : "docs"}
                  {sortMode === "popular" && ` · ${author.totalViews.toLocaleString()} views`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
