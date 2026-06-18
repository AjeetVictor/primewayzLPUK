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

export type WebPresenceAuditReport = {
  score: number;
  label: string;
  summary: string;
  checks: AuditCheck[];
  notVerified: string[];
  metadata: {
    auditedUrl: string;
    pagesCrawled: number;
    pagesAttempted: number;
    generatedAt: string;
    version: 'web-presence-audit-v1';
  };
};

export class AuditInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditInputError';
  }
}
