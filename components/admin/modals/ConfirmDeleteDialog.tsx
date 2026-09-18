"use client";

import { memo } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog = memo(function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-3xl border border-surface-subtle bg-surface-deep p-6 shadow-2xl overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <AlertTriangle size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold font-display text-text-primary">
                {title}
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:bg-surface-raised hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-subtle pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-surface-subtle bg-surface-base px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-900/30 hover:bg-red-500 transition-all"
            >
              <Trash2 size={14} />
              <span>Confirm deletion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
