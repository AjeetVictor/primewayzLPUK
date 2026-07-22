import { CANONICAL_ROUTES } from './canonicalRoutes';

export type AuditActionCategoryId =
  | 'technical-seo'
  | 'trust-signals'
  | 'lead-capture'
  | 'local-visibility'
  | 'external-presence'
  | 'reviews-reputation'
  | 'analytics-readiness'
  | 'mobile-readiness'
  | 'head-readiness';

export type AuditCategoryActionLink = {
  categoryId: AuditActionCategoryId;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

function auditActionContactHref(categorySlug: AuditActionCategoryId): string {
  return `/contact-us?utm_source=audit_report&utm_medium=action_card&utm_campaign=web_presence_audit_actions&utm_content=${categorySlug}#book-call`;
}

export const AUDIT_CATEGORY_ACTION_LINKS: Record<AuditActionCategoryId, AuditCategoryActionLink> = {
  'technical-seo': {
    categoryId: 'technical-seo',
    title: 'Improve technical SEO readiness',
    description: 'Review crawlability, metadata, canonical signals, sitemaps, and technical foundations.',
    ctaLabel: 'Fix SEO readiness',
    href: '/website-visibility-support',
  },
  'trust-signals': {
    categoryId: 'trust-signals',
    title: 'Strengthen trust signals',
    description: 'Make ownership, contact information, policies, and business credibility easier to verify.',
    ctaLabel: 'Strengthen trust signals',
    href: '/about-us',
  },
  'lead-capture': {
    categoryId: 'lead-capture',
    title: 'Improve enquiry flow',
    description: 'Clarify calls to action and reduce friction between a visit and a useful enquiry.',
    ctaLabel: 'Improve enquiry flow',
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
  },
  'local-visibility': {
    categoryId: 'local-visibility',
    title: 'Improve UK/local visibility',
    description: 'Make service areas, local contact details, and UK relevance clearer on public pages.',
    ctaLabel: 'Improve UK visibility',
    href: '/contact-us',
  },
  'external-presence': {
    categoryId: 'external-presence',
    title: 'Build a visible external presence plan',
    description: 'Connect relevant public profiles and listings so visitors can verify the business elsewhere.',
    ctaLabel: 'Build visibility plan',
    href: auditActionContactHref('external-presence'),
  },
  'reviews-reputation': {
    categoryId: 'reviews-reputation',
    title: 'Add proof, case studies, and review links',
    description: 'Present genuine evidence of delivery, customer outcomes, and relevant reputation sources.',
    ctaLabel: 'Review success stories',
    href: '/success-stories',
  },
  'analytics-readiness': {
    categoryId: 'analytics-readiness',
    title: 'Set up GA4/GTM and conversion tracking',
    description: 'Create a measured enquiry journey with governed analytics and conversion events.',
    ctaLabel: 'Request analytics setup',
    href: auditActionContactHref('analytics-readiness'),
  },
  'mobile-readiness': {
    categoryId: 'mobile-readiness',
    title: 'Request a mobile UX review',
    description: 'Review responsive behaviour, mobile navigation, content clarity, and enquiry paths.',
    ctaLabel: 'Request mobile UX review',
    href: auditActionContactHref('mobile-readiness'),
  },
  'head-readiness': {
    categoryId: 'head-readiness',
    title: 'Fix indexing and metadata signals',
    description: 'Correct visible head, indexing, social preview, and structured-data foundations.',
    ctaLabel: 'Fix metadata/indexing',
    href: '/website-visibility-support',
  },
};
