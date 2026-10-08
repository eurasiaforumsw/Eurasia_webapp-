import React from 'react';

export default function DocumentCardSkeleton() {
  return (
    <div
      className="relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl border-2"
      style={{
        '--surface-2': '#0A0D12',
        '--surface-3': '#0F131C',
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--surface-3)',
      } as React.CSSProperties}
    >
      {/* Category Badge Skeleton */}
      <div className="absolute top-4 right-4 z-10">
        <div className="academic-skeleton w-20 h-6 rounded-full" />
      </div>

      {/* Avatar Skeleton */}
      <div className="relative flex-shrink-0">
        <div className="academic-skeleton w-24 h-24 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="academic-skeleton h-6 w-full rounded-lg" />
          <div className="academic-skeleton h-6 w-3/4 rounded-lg" />
        </div>

        {/* Author Skeleton */}
        <div className="academic-skeleton h-4 w-32 rounded-lg" />

        {/* Summary Skeleton */}
        <div className="space-y-2">
          <div className="academic-skeleton h-4 w-full rounded-lg" />
          <div className="academic-skeleton h-4 w-5/6 rounded-lg" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2">
          <div className="academic-skeleton h-6 w-16 rounded-full" />
          <div className="academic-skeleton h-6 w-20 rounded-full" />
          <div className="academic-skeleton h-6 w-14 rounded-full" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex gap-4">
            <div className="academic-skeleton h-4 w-20 rounded-lg" />
            <div className="academic-skeleton h-4 w-16 rounded-lg" />
            <div className="academic-skeleton h-4 w-16 rounded-lg" />
            <div className="academic-skeleton h-4 w-12 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
