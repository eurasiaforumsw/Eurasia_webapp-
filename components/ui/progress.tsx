import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  animated?: boolean
  variant?: "default" | "success" | "warning" | "error"
  size?: "sm" | "md" | "lg"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value,
    max = 100,
    showLabel = false,
    animated = true,
    variant = "default",
    size = "md",
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const variants = {
      default: "bg-accent-primary",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
    }

    const sizes = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    }

    return (
      <div className="w-full space-y-2">
        {showLabel && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary font-medium">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-surface-raised",
            sizes[size],
            className
          )}
          {...props}
        >
          <motion.div
            className={cn("h-full rounded-full", variants[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={
              animated
                ? { type: "spring", stiffness: 200, damping: 20 }
                : { duration: 0 }
            }
          />

          {/* Shimmer effect */}
          {animated && percentage < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
