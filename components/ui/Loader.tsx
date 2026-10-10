import React from 'react';
import '@/styles/loader.css';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Animated 3D loader component matching EFSW design system
 *
 * @example
 * <Loader size="md" />
 *
 * @example
 * // In a loading state
 * {isLoading && <Loader size="lg" />}
 */
export default function Loader({ size = 'md', className = '' }: LoaderProps) {
  const sizeMap = {
    sm: 'loader--sm',
    md: 'loader--md',
    lg: 'loader--lg',
  };

  return (
    <div className={`loader-container ${className}`}>
      <div className={`loader ${sizeMap[size]}`} role="status" aria-label="Loading">
        <span className="loader__sr-only">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Fullscreen loader overlay
 */
export function LoaderOverlay({ message }: { message?: string }) {
  return (
    <div className="loader-overlay">
      <div className="loader-overlay__content">
        <Loader size="lg" />
        {message && <p className="loader-overlay__message">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Inline loader for buttons
 */
export function LoaderInline({ className = '' }: { className?: string }) {
  return (
    <span className={`loader-inline ${className}`} role="status" aria-label="Loading">
      <span className="loader-inline__spinner" />
    </span>
  );
}
