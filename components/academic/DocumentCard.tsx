"use client";

import React from "react";
import {
  BookOpen,
  FileText,
  FileBarChart2,
  Download,
  Eye,
  Heart,
  Calendar,
  User,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

type DocumentCardProps = {
  id: string;
  title: string;
  category: "Research" | "Practice" | "Briefings";
  author: string;
  date: string;
  summary: string;
  tags: string[];
  downloads: number;
  featured?: boolean;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  onView: () => void;
  onLike: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
};

const CATEGORY_CONFIG = {
  Research: {
    icon: BookOpen,
    color: "#3b82f6",
    bgColor: "#1e3a5f",
  },
  Practice: {
    icon: FileText,
    color: "#10b981",
    bgColor: "#0f3a2f",
  },
  Briefings: {
    icon: FileBarChart2,
    color: "#f59e0b",
    bgColor: "#3d2f1a",
  },
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
  onView,
  onLike,
  onDownload,
}: DocumentCardProps) {
  const categoryConfig = CATEGORY_CONFIG[category];
  const Icon = categoryConfig.icon;

  return (
    <article className="document-card" onClick={onView}>
      {featured && (
        <div className="document-card__badge">
          <TrendingUp size={11} />
          Featured
        </div>
      )}

      <div className="document-card__header">
        <div
          className="document-card__category"
          style={
            {
              "--category-color": categoryConfig.color,
              "--category-bg": categoryConfig.bgColor,
            } as React.CSSProperties
          }
        >
          <Icon size={14} />
          <span>{category}</span>
        </div>
        <time className="document-card__date">
          <Calendar size={12} />
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          })}
        </time>
      </div>

      <div className="document-card__content">
        <h3 className="document-card__title">{title}</h3>
        <p className="document-card__summary">{summary}</p>
        <div className="document-card__author">
          <User size={13} />
          {author}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="document-card__tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="document-card__tag">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="document-card__tag">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="document-card__footer">
        <div className="document-card__stats">
          <span title="Views">
            <Eye size={13} />
            {viewCount || 0}
          </span>
          <span title="Downloads">
            <Download size={13} />
            {downloads || 0}
          </span>
          <span title="Likes">
            <Heart
              size={13}
              fill={isLiked ? "currentColor" : "none"}
            />
            {likeCount || 0}
          </span>
        </div>
        <div className="document-card__actions">
          <button
            type="button"
            onClick={onLike}
            className={`document-card__action ${isLiked ? "is-liked" : ""}`}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="document-card__action"
            title="Download"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="document-card__action document-card__action--primary"
            title="View document"
          >
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
