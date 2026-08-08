import { useState, useCallback } from 'react';

interface UseAvatarUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

interface UseAvatarUploadReturn {
  uploadAvatar: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  clearError: () => void;
}

export function useAvatarUpload({
  onSuccess,
  onError,
  maxSizeMB = 1,
  maxWidthOrHeight = 1024
}: UseAvatarUploadOptions = {}): UseAvatarUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      setUploadProgress(20);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      if (result.success && result.url) {
        onSuccess?.(result.url);
      } else {
        const error = 'Upload failed. Please try again.';
        setUploadError(error);
        onError?.(error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setUploadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess, onError]);

  return {
    uploadAvatar,
    isUploading,
    uploadProgress,
    uploadError,
    clearError
  };
}
