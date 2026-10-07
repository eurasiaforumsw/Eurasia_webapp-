"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  actions: Array<{
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant: "default" | "danger" | "success";
    disabled?: boolean;
  }>;
}

export const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="efsw-admin-bulk-bar"
      role="region"
      aria-label="Bulk actions"
      aria-live="polite"
    >
      <div className="efsw-admin-bulk-bar__inner">
        {/* Selection count */}
        <div className="efsw-admin-bulk-bar__count">
          <span className="efsw-admin-bulk-bar__count-badge" aria-label={`${selectedCount} items selected`}>
            {selectedCount}
          </span>
          <span className="efsw-admin-bulk-bar__count-text">
            of {totalCount} selected
          </span>
        </div>

        {/* Action buttons */}
        <div className="efsw-admin-bulk-bar__actions">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`efsw-admin-bulk-bar__action efsw-admin-bulk-bar__action--${action.variant}`}
                aria-label={action.label}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="efsw-admin-bulk-bar__clear"
          aria-label="Clear selection"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
