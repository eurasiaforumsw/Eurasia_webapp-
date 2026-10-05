"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Grid3x3,
  List,
  X,
  Copy,
  Trash2,
  Eye,
  Download,
  Image as ImageIcon,
  Video,
  File,
  Calendar,
} from "lucide-react";

type MediaItem = {
  id: string;
  url: string;
  key: string;
  kind: "image" | "video";
  mimeType: string;
  sizeBytes: number;
  humanSize: string;
  uploadedAt: string;
  fileName?: string;
};

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
}

export function MediaLibrary({ isOpen, onClose, onSelect }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Load media from localStorage (simulated - will connect to R2 later)
  const allMedia = useMemo<MediaItem[]>(() => {
    if (typeof window === "undefined") return [];

    // Get all uploaded media from admin content
    const stored = window.localStorage.getItem("efsw_admin_content");
    if (!stored) return [];

    try {
      const content = JSON.parse(stored);
      const media: MediaItem[] = [];

      // Extract cover images from content
      Object.values(content as Record<string, any>).forEach((item: any) => {
        if (item.coverImage && item.coverImage.startsWith("http")) {
          media.push({
            id: `${item.id}-cover`,
            url: item.coverImage,
            key: item.coverImage.split('/').pop() || "",
            kind: "image",
            mimeType: "image/webp",
            sizeBytes: 0,
            humanSize: "Unknown",
            uploadedAt: item.updatedAt || new Date().toISOString(),
            fileName: item.title || "Untitled",
          });
        }
      });

      return media;
    } catch {
      return [];
    }
  }, []);

  const filteredMedia = useMemo(() => {
    if (!searchQuery) return allMedia;
    const query = searchQuery.toLowerCase();
    return allMedia.filter(
      (item) =>
        item.fileName?.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query)
    );
  }, [allMedia, searchQuery]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  };

  const deleteMedia = (id: string) => {
    if (confirm("Are you sure you want to delete this media?")) {
      // TODO: Implement actual deletion
      alert("Delete functionality coming soon!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="media-library-overlay">
      <div className="media-library">
        {/* Header */}
        <div className="media-library__header">
          <h2>Media Library</h2>
          <button
            type="button"
            onClick={onClose}
            className="media-library__close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="media-library__toolbar">
          <div className="media-library__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="media-library__search-clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="media-library__view-toggle">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "is-active" : ""}
              aria-label="Grid view"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "is-active" : ""}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="media-library__stats">
          {filteredMedia.length} {filteredMedia.length === 1 ? "item" : "items"}
        </div>

        {/* Grid/List */}
        {filteredMedia.length === 0 ? (
          <div className="media-library__empty">
            <ImageIcon size={48} />
            <h3>No media found</h3>
            <p>Upload images through the content editor</p>
          </div>
        ) : (
          <div
            className={`media-library__grid ${
              viewMode === "list" ? "media-library__grid--list" : ""
            }`}
          >
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="media-library__item"
                onClick={() => setSelectedItem(item)}
              >
                <div className="media-library__item-preview">
                  {item.kind === "image" ? (
                    <img src={item.url} alt={item.fileName} />
                  ) : (
                    <div className="media-library__item-video-placeholder">
                      <Video size={32} />
                    </div>
                  )}
                </div>
                <div className="media-library__item-info">
                  <div className="media-library__item-name">
                    {item.fileName || item.key}
                  </div>
                  <div className="media-library__item-meta">
                    {item.humanSize || "Unknown size"}
                  </div>
                </div>
                <div className="media-library__item-actions">
                  {onSelect && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.url);
                        onClose();
                      }}
                      className="media-library__action"
                      title="Select"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.url);
                    }}
                    className="media-library__action"
                    title="Copy URL"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMedia(item.id);
                    }}
                    className="media-library__action media-library__action--danger"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {selectedItem && (
          <div
            className="media-library__preview-overlay"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="media-library__preview"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="media-library__preview-close"
              >
                <X size={24} />
              </button>

              <div className="media-library__preview-image">
                {selectedItem.kind === "image" ? (
                  <img src={selectedItem.url} alt={selectedItem.fileName} />
                ) : (
                  <video src={selectedItem.url} controls />
                )}
              </div>

              <div className="media-library__preview-details">
                <h3>{selectedItem.fileName || selectedItem.key}</h3>
                <div className="media-library__preview-meta">
                  <div>
                    <strong>Type:</strong> {selectedItem.mimeType}
                  </div>
                  <div>
                    <strong>Size:</strong> {selectedItem.humanSize}
                  </div>
                  <div>
                    <strong>Uploaded:</strong>{" "}
                    {new Date(selectedItem.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="media-library__preview-actions">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedItem.url)}
                    className="media-library__btn"
                  >
                    <Copy size={16} />
                    Copy URL
                  </button>
                  <a
                    href={selectedItem.url}
                    download
                    className="media-library__btn"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
