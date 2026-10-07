"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Save,
  Filter as FilterIcon,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "./SearchFilter";
import { SelectFilter } from "./SelectFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { DateRangeFilter } from "./DateRangeFilter";
import { BooleanFilter } from "./BooleanFilter";

export interface Filter {
  id: string;
  label: string;
  type: "search" | "select" | "multiselect" | "daterange" | "boolean";
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  placeholder?: string;
}

export interface FilterPreset {
  name: string;
  filters: Record<string, any>;
}

export interface AdvancedFilterPanelProps {
  filters: Filter[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset: () => void;
  onSavePreset?: (name: string, filters: Record<string, any>) => void;
  presets?: FilterPreset[];
  className?: string;
}

export function AdvancedFilterPanel({
  filters,
  values,
  onChange,
  onReset,
  onSavePreset,
  presets = [],
  className,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Count active filters
  const activeFilterCount = Object.entries(values).filter(([key, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && "start" in value && "end" in value) {
      return value.start || value.end;
    }
    return true;
  }).length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F to toggle panel
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          // Focus first filter input when opening
          setTimeout(() => {
            const firstInput = panelRef.current?.querySelector<HTMLInputElement>(
              'input[type="text"], input[type="search"], select'
            );
            firstInput?.focus();
          }, 100);
        }
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
    setSelectedPreset(null); // Clear preset selection when manually changing
  };

  const handleReset = () => {
    onReset();
    setSelectedPreset(null);
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), values);
      setPresetName("");
      setShowPresetInput(false);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onChange(preset.filters);
    setSelectedPreset(preset.name);
  };

  const renderFilter = (filter: Filter) => {
    const value = values[filter.id];

    switch (filter.type) {
      case "search":
        return (
          <SearchFilter
            key={filter.id}
            id={filter.id}
            label={filter.label}
            value={value || ""}
            onChange={(val) => handleFilterChange(filter.id, val)}
            placeholder={filter.placeholder}
          />
        );

      case "select":
        return (
          <SelectFilter
            key={filter.id}
            id={filter.id}
            label={filter.label}
            value={value || ""}
            options={filter.options || []}
            onChange={(val) => handleFilterChange(filter.id, val)}
            placeholder={filter.placeholder}
          />
        );

      case "multiselect":
        return (
          <MultiSelectFilter
            key={filter.id}
            id={filter.id}
            label={filter.label}
            value={value || []}
            options={filter.options || []}
            onChange={(val) => handleFilterChange(filter.id, val)}
          />
        );

      case "daterange":
        return (
          <DateRangeFilter
            key={filter.id}
            id={filter.id}
            label={filter.label}
            value={value || { start: "", end: "" }}
            onChange={(val) => handleFilterChange(filter.id, val)}
          />
        );

      case "boolean":
        return (
          <BooleanFilter
            key={filter.id}
            id={filter.id}
            label={filter.label}
            value={value || false}
            onChange={(val) => handleFilterChange(filter.id, val)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle Button */}
      <button
        ref={toggleButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border-2 border-border-base bg-surface-raised px-4 py-3 text-left transition-all hover:border-accent-primary/50 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-deep"
        aria-expanded={isOpen}
        aria-controls="filter-panel-content"
        aria-label={`Advanced filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
      >
        <div className="flex items-center gap-3">
          <FilterIcon size={18} className="text-accent-primary" aria-hidden="true" />
          <span className="font-semibold text-text-primary">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="info" size="sm" animated>
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-text-muted" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="filter-panel-content"
            ref={panelRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
            role="region"
            aria-label="Filter controls"
          >
            <div className="mt-3 rounded-lg border border-border-subtle bg-surface-base p-6">
              {/* Presets Row */}
              {(presets.length > 0 || onSavePreset) && (
                <div className="mb-6 pb-6 border-b border-border-subtle">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-text-secondary">
                      Filter Presets:
                    </span>

                    {/* Preset Buttons */}
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleLoadPreset(preset)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                          selectedPreset === preset.name
                            ? "bg-accent-primary text-white"
                            : "bg-surface-raised text-text-secondary hover:bg-surface-elevated hover:text-accent-primary"
                        )}
                        aria-pressed={selectedPreset === preset.name}
                      >
                        {selectedPreset === preset.name && (
                          <Check size={14} aria-hidden="true" />
                        )}
                        {preset.name}
                      </button>
                    ))}

                    {/* Save Preset */}
                    {onSavePreset && (
                      <>
                        {!showPresetInput ? (
                          <button
                            onClick={() => setShowPresetInput(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-secondary transition-all hover:bg-accent-primary/10 hover:text-accent-primary"
                            disabled={activeFilterCount === 0}
                            aria-label="Save current filters as preset"
                          >
                            <Save size={14} aria-hidden="true" />
                            Save as Preset
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={presetName}
                              onChange={(e) => setPresetName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePreset();
                                if (e.key === "Escape") setShowPresetInput(false);
                              }}
                              placeholder="Preset name"
                              className="h-8 rounded-lg border border-border-base bg-surface-deep px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                              autoFocus
                              aria-label="Preset name"
                            />
                            <Button
                              size="sm"
                              onClick={handleSavePreset}
                              disabled={!presetName.trim()}
                              aria-label="Confirm save preset"
                            >
                              Save
                            </Button>
                            <button
                              onClick={() => {
                                setShowPresetInput(false);
                                setPresetName("");
                              }}
                              className="rounded-lg p-1 hover:bg-surface-raised"
                              aria-label="Cancel save preset"
                            >
                              <X size={16} className="text-text-muted" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filters.map(renderFilter)}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between gap-3 pt-6 border-t border-border-subtle">
                <button
                  onClick={handleReset}
                  disabled={activeFilterCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:text-error hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-error/50"
                  aria-label="Clear all filters"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Clear All
                </button>

                <div className="text-sm text-text-muted">
                  <kbd className="rounded bg-surface-elevated px-2 py-1 text-xs font-mono border border-border-subtle">
                    Cmd+F
                  </kbd>{" "}
                  to toggle •{" "}
                  <kbd className="rounded bg-surface-elevated px-2 py-1 text-xs font-mono border border-border-subtle">
                    Esc
                  </kbd>{" "}
                  to close
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
