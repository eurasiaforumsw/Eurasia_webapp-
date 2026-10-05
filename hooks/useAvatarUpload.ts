import { useState } from "react";
import { AvatarSettings } from "./useProfileEdit";

/**
 * Custom hook for managing avatar upload and crop settings
 */
export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const openEditor = () => {
    setEditorOpen(true);
    setError("");
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setError("");
    setAvatarSettings(null);
  };

  const handleFileSelect = async (file: File) => {
    setError("");

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    try {
      // Convert to data URL
      const dataUrl = await compressImageToDataUrl(file);
      setAvatarSettings({
        src: dataUrl,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image");
    }
  };

  const updateSettings = (settings: AvatarSettings) => {
    setAvatarSettings(settings);
  };

  const saveAvatar = async (): Promise<AvatarSettings | null> => {
    if (!avatarSettings) return null;

    setUploading(true);
    setError("");

    try {
      // In a real app, upload to R2/S3 here
      // For now, just return the data URL
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate upload

      return avatarSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    avatarSettings,
    editorOpen,
    openEditor,
    closeEditor,
    handleFileSelect,
    updateSettings,
    saveAvatar,
  };
}

/**
 * Compress image to data URL (max width 800px)
 */
function compressImageToDataUrl(
  file: File,
  maxWidth = 800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image format is not supported."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error("Failed to compress image."));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
