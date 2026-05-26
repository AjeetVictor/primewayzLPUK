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
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    service_region: 'UK',
    business_model: 'subscription_software_delivery',
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', eventName, {
    service_region: 'UK',
    business_model: 'subscription_software_delivery',
    page_path: window.location.pathname,
    page_title: document.title,
    ...params,
  });
}

export function trackCtaClick(
  ctaText: string,
  ctaLocation: string,
  extraParams?: Record<string, unknown>
): void {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    ...extraParams,
  });
}