"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  Link2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  GripVertical,
} from "lucide-react";
import { AdminHeroScene, R2UploadResult, uploadMediaToR2 } from "@/lib/admin-data";

interface HeroSceneEditorProps {
  scene: AdminHeroScene;
  index: number;
  total: number;
  onChange: (next: AdminHeroScene) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

type UploadPhase = "idle" | "uploading" | "done" | "error";

/**
 * A single hero-scene editor — image or video, with optional poster
 * (video) and per-scene duration (image). Supports direct file upload
 * to R2 with progress + final asset summary, plus URL paste fallback.
 */
export function HeroSceneEditor({
  scene,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: HeroSceneEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"upload" | "url">(
    scene.url ? "url" : "upload"
  );

  const accept = scene.kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
  const posterAccept = "image/jpeg,image/png,image/webp";

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setPhase("uploading");
      try {
        const result: R2UploadResult = await uploadMediaToR2(file);
        const isVideo = file.type.startsWith("video/");
        onChange({
          ...scene,
          kind: isVideo ? "video" : "image",
          url: result.url,
          mimeType: result.mimeType ?? file.type,
          sizeBytes: result.sizeBytes ?? file.size,
          uploadedAt: new Date().toISOString(),
        });
        setPhase("done");
        // Settle back to idle after a brief celebration.
        setTimeout(() => setPhase("idle"), 1200);
      } catch (err: any) {
        setError(err?.message || "Upload failed");
        setPhase("error");
      }
    },
    [scene, onChange]
  );

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handlePosterFile = useCallback(
    async (file: File) => {
      try {
        const result = await uploadMediaToR2(file);
        onChange({ ...scene, posterUrl: result.url });
      } catch (err: any) {
        setError(err?.message || "Poster upload failed");
      }
    },
    [scene, onChange]
  );

