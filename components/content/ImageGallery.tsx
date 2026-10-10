'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export default function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const slides = images.map((img) => ({
    src: img.url,
    alt: img.alt || '',
    width: img.width || 1920,
    height: img.height || 1080,
  }));

  return (
    <>
      <div className={`gallery-grid ${className}`}>
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => openLightbox(index)}
            className="gallery-item"
            type="button"
            aria-label={`View image ${index + 1} of ${images.length}`}
          >
            <div className="gallery-item-inner">
              <Image
                src={image.url}
                alt={image.alt || `Gallery image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="gallery-image"
                loading="lazy"
              />
              <div className="gallery-overlay">
                <svg
                  className="gallery-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        on={{
          view: ({ index }) => setCurrentIndex(index),
        }}
        animation={{ fade: 300, swipe: 250 }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{
          finite: images.length <= 1,
          preload: 2,
        }}
        render={{
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
        }}
      />

      <style jsx>{`
        .gallery-grid {
          --gap: clamp(0.75rem, 2vw, 1.5rem);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--gap);
          width: 100%;
        }

        @media (min-width: 640px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .gallery-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .gallery-item {
          --radius: clamp(0.5rem, 1.5vw, 1rem);
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: var(--radius);
          border: none;
          padding: 0;
          background: #0F131C;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .gallery-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .gallery-item:focus-visible {
          outline: 2px solid #38BDF8;
          outline-offset: 2px;
        }

        .gallery-item-inner {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .gallery-image {
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .gallery-item:hover .gallery-image {
          transform: scale(1.05);
        }

        .gallery-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 7, 12, 0.6);
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-icon {
          width: clamp(2rem, 4vw, 3rem);
          height: clamp(2rem, 4vw, 3rem);
          color: #38BDF8;
          filter: drop-shadow(0 2px 8px rgba(56, 189, 248, 0.3));
        }

        :global(.yarl__root) {
          --yarl__color_backdrop: rgba(5, 7, 12, 0.95);
          --yarl__color_button: #38BDF8;
          --yarl__color_button_active: #7DD3FC;
        }
      `}</style>
    </>
  );
}
