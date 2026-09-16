import type { AuditCategoryId } from '../types.ts';

export const CATEGORY_CONFIG: Record<AuditCategoryId, { name: string; maxPoints: number }> = {
  'website-basics': { name: 'Website Foundations', maxPoints: 5 },
  'technical-seo': { name: 'Technical, On-page & Content SEO', maxPoints: 20 },
  'trust-signals': { name: 'Business Identity & Trust', maxPoints: 15 },
  'lead-capture': { name: 'UX & Conversion', maxPoints: 15 },
  'local-visibility': { name: 'Local & Regional Signals', maxPoints: 15 },
  'external-presence': { name: 'Competitor & Local Search Verification', maxPoints: 0 },
  'reviews-reputation': { name: 'Trust & Proof', maxPoints: 10 },
  'performance-ux': { name: 'Performance & Mobile Readiness', maxPoints: 10 },
  'analytics-readiness': { name: 'Measurement & Tracking', maxPoints: 10 },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as AuditCategoryId[];
