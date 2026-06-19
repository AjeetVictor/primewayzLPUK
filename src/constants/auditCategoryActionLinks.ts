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
  href: string;
};

export const AUDIT_CATEGORY_ACTION_LINKS: Record<AuditActionCategoryId, AuditCategoryActionLink> = {
  'technical-seo': {
    categoryId: 'technical-seo',
    title: 'Improve technical SEO readiness',
    description: 'Review crawlability, metadata, canonical signals, sitemaps, and technical foundations.',
    href: '/website-maintenance-subscription-uk',
  },
  'trust-signals': {
    categoryId: 'trust-signals',
    title: 'Strengthen trust signals',
    description: 'Make ownership, contact information, policies, and business credibility easier to verify.',
    href: '/about-us',
  },
  'lead-capture': {
    categoryId: 'lead-capture',
    title: 'Improve enquiry flow',
    description: 'Clarify calls to action and reduce friction between a visit and a useful enquiry.',
    href: '/success-stories/local-trades-lead-capture',
  },
  'local-visibility': {
    categoryId: 'local-visibility',
    title: 'Improve UK/local visibility',
    description: 'Make service areas, local contact details, and UK relevance clearer on public pages.',
    href: '/contact-us',
  },
  'external-presence': {
    categoryId: 'external-presence',
    title: 'Build visible external presence',
    description: 'Connect relevant public profiles and listings so visitors can verify the business elsewhere.',
    href: '/services',
  },
  'reviews-reputation': {
    categoryId: 'reviews-reputation',
    title: 'Add proof, case studies, and review links',
    description: 'Present genuine evidence of delivery, customer outcomes, and relevant reputation sources.',
    href: '/success-stories',
  },
  'analytics-readiness': {
    categoryId: 'analytics-readiness',
    title: 'Set up GA4/GTM and conversion tracking',
    description: 'Create a measured enquiry journey with governed analytics and conversion events.',
    href: '/services',
  },
  'mobile-readiness': {
    categoryId: 'mobile-readiness',
    title: 'Request a mobile UX review',
    description: 'Review responsive behaviour, mobile navigation, content clarity, and enquiry paths.',
    href: '/#contact',
  },
  'head-readiness': {
    categoryId: 'head-readiness',
    title: 'Fix indexing and metadata signals',
    description: 'Correct visible head, indexing, social preview, and structured-data foundations.',
    href: '/website-maintenance-subscription-uk',
  },
};

