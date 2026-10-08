/**
 * Responsive utilities for Academic Document page
 */

export const breakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Get grid column count based on screen width
 */
export function getGridColumns(width: number): number {
  if (width < breakpoints.mobile) return 1;
  if (width < breakpoints.tablet) return 2;
  return 3;
}

/**
 * Get marquee animation speed based on device type
 */
export function getMarqueeSpeed(isMobile: boolean): number {
  return isMobile ? 30 : 40; // seconds
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply smooth scroll behavior
 */
export function enableSmoothScroll() {
  if (typeof document === 'undefined') return;

  if (!prefersReducedMotion()) {
    document.documentElement.classList.add('academic-smooth-scroll');
  }
}

/**
 * Disable smooth scroll behavior
 */
export function disableSmoothScroll() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('academic-smooth-scroll');
}

/**
 * Get responsive padding based on screen size
 */
export function getResponsivePadding(width: number): string {
  if (width < breakpoints.mobile) return '1rem';
  if (width < breakpoints.tablet) return '1.5rem';
  return '2rem';
}

/**
 * Get responsive gap based on screen size
 */
export function getResponsiveGap(width: number): string {
  if (width < breakpoints.mobile) return '1rem';
  if (width < breakpoints.tablet) return '1.25rem';
  return '1.5rem';
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.mobile;
}

/**
 * Check if device is tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.mobile && window.innerWidth < breakpoints.tablet;
}

/**
 * Check if device is desktop
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.tablet;
}
