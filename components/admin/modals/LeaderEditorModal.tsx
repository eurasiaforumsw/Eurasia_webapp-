"use client";

import { ChangeEvent, DragEvent, FormEvent, memo, useState } from "react";
import { X, UploadCloud, UserCheck, Save, Trash2 } from "lucide-react";
import { AdminLeaderProfile } from "@/lib/admin-data";
import { compressImageFile } from "@/lib/image-utils";

interface LeaderEditorModalProps {
  initialLeader: AdminLeaderProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leader: AdminLeaderProfile) => void;
  onDelete?: (leader: AdminLeaderProfile) => void;
}

const BLANK_LEADER: AdminLeaderProfile = {
  id: "",
  name: "",
  title: "",
  quote: "",
  specializations: [],
  portrait: "",
  portraitAlt: "",
  textPosition: "both",
};

export const LeaderEditorModal = memo(function LeaderEditorModal({
  initialLeader,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: LeaderEditorModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<AdminLeaderProfile>(initialLeader || BLANK_LEADER);
  const [specInput, setSpecInput] = useState(
    initialLeader?.specializations ? initialLeader.specializations.join(", ") : ""
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 1100,
        quality: 0.82,
        outputFormat: "image/webp",
      });
      setFormData((prev) => ({ ...prev, portrait: compressed }));
    } catch (err) {
      console.error("Portrait compression error:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const specializations = specInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: AdminLeaderProfile = {
      ...formData,
      id: formData.id || `dean-${Date.now().toString(36)}`,
      portraitAlt: formData.name,
      specializations,
    };

    onSave(updated);
  };

  return (
    <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
      <div className="efsw-admin-modal-scrim" onClick={onClose} />

      <div className="efsw-admin-modal-card efsw-admin-modal-card--wide" role="dialog" aria-modal="true" aria-label={formData.id ? "Edit leadership profile" : "Add leadership profile"}>
        {/* ── Head ── */}
        <div className="efsw-admin-modal-card__head">
          <div className="efsw-admin-modal-card__lead">
            <div className="efsw-admin-modal-card__icon">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="efsw-admin-modal-card__title">
                {formData.id ? "Edit leadership profile" : "Add leadership profile"}
              </h2>
              <p className="efsw-admin-modal-card__lede">Leadership profile shown in the homepage message slider.</p>
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
              Full name (with title)
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Prof. Dr. Emily Peterson"
                required
              />
            </label>

            <label>
              Academic or organisation title
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Dean of Social Work & Regional Lead"
                required
              />
            </label>
          </div>

          {/* Quote */}
          <label>
            Message / quote
            <textarea
              rows={4}
              value={formData.quote}
              onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
              placeholder="An inspiring message, vision, or thought on international collaboration..."
              required
            />
          </label>

          {/* Specializations & Text Position */}
          <div className="efsw-admin-modal-grid">
            <label>
              Specialisations (comma-separated)
              <input
                type="text"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                placeholder="Welfare Policy, Curriculum, Community"
              />
            </label>

            <label>
              Text position
              <select
                value={formData.textPosition}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    textPosition: e.target.value as "left" | "right" | "both",
                  }))
                }
              >
                <option value="both">Both columns (balanced)</option>
                <option value="left">Left only</option>
                <option value="right">Right only</option>
              </select>
            </label>
          </div>

          {/* Portrait */}
          <div>
            <label style={{ margin: 0 }}>Portrait (auto-compressed)</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`efsw-admin-modal-dropzone ${isDragOver ? "is-dragover" : ""}`}
            >
              {formData.portrait ? (
                <div className="efsw-admin-modal-preview">
                  <img src={formData.portrait} alt={formData.name} />
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, portrait: "" }))} aria-label="Remove portrait">
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <div className="efsw-admin-modal-dropzone__hint">
                  <UploadCloud size={28} />
                  <strong>{isCompressing ? "Processing image..." : "Drop a portrait here or click to upload"}</strong>
                  <small>Front-facing portrait, 3:4 ratio recommended.</small>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={isCompressing} aria-label="Choose portrait" />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="efsw-admin-modal-actions efsw-admin-modal-actions--split">
            {formData.id && onDelete ? (
              <button type="button" onClick={() => onDelete(formData)} className="efsw-admin-danger-action">
                <Trash2 size={14} />
                <span>Delete profile</span>
              </button>
            ) : (
              <span />
            )}

            <div className="efsw-admin-modal-actions__end">
              <button type="button" onClick={onClose} className="efsw-admin-outline-action">
                Cancel
              </button>
              <button type="submit" disabled={isCompressing} className="efsw-admin-primary">
                <Save size={15} />
                <span>Save profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
