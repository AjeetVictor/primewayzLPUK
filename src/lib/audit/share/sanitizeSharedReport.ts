import type { SharedWebPresenceAuditReport, WebPresenceAuditReport } from '../types.ts';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeSharedReport(raw: unknown): SharedWebPresenceAuditReport {
  if (!isObject(raw)) {
    throw new Error('A valid audit report is required.');
  }

  const profile = isObject(raw.profile) ? raw.profile : {};
  const metadata = isObject(raw.metadata) ? raw.metadata : {};
  const checks = Array.isArray(raw.checks) ? raw.checks : [];
  const notVerified = Array.isArray(raw.notVerified)
    ? raw.notVerified.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    score: Math.max(0, Math.min(100, Number(raw.score) || 0)),
    label: typeof raw.label === 'string' ? raw.label.trim() : 'Web presence audit',
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    checks: checks as SharedWebPresenceAuditReport['checks'],
    notVerified,
    profile: {
      businessName: typeof profile.businessName === 'string' ? profile.businessName.trim() : 'Business',
      websiteUrl: typeof profile.websiteUrl === 'string' ? profile.websiteUrl.trim() : '',
      normalizedHost: typeof profile.normalizedHost === 'string' ? profile.normalizedHost.trim() : '',
      businessType: typeof profile.businessType === 'string' ? profile.businessType.trim() : '',
      targetCountry: typeof profile.targetCountry === 'string' ? profile.targetCountry.trim() : '',
      location: typeof profile.location === 'string' && profile.location.trim() ? profile.location.trim() : undefined,
      detectedPhone: typeof profile.detectedPhone === 'string' && profile.detectedPhone.trim()
        ? profile.detectedPhone.trim()
        : undefined,
      detectedEmail: typeof profile.detectedEmail === 'string' && profile.detectedEmail.trim()
        ? profile.detectedEmail.trim()
        : undefined,
      detectedAddressSnippet: typeof profile.detectedAddressSnippet === 'string' && profile.detectedAddressSnippet.trim()
        ? profile.detectedAddressSnippet.trim()
        : undefined,
      faviconUrl: typeof profile.faviconUrl === 'string' ? profile.faviconUrl : undefined,
      logoUrl: typeof profile.logoUrl === 'string' ? profile.logoUrl : undefined,
      openGraphImage: typeof profile.openGraphImage === 'string' ? profile.openGraphImage : undefined,
      hostingLocationStatus: 'not_verified',
    },
    metadata: {
      auditedUrl: typeof metadata.auditedUrl === 'string' ? metadata.auditedUrl : '',
      pagesCrawled: Number(metadata.pagesCrawled) || 0,
      pagesAttempted: Number(metadata.pagesAttempted) || 0,
      generatedAt: typeof metadata.generatedAt === 'string' ? metadata.generatedAt : new Date().toISOString(),
      version: 'web-presence-audit-v1',
    },
  };
}

export function toSharedReport(report: WebPresenceAuditReport): SharedWebPresenceAuditReport {
  return sanitizeSharedReport(report);
}
