import { getFirstUtmParams, getLatestUtmParams } from './utm';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

export function getDataLayerUtmPayload(): Record<string, string | null> {
  const first = getFirstUtmParams();
  const latest = getLatestUtmParams();

  return {
    utm_source: first.utm_source,
    utm_medium: first.utm_medium,
    utm_campaign: first.utm_campaign,
    utm_content: first.utm_content,
    utm_term: first.utm_term,
    first_utm_source: first.utm_source,
    first_utm_medium: first.utm_medium,
    first_utm_campaign: first.utm_campaign,
    first_utm_content: first.utm_content,
    first_utm_term: first.utm_term,
    latest_utm_source: latest.utm_source,
    latest_utm_medium: latest.utm_medium,
    latest_utm_campaign: latest.utm_campaign,
    latest_utm_content: latest.utm_content,
    latest_utm_term: latest.utm_term,
  };
}
