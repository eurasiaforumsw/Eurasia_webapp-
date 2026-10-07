"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BooleanFilterProps {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  className?: string;
}

export const BooleanFilter = memo(function BooleanFilter({
  id,
  label,
  value,
  onChange,
  description,
  className,
}: BooleanFilterProps) {
  const toggleId = `boolean-filter-${id}`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <label
            htmlFor={toggleId}
            className="text-sm font-medium text-text-secondary cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-xs text-text-muted">{description}</p>
          )}
        </div>

        {/* Toggle Switch */}
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={label}
          onClick={() => onChange(!value)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-250",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-base",
            value ? "bg-accent-primary" : "bg-surface-elevated border-2 border-border-base"
          )}
        >
          <motion.span
            layout
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform",
              value ? "translate-x-6" : "translate-x-1"
            )}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
});
