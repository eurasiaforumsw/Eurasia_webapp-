"use client";

import React, { memo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchFilterProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchFilter = memo(function SearchFilter({
  id,
  label,
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
}: SearchFilterProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);
  const inputId = `search-filter-${id}`;

  // Sync debounced value to parent
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-secondary"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search size={16} className="text-text-muted" aria-hidden="true" />
        </div>

        <input
          id={inputId}
          type="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border-2 border-border-base bg-surface-deep px-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
            "transition-all duration-250",
            "hover:border-border-base/80",
            "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-label={label}
        />

        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            aria-label={`Clear ${label}`}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
});
