export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isGaEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID && typeof window !== 'undefined');
}

export function initGA(): void {
  if (!isGaEnabled()) return;

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());

  window.gtag('config', GA_MEASUREMENT_ID);

  const scriptSelector =
    'script[src*="googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID + '"]';

  if (document.querySelector(scriptSelector)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src =
    'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;

  document.head.appendChild(script);
}

export function trackPageView(path: string): void {
  // Temporarily disabled while validating default GA4 page_view
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', eventName, params || {});
}