export type AuditSignalStatus = 'found' | 'partial' | 'missing' | 'not_verified';
export type AuditCheckStatus = 'good' | 'partial' | 'gap' | 'not_verified';
export type AuditEvidenceSource = 'website' | 'external_provider' | 'not_verified';

export type AuditCategoryId =
  | 'website-basics'
  | 'technical-seo'
  | 'trust-signals'
  | 'lead-capture'
  | 'local-visibility'
  | 'external-presence'
  | 'reviews-reputation'
  | 'performance-ux'
  | 'analytics-readiness';

export type AuditEvidence = {
  source: AuditEvidenceSource;
  url?: string;
  label: string;
  value?: string;
  snippet?: string;
};

export type AuditSignal = {
  key: string;
  category: AuditCategoryId;
  status: AuditSignalStatus;
  confidence: number;
  points: number;
  maxPoints: number;
  evidence: AuditEvidence[];
  recommendations: string[];
};

export type AuditCheck = {
  id: AuditCategoryId;
  name: string;
  status: AuditCheckStatus;
  points: number;
  maxPoints: number;
  explanation: string;
  evidence: AuditEvidence[];
  recommendations: string[];
};

export type WebPresenceAuditInput = {
  websiteUrl: string;
  businessName: string;
  businessType: string;
  targetCountry: string;
  location?: string;
  phone?: string;
  email?: string;
};

export type FetchedPage = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  html: string;
  contentType: string;
  bytesRead: number;
  error?: string;
};

export type AuditCrawlResult = {
  auditedUrl: string;
  normalizedHost: string;
  resolvedIp?: string;
  pages: FetchedPage[];
  pagesAttempted: number;
  robotsAccessible: boolean;
  sitemapAccessible: boolean;
};

export type AuditContext = {
  input: WebPresenceAuditInput;
  crawl: AuditCrawlResult;
  combinedHtml: string;
  combinedText: string;
  homepage?: FetchedPage;
};

export type WebPresenceAuditProfile = {
  businessName: string;
  websiteUrl: string;
  normalizedHost: string;
  businessType: string;
  targetCountry: string;
  location?: string;
  providedPhone?: string;
  providedEmail?: string;
  detectedPhone?: string;
  detectedEmail?: string;
  detectedAddressSnippet?: string;
  faviconUrl?: string;
  logoUrl?: string;
  openGraphImage?: string;
  resolvedIp?: string;
  hostingLocationStatus: 'not_verified';
};

export type WebPresenceAuditMetadata = {
  auditedUrl: string;
  pagesCrawled: number;
  pagesAttempted: number;
  generatedAt: string;
  version: 'web-presence-audit-v1';
};

export type WebPresenceAuditBenchmark = {
  label: string;
  helper: string;
  disclaimer: string;
  frameworkName: 'Primewayz UK Public-Signal Readiness Framework';
  sector: string;
  sectorInsight: string;
  strengths: string[];
  improvementAreas: string[];
  shareSummary: string;
};

export type WebPresenceAuditClassification = {
  detectedType: string;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  detectedSignals: string[];
  recommendationFocus: string[];
};

export type WebPresenceAuditMobileReadiness = {
  label: string;
  status: 'strong' | 'workable' | 'needs_review' | 'not_verified';
  signals: string[];
  concerns: string[];
  recommendations: string[];
  disclaimer: string;
};

export type WebPresenceAuditHeadReadiness = {
  title: 'found' | 'missing';
  metaDescription: 'found' | 'missing';
  canonical: 'found' | 'missing';
  robotsMeta: 'indexable' | 'noindex_detected' | 'not_detected';
  openGraph: 'found' | 'partial' | 'missing';
  twitterCard: 'found' | 'missing';
  structuredData: 'found' | 'missing';
  robotsTxt: 'accessible' | 'not_detected';
  sitemapXml: 'accessible' | 'not_detected';
  googleSiteVerificationMeta: 'detected' | 'not_detected';
  bingSiteVerificationMeta: 'detected' | 'not_detected';
  notes: string[];
  recommendations: string[];
};

export type WebPresenceAuditReport = {
  score: number;
  label: string;
  summary: string;
  checks: AuditCheck[];
  notVerified: string[];
  profile: WebPresenceAuditProfile;
  metadata: WebPresenceAuditMetadata;
  benchmark?: WebPresenceAuditBenchmark;
  classification?: WebPresenceAuditClassification;
  mobileReadiness?: WebPresenceAuditMobileReadiness;
  headReadiness?: WebPresenceAuditHeadReadiness;
};

export type SharedWebPresenceAuditProfile = Omit<
  WebPresenceAuditProfile,
  'providedPhone' | 'providedEmail' | 'resolvedIp'
>;

export type SharedWebPresenceAuditReport = Omit<WebPresenceAuditReport, 'profile'> & {
  profile: SharedWebPresenceAuditProfile;
};

export class AuditInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditInputError';
  }
}
