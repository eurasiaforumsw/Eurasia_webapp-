"use client";

import { useState } from "react";
import { Eye, Monitor, Smartphone, X } from "lucide-react";
import { AdminContentItem } from "@/lib/admin-data";

interface ContentPreviewProps {
  content: AdminContentItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentPreview({ content, isOpen, onClose }: ContentPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  if (!isOpen) return null;

  const previewUrl = `/${content.kind === "event" ? "events" : content.kind}/${content.id}?preview=true`;

  return (
    <div className="content-preview-overlay">
      <div className="content-preview">
        {/* Header */}
        <div className="content-preview__header">
          <div className="content-preview__title">
            <Eye size={20} />
            <h2>Content Preview</h2>
          </div>

          <div className="content-preview__controls">
            <div className="content-preview__device-toggle">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={device === "desktop" ? "is-active" : ""}
                title="Desktop view"
              >
                <Monitor size={18} />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={device === "mobile" ? "is-active" : ""}
                title="Mobile view"
              >
                <Smartphone size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="content-preview__close"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="content-preview__body">
          <div
            className={`content-preview__frame ${
              device === "mobile" ? "content-preview__frame--mobile" : ""
            }`}
          >
            <iframe
              src={previewUrl}
              title="Content preview"
              className="content-preview__iframe"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="content-preview__footer">
          <div className="content-preview__info">
            <strong>{content.title}</strong>
            <span>•</span>
            <span>{content.kind}</span>
            <span>•</span>
            <span>{content.status}</span>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="content-preview__btn"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
