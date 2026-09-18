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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-surface-subtle bg-surface-deep p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-surface-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal-light">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-text-primary">
                  {formData.id ? "Edit board member" : "Add board member"}
                </h2>
                <p className="text-xs text-text-muted">Name, title, country, and portrait shown on the Organization page.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:bg-surface-raised hover:text-text-primary">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-text-secondary">
                Full name
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Mr. Sug Pyo Kim"
                  className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none"
                />
              </label>
              <label className="text-xs font-bold text-text-secondary">
                Title
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. President"
                  className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-text-secondary">
              Country
              <input
                type="text"
                required
                value={formData.country}
                onChange={(event) => setFormData((prev) => ({ ...prev, country: event.target.value }))}
                placeholder="e.g. Thailand"
                className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none"
              />
            </label>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-secondary">Portrait</label>
              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex min-h-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-5 transition-colors ${isDragOver ? "border-teal bg-teal/10" : "border-surface-subtle bg-surface-base/50 hover:border-teal/50"}`}
              >
                {formData.image ? (
                  <div className="relative h-44 w-32 overflow-hidden rounded-xl border border-surface-subtle">
                    <img src={formData.image} alt={formData.name || "Board member portrait"} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, image: "" }))} aria-label="Remove portrait" className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-white hover:bg-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={30} className="mx-auto mb-2 text-teal" />
                    <p className="text-xs font-bold text-text-primary">{isCompressing ? "Processing image..." : "Drop an image here or click to upload"}</p>
                    <p className="mt-1 text-[11px] text-text-muted">Portrait orientation, 3:4 ratio recommended.</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={isCompressing} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Upload portrait" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-surface-subtle pt-5">
              <button type="button" onClick={onClose} className="rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs font-bold text-text-muted hover:text-text-primary">Cancel</button>
              <button type="submit" disabled={isCompressing} className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid disabled:opacity-50">
                <Save size={15} />
                <span>Save member</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
