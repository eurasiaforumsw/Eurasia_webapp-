import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export const AccordionItem = ({ title, children, defaultOpen = false, className }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className={cn("border-b border-border-subtle last:border-b-0", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left transition-colors",
          "hover:text-accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep",
          "group"
        )}
      >
        <span className="text-base font-medium text-text-primary group-hover:text-accent-primary transition-colors">
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronDown className="w-5 h-5 text-text-muted group-hover:text-accent-primary transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-text-secondary leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
}

export const Accordion = ({ children, className }: AccordionProps) => {
  return (
    <div className={cn("divide-y divide-border-subtle", className)}>
      {children}
    </div>
  )
}
