import type { WebPresenceAuditReport } from './types';

const REPORT_CACHE_KEY = 'primewayz_web_presence_audit_report';
const FORM_CACHE_KEY = 'primewayz_web_presence_audit_form';
const RESTORE_FLAG_KEY = 'primewayz_web_presence_audit_restore';
const MAX_AGE_MS = 60 * 60 * 1000;

export type CachedAuditForm = {
  websiteUrl: string;
  businessName: string;
  businessType: string;
  targetCountry: string;
  location: string;
  phone: string;
  email: string;
};

type CachedAuditReport = {
  report: Partial<WebPresenceAuditReport>;
  savedAt: string;
  auditedUrl?: string;
};

type CachedAuditFormPayload = {
  form: CachedAuditForm;
  savedAt: string;
};

export type AuditPageEntryMode = 'fresh' | 'website-prefill' | 'restore-report' | 'default';

function isFresh(savedAt: string) {
  const timestamp = Date.parse(savedAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= MAX_AGE_MS;
}

export function markAuditReportForRestore(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RESTORE_FLAG_KEY, '1');
}

export function clearAuditRestoreFlag(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RESTORE_FLAG_KEY);
}

export function shouldRestoreAuditReportOnLoad(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(RESTORE_FLAG_KEY) !== '1') return false;
  return loadAuditReportSession() !== null;
}

/**
 * Resolves how the audit checker page should initialise.
 * Call once on page load before rendering cached report state.
 */
export function resolveAuditPageEntry(): AuditPageEntryMode {
  if (typeof window === 'undefined') return 'default';

  const params = new URLSearchParams(window.location.search);

  if (params.get('fresh') === '1') {
    clearAuditSession();
    return 'fresh';
  }

  if (params.get('website')) {
    clearAuditReportSession();
    clearAuditRestoreFlag();
    return 'website-prefill';
  }

  if (shouldRestoreAuditReportOnLoad()) {
    return 'restore-report';
  }

  return 'default';
}

export function saveAuditReportSession(
  report: Partial<WebPresenceAuditReport>,
  auditedUrl?: string,
): void {
  if (typeof window === 'undefined') return;

  const payload: CachedAuditReport = {
    report,
    savedAt: new Date().toISOString(),
    auditedUrl,
  };
  sessionStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(payload));
  markAuditReportForRestore();
}

export function loadAuditReportSession(): Partial<WebPresenceAuditReport> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(REPORT_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedAuditReport;
    if (!parsed?.report || !parsed.savedAt || !isFresh(parsed.savedAt)) {
      clearAuditReportSession();
      return null;
    }

    return parsed.report;
  } catch {
    clearAuditReportSession();
    return null;
  }
}

export function hasAuditReportSession(): boolean {
  return loadAuditReportSession() !== null;
}

export function clearAuditReportSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REPORT_CACHE_KEY);
}

export function saveAuditFormSession(form: CachedAuditForm): void {
  if (typeof window === 'undefined') return;

  const payload: CachedAuditFormPayload = {
    form,
    savedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(FORM_CACHE_KEY, JSON.stringify(payload));
}

export function loadAuditFormSession(): CachedAuditForm | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(FORM_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedAuditFormPayload;
    if (!parsed?.form || !parsed.savedAt || !isFresh(parsed.savedAt)) {
      clearAuditFormSession();
      return null;
    }

    return parsed.form;
  } catch {
    clearAuditFormSession();
    return null;
  }
}

export function clearAuditFormSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FORM_CACHE_KEY);
}

export function clearAuditSession(): void {
  clearAuditReportSession();
  clearAuditFormSession();
  clearAuditRestoreFlag();
}
