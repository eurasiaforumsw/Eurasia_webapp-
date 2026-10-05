import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded"
  animation?: "pulse" | "shimmer" | "none"
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", animation = "shimmer", ...props }, ref) => {
    const variantClasses = {
      text: "h-4 w-full rounded-sm",
      circular: "rounded-full aspect-square",
      rectangular: "w-full h-full rounded-none",
      rounded: "w-full h-full rounded-lg",
    }

    const animationClasses = {
      pulse: "animate-pulse",
      shimmer: "animate-shimmer bg-gradient-to-r from-surface-raised via-surface-elevated to-surface-raised bg-[length:1000px_100%]",
      none: "",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface-raised",
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Skeleton preset components for common use cases
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-6 rounded-lg bg-surface-base border border-border-subtle", className)}>
    <Skeleton variant="rounded" className="h-48" />
    <div className="space-y-2">
      <Skeleton variant="text" className="h-6 w-3/4" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-5/6" />
    </div>
  </div>
)

export const SkeletonAvatar = ({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  return <Skeleton variant="circular" className={sizeClasses[size]} />
}

export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn("h-4", i === lines - 1 && "w-3/4")}
      />
    ))}
  </div>
)

export const SkeletonButton = ({ className }: { className?: string }) => (
  <Skeleton variant="rounded" className={cn("h-11 w-32", className)} />
)

export const SkeletonTable = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-4 w-full">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} variant="text" className="h-5" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="h-4" />
        ))}
      </div>
    ))}
  </div>
)

export { Skeleton }
