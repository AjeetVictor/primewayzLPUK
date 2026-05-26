export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-669V6LN0B7';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isGaEnabled(): boolean {
  return Boolean(
    GA_MEASUREMENT_ID &&
      typeof window !== 'undefined' &&
      typeof window.gtag === 'function'
  );
}

export function initGA(): void {
  // GA base script is loaded from index.html.
}

export function trackPageView(path: string): void {
  // Temporarily disabled while validating default GA4 page_view from index.html.
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', eventName, params || {});
}