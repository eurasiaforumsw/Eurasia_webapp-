'use client';

import Image from 'next/image';
import { Calendar, Eye, Download, Heart, ArrowRight } from 'lucide-react';

export interface DocumentCardProps {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  summary: string;
  views: number;
  downloads: number;
  likes: number;
  date: string;
  tags?: string[];
  isLiked?: boolean;
  onClick: () => void;
  onLike?: (e: React.MouseEvent) => void;
}

export default function DocumentCard({
  id,
  title,
  author,
  authorAvatar,
  category,
  categoryColor,
  categoryBg,
  summary,
  views,
  downloads,
  likes,
  date,
  tags = [],
  isLiked = false,
  onClick,
  onLike,
}: DocumentCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer academic-focus-ring"
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title} by ${author}`}
      style={{
        '--surface-1': '#05070C',
        '--surface-2': '#0A0D12',
        '--surface-3': '#0F131C',
        '--accent-teal': '#38BDF8',
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--surface-3)',
      } as React.CSSProperties}
    >
      {/* Hover Glow Effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(56, 189, 248, 0.1), transparent 40%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      />

      {/* Category Badge - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: categoryBg,
            color: categoryColor,
          }}
        >
          {category}
        </span>
      </div>

      {/* Author Avatar - Left */}
      <div className="relative flex-shrink-0">
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--accent-teal)]"
          style={{ borderColor: 'var(--surface-3)' }}
          aria-hidden="true"
        >
          <Image
            src={authorAvatar}
            alt={`${author} profile picture`}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      </div>

      {/* Content - Right */}
      <div className="flex-1 min-w-0 relative z-10">
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2 group-hover:text-[var(--accent-teal)] transition-colors duration-300">
          {title}
        </h3>

        {/* Author */}
        <p className="text-sm text-white/70 mb-3 flex items-center gap-2">
          <span>by</span>
          <span className="font-medium text-white/90">{author}</span>
        </p>

        {/* Summary */}
        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {summary}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer - Metadata & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          {/* Date & Stats */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={14} />
              {views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Download size={14} />
              {downloads.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onLike}
              className={`flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--accent-teal)] academic-focus-ring ${
                isLiked ? 'text-[var(--accent-teal)]' : ''
              }`}
              aria-label={isLiked ? `Unlike this document (${likes} likes)` : `Like this document (${likes} likes)`}
              aria-pressed={isLiked}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              <span aria-live="polite">{likes}</span>
            </button>
          </div>

          {/* View Arrow */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-teal)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            <span>View</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </article>
  );
}
