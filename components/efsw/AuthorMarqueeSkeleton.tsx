import React from 'react';

export default function AuthorMarqueeSkeleton() {
  const skeletonCount = 8;

  return (
    <div
      className="relative w-full overflow-hidden py-12"
      style={{
        '--surface-1': '#05070C',
        '--surface-2': '#0F131C',
      } as React.CSSProperties}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-transparent to-[var(--surface-1)] pointer-events-none z-10" />

      {/* Skeleton Avatars */}
      <div className="flex gap-8 justify-center">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 flex-shrink-0"
          >
            {/* Avatar Skeleton */}
            <div className="relative">
              <div className="academic-skeleton w-24 h-24 rounded-full" />
              {/* Badge Skeleton */}
              <div className="absolute -bottom-1 -right-1">
                <div className="academic-skeleton w-8 h-6 rounded-full" />
              </div>
            </div>

            {/* Name Skeleton */}
            <div className="space-y-1.5">
              <div className="academic-skeleton h-4 w-24 rounded-lg" />
              <div className="academic-skeleton h-3 w-16 rounded-lg mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
