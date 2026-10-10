'use client';

import type { CoverImageCrop } from '@/lib/admin-data';

interface CoverImageProps {
  src: string;
  alt: string;
  crop?: CoverImageCrop;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

/**
 * CoverImage component handles displaying cover images with optional crop data.
 * When crop data is provided, it applies object-fit and object-position to show
 * the cropped region without generating a new image.
 */
export default function CoverImage({
  src,
  alt,
  crop,
  className = '',
  loading = 'lazy',
}: CoverImageProps) {
  const style: React.CSSProperties = crop
    ? {
        objectFit: 'cover',
        objectPosition: `${crop.x}% ${crop.y}%`,
        transform: `scale(${crop.scale})`,
        transformOrigin: 'center',
      }
    : {
        objectFit: 'cover',
      };

  return (
    <div className={`cover-image-wrapper ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        style={style}
        className="cover-image"
      />
    </div>
  );
}
