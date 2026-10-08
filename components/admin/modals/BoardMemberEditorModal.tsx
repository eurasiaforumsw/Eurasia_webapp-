"use client";

import { ChangeEvent, DragEvent, FormEvent, memo, useEffect, useRef, useState } from "react";
import { Save, Trash2, UploadCloud, UserRound, X } from "lucide-react";
import { AdminBoardMember } from "@/lib/admin-data";
import { compressImageFile } from "@/lib/image-utils";

interface BoardMemberEditorModalProps {
  initialMember: AdminBoardMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: AdminBoardMember) => void;
}

const BLANK_MEMBER: AdminBoardMember = {
  id: "",
  name: "",
  title: "Executive Committee",
  country: "",
  image: "",
};

export const BoardMemberEditorModal = memo(function BoardMemberEditorModal({
  initialMember,
  isOpen,
  onClose,
  onSave,
}: BoardMemberEditorModalProps) {
  const [formData, setFormData] = useState<AdminBoardMember>(initialMember || BLANK_MEMBER);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Focus management refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setFormData(initialMember || BLANK_MEMBER);
  }, [initialMember, isOpen]);

  // Focus management on open/close
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first input after a brief delay
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap with Tab
      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: moving backwards
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsCompressing(true);
    try {
      const image = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 1100,
        quality: 0.82,
        outputFormat: "image/webp",
      });
      setFormData((prev) => ({ ...prev, image }));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleImageUpload(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleImageUpload(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      ...formData,
      id: formData.id || `board-${Date.now().toString(36)}`,
      name: formData.name.trim(),
      title: formData.title.trim() || "Executive Committee",
      country: formData.country.trim(),
    });
  };

  return (
    <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
      <div
        className="efsw-admin-modal-scrim"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="efsw-admin-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-member-modal-title"
        aria-describedby="board-member-modal-description"
      >
        {/* ── Head ── */}
        <div className="efsw-admin-modal-card__head">
          <div className="efsw-admin-modal-card__lead">
            <div className="efsw-admin-modal-card__icon" aria-hidden="true">
              <UserRound size={20} />
            </div>
            <div>
              <h2 id="board-member-modal-title" className="efsw-admin-modal-card__title">
                {formData.id ? "Edit board member" : "Add board member"}
              </h2>
              <p id="board-member-modal-description" className="efsw-admin-modal-card__lede">
                Name, title, country, and portrait shown on the Organization page.
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="efsw-admin-icon-button"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="efsw-admin-modal-form">
          <div className="efsw-admin-modal-grid">
            <label htmlFor="board-member-name">
              Full name
              <input
                ref={firstInputRef}
                id="board-member-name"
                type="text"
                required
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Mr. Sug Pyo Kim"
                aria-required="true"
              />
            </label>
            <label htmlFor="board-member-title">
              Title
              <input
                id="board-member-title"
                type="text"
                required
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. President"
                aria-required="true"
              />
            </label>
          </div>

          <label htmlFor="board-member-country">
            Country
            <input
              id="board-member-country"
              type="text"
              required
              value={formData.country}
              onChange={(event) => setFormData((prev) => ({ ...prev, country: event.target.value }))}
              placeholder="e.g. Thailand"
              aria-required="true"
            />
          </label>

          <label htmlFor="board-member-bio">
            Biography
            <textarea
              id="board-member-bio"
              rows={3}
              value={formData.bio ?? ""}
              onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value.trim() || undefined }))}
              placeholder="Shown inside the card's expandable section. Leave empty to hide the disclosure button."
            />
          </label>

          {/* ── Portrait ── */}
          <div>
            <label style={{ margin: 0 }}>Portrait</label>
            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`efsw-admin-modal-dropzone ${isDragOver ? "is-dragover" : ""}`}
            >
              {formData.image ? (
                <div className="efsw-admin-modal-preview">
                  <img src={formData.image} alt={formData.name || "Board member portrait"} />
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, image: "" }))} aria-label="Remove portrait">
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <div className="efsw-admin-modal-dropzone__hint">
                  <UploadCloud size={28} />
                  <strong>{isCompressing ? "Processing image..." : "Drop an image here or click to upload"}</strong>
                  <small>Portrait orientation, 3:4 ratio recommended.</small>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={isCompressing} aria-label="Upload portrait" />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="efsw-admin-modal-actions efsw-admin-modal-actions--split">
            <span />
            <div className="efsw-admin-modal-actions__end">
              <button type="button" onClick={onClose} className="efsw-admin-outline-action">
                Cancel
              </button>
              <button type="submit" disabled={isCompressing} className="efsw-admin-primary">
                <Save size={15} />
                <span>Save member</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
