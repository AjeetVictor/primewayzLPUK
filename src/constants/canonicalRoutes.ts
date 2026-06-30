/** Final canonical public routes for Primewayz UK marketing site. */
export const CANONICAL_ROUTES = {
  websiteVisibilitySupport: '/website-visibility-support',
  crmAutomationSupport: '/crm-automation-support',
  softwareProductDelivery: '/software-product-delivery',
  remoteItResources: '/remote-it-resources',
  maintenance: '/maintenance',
  pricing: '/pricing',
  blog: '/blog',
  contact: '/contact-us',
  bookCall: '/contact-us#book-call',
  freeAudit: '/uk-sme-digital-visibility-checker',
  successStories: '/success-stories',
  services: '/services',
  about: '/about-us',
  howItWorks: '/#how-it-works',
} as const;

/** Legacy marketing URLs â†’ canonical paths (server 301/308 redirects). */
export const LEGACY_ROUTE_REDIRECTS = {
  '/contact': CANONICAL_ROUTES.contact,
  '/about': CANONICAL_ROUTES.about,
  '/crm-integration-support-uk': CANONICAL_ROUTES.crmAutomationSupport,
  '/software-development-subscription-uk': CANONICAL_ROUTES.softwareProductDelivery,
  '/remote-it-resource-augmentation': CANONICAL_ROUTES.remoteItResources,
  '/website-maintenance-subscription-uk': CANONICAL_ROUTES.maintenance,
  '/blog/why-uk-smes-need-monthly-digital-support': '/blog/monthly-digital-support-uk-smes',
  '/blog/why-start-with-foundation-sprint-before-monthly-delivery': '/blog/foundation-sprint-before-monthly-delivery',
} as const;

