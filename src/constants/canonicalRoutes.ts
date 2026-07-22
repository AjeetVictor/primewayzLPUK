/** Final canonical public routes for Primewayz UK marketing site. */
export const CANONICAL_ROUTES = {
  websiteVisibilitySupport: '/website-visibility-support',
  crmAutomationSupport: '/crm-automation-support',
  /** Canonical commercial SDaaS page (Intent A: buying development via subscription). */
  softwareDevelopmentSubscription: '/software-development-subscription-uk',
  /** @deprecated Prefer softwareDevelopmentSubscription — kept for typed redirects. */
  softwareProductDelivery: '/software-development-subscription-uk',
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
  sdaasCapacityRequest: '/software-development-subscription-uk/request-capacity',
} as const;

/** Educational pillar (Intent B + Intent A explanation). */
export const SDAAS_PILLAR_GUIDE_HREF = '/insights/subscription-based-software-development' as const;

/** Decision-stage comparison article (subscription vs fixed-price). */
export const SDAAS_COMPARISON_VS_FIXED_PRICE_HREF =
  '/insights/software-development-subscription-vs-fixed-price' as const;

/** MOF use-cases article for subscription-suitable workloads. */
export const SDAAS_USE_CASES_HREF =
  '/insights/software-development-subscription-use-cases' as const;

/** Supporting SDaaS cluster articles (semantic expansion). */
export const SDAAS_MONTHLY_CAPACITY_HREF =
  '/insights/how-monthly-software-development-capacity-works' as const;
export const SDAAS_PRIORITISATION_HREF =
  '/insights/how-to-prioritise-software-development-requests' as const;
export const SDAAS_APPLICATION_RESCUE_HREF =
  '/insights/application-rescue-and-stabilisation-before-ongoing-development' as const;
export const SDAAS_TECHNICAL_DEBT_HREF =
  '/insights/technical-debt-explained-for-business-owners' as const;
export const SDAAS_CONTINUOUS_DEVELOPMENT_HREF =
  '/insights/why-businesses-move-to-continuous-software-development' as const;
export const SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF =
  '/insights/software-maintenance-vs-continuous-product-development' as const;
export const SDAAS_CHOOSE_PARTNER_HREF =
  '/insights/how-to-choose-a-software-development-partner' as const;

/** Retired illustrative success-story URLs → relevant service pages (server 301 redirects). */
export const LEGACY_SUCCESS_STORY_REDIRECTS = {
  '/success-stories/local-trades-lead-capture': CANONICAL_ROUTES.websiteVisibilitySupport,
  '/success-stories/professional-services-crm-cleanup': CANONICAL_ROUTES.crmAutomationSupport,
  '/success-stories/ecommerce-store-stability-support': CANONICAL_ROUTES.maintenance,
} as const;

/** Legacy marketing URLs → canonical paths (server 301/308 redirects). */
export const LEGACY_ROUTE_REDIRECTS = {
  '/contact': CANONICAL_ROUTES.contact,
  '/about': CANONICAL_ROUTES.about,
  '/crm-integration-support-uk': CANONICAL_ROUTES.crmAutomationSupport,
  '/software-product-delivery': CANONICAL_ROUTES.softwareDevelopmentSubscription,
  '/remote-it-resource-augmentation': CANONICAL_ROUTES.remoteItResources,
  '/website-maintenance-subscription-uk': CANONICAL_ROUTES.maintenance,
  '/blog/why-uk-smes-need-monthly-digital-support': '/blog/monthly-digital-support-uk-smes',
  '/blog/why-start-with-foundation-sprint-before-monthly-delivery': '/blog/foundation-sprint-before-monthly-delivery',
  ...LEGACY_SUCCESS_STORY_REDIRECTS,
} as const;
