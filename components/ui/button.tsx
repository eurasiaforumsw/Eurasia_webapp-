import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-short focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white hover:bg-accent-hover shadow-base hover:shadow-md active:shadow-subtle",
        destructive:
          "bg-error text-white hover:bg-error/90 shadow-base hover:shadow-md",
        danger:
          "bg-error text-white hover:bg-error/90 shadow-base hover:shadow-md",
        outline:
          "border-2 border-border-base bg-transparent text-text-primary hover:bg-surface-raised hover:border-accent-primary/50 hover:text-accent-primary",
        secondary:
          "bg-surface-elevated text-text-primary hover:bg-surface-overlay shadow-subtle hover:shadow-base border border-border-subtle",
        ghost:
          "text-accent-primary hover:bg-accent-primary/10 hover:text-accent-hover",
        link:
          "text-accent-primary underline-offset-4 hover:underline hover:text-accent-hover",
        magnetic:
          "bg-gradient-to-br from-accent-primary to-accent-secondary text-white hover:shadow-glow transition-shadow duration-350",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-base rounded-full",
        sm: "h-9 px-4 py-2 text-sm rounded-full",
        lg: "h-14 px-8 py-3 text-lg rounded-full",
        xl: "h-16 px-10 py-4 text-xl rounded-full",
        icon: "h-11 w-11 rounded-full",
        "icon-sm": "h-9 w-9 rounded-full",
        "icon-lg": "h-14 w-14 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  ripple?: boolean
  magnetic?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    ripple = false,
    magnetic = false,
    children,
    onClick,
    ...props
  }, ref) => {
    // Radix Slot requires exactly ONE React element as a child, and it cannot
    // be a Fragment. We also cannot enable decorative effects (shimmer / ripple
    // / spinner) on a slotted element — those render as siblings around the
    // child. So when effects are needed, or when children don't collapse to a
    // single non-fragment element, we fall back to a native <button>.
    const slotChildCandidate = React.useMemo(() => {
      if (!asChild) return null
      const kids = React.Children.toArray(children)
      if (kids.length !== 1) return null
      const only = kids[0]
      if (!React.isValidElement(only)) return null
      // @radix-ui/react-slot explodes on Fragment children.
      if (only.type === React.Fragment) return null
      return only
    }, [asChild, children])

    const hasEffects = ripple || loading || magnetic
    const useSlot = !hasEffects && slotChildCandidate !== null

    const Comp = useSlot ? Slot : "button"
    const [rippleArray, setRippleArray] = React.useState<Array<{ x: number; y: number; id: number }>>([])
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    React.useImperativeHandle(ref, () => buttonRef.current!)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !loading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()

        setRippleArray((prev) => [...prev, { x, y, id }])

        setTimeout(() => {
          setRippleArray((prev) => prev.filter((ripple) => ripple.id !== id))
        }, 600)
      }

      onClick?.(e)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (magnetic && buttonRef.current) {
        const button = buttonRef.current
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        setMousePosition({ x, y })
      }
    }

    const handleMouseLeave = () => {
      if (magnetic) {
        setMousePosition({ x: 0, y: 0 })
      }
    }

    // Memoize the motion component so it doesn't get recreated each render
    // (re-mounting Slot inside motion() causes the same Children.only crash).
    const MotionComp = React.useMemo(() => motion(Comp), [Comp])
    const motionProps = {
      animate: magnetic ? {
        x: mousePosition.x * 0.2,
        y: mousePosition.y * 0.2,
      } : undefined,
      transition: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
      whileHover: magnetic ? { scale: 1.02 } : undefined,
      whileTap: magnetic ? { scale: 0.98 } : undefined,
    }

    // When using Slot we render the slotted child directly — the styling
    // variants are merged onto it via Slot's className forwarding.
    const inner = useSlot ? (
      slotChildCandidate
    ) : (
      <>
        {/* Shimmer effect on hover — only on native <button> to avoid
            changing the slotted child's layout semantics */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        {/* Ripple effect */}
        {ripple && rippleArray.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Loading spinner */}
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          children
        )}
      </>
    )

    return (
      <MotionComp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        disabled={!useSlot ? loading || props.disabled : undefined}
        {...(motionProps as any)}
        {...props}
      >
        {inner}
      </MotionComp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
