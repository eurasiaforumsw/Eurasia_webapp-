"use client";

import { ChangeEvent, DragEvent, FormEvent, memo, useState } from "react";
import {
  X,
  UploadCloud,
  ImageIcon,
  Save,
  Trash2,
  FileText,
  Newspaper,
  CheckCircle2,
} from "lucide-react";
import { AdminContentCategory, AdminContentItem, AdminContentKind, AdminContentStatus } from "@/lib/admin-data";
import { compressImageFile } from "@/lib/image-utils";

interface ContentEditorModalProps {
  initialItem: AdminContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AdminContentItem) => void;
  onDelete?: (id: string) => void;
  contentCategories?: AdminContentCategory[];
}

const BLANK_ITEM: AdminContentItem = {
  id: "",
  kind: "news",
  category: "Platform update",
  title: "",
  summary: "",
  body: "",
  coverImage: "",
  imageCaption: "",
  author: "EFSW Editorial Board",
  tags: [],
  status: "published",
  locale: "en",
  updatedAt: "",
};

export const ContentEditorModal = memo(function ContentEditorModal({
  initialItem,
  isOpen,
  onClose,
  onSave,
  onDelete,
  contentCategories = [],
}: ContentEditorModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<AdminContentItem>(initialItem || BLANK_ITEM);
  const [tagsInput, setTagsInput] = useState(
    initialItem?.tags ? initialItem.tags.join(", ") : ""
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        outputFormat: "image/webp",
      });
      setFormData((prev) => ({ ...prev, coverImage: compressed }));
    } catch (err) {
      console.error("Image compression error:", err);
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
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: AdminContentItem = {
      ...formData,
      id: formData.id || `content-${Date.now().toString(36)}`,
      tags,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl rounded-3xl border border-surface-subtle bg-surface-deep p-6 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal-light">
                {formData.kind === "news" ? <Newspaper size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-text-primary">
                  {formData.id ? "Edit content" : "Create content"}
                </h2>
                <p className="text-xs text-text-muted">
                  Publish news and academic resources to EFSW.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Kind & Status & Locale selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Content type
                </label>
                <select
                  value={formData.kind}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kind: e.target.value as AdminContentKind,
                    }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                >
                  <option value="news">News</option>
                  <option value="document">Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Category
                </label>
                <input
                  type="text"
                  list={formData.kind === "news" ? "newsroom-category-options" : undefined}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="e.g. Platform, Research, Policy"
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  required
                />
                {formData.kind === "news" && (
                  <datalist id="newsroom-category-options">
                    {contentCategories
                      .filter((category) => category.kind === "news" && category.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map((category) => <option key={category.id} value={category.label} />)}
                  </datalist>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as AdminContentStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Write a clear, engaging title..."
                className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs font-medium text-text-primary focus:border-teal focus:outline-none"
                required
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Summary
              </label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                placeholder="Summarise the key points in one or two paragraphs..."
                className="w-full rounded-xl border border-surface-subtle bg-surface-base p-3.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                required
              />
            </div>

            {/* Full Body */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Full body
              </label>
              <textarea
                rows={5}
                value={formData.body || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Article details, captions, or supporting information..."
                className="w-full rounded-xl border border-surface-subtle bg-surface-base p-3.5 text-xs text-text-primary focus:border-teal focus:outline-none"
              />
            </div>

            {/* Image Uploader with Auto Compression */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Cover image (auto-compressed)
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
                {formData.coverImage ? (
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-surface-subtle">
                    <img
                      src={formData.coverImage}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                      className="absolute top-2 right-2 rounded-lg bg-black/70 p-1.5 text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud size={32} className="text-teal mb-2" />
                    <p className="text-xs font-bold text-text-primary">
                      {isCompressing ? "Processing and compressing image..." : "Drop an image here or click to upload"}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      Images are resized and compressed to high-quality WebP automatically.
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

            {/* Author, Tags, Locale */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Author / organisation
                </label>
                <input
                  type="text"
                  value={formData.author || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, author: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Search tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Platform, Exchange, Welfare"
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-surface-subtle pt-5">
              {formData.id && onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(formData.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete content</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid disabled:opacity-50 transition-all"
                >
                  <Save size={15} />
                  <span>Save content</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});
