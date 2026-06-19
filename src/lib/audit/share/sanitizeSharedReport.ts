import type {
  SharedWebPresenceAuditReport,
  WebPresenceAuditBenchmark,
  WebPresenceAuditClassification,
  WebPresenceAuditHeadReadiness,
  WebPresenceAuditMobileReadiness,
  WebPresenceAuditReport,
} from '../types.ts';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeBenchmark(raw: unknown): WebPresenceAuditBenchmark | undefined {
  if (!isObject(raw)) return undefined;

  const strengths = Array.isArray(raw.strengths)
    ? raw.strengths.filter((item): item is string => typeof item === 'string')
    : [];
  const improvementAreas = Array.isArray(raw.improvementAreas)
    ? raw.improvementAreas.filter((item): item is string => typeof item === 'string')
    : [];

  if (
    typeof raw.label !== 'string'
    || typeof raw.helper !== 'string'
    || typeof raw.disclaimer !== 'string'
    || typeof raw.sector !== 'string'
    || typeof raw.sectorInsight !== 'string'
    || typeof raw.shareSummary !== 'string'
  ) {
    return undefined;
  }

  return {
    label: raw.label.trim(),
    helper: raw.helper.trim(),
    disclaimer: raw.disclaimer.trim(),
    frameworkName: 'Primewayz UK Public-Signal Readiness Framework',
    sector: raw.sector.trim(),
    sectorInsight: raw.sectorInsight.trim(),
    strengths,
    improvementAreas,
    shareSummary: raw.shareSummary.trim(),
  };
}

function sanitizeStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
}

function sanitizeClassification(raw: unknown): WebPresenceAuditClassification | undefined {
  if (!isObject(raw)) return undefined;
  const confidence = raw.confidence;
  if (
    typeof raw.detectedType !== 'string'
    || typeof raw.reason !== 'string'
    || (confidence !== 'low' && confidence !== 'medium' && confidence !== 'high')
  ) {
    return undefined;
  }

  return {
    detectedType: raw.detectedType.trim(),
    confidence,
    reason: raw.reason.trim(),
    detectedSignals: sanitizeStringArray(raw.detectedSignals),
    recommendationFocus: sanitizeStringArray(raw.recommendationFocus),
  };
}

function sanitizeMobileReadiness(raw: unknown): WebPresenceAuditMobileReadiness | undefined {
  if (!isObject(raw)) return undefined;
  const status = raw.status;
  if (
    typeof raw.label !== 'string'
    || typeof raw.disclaimer !== 'string'
    || (status !== 'strong' && status !== 'workable' && status !== 'needs_review' && status !== 'not_verified')
  ) {
    return undefined;
  }

  return {
    label: raw.label.trim(),
    status,
    signals: sanitizeStringArray(raw.signals),
    concerns: sanitizeStringArray(raw.concerns),
    recommendations: sanitizeStringArray(raw.recommendations),
    disclaimer: raw.disclaimer.trim(),
  };
}

function sanitizeHeadReadiness(raw: unknown): WebPresenceAuditHeadReadiness | undefined {
  if (!isObject(raw)) return undefined;

  const title = raw.title === 'found' || raw.title === 'missing' ? raw.title : undefined;
  const metaDescription = raw.metaDescription === 'found' || raw.metaDescription === 'missing' ? raw.metaDescription : undefined;
  const canonical = raw.canonical === 'found' || raw.canonical === 'missing' ? raw.canonical : undefined;
  const robotsMeta = raw.robotsMeta === 'indexable' || raw.robotsMeta === 'noindex_detected' || raw.robotsMeta === 'not_detected'
    ? raw.robotsMeta
    : undefined;
  const openGraph = raw.openGraph === 'found' || raw.openGraph === 'partial' || raw.openGraph === 'missing'
    ? raw.openGraph
    : undefined;
  const twitterCard = raw.twitterCard === 'found' || raw.twitterCard === 'missing' ? raw.twitterCard : undefined;
  const structuredData = raw.structuredData === 'found' || raw.structuredData === 'missing' ? raw.structuredData : undefined;
  const robotsTxt = raw.robotsTxt === 'accessible' || raw.robotsTxt === 'not_detected' ? raw.robotsTxt : undefined;
  const sitemapXml = raw.sitemapXml === 'accessible' || raw.sitemapXml === 'not_detected' ? raw.sitemapXml : undefined;
  const googleSiteVerificationMeta = raw.googleSiteVerificationMeta === 'detected' || raw.googleSiteVerificationMeta === 'not_detected'
    ? raw.googleSiteVerificationMeta
    : undefined;
  const bingSiteVerificationMeta = raw.bingSiteVerificationMeta === 'detected' || raw.bingSiteVerificationMeta === 'not_detected'
    ? raw.bingSiteVerificationMeta
    : undefined;

  if (
    !title || !metaDescription || !canonical || !robotsMeta || !openGraph || !twitterCard
    || !structuredData || !robotsTxt || !sitemapXml || !googleSiteVerificationMeta || !bingSiteVerificationMeta
  ) {
    return undefined;
  }

  return {
    title,
    metaDescription,
    canonical,
    robotsMeta,
    openGraph,
    twitterCard,
    structuredData,
    robotsTxt,
    sitemapXml,
    googleSiteVerificationMeta,
    bingSiteVerificationMeta,
    notes: sanitizeStringArray(raw.notes),
    recommendations: sanitizeStringArray(raw.recommendations),
  };
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
  const benchmark = sanitizeBenchmark(raw.benchmark);
  const classification = sanitizeClassification(raw.classification);
  const mobileReadiness = sanitizeMobileReadiness(raw.mobileReadiness);
  const headReadiness = sanitizeHeadReadiness(raw.headReadiness);

  const report: SharedWebPresenceAuditReport = {
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

  if (benchmark) {
    report.benchmark = benchmark;
  }
  if (classification) {
    report.classification = classification;
  }
  if (mobileReadiness) {
    report.mobileReadiness = mobileReadiness;
  }
  if (headReadiness) {
    report.headReadiness = headReadiness;
  }

  return report;
}

export function toSharedReport(report: WebPresenceAuditReport): SharedWebPresenceAuditReport {
  return sanitizeSharedReport(report);
}
