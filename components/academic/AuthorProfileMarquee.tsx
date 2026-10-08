"use client";

import { useState } from "react";
import { User, FileText, Eye } from "lucide-react";

type AuthorProfile = {
  id: string;
  name: string;
  profileImage?: string;
  documentCount: number;
  totalViews: number;
  latestDocumentDate: string;
  specialty?: string;
};

type SortMode = "latest" | "popular" | "prolific";

type AuthorProfileMarqueeProps = {
  authors: AuthorProfile[];
  sortMode?: SortMode;
  onAuthorClick?: (authorId: string) => void;
  label?: string;
};

export function AuthorProfileMarquee({
  authors,
  sortMode = "popular",
  onAuthorClick,
  label = "Featured Researchers",
}: AuthorProfileMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  const sortedAuthors = [...authors].sort((a, b) => {
    switch (sortMode) {
      case "latest":
        return (
          new Date(b.latestDocumentDate).getTime() -
          new Date(a.latestDocumentDate).getTime()
        );
      case "popular":
        return b.totalViews - a.totalViews;
      case "prolific":
        return b.documentCount - a.documentCount;
      default:
        return 0;
    }
  });

  const displayAuthors = [...sortedAuthors, ...sortedAuthors, ...sortedAuthors];

  return (
    <div className="author-profile-marquee">
      <div className="author-profile-marquee__header">
        <h3 className="author-profile-marquee__label">{label}</h3>
        <p className="author-profile-marquee__description">
          Click on a researcher to explore their work
        </p>
      </div>

      <div className="author-profile-marquee__wrapper">
        <div
          className={`author-profile-marquee__track ${
            isPaused ? "is-paused" : ""
          }`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {displayAuthors.map((author, idx) => (
            <button
              key={`${author.id}-${idx}`}
              type="button"
              onClick={() => onAuthorClick?.(author.id)}
              className="author-profile-marquee__card"
              aria-label={`View research by ${author.name}`}
            >
              <div className="author-profile-marquee__avatar-wrapper">
                {author.profileImage ? (
                  <img
                    src={author.profileImage}
                    alt={author.name}
                    className="author-profile-marquee__avatar"
                    loading="lazy"
                  />
                ) : (
                  <div className="author-profile-marquee__avatar author-profile-marquee__avatar--placeholder">
                    <User size={32} strokeWidth={1.5} />
                  </div>
                )}
                <div className="author-profile-marquee__ring" />
              </div>
              <div className="author-profile-marquee__info">
                <span className="author-profile-marquee__name">
                  {author.name}
                </span>
                {author.specialty && (
                  <span className="author-profile-marquee__specialty">
                    {author.specialty}
                  </span>
                )}
                <div className="author-profile-marquee__stats">
                  <span>
                    <FileText size={12} />
                    {author.documentCount}
                  </span>
                  {sortMode === "popular" && (
                    <span>
                      <Eye size={12} />
                      {author.totalViews > 999
                        ? `${(author.totalViews / 1000).toFixed(1)}k`
                        : author.totalViews}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
