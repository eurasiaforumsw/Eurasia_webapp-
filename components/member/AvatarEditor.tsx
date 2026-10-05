import { useState, useRef, ChangeEvent } from "react";
import { Camera, X, ZoomIn, ZoomOut, Check, AlertCircle } from "lucide-react";
import { AvatarSettings } from "@/hooks/useProfileEdit";

interface AvatarEditorProps {
  avatar: AvatarSettings | null;
  uploading: boolean;
  error: string;
  onFileSelect: (file: File) => void;
  onUpdateSettings: (settings: AvatarSettings) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export function AvatarEditor({
  avatar,
  uploading,
  error,
  onFileSelect,
  onUpdateSettings,
  onSave,
  onCancel,
}: AvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  };

  return (
    <div className="efsw-avatar-editor">
      <div className="efsw-avatar-editor__overlay" onClick={onCancel} />

      <div className="efsw-avatar-editor__modal">
        <header className="efsw-avatar-editor__header">
          <h2>Edit profile photo</h2>
          <button
            type="button"
            onClick={onCancel}
            className="efsw-avatar-editor__close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="efsw-avatar-editor__body">
          {!avatar?.src ? (
            <div
              className={`efsw-avatar-editor__dropzone ${isDragging ? "is-dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Camera size={32} />
              <p>
                <strong>Drop an image here</strong>
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--efsw-ink-soft)" }}>
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="efsw-profile__btn efsw-profile__btn--primary"
                style={{ marginTop: "1rem" }}
              >
                Choose file
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--efsw-ink-soft)", marginTop: "1rem" }}>
                JPG, PNG, or WebP • Max 10 MB
              </p>
            </div>
          ) : (
            <>
              <div className="efsw-avatar-editor__preview">
                <div className="efsw-avatar-editor__canvas">
                  <img
                    src={avatar.src}
                    alt="Avatar preview"
                    style={{
                      transform: `scale(${avatar.zoom}) translate(${avatar.offsetX * 50}%, ${avatar.offsetY * 50}%)`,
                    }}
                  />
                </div>
              </div>

              <div className="efsw-avatar-editor__controls">
                <div className="efsw-avatar-editor__control">
                  <label>
                    <ZoomIn size={14} /> Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.1}
                    value={avatar.zoom}
                    onChange={(e) =>
                      onUpdateSettings({ ...avatar, zoom: parseFloat(e.target.value) })
                    }
                  />
                  <span>{avatar.zoom.toFixed(1)}×</span>
                </div>

                <div className="efsw-avatar-editor__control">
                  <label>Horizontal</label>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={avatar.offsetX}
                    onChange={(e) =>
                      onUpdateSettings({ ...avatar, offsetX: parseFloat(e.target.value) })
                    }
                  />
                </div>

                <div className="efsw-avatar-editor__control">
                  <label>Vertical</label>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={avatar.offsetY}
                    onChange={(e) =>
                      onUpdateSettings({ ...avatar, offsetY: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="efsw-profile__btn efsw-profile__btn--secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Camera size={14} /> Choose different image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </>
          )}

          {error && (
            <div className="efsw-profile__alert efsw-profile__alert--error" style={{ marginTop: "1rem" }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        <footer className="efsw-avatar-editor__footer">
          <button
            type="button"
            onClick={onCancel}
            className="efsw-profile__btn efsw-profile__btn--secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="efsw-profile__btn efsw-profile__btn--primary"
            disabled={uploading || !avatar?.src}
          >
            <Check size={14} />
            {uploading ? "Uploading..." : "Save photo"}
          </button>
        </footer>
      </div>
    </div>
  );
}
