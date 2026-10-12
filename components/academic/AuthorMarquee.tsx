"use client";

import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";

type Author = {
  id: string;
  name: string;
  profileImage?: string;
  documentCount: number;
  totalViews: number;
  latestDate: string;
};

type AuthorMarqueeProps = {
  authors: Author[];
  sortMode?: "latest" | "popular" | "prolific";
  selectedAuthor?: string | null;
  onAuthorClick?: (authorId: string) => void;
};

export function AuthorMarquee({
  authors,
  sortMode = "popular",
  selectedAuthor,
  onAuthorClick,
}: AuthorMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const sortedAuthors = [...authors].sort((a, b) => {
    if (sortMode === "latest")
      return Date.parse(b.latestDate) - Date.parse(a.latestDate);
    if (sortMode === "prolific") return b.documentCount - a.documentCount;
    return b.totalViews - a.totalViews;
  });
  if (!sortedAuthors.length) return null;
  const animate = sortedAuthors.length > 1;
  const loopAuthors = animate
    ? Array.from(
        { length: Math.ceil(8 / sortedAuthors.length) },
        () => sortedAuthors,
      ).flat()
    : sortedAuthors;

  return (
    <div
      className={`author-marquee ${isPaused ? "is-paused" : ""} ${animate ? "" : "is-static"}`}
    >
      <div className="author-marquee__toolbar">
        <span>
          {authors.length}{" "}
          {authors.length === 1 ? "contributor" : "contributors"} · A community
          of perspectives
        </span>
        <button
          type="button"
          onClick={() => setIsPaused((previous) => !previous)}
          aria-label={
            isPaused
              ? "Resume contributor scrolling"
              : "Pause contributor scrolling"
          }
          aria-pressed={isPaused}
        >
          {isPaused ? (
            <Play size={16} aria-hidden="true" />
          ) : (
            <Pause size={16} aria-hidden="true" />
          )}
          <span>{isPaused ? "Resume" : "Pause"}</span>
        </button>
      </div>
      <div
        className="author-marquee__inner"
        onPointerDown={(event) => {
          if (event.pointerType === "touch") setIsPaused(true);
        }}
      >
        <div className="author-marquee__track">
          {(animate ? [0, 1] : [0]).map((copy) => (
            <div
              className={`author-marquee__group ${copy ? "author-marquee__group--duplicate" : ""}`}
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {loopAuthors.map((author, index) => (
                <button
                  key={`${author.id}-${index}`}
                  type="button"
                  onClick={() => onAuthorClick?.(author.id)}
                  className={`author-marquee__item ${selectedAuthor === author.id ? "is-selected" : ""}`}
                  aria-label={`View documents by ${author.name}`}
                  aria-pressed={selectedAuthor === author.id}
                  aria-hidden={copy === 1 || index >= sortedAuthors.length ? true : undefined}
                  tabIndex={copy || index >= sortedAuthors.length ? -1 : 0}
                  title={author.name}
                >
                  <span className="author-marquee__avatar">
                    <span
                      className="author-marquee__initials"
                      aria-hidden="true"
                    >
                      {author.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    {author.profileImage && (
                      <img
                        src={author.profileImage}
                        alt=""
                        width={148}
                        height={172}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    )}
                  </span>
                  <span className="author-marquee__info">
                    <span className="author-marquee__name">{author.name}</span>
                    <span className="author-marquee__meta">
                      {author.documentCount}{" "}
                      {author.documentCount === 1 ? "document" : "documents"}
                    </span>
                    <span className="author-marquee__link">
                      Discover work{" "}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
