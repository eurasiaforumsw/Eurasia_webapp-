"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, Download, User } from "lucide-react";

type FeaturedDocument = {
  id: string;
  title: string;
  author: string;
  authorImage?: string;
  category: string;
  summary: string;
  coverImage?: string;
  views: number;
  downloads: number;
};

type FeaturedShowcaseProps = {
  documents: FeaturedDocument[];
  onDocumentClick?: (id: string) => void;
};

export function FeaturedShowcase({
  documents,
  onDocumentClick,
}: FeaturedShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || documents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % documents.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, documents.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % documents.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (documents.length === 0) return null;

  const currentDoc = documents[currentIndex];

  return (
    <div className="featured-showcase">
      <div className="featured-showcase__inner">
        <div className="featured-showcase__content">
          <span className="featured-showcase__label">Featured Research</span>
          <h2 className="featured-showcase__title">{currentDoc.title}</h2>
          <p className="featured-showcase__summary">{currentDoc.summary}</p>

          <div className="featured-showcase__meta">
            <div className="featured-showcase__author">
              {currentDoc.authorImage ? (
                <img
                  src={currentDoc.authorImage}
                  alt={currentDoc.author}
                  className="featured-showcase__author-img"
                />
              ) : (
                <div className="featured-showcase__author-placeholder">
                  <User size={20} />
                </div>
              )}
              <div className="featured-showcase__author-info">
                <span className="featured-showcase__author-name">
                  {currentDoc.author}
                </span>
                <span className="featured-showcase__category">
                  {currentDoc.category}
                </span>
              </div>
            </div>
            <div className="featured-showcase__stats">
              <span>
                <Eye size={16} />
                {currentDoc.views.toLocaleString()}
              </span>
              <span>
                <Download size={16} />
                {currentDoc.downloads.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDocumentClick?.(currentDoc.id)}
            className="featured-showcase__cta"
          >
            View Document
          </button>
        </div>

        <div className="featured-showcase__visual">
          <div className="featured-showcase__cover">
            {currentDoc.coverImage ? (
              <img
                src={currentDoc.coverImage}
                alt={currentDoc.title}
                className="featured-showcase__cover-img"
              />
            ) : (
              <div className="featured-showcase__cover-placeholder">
                <span>{currentDoc.category}</span>
              </div>
            )}
          </div>
        </div>

        {documents.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="featured-showcase__nav featured-showcase__nav--prev"
              aria-label="Previous document"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="featured-showcase__nav featured-showcase__nav--next"
              aria-label="Next document"
            >
              <ChevronRight size={24} />
            </button>

            <div className="featured-showcase__dots">
              {documents.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`featured-showcase__dot ${
                    index === currentIndex ? "is-active" : ""
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
