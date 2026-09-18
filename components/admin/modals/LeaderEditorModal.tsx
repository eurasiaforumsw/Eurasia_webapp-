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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-3xl border border-surface-subtle bg-surface-deep p-6 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal-light">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-text-primary">
                  {formData.id ? "Edit leadership profile" : "Add leadership profile"}
                </h2>
                <p className="text-xs text-text-muted">
                  Leadership profile shown in the homepage message slider.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:bg-surface-raised hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Full name (with title)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Prof. Dr. Emily Peterson"
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Academic or organisation title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Dean of Social Work & Regional Lead"
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quote */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Message / quote
              </label>
              <textarea
                rows={4}
                value={formData.quote}
                onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
                placeholder="An inspiring message, vision, or thought on international collaboration..."
                className="w-full rounded-xl border border-surface-subtle bg-surface-base p-3.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                required
              />
            </div>

            {/* Specializations & Text Position */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Specialisations (comma-separated)
                </label>
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  placeholder="Welfare Policy, Curriculum, Community"
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Text position
                </label>
                <select
                  value={formData.textPosition}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      textPosition: e.target.value as "left" | "right" | "both",
                    }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                >
                  <option value="both">Both columns (balanced)</option>
                  <option value="left">Left only</option>
                  <option value="right">Right only</option>
                </select>
              </div>
            </div>

            {/* Portrait Image Uploader */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Portrait (auto-compressed)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                  isDragOver
                    ? "border-teal bg-teal/10"
                    : "border-surface-subtle bg-surface-base/50 hover:border-teal/50"
                }`}
              >
                {formData.portrait ? (
                  <div className="relative h-44 w-32 overflow-hidden rounded-xl border border-surface-subtle">
                    <img
                      src={formData.portrait}
                      alt={formData.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, portrait: "" }))}
                      className="absolute top-2 right-2 rounded-lg bg-black/70 p-1.5 text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud size={30} className="text-teal mb-2" />
                    <p className="text-xs font-bold text-text-primary">
                      {isCompressing ? "Processing image..." : "Drop a portrait here or click to upload"}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      Front-facing portrait, 3:4 ratio recommended.
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isCompressing}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t border-surface-subtle pt-5">
              {formData.id && onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(formData)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete profile</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs font-bold text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid disabled:opacity-50 transition-all"
                >
                  <Save size={15} />
                  <span>Save profile</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
