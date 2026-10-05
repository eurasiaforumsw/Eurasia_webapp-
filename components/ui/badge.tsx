import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "outline"
type BadgeSize = "sm" | "md" | "lg"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  animated?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot = false, animated = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-white text-text-primary border-border-base hover:bg-accent-primary hover:text-white hover:border-accent-primary shadow-sm hover:shadow-md",
      success: "bg-success/10 text-success border-success/30 hover:bg-success/20",
      warning: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
      error: "bg-error/10 text-error border-error/30 hover:bg-error/20",
      info: "bg-info/10 text-info border-info/30 hover:bg-info/20",
      outline: "bg-white/5 text-text-secondary border-border-base hover:bg-white/10 hover:text-text-primary hover:border-accent-primary/50",
    }

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-1.5 text-base",
    }

    const Component = animated ? motion.span : "span"
    const animationProps = animated ? {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      transition: { type: "spring", stiffness: 300, damping: 20 },
    } : {}

    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-250",
          variants[variant],
          sizes[size],
          className
        )}
        {...(animationProps as any)}
        {...props}
      >
        {dot && (
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "default" && "bg-text-primary",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-error",
            variant === "info" && "bg-info",
            variant === "outline" && "bg-text-primary",
            animated && "animate-pulse"
          )} />
        )}
        {children}
      </Component>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
export type { BadgeVariant, BadgeSize }
