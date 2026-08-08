import { useState, useRef } from 'react';
import { useAvatarUpload } from './useAvatarUpload';
import { AvatarDisplay } from './AvatarDisplay';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName = 'User',
  onUploadSuccess,
  onUploadError
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    uploadAvatar,
    isUploading,
    uploadProgress,
    uploadError,
    clearError
  } = useAvatarUpload({
    onSuccess: (url) => {
      setPreviewUrl(null);
      setSelectedFile(null);
      onUploadSuccess?.(url);
    },
    onError: (error) => {
      onUploadError?.(error);
    }
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearError();

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onUploadError?.('Invalid file type. Please upload JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError?.('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadAvatar(selectedFile);
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="avatar-upload">
      <div className="avatar-upload__container">
        <div
          className="avatar-upload__avatar-wrapper"
          onClick={!previewUrl ? handleAvatarClick : undefined}
          role="button"
          tabIndex={0}
          aria-label="Upload avatar"
        >
          <AvatarDisplay
            avatarUrl={displayUrl}
            userName={userName}
            size={120}
            isLoading={isUploading}
          />
          {!previewUrl && (
            <div className="avatar-upload__overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Upload</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="avatar-upload__input"
          aria-label="Select avatar image"
        />

        {previewUrl && (
          <div className="avatar-upload__actions">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="avatar-upload__button avatar-upload__button--primary"
            >
              {isUploading ? 'Uploading...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="avatar-upload__button avatar-upload__button--secondary"
            >
              Cancel
            </button>
          </div>
        )}

        {isUploading && (
          <div className="avatar-upload__progress">
            <div
              className="avatar-upload__progress-bar"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {uploadError && (
          <div className="avatar-upload__error" role="alert">
            {uploadError}
          </div>
        )}
      </div>

      <style jsx>{`
        .avatar-upload {
          --surface-00: #05070C;
          --surface-01: #0A0D12;
          --surface-02: #0F131C;
          --surface-03: #161D2B;
          --surface-04: #1E2636;
          --accent: #38BDF8;
          --accent-muted: #1E3A5F;
          --text-primary: #E5E7EB;
          --text-secondary: #9CA3AF;
          --error: #EF4444;
          --radius-full: 999px;
          --radius-circle: 50%;
          --spacing-2: 0.5rem;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-6: 1.5rem;
        }

        .avatar-upload__container {
          display: grid;
          gap: var(--spacing-4);
          place-items: center;
        }

        .avatar-upload__avatar-wrapper {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .avatar-upload__avatar-wrapper:hover {
          transform: scale(1.02);
        }

        .avatar-upload__avatar-wrapper:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
          border-radius: var(--radius-circle);
        }

        .avatar-upload__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-2);
          background: rgba(5, 7, 12, 0.75);
          border-radius: var(--radius-circle);
          opacity: 0;
          transition: opacity 0.2s ease;
          color: var(--text-primary);
          font-size: clamp(0.75rem, 2vw, 0.875rem);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .avatar-upload__avatar-wrapper:hover .avatar-upload__overlay,
        .avatar-upload__avatar-wrapper:focus-visible .avatar-upload__overlay {
          opacity: 1;
        }

        .avatar-upload__input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .avatar-upload__actions {
          display: flex;
          gap: var(--spacing-3);
        }

        .avatar-upload__button {
          padding: var(--spacing-3) var(--spacing-6);
          border-radius: var(--radius-full);
          font-size: clamp(0.875rem, 2vw, 1rem);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .avatar-upload__button--primary {
          background: var(--accent);
          color: var(--surface-00);
        }

        .avatar-upload__button--primary:hover:not(:disabled) {
          background: #7DD3FC;
        }

        .avatar-upload__button--primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .avatar-upload__button--secondary {
          background: var(--surface-03);
          color: var(--text-primary);
        }

        .avatar-upload__button--secondary:hover:not(:disabled) {
          background: var(--surface-04);
        }

        .avatar-upload__progress {
          width: 100%;
          max-width: 240px;
          height: 4px;
          background: var(--surface-03);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .avatar-upload__progress-bar {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s ease;
        }

        .avatar-upload__error {
          color: var(--error);
          font-size: clamp(0.75rem, 2vw, 0.875rem);
          text-align: center;
          max-width: 320px;
        }
      `}</style>
    </div>
  );
}
