"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFilterProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className,
}: SelectFilterProps) {
  const selectId = `select-filter-${id}`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-text-secondary"
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-lg border-2 border-border-base bg-surface-deep px-4 py-2.5 pr-10 text-sm text-text-primary",
            "transition-all duration-250",
            "hover:border-border-base/80",
            "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-text-muted"
          )}
          aria-label={label}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <ChevronDown size={16} className="text-text-muted" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
