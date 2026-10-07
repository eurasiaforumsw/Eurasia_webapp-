/**
 * Performance monitoring utilities
 */

declare global {
  interface Window {
    gtag?: (event: string, action: string, params?: Record<string, any>) => void;
  }
}

export function measurePageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (perfData) {
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        domComplete: perfData.domComplete - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      };

      console.log('⚡ Performance Metrics:', metrics);

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'page_performance', metrics);
      }
    }
  });
}

export function measureComponentRender(componentName: string) {
  if (typeof window === 'undefined') return () => {};

  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (duration > 100) {
      console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  };
}

export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

export function preconnect(url: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}
