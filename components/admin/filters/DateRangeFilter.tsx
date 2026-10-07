"use client";

import React, { memo } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  start: string;
  end: string;
}

export interface DateRangeFilterProps {
  id: string;
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}

const PRESETS = [
  { label: "Today", getValue: () => {
    const today = new Date().toISOString().split("T")[0];
    return { start: today, end: today };
  }},
  { label: "Last 7 days", getValue: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }},
  { label: "Last 30 days", getValue: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }},
  { label: "This month", getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }},
];

export const DateRangeFilter = memo(function DateRangeFilter({
  id,
  label,
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const startId = `daterange-filter-${id}-start`;
  const endId = `daterange-filter-${id}-end`;

  const handleStartChange = (start: string) => {
    onChange({ ...value, start });
  };

  const handleEndChange = (end: string) => {
    onChange({ ...value, end });
  };

  const handlePreset = (presetValue: DateRangeValue) => {
    onChange(presetValue);
  };

  const handleClear = () => {
    onChange({ start: "", end: "" });
  };

  const hasValue = value.start || value.end;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-xs text-text-muted transition-colors hover:bg-surface-raised hover:text-error focus:outline-none focus:ring-2 focus:ring-error/50"
            aria-label={`Clear ${label}`}
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            id={startId}
            type="date"
            value={value.start}
            onChange={(e) => handleStartChange(e.target.value)}
            max={value.end || undefined}
            className={cn(
              "w-full rounded-lg border-2 border-border-base bg-surface-deep px-3 py-2 text-sm text-text-primary",
              "transition-all duration-250",
              "hover:border-border-base/80",
              "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            aria-label={`${label} start date`}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Calendar size={14} className="text-text-muted" aria-hidden="true" />
          </div>
        </div>

        <div className="relative">
          <input
            id={endId}
            type="date"
            value={value.end}
            onChange={(e) => handleEndChange(e.target.value)}
            min={value.start || undefined}
            className={cn(
              "w-full rounded-lg border-2 border-border-base bg-surface-deep px-3 py-2 text-sm text-text-primary",
              "transition-all duration-250",
              "hover:border-border-base/80",
              "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            aria-label={`${label} end date`}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Calendar size={14} className="text-text-muted" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset.getValue())}
            className="rounded-md bg-surface-raised px-2 py-1 text-xs font-medium text-text-secondary transition-all hover:bg-surface-elevated hover:text-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            aria-label={`Set date range to ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
});
