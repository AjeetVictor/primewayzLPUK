import type { AuditCategoryId } from '../types.ts';

export const CATEGORY_CONFIG: Record<AuditCategoryId, { name: string; maxPoints: number }> = {
  'website-basics': { name: 'Website Basics', maxPoints: 10 },
  'technical-seo': { name: 'Technical SEO', maxPoints: 15 },
  'trust-signals': { name: 'Trust Signals', maxPoints: 15 },
  'lead-capture': { name: 'Lead Capture', maxPoints: 15 },
  'local-visibility': { name: 'UK / Local Visibility', maxPoints: 15 },
  'external-presence': { name: 'External Presence Readiness', maxPoints: 10 },
  'reviews-reputation': { name: 'Reviews / Reputation Signals', maxPoints: 10 },
  'performance-ux': { name: 'Performance / UX Basics', maxPoints: 5 },
  'analytics-readiness': { name: 'Analytics / Tracking Readiness', maxPoints: 5 },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as AuditCategoryId[];
