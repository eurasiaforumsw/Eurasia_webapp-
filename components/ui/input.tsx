import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  floatingLabel?: boolean
}

// Generate unique IDs for each input instance
let inputIdCounter = 0
const generateId = () => `input-${++inputIdCounter}-${Date.now()}`

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, floatingLabel = true, id: providedId, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    // Use provided ID or generate a unique one
    const inputId = React.useMemo(() => providedId || generateId(), [providedId])
    const errorId = `${inputId}-error`

    const handleFocus = () => setIsFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value.length > 0)
      props.onBlur?.(e)
    }

    const isLabelFloating = isFocused || hasValue || props.value

    return (
      <div className="relative w-full">
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex w-full rounded-lg border-2 bg-surface-base px-4 py-3 text-base transition-all duration-250",
            "text-text-primary placeholder:text-text-muted",
            "border-border-base focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus:border-error focus:ring-error/20",
            floatingLabel && label && "pt-6 pb-2",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />

        {floatingLabel && label && (
          <motion.label
            htmlFor={inputId}
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-250",
              "text-text-muted origin-left",
              error && "text-error"
            )}
            animate={{
              y: isLabelFloating ? -8 : 12,
              scale: isLabelFloating ? 0.75 : 1,
              color: isFocused
                ? error
                  ? "hsl(0, 72%, 58%)"
                  : "hsl(187, 62%, 50%)"
                : "hsl(210, 10%, 55%)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {label}
          </motion.label>
        )}

        {!floatingLabel && label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}

        {error && (
          <motion.p
            id={errorId}
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-error mt-1.5 ml-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
