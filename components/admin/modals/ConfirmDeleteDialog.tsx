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
    <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
      <div className="efsw-admin-modal-scrim" onClick={onCancel} />

      <div className="efsw-admin-modal-card efsw-admin-modal-card--narrow" role="dialog" aria-modal="true" aria-label={title}>
        {/* ── Head ── */}
        <div className="efsw-admin-modal-card__head">
          <div className="efsw-admin-modal-card__lead">
            <div className="efsw-admin-modal-card__icon efsw-admin-modal-card__icon--danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="efsw-admin-modal-card__title">{title}</h3>
              <p className="efsw-admin-modal-card__lede">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="efsw-admin-icon-button">
            <X size={16} />
          </button>
        </div>

        {/* ── Actions ── */}
        <div className="efsw-admin-modal-actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} className="efsw-admin-outline-action">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="efsw-admin-danger-action">
            <Trash2 size={14} />
            <span>Confirm deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
});
