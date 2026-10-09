export type AnalyticsConsent = 'accepted' | 'rejected' | null;

export const ANALYTICS_CONSENT_CHANGE_EVENT = 'primewayz:analytics-consent-change';
export const OPEN_ANALYTICS_SETTINGS_EVENT = 'primewayz:open-analytics-settings';
const STORAGE_KEY = 'primewayz_analytics_consent';

let inMemoryConsent: AnalyticsConsent = null;

declare global {
  interface Window {
    __PRIMEWAYZ_ANALYTICS_CONSENT__?: boolean;
  }
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'accepted' || value === 'rejected') {
      inMemoryConsent = value;
      window.__PRIMEWAYZ_ANALYTICS_CONSENT__ = value === 'accepted';
      return value;
    }
  } catch {
    return inMemoryConsent;
  }
  window.__PRIMEWAYZ_ANALYTICS_CONSENT__ = false;
  return inMemoryConsent;
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'accepted';
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
  inMemoryConsent = consent;
  if (typeof window === 'undefined') return;
  window.__PRIMEWAYZ_ANALYTICS_CONSENT__ = consent === 'accepted';
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // The in-memory choice still applies for this page when storage is unavailable.
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGE_EVENT));
}
