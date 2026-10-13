"use client";

import { memo, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteDialog = memo(function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!isOpen) return null;
  const confirm = async () => {
    setSaving(true);
    setError("");
    try { await onConfirm(); }
    catch (error) { setError(error instanceof Error ? error.message : "Delete failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
      <div className="efsw-admin-modal-scrim" onClick={() => { if (!saving) onCancel(); }} />

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
          <button type="button" disabled={saving} onClick={onCancel} aria-label="Close" className="efsw-admin-icon-button">
            <X size={16} />
          </button>
        </div>
        {error && <p role="alert">{error}</p>}

        {/* ── Actions ── */}
        <div className="efsw-admin-modal-actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" disabled={saving} onClick={onCancel} className="efsw-admin-outline-action">
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={() => void confirm()} className="efsw-admin-danger-action">
            <Trash2 size={14} />
            <span>{saving ? "Deleting…" : "Confirm deletion"}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