  const handlePosterInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handlePosterFile(file);
    event.target.value = "";
  };

  return (
    <article
      style={{
        border: "1px solid var(--admin-line)",
        background: "var(--admin-surface)",
        overflow: "hidden",
      }}
    >
      {/* ── Scene header ─────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          padding: "0.85rem 1.1rem",
          borderBottom: "1px solid var(--admin-line)",
          background: "var(--admin-surface-deep)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: "1.8rem",
              height: "1.8rem",
              borderRadius: "999px",
              background: "var(--admin-ink)",
              color: "var(--admin-surface)",
              fontSize: "0.74rem",
              fontWeight: 800,
            }}
          >
            {index + 1}
          </span>
          <div style={{ display: "grid" }}>
            <strong style={{ color: "var(--admin-ink)", fontSize: "0.82rem", fontWeight: 750 }}>
              Scene {index + 1} · {scene.kind === "video" ? "Video" : "Image"}
            </strong>
            <small style={{ color: "var(--admin-muted)", fontSize: "0.66rem" }}>
              {scene.kind === "video"
                ? "Plays to its natural length, then advances."
                : `Shows for ${scene.durationSec ?? 5} seconds, then advances.`}
            </small>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          {/* Toggle kind */}
          <div className="efsw-admin-segmented" style={{ padding: "0.15rem" }}>
            <button
              type="button"
              onClick={() => onChange({ ...scene, kind: "image" })}
              className={scene.kind === "image" ? "is-active" : ""}
              style={{ minHeight: "2rem", fontSize: "0.66rem" }}
              aria-pressed={scene.kind === "image"}
            >
              <ImageIcon size={11} /> Image
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...scene, kind: "video" })}
              className={scene.kind === "video" ? "is-active" : ""}
              style={{ minHeight: "2rem", fontSize: "0.66rem" }}
              aria-pressed={scene.kind === "video"}
            >
              <Film size={11} /> Video
            </button>
          </div>

          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="efsw-admin-icon-button"
            aria-label="Move scene up"
            style={{ width: "2rem", height: "2rem" }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="efsw-admin-icon-button"
            aria-label="Move scene down"
            style={{ width: "2rem", height: "2rem" }}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="efsw-admin-icon-button"
            aria-label="Delete scene"
            style={{ width: "2rem", height: "2rem", color: "var(--admin-danger)", borderColor: "var(--admin-danger)" }}
          >
            <X size={12} />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gap: "0.85rem",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          padding: "1rem 1.1rem 1.15rem",
        }}
      >
        {/* ── Source picker ─────────────────────────────────── */}
        <div style={{ display: "grid", gap: "0.55rem", alignContent: "start" }}>
          <div className="efsw-admin-segmented" style={{ alignSelf: "start" }}>
            <button
              type="button"
              onClick={() => setUploadMode("upload")}
              className={uploadMode === "upload" ? "is-active" : ""}
            >
              <UploadCloud size={12} /> Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={uploadMode === "url" ? "is-active" : ""}
            >
              <Link2 size={12} /> Paste URL
            </button>
          </div>

          {uploadMode === "upload" ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "9rem",
                padding: "1rem",
                border: `2px dashed ${
                  phase === "error"
                    ? "var(--admin-danger)"
                    : phase === "done"
                      ? "var(--admin-green)"
                      : "var(--admin-line)"
                }`,
                background:
                  phase === "uploading"
                    ? "color-mix(in oklch, var(--admin-green) 6%, var(--admin-surface))"
                    : "var(--admin-surface-deep)",
                cursor: "pointer",
                transition: "background 150ms var(--ease-out)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleInput}
                style={{ display: "none" }}
              />
              <div style={{ display: "grid", gap: "0.35rem", placeItems: "center", color: "var(--admin-muted)" }}>
                {phase === "uploading" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--admin-green)" }} />
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--admin-green)" }}>
                      Uploading to R2…
                    </span>
                  </>
                ) : phase === "done" ? (
                  <>
                    <CheckCircle2 size={20} style={{ color: "var(--admin-green)" }} />
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--admin-green)" }}>
                      Uploaded
                    </span>
                  </>
                ) : phase === "error" ? (
                  <>
                    <AlertCircle size={20} style={{ color: "var(--admin-danger)" }} />
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--admin-danger)" }}>
                      {error ?? "Upload failed"}
                    </span>
                    <small style={{ fontSize: "0.62rem" }}>Click to retry</small>
                  </>
                ) : scene.url ? (
                  <>
                    {scene.kind === "video" ? <Film size={20} /> : <ImageIcon size={20} />}
                    <span style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Drop to replace {scene.kind === "video" ? "video" : "image"}
                    </span>
                    <small style={{ fontSize: "0.62rem" }}>
                      {scene.kind === "video" ? "MP4 / WebM / MOV · up to 200 MB" : "JPG / PNG / WebP / SVG · up to 20 MB"}
                    </small>
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} />
                    <span style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Drop {scene.kind === "video" ? "video" : "image"} here or click to upload
                    </span>
                    <small style={{ fontSize: "0.62rem" }}>
                      Auto-stored in Cloudflare R2 · {scene.kind === "video" ? "MP4 / WebM / MOV · up to 200 MB" : "JPG / PNG / WebP / SVG · up to 20 MB"}
                    </small>
                  </>
                )}
              </div>
            </div>
          ) : (
            <label style={{ display: "grid", gap: "0.3rem" }}>
              <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>
                {scene.kind === "video" ? "Video URL" : "Image URL"}
              </span>
              <input
                type="text"
                value={scene.url}
                onChange={(e) => onChange({ ...scene, url: e.target.value })}
                placeholder={scene.kind === "video" ? "https://…/hero.mp4" : "https://…/hero.jpg"}
                style={{
                  width: "100%",
                  border: "1px solid var(--admin-line)",
                  background: "var(--admin-surface)",
                  color: "var(--admin-ink)",
                  padding: "0.55rem 0.7rem",
                  fontSize: "0.78rem",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              />
            </label>
          )}

          {/* Asset summary — appears once a file is uploaded */}
          {scene.sizeBytes !== undefined && scene.mimeType && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.4rem 0.7rem",
                padding: "0.7rem 0.85rem",
                border: "1px solid var(--admin-green)",
                background: "color-mix(in oklch, var(--admin-green) 6%, var(--admin-surface))",
                color: "var(--admin-ink)",
                fontSize: "0.72rem",
                lineHeight: 1.4,
              }}
            >
              <CheckCircle2 size={14} style={{ color: "var(--admin-green)" }} />
              <strong style={{ fontSize: "0.72rem", fontWeight: 800 }}>Asset summary</strong>
              <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Size</span>
              <span>
                <strong>{formatBytes(scene.sizeBytes)}</strong>
                {scene.uploadedAt && (
                  <small style={{ display: "block", color: "var(--admin-muted)" }}>
                    uploaded {timeAgo(scene.uploadedAt)}
                  </small>
                )}
              </span>
              <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Type</span>
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                {scene.mimeType}
              </span>
              <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Storage</span>
              <span>
                Cloudflare R2 <code style={{ fontSize: "0.62rem" }}>{scene.url.split("/").pop()}</code>
              </span>
            </div>
          )}
        </div>

        {/* ── Settings ──────────────────────────────────────── */}
        <div style={{ display: "grid", gap: "0.55rem", alignContent: "start" }}>
          {/* Image-only: display duration */}
          {scene.kind === "image" && (
            <label style={{ display: "grid", gap: "0.3rem" }}>
              <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>
                <Clock size={11} style={{ verticalAlign: "-0.1em", marginRight: "0.3rem" }} />
                Display time (seconds)
              </span>
              <input
                type="number"
                min={1}
                max={120}
                step={1}
                value={scene.durationSec ?? 5}
                onChange={(e) =>
                  onChange({ ...scene, durationSec: Math.max(1, Math.min(120, Number(e.target.value) || 5)) })
                }
                style={{
                  width: "100%",
                  border: "1px solid var(--admin-line)",
                  background: "var(--admin-surface)",
                  color: "var(--admin-ink)",
                  padding: "0.55rem 0.7rem",
                  fontSize: "0.78rem",
                }}
              />
              <small style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>
                How long this image stays on screen before the carousel advances. 5 seconds is a sensible default.
              </small>
            </label>
          )}

          {/* Video-only: poster URL */}
          {scene.kind === "video" && (
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>
                Poster image (optional)
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  type="text"
                  value={scene.posterUrl ?? ""}
                  onChange={(e) => onChange({ ...scene, posterUrl: e.target.value })}
                  placeholder="https://…/poster.jpg"
                  style={{
                    flex: 1,
                    border: "1px solid var(--admin-line)",
                    background: "var(--admin-surface)",
                    color: "var(--admin-ink)",
                    padding: "0.55rem 0.7rem",
                    fontSize: "0.78rem",
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="efsw-admin-text-action"
                  style={{
                    padding: "0 0.85rem",
                    border: "1px solid var(--admin-line)",
                    background: "var(--admin-surface)",
                    fontSize: "0.72rem",
                  }}
                >
                  <UploadCloud size={12} /> Upload
                </button>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept={posterAccept}
                  onChange={handlePosterInput}
                  style={{ display: "none" }}
                />
              </div>
              <small style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>
                Shown until the video's first frame is ready.
              </small>
            </div>
          )}

          {/* Per-scene overlay (optional) */}
          <details
            style={{
              border: "1px solid var(--admin-line)",
              background: "var(--admin-surface)",
              padding: "0.6rem 0.8rem",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: "var(--admin-muted)",
                fontSize: "0.7rem",
                fontWeight: 800,
                listStyle: "none",
              }}
            >
              <GripVertical size={11} style={{ verticalAlign: "-0.1em", marginRight: "0.3rem" }} />
              Per-scene overlay (optional)
            </summary>
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }}>
              <input
                type="text"
                value={scene.headline ?? ""}
                onChange={(e) => onChange({ ...scene, headline: e.target.value })}
                placeholder="Headline (overrides the global one)"
                style={{
                  border: "1px solid var(--admin-line)",
                  background: "var(--admin-surface-deep)",
                  color: "var(--admin-ink)",
                  padding: "0.5rem 0.65rem",
                  fontSize: "0.74rem",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={scene.ctaText ?? ""}
                  onChange={(e) => onChange({ ...scene, ctaText: e.target.value })}
                  placeholder="CTA label"
                  style={{
                    border: "1px solid var(--admin-line)",
                    background: "var(--admin-surface-deep)",
                    color: "var(--admin-ink)",
                    padding: "0.5rem 0.65rem",
                    fontSize: "0.74rem",
                  }}
                />
                <input
                  type="text"
                  value={scene.ctaLink ?? ""}
                  onChange={(e) => onChange({ ...scene, ctaLink: e.target.value })}
                  placeholder="/link"
                  style={{
                    border: "1px solid var(--admin-line)",
                    background: "var(--admin-surface-deep)",
                    color: "var(--admin-ink)",
                    padding: "0.5rem 0.65rem",
                    fontSize: "0.74rem",
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  }}
                />
              </div>
              <small style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>
                Leave blank to use the global hero copy for this scene.
              </small>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
    return `${Math.floor(diff / 86_400_000)} d ago`;
  } catch {
    return "";
  }
}