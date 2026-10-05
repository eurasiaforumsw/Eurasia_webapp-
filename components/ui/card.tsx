import * as React from "react"
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tilt?: boolean
  spotlight?: boolean
  glowOnHover?: boolean
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tilt = false, spotlight = false, glowOnHover = false, children, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
      stiffness: 150,
      damping: 15,
    })
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
      stiffness: 150,
      damping: 15,
    })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const mouseXPos = (e.clientX - centerX) / (rect.width / 2)
      const mouseYPos = (e.clientY - centerY) / (rect.height / 2)

      mouseX.set(mouseXPos)
      mouseY.set(mouseYPos)

      if (spotlight) {
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        cardRef.current.style.setProperty("--mouse-x", `${x}%`)
        cardRef.current.style.setProperty("--mouse-y", `${y}%`)
      }
    }

    const handleMouseLeave = () => {
      mouseX.set(0)
      mouseY.set(0)
    }

    const MotionDiv = tilt ? motion.div : "div"

    return (
      <MotionDiv
        ref={(node: HTMLDivElement | null) => {
          if (cardRef) {
            (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
        }}
        className={cn(
          "relative rounded-lg bg-surface-base border border-border-subtle overflow-hidden transition-all duration-350",
          spotlight && "spotlight-card",
          glowOnHover && "hover:shadow-glow",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          tilt
            ? {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
            : undefined
        }
        {...(props as any)}
      >
        {spotlight && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle 200px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(56, 189, 248, 0.08), transparent 80%)",
              }}
            />
          </div>
        )}
        {children}
      </MotionDiv>
    )
  }
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-snug tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
