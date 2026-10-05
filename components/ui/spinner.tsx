import * as React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "muted"
  className?: string
}

export const Spinner = ({ size = "md", variant = "default", className }: SpinnerProps) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }

  const variants = {
    default: "text-text-primary",
    primary: "text-accent-primary",
    muted: "text-text-muted",
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn("inline-block", className)}
    >
      <Loader2 className={cn(sizes[size], variants[variant])} />
    </motion.div>
  )
}

interface LoadingOverlayProps {
  visible: boolean
  message?: string
  className?: string
}

export const LoadingOverlay = ({ visible, message, className }: LoadingOverlayProps) => {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="text-center space-y-4">
        <Spinner size="xl" variant="primary" />
        {message && (
          <p className="text-text-secondary text-base">{message}</p>
        )}
      </div>
    </motion.div>
  )
}
