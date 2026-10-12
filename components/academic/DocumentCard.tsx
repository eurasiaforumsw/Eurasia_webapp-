"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  Eye,
  FileBarChart2,
  FileText,
  Heart,
} from "lucide-react";
import CoverImage from "@/components/content/CoverImage";
import type { CoverImageCrop } from "@/lib/admin-data";

type DocumentCardProps = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  summary: string;
  tags: string[];
  downloads: number;
  featured?: boolean;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  coverImage?: string;
  coverImageCrop?: CoverImageCrop;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
  onView: () => void;
  onLike: (event: MouseEvent) => void;
  onDownload: (event: MouseEvent) => void;
};

export function DocumentCard({
  id,
  title,
  category,
  author,
  date,
  summary,
  tags,
  downloads,
  featured,
  viewCount,
  likeCount,
  isLiked,
  coverImage,
  coverImageCrop,
  fileUrl,
  fileName,
  fileSize,
  pageCount,
  onView,
  onLike,
  onDownload,
}: DocumentCardProps) {
  const tone = /practice|guide|manual/i.test(category)
    ? "practice"
    : /policy|brief/i.test(category)
      ? "briefings"
      : "research";
  const Icon =
    tone === "practice"
      ? FileText
      : tone === "briefings"
        ? FileBarChart2
        : BookOpen;
  const href = `/academic-documents/${encodeURIComponent(id)}`;
  const downloadHref =
    fileUrl && /^(https?:\/\/|\/(?!\/))/i.test(fileUrl) ? fileUrl : null;

  return (
    <article className={`document-card document-card--${tone}`}>
      <Link
        href={href}
        onClick={onView}
        className="document-card__cover"
        aria-label={`Read ${title}`}
        tabIndex={-1}
      >
        {coverImage ? (
          <CoverImage src={coverImage} crop={coverImageCrop} alt="" />
        ) : (
          <div className="document-card__paper" aria-hidden="true">
            <Icon size={40} strokeWidth={1.3} />
            <span>{category}</span>
            <div />
            <div />
            <div />
          </div>
        )}
        {featured && (
          <span className="document-card__badge">Editor's pick</span>
        )}
      </Link>
      <div className="document-card__body">
        <div className="document-card__header">
          <span className="document-card__category">
            <Icon size={14} aria-hidden="true" />
            {category}
          </span>
          <time dateTime={date} className="document-card__date">
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              timeZone: "Asia/Bangkok",
            })}
          </time>
        </div>
        <h3 className="document-card__title">
          <Link href={href} onClick={onView}>
            {title}
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </h3>
        <p className="document-card__author">{author}</p>
        <p className="document-card__summary">{summary}</p>
        {pageCount || fileSize ? (
          <p className="document-card__meta">
            {pageCount ? `${pageCount} pages` : ""}
            {pageCount && fileSize ? " · " : ""}
            {fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : ""}
          </p>
        ) : null}
        {tags.length > 0 && (
          <div className="document-card__tags">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="document-card__tag">
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span
                className="document-card__tag"
                title={tags.slice(2).join(", ")}
              >
                +{tags.length - 2} topics
              </span>
            )}
          </div>
        )}
        <div className="document-card__footer">
          <div className="document-card__stats">
            <span>
              <Eye size={14} aria-hidden="true" />
              {viewCount.toLocaleString()}
              <span className="sr-only"> views</span>
            </span>
            {downloadHref && (
              <span>
                <Download size={14} aria-hidden="true" />
                {downloads.toLocaleString()}
                <span className="sr-only"> downloads</span>
              </span>
            )}
          </div>
          <div className="document-card__actions">
            <button
              type="button"
              onClick={onLike}
              className={`document-card__action ${isLiked ? "is-liked" : ""}`}
              aria-label={`${isLiked ? "Unlike" : "Like"} ${title}`}
              aria-pressed={isLiked}
            >
              <Heart
                size={17}
                fill={isLiked ? "currentColor" : "none"}
                aria-hidden="true"
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {downloadHref && (
              <a
                href={downloadHref}
                download={fileName || undefined}
                onClick={onDownload}
                className="document-card__action"
                aria-label={`Download ${title}`}
              >
                <Download size={17} aria-hidden="true" />
              </a>
            )}
            <Link href={href} onClick={onView} className="document-card__read">
              Read <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
