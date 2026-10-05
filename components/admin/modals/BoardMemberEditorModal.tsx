"use client";

import { ChangeEvent, DragEvent, FormEvent, memo, useEffect, useState } from "react";
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

  useEffect(() => {
    setFormData(initialMember || BLANK_MEMBER);
  }, [initialMember, isOpen]);

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
      <div className="efsw-admin-modal-scrim" onClick={onClose} />

      <div className="efsw-admin-modal-card" role="dialog" aria-modal="true" aria-label={formData.id ? "Edit board member" : "Add board member"}>
        {/* ── Head ── */}
        <div className="efsw-admin-modal-card__head">
          <div className="efsw-admin-modal-card__lead">
            <div className="efsw-admin-modal-card__icon">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="efsw-admin-modal-card__title">
                {formData.id ? "Edit board member" : "Add board member"}
              </h2>
              <p className="efsw-admin-modal-card__lede">
                Name, title, country, and portrait shown on the Organization page.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="efsw-admin-icon-button">
            <X size={16} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="efsw-admin-modal-form">
          <div className="efsw-admin-modal-grid">
            <label>
              Full name
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Mr. Sug Pyo Kim"
              />
            </label>
            <label>
              Title
              <input
                type="text"
                required
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. President"
              />
            </label>
          </div>

          <label>
            Country
            <input
              type="text"
              required
              value={formData.country}
              onChange={(event) => setFormData((prev) => ({ ...prev, country: event.target.value }))}
              placeholder="e.g. Thailand"
            />
          </label>

          <label>
            Biography
            <textarea
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
