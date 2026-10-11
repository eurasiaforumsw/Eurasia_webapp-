"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Download, AlertCircle } from "lucide-react";

interface PDFPreviewModalProps {
  isOpen: boolean;
  fileUrl?: string;
  fileName?: string;
  onClose: () => void;
}

export function PDFPreviewModal({
  isOpen,
  fileUrl,
  fileName,
  onClose,
}: PDFPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileUrl) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, fileUrl]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="pdf-preview-modal-overlay" onClick={onClose}>
      <div className="pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-preview-modal__header">
          <div>
            <h3>{fileName || "Document Preview"}</h3>
            <p className="pdf-preview-modal__meta">
              {fileUrl && `Viewing: ${fileUrl.split("/").pop()}`}
            </p>
          </div>
          <div className="pdf-preview-modal__actions">
            <button
              onClick={handleDownload}
              className="pdf-preview-modal__btn"
              title="Download file"
            >
              <Download size={16} />
              Download
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-preview-modal__btn"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
              Open
            </a>
            <button
              onClick={onClose}
              className="pdf-preview-modal__close"
              title="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="pdf-preview-modal__content">
          {error && (
            <div className="pdf-preview-modal__error">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!error && fileUrl && (
            <>
              {isLoading && (
                <div className="pdf-preview-modal__loading">
                  <div className="pdf-preview-modal__spinner" />
                  <p>Loading preview...</p>
                </div>
              )}
              <object
                data={fileUrl}
                type="application/pdf"
                className="pdf-preview-modal__object"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError("Could not load PDF preview. It may be corrupted or in an unsupported format.");
                }}
              >
                <embed
                  src={fileUrl}
                  type="application/pdf"
                  className="pdf-preview-modal__embed"
                />
              </object>
            </>
          )}
        </div>
      </div>

      <style>{`
        .pdf-preview-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .pdf-preview-modal {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1000px;
          height: 90vh;
          max-height: 700px;
          background: var(--admin-surface);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .pdf-preview-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--admin-line);
          background: var(--admin-surface-deep);
          flex-shrink: 0;
        }

        .pdf-preview-modal__header h3 {
          margin: 0;
          color: var(--admin-ink);
          font-size: 1rem;
          font-weight: 600;
        }

        .pdf-preview-modal__meta {
          margin: 0.25rem 0 0;
          color: var(--admin-muted);
          font-size: 0.8rem;
        }

        .pdf-preview-modal__actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .pdf-preview-modal__btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--admin-teal);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .pdf-preview-modal__btn:hover {
          background: var(--admin-teal-dark);
        }

        .pdf-preview-modal__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: var(--admin-surface);
          color: var(--admin-muted);
          border: 1px solid var(--admin-line);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pdf-preview-modal__close:hover {
          background: var(--admin-error-alpha);
          color: var(--admin-error);
          border-color: var(--admin-error);
        }

        .pdf-preview-modal__content {
          flex: 1;
          overflow: auto;
          background: var(--admin-surface);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pdf-preview-modal__object,
        .pdf-preview-modal__embed {
          width: 100%;
          height: 100%;
          border: none;
        }

        .pdf-preview-modal__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: absolute;
          inset: 0;
          background: var(--admin-surface-deep);
          z-index: 100;
        }

        .pdf-preview-modal__spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--admin-line);
          border-top-color: var(--admin-teal);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .pdf-preview-modal__loading p {
          color: var(--admin-muted);
          font-size: 0.9rem;
          margin: 0;
        }

        .pdf-preview-modal__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem;
          text-align: center;
          color: var(--admin-error);
        }

        .pdf-preview-modal__error svg {
          flex-shrink: 0;
        }

        .pdf-preview-modal__error p {
          margin: 0;
          font-size: 0.9rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .pdf-preview-modal {
            max-height: 85vh;
          }

          .pdf-preview-modal__header {
            flex-wrap: wrap;
          }

          .pdf-preview-modal__actions {
            width: 100%;
            gap: 0.3rem;
          }

          .pdf-preview-modal__btn {
            flex: 1;
            padding: 0.4rem 0.6rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
