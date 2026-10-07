"use client";

import { memo, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Loader2, AlertTriangle, X } from "lucide-react";

interface BulkProgressModalProps {
  isOpen: boolean;
  operation: string;
  total: number;
  completed: number;
  errors: string[];
  onClose: () => void;
  onCancel?: () => void;
}

export const BulkProgressModal = memo(function BulkProgressModal({
  isOpen,
  operation,
  total,
  completed,
  errors,
  onClose,
  onCancel,
}: BulkProgressModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isComplete = completed >= total;
  const isInProgress = completed < total && errors.length < total;
  const successCount = completed - errors.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isComplete || onCancel)) {
        e.preventDefault();
        if (isComplete) {
          onClose();
        } else if (onCancel) {
          onCancel();
        }
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isComplete, onClose, onCancel]);

  // Auto-close on completion (after 2 seconds)
  useEffect(() => {
    if (isComplete && errors.length === 0) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, errors.length, onClose]);

  if (!isOpen) return null;

  return (
    <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
      <div className="efsw-admin-modal-scrim" onClick={isComplete ? onClose : undefined} />

      <div
        ref={modalRef}
        className="efsw-admin-modal-card efsw-admin-modal-card--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-progress-title"
        aria-describedby="bulk-progress-description"
      >
        {/* Header */}
        <div className="efsw-admin-modal-card__head">
          <div className="efsw-admin-modal-card__lead">
            <div
              className={`efsw-admin-modal-card__icon ${
                isComplete
                  ? errors.length > 0
                    ? "efsw-admin-modal-card__icon--danger"
                    : ""
                  : ""
              }`}
            >
              {isInProgress ? (
                <Loader2 size={22} className="animate-spin" aria-hidden="true" />
              ) : errors.length > 0 ? (
                <AlertTriangle size={22} aria-hidden="true" />
              ) : (
                <CheckCircle size={22} aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 id="bulk-progress-title" className="efsw-admin-modal-card__title">
                {isInProgress ? `${operation}...` : isComplete ? "Operation Complete" : operation}
              </h3>
              <p id="bulk-progress-description" className="efsw-admin-modal-card__lede">
                {isInProgress
                  ? `Processing ${completed} of ${total} items`
                  : errors.length > 0
                  ? `Completed with ${errors.length} error${errors.length !== 1 ? "s" : ""}`
                  : `Successfully processed ${successCount} item${successCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {isComplete && (
            <button type="button" onClick={onClose} aria-label="Close" className="efsw-admin-icon-button">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Progress section */}
        <div className="efsw-admin-bulk-progress__body">
          {/* Progress bar */}
          <div className="efsw-admin-bulk-progress__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="efsw-admin-bulk-progress__fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Stats */}
          <div className="efsw-admin-bulk-progress__stats">
            <div className="efsw-admin-bulk-progress__stat efsw-admin-bulk-progress__stat--success">
              <CheckCircle size={14} aria-hidden="true" />
              <span>{successCount} successful</span>
            </div>
            {errors.length > 0 && (
              <div className="efsw-admin-bulk-progress__stat efsw-admin-bulk-progress__stat--error">
                <XCircle size={14} aria-hidden="true" />
                <span>{errors.length} failed</span>
              </div>
            )}
          </div>

          {/* Error list */}
          {errors.length > 0 && (
            <div className="efsw-admin-bulk-progress__errors">
              <h4 className="efsw-admin-bulk-progress__errors-title">Errors:</h4>
              <ul className="efsw-admin-bulk-progress__errors-list" role="list">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="efsw-admin-bulk-progress__errors-more">
                    and {errors.length - 5} more error{errors.length - 5 !== 1 ? "s" : ""}...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="efsw-admin-modal-actions" style={{ justifyContent: "flex-end" }}>
          {isInProgress && onCancel && (
            <button type="button" onClick={onCancel} className="efsw-admin-outline-action">
              Cancel
            </button>
          )}
          {isComplete && (
            <button type="button" onClick={onClose} className="efsw-admin-primary">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
