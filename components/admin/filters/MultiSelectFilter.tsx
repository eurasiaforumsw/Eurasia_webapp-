"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectFilterProps {
  id: string;
  label: string;
  value: string[];
  options: MultiSelectOption[];
  onChange: (value: string[]) => void;
  searchable?: boolean;
  searchThreshold?: number;
  className?: string;
}

export const MultiSelectFilter = memo(function MultiSelectFilter({
  id,
  label,
  value = [],
  options,
  onChange,
  searchable = true,
  searchThreshold = 10,
  className,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonId = `multiselect-filter-${id}`;
  const listboxId = `multiselect-listbox-${id}`;
  const searchId = `multiselect-search-${id}`;

  const showSearch = searchable && options.length >= searchThreshold;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const filteredOptions = showSearch
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectAll = () => {
    onChange(filteredOptions.map((opt) => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const removeItem = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={buttonId}
        className="text-sm font-medium text-text-secondary"
      >
        {label}
      </label>

      {/* Trigger Button */}
      <button
        id={buttonId}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border-2 border-border-base bg-surface-deep px-4 py-2.5 text-left text-sm transition-all duration-250",
          "hover:border-border-base/80",
          "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
          isOpen && "border-accent-primary ring-2 ring-accent-primary/20"
        )}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={`${label}, ${value.length} selected`}
      >
        <span className={cn("truncate", value.length === 0 && "text-text-muted")}>
          {value.length === 0
            ? "Select options"
            : `${value.length} selected`}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-text-muted" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Selected Pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((val) => {
            const option = options.find((opt) => opt.value === val);
            return option ? (
              <Badge
                key={val}
                variant="outline"
                size="sm"
                className="gap-1.5 pr-1"
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => removeItem(val)}
                  className="rounded-sm hover:bg-surface-raised focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  aria-label={`Remove ${option.label}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-50"
          >
            <div className="rounded-lg border border-border-subtle bg-surface-base shadow-lg">
              {/* Search Input */}
              {showSearch && (
                <div className="border-b border-border-subtle p-3">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <Search size={14} className="text-text-muted" aria-hidden="true" />
                    </div>
                    <input
                      id={searchId}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search options..."
                      className="w-full rounded-md border border-border-base bg-surface-deep py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20"
                      aria-label="Search options"
                    />
                  </div>
                </div>
              )}

              {/* Select All / Clear All */}
              <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={filteredOptions.length === value.length}
                  className="text-xs font-medium text-accent-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary/50 rounded px-1"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={value.length === 0}
                  className="text-xs font-medium text-error hover:underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-error/50 rounded px-1"
                >
                  Clear All
                </button>
              </div>

              {/* Options List */}
              <div
                id={listboxId}
                role="listbox"
                aria-multiselectable="true"
                aria-labelledby={buttonId}
                className="max-h-64 overflow-y-auto overscroll-contain"
              >
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => toggleOption(option.value)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          "hover:bg-surface-raised focus:bg-surface-raised focus:outline-none",
                          isSelected && "bg-accent-primary/5"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border-2 transition-all",
                            isSelected
                              ? "border-accent-primary bg-accent-primary"
                              : "border-border-base bg-surface-deep"
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={cn(isSelected && "font-medium text-text-primary")}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
