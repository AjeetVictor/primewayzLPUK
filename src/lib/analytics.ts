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

  const scriptSelector =
    'script[src*="googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID + '"]';

  if (document.querySelector(scriptSelector)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });
}

export function trackPageView(path: string): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', eventName, params || {});
}