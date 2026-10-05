"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id, duration: toast.duration || 5000 }

    setToasts((prev) => [...prev, newToast])

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const dragX = React.useRef(0)

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const colors = {
    success: "border-success/30 bg-success/10 text-success",
    error: "border-error/30 bg-error/10 text-error",
    info: "border-info/30 bg-info/10 text-info",
    warning: "border-warning/30 bg-warning/10 text-warning",
  }

  const Icon = icons[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 100 || velocity.x > 500) {
          onRemove()
        }
      }}
      className={cn(
        "pointer-events-auto w-96 rounded-lg border-2 backdrop-blur-xl p-4 shadow-lg cursor-grab active:cursor-grabbing",
        "bg-surface-elevated/95",
        colors[toast.type]
      )}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-text-primary mb-0.5">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs text-text-secondary leading-relaxed">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-full hover:bg-surface-overlay"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-30 rounded-b-lg origin-left"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
      />
    </motion.div>
  )
}

// Helper function to use toast outside components
let globalAddToast: ((toast: Omit<Toast, "id">) => void) | null = null

export const setGlobalToast = (addToast: (toast: Omit<Toast, "id">) => void) => {
  globalAddToast = addToast
}

export const toast = {
  success: (title: string, description?: string) => {
    globalAddToast?.({ type: "success", title, description })
  },
  error: (title: string, description?: string) => {
    globalAddToast?.({ type: "error", title, description })
  },
  info: (title: string, description?: string) => {
    globalAddToast?.({ type: "info", title, description })
  },
  warning: (title: string, description?: string) => {
    globalAddToast?.({ type: "warning", title, description })
  },
}
