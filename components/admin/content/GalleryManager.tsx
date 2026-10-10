'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react';

export interface GalleryImage {
  id: string;
  url: string;
  file?: File;
  alt?: string;
  order: number;
}

interface GalleryManagerProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  maxImages?: number;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

interface SortableImageCardProps {
  image: GalleryImage;
  onDelete: (id: string) => void;
  onEditAlt: (id: string, alt: string) => void;
  onPreview: (image: GalleryImage) => void;
}

function SortableImageCard({ image, onDelete, onEditAlt, onPreview }: SortableImageCardProps) {
  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [altText, setAltText] = useState(image.alt || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveAlt = () => {
    onEditAlt(image.id, altText);
    setIsEditingAlt(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(image.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-[#0F131C] rounded-2xl border border-[#1E2636] overflow-hidden transition-all duration-200 hover:border-[#38BDF8]/50 hover:shadow-lg hover:shadow-[#38BDF8]/10"
    >
      {/* Image */}
      <div
        className="relative aspect-[4/3] bg-[#0A0D12] cursor-pointer overflow-hidden"
        onClick={() => onPreview(image)}
      >
        <img
          src={image.url}
          alt={image.alt || `Gallery image ${image.order + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Drag Handle Overlay */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-2 bg-black/60 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={16} className="text-white" />
        </div>

        {/* Preview Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white text-sm font-medium">Click to preview</div>
        </div>
      </div>

      {/* Alt Text Editor or Display */}
      <div className="p-3 space-y-2">
        {isEditingAlt ? (
          <div className="space-y-2">
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Enter alt text..."
              className="w-full px-3 py-2 text-sm bg-[#161D2B] border border-[#1E2636] rounded-lg text-gray-300 placeholder:text-gray-500 focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAlt();
                if (e.key === 'Escape') setIsEditingAlt(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveAlt}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#38BDF8] rounded-lg hover:bg-[#38BDF8]/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingAlt(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-400 bg-[#161D2B] rounded-lg hover:bg-[#1E2636] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-start gap-2 cursor-pointer group/alt"
            onClick={() => setIsEditingAlt(true)}
          >
            <Edit2 size={14} className="text-gray-500 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-xs text-gray-400 line-clamp-2 flex-1 group-hover/alt:text-gray-300 transition-colors">
              {image.alt || 'Click to add alt text...'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDeleteClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10">
          <div className="bg-[#0F131C] rounded-xl p-4 space-y-3 w-full">
            <p className="text-sm text-gray-300 text-center">
              Delete this image?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-400 bg-[#161D2B] rounded-lg hover:bg-[#1E2636] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryManager({
  images,
  onChange,
  maxImages = 20,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        order: idx,
      }));

      onChange(reorderedImages);
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        onUploadError?.(`Maximum ${maxImages} images allowed`);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const invalidFiles = filesToProcess.filter(
        (file) => !file.type.startsWith('image/')
      );

      if (invalidFiles.length > 0) {
        onUploadError?.('Only image files are allowed');
        return;
      }

      setUploading(true);
      onUploadStart?.();

      try {
        const newImages: GalleryImage[] = [];

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const url = URL.createObjectURL(file);

          newImages.push({
            id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            file,
            alt: '',
            order: images.length + i,
          });
        }

        onChange([...images, ...newImages]);
        onUploadComplete?.();
      } catch (error) {
        onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange, onUploadStart, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const filtered = images.filter((img) => img.id !== id);
      const reindexed = filtered.map((img, idx) => ({ ...img, order: idx }));
      onChange(reindexed);
    },
    [images, onChange]
  );

  const handleEditAlt = useCallback(
    (id: string, alt: string) => {
      const updated = images.map((img) =>
        img.id === id ? { ...img, alt } : img
      );
      onChange(updated);
    },
    [images, onChange]
  );

  const handlePreview = useCallback((image: GalleryImage) => {
    setPreviewImage(image);
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
          dragActive
            ? 'border-[#38BDF8] bg-[#38BDF8]/5'
            : 'border-[#1E2636] bg-[#0A0D12] hover:border-[#38BDF8]/50'
        } ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => {
          if (images.length < maxImages && !uploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={images.length >= maxImages || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`p-4 rounded-2xl transition-colors ${
            dragActive ? 'bg-[#38BDF8]/20' : 'bg-[#161D2B]'
          }`}>
            {uploading ? (
              <div className="w-12 h-12 border-4 border-[#38BDF8]/30 border-t-[#38BDF8] rounded-full animate-spin" />
            ) : (
              <Upload size={48} className={`transition-colors ${
                dragActive ? 'text-[#38BDF8]' : 'text-gray-500'
              }`} />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-300">
              {uploading ? 'Uploading...' : dragActive ? 'Drop images here' : 'Upload Images'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              {images.length >= maxImages
                ? `Maximum ${maxImages} images reached`
                : `Drag and drop images or click to browse. ${images.length}/${maxImages} images uploaded.`}
            </p>
          </div>

          {!uploading && images.length < maxImages && (
            <button
              type="button"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#38BDF8] hover:bg-[#38BDF8]/90 shadow-lg shadow-[#38BDF8]/30 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose Files
            </button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-300">
              Gallery Images ({images.length})
            </h3>
            <p className="text-sm text-gray-500">
              Drag to reorder
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image) => (
                  <SortableImageCard
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                    onEditAlt={handleEditAlt}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F131C]">
            <ImageIcon size={64} className="text-gray-600" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-400">
              No images yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Upload images to create a gallery. You can add up to {maxImages} images.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.alt || 'Preview'}
              className="w-full h-full object-contain rounded-2xl"
            />
            {previewImage.alt && (
              <div className="mt-4 p-4 bg-[#0F131C]/80 backdrop-blur-sm rounded-xl">
                <p className="text-sm text-gray-300 text-center">{previewImage.alt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
