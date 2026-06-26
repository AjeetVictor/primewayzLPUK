import { getFirstUtmParams, getLatestUtmParams } from './utm';
import { trackConversionEvent } from './analytics';

export const CALENDLY_BASE_URL = 'https://calendly.com/primewayz-info/30-minute-meeting-uk';
export const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js';

export function buildCalendlyUrl(): string {
  const latest = getLatestUtmParams();
  const first = getFirstUtmParams();
  const url = new URL(CALENDLY_BASE_URL);

  const source = latest.utm_source || first.utm_source;
  const medium = latest.utm_medium || first.utm_medium;
  const campaign = latest.utm_campaign || first.utm_campaign;
  const content = latest.utm_content || first.utm_content;
  const term = latest.utm_term || first.utm_term;

  if (source) url.searchParams.set('utm_source', source);
  if (medium) url.searchParams.set('utm_medium', medium);
  if (campaign) url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  if (term) url.searchParams.set('utm_term', term);

  return url.toString();
}

export function getCalendlyUtmPayload(): Record<string, string> {
  const latest = getLatestUtmParams();
  const first = getFirstUtmParams();

  const payload: Record<string, string> = {};
  const source = latest.utm_source || first.utm_source;
  const medium = latest.utm_medium || first.utm_medium;
  const campaign = latest.utm_campaign || first.utm_campaign;
  const content = latest.utm_content || first.utm_content;
  const term = latest.utm_term || first.utm_term;

  if (source) payload.utmSource = source;
  if (medium) payload.utmMedium = medium;
  if (campaign) payload.utmCampaign = campaign;
  if (content) payload.utmContent = content;
  if (term) payload.utmTerm = term;

  return payload;
}

export function loadCalendlyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      if (window.Calendly?.initInlineWidget) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Calendly script failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Calendly script failed'));
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget?: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, unknown>;
        utm?: Record<string, unknown>;
      }) => void;
    };
  }
}

export function initCalendlyInlineWidget(parentElement: HTMLElement, ctaLocation: string): void {
  if (!window.Calendly?.initInlineWidget) return;

  parentElement.innerHTML = '';

  const utm = getCalendlyUtmPayload();
  window.Calendly.initInlineWidget({
    url: buildCalendlyUrl(),
    parentElement,
    utm: Object.keys(utm).length > 0 ? utm : undefined,
  });

  trackConversionEvent('calendly_widget_view', {
    calendly_url: CALENDLY_BASE_URL,
    cta_location: ctaLocation,
    source_page: window.location.pathname,
  });
}

const CALENDLY_MESSAGE_EVENTS = new Set([
  'calendly.event_scheduled',
  'calendly.date_and_time_selected',
  'calendly.profile_page_viewed',
]);

export function subscribeCalendlyPostMessages(ctaLocation: string): () => void {
  const handleCalendlyEvent = (event: MessageEvent) => {
    if (event.origin !== 'https://calendly.com') return;

    const calendlyEventName = event.data?.event;
    if (!calendlyEventName || !CALENDLY_MESSAGE_EVENTS.has(calendlyEventName)) return;

    const basePayload = {
      calendly_url: CALENDLY_BASE_URL,
      lead_type: 'discovery_call',
      cta_location: ctaLocation,
      source_page: window.location.pathname,
    };

    if (calendlyEventName === 'calendly.date_and_time_selected') {
      trackConversionEvent('calendly_date_selected', basePayload);
      return;
    }

    if (calendlyEventName === 'calendly.event_scheduled') {
      trackConversionEvent('calendly_event_scheduled', basePayload);
    }
  };

  window.addEventListener('message', handleCalendlyEvent);
  return () => window.removeEventListener('message', handleCalendlyEvent);
}
