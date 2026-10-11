"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle2, FileIcon } from "lucide-react";

interface AcademicFileUploaderProps {
  onFileSelect: (file: File) => Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }>;
  currentFile?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  onClear: () => void;
}

export function AcademicFileUploader({
  onFileSelect,
  currentFile,
  onClear,
}: AcademicFileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and Word documents are allowed.");
      return false;
    }
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit.`);
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setError(null);
    setIsUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentId", "temp-" + Date.now());

      const res = await fetch("/api/admin/content/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Upload failed");
      }

      const result = await res.json();
      await onFileSelect(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName?: string) => {
    if (fileName?.endsWith(".pdf")) {
      return <FileText size={20} />;
    }
    return <FileIcon size={20} />;
  };

  return (
    <div className="academic-file-uploader">
      <div className="academic-file-uploader__label">
        <strong>Academic Document File</strong>
        <span className="academic-file-uploader__hint">PDF or Word document (max 50MB)</span>
      </div>

      {currentFile?.fileUrl ? (
        <div className="academic-file-uploader__current">
          <div className="academic-file-uploader__file-info">
            <div className="academic-file-uploader__file-icon">
              {getFileIcon(currentFile.fileName)}
            </div>
            <div className="academic-file-uploader__file-details">
              <div className="academic-file-uploader__file-name">{currentFile.fileName}</div>
              <div className="academic-file-uploader__file-size">
                {formatFileSize(currentFile.fileSize || 0)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="academic-file-uploader__clear"
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`academic-file-uploader__zone ${isDragOver ? "is-drag-over" : ""} ${isUploading ? "is-uploading" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="academic-file-uploader__content">
            <Upload size={32} />
            <div className="academic-file-uploader__text">
              <strong>Drag and drop your document</strong>
              <span>or click to browse</span>
            </div>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleInputChange}
            disabled={isUploading}
            className="academic-file-uploader__input"
          />
        </div>
      )}

      {error && (
        <div className="academic-file-uploader__error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="academic-file-uploader__success">
          <CheckCircle2 size={16} />
          File uploaded successfully
        </div>
      )}

      {isUploading && (
        <div className="academic-file-uploader__progress">
          <div className="academic-file-uploader__spinner" />
          <span>Uploading...</span>
        </div>
      )}

      <style>{`
        .academic-file-uploader {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.1rem;
          background: var(--admin-surface-deep);
          border: 1px solid var(--admin-line);
          border-radius: 8px;
        }

        .academic-file-uploader__label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .academic-file-uploader__label strong {
          color: var(--admin-ink);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .academic-file-uploader__hint {
          color: var(--admin-muted);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .academic-file-uploader__zone {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          padding: 1.5rem;
          border: 2px dashed var(--admin-line);
          border-radius: 8px;
          background: var(--admin-surface);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .academic-file-uploader__zone:hover {
          background: var(--admin-surface-deep);
          border-color: var(--admin-teal);
        }

        .academic-file-uploader__zone.is-drag-over {
          background: var(--admin-teal-alpha);
          border-color: var(--admin-teal);
        }

        .academic-file-uploader__zone.is-uploading {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .academic-file-uploader__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
          pointer-events: none;
        }

        .academic-file-uploader__content svg {
          color: var(--admin-teal);
        }

        .academic-file-uploader__text {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .academic-file-uploader__text strong {
          color: var(--admin-ink);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .academic-file-uploader__text span {
          color: var(--admin-muted);
          font-size: 0.8rem;
        }

        .academic-file-uploader__input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .academic-file-uploader__current {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--admin-surface);
          border: 1px solid var(--admin-line);
          border-radius: 8px;
          gap: 1rem;
        }

        .academic-file-uploader__file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .academic-file-uploader__file-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: var(--admin-surface-deep);
          color: var(--admin-teal);
        }

        .academic-file-uploader__file-details {
          flex: 1;
          min-width: 0;
        }

        .academic-file-uploader__file-name {
          color: var(--admin-ink);
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .academic-file-uploader__file-size {
          color: var(--admin-muted);
          font-size: 0.75rem;
          margin-top: 0.2rem;
        }

        .academic-file-uploader__clear {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: var(--admin-surface-deep);
          color: var(--admin-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .academic-file-uploader__clear:hover {
          background: var(--admin-error-alpha);
          color: var(--admin-error);
        }

        .academic-file-uploader__error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--admin-error-alpha);
          border: 1px solid var(--admin-error);
          border-radius: 6px;
          color: var(--admin-error);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .academic-file-uploader__error svg {
          flex-shrink: 0;
        }

        .academic-file-uploader__success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--admin-success-alpha);
          border: 1px solid var(--admin-success);
          border-radius: 6px;
          color: var(--admin-success);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .academic-file-uploader__success svg {
          flex-shrink: 0;
        }

        .academic-file-uploader__progress {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--admin-surface);
          border: 1px solid var(--admin-line);
          border-radius: 6px;
          color: var(--admin-muted);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .academic-file-uploader__spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--admin-line);
          border-top-color: var(--admin-teal);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
