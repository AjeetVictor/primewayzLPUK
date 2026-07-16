/** Shared SDaaS illustration manifest — reusable on commercial page and future pillar articles. */
export const SDAAS_IMAGE_BASE = '/articles/sdaas';

export type SdaasImageAsset = {
  /** URL slug without extension, e.g. monthly-delivery-workflow */
  slug: string;
  /** Path without extension for OptimizedPicture */
  basePath: string;
  name: string;
  description: string;
  alt: string;
  width: number;
  height: number;
  /** Pillar article and cluster reuse */
  clusterReuse?: boolean;
};

export const SDAAS_COMMERCIAL_IMAGES = {
  heroWorkflow: {
    slug: 'monthly-delivery-workflow',
    basePath: `${SDAAS_IMAGE_BASE}/monthly-delivery-workflow`,
    name: 'Monthly software development workflow',
    description:
      'Workflow illustration showing backlog intake, prioritisation, development, quality assurance and release within monthly capacity.',
    alt: 'Monthly software development workflow showing backlog prioritisation, development, quality assurance and release.',
    width: 1693,
    height: 929,
    clusterReuse: true,
  },
  deliveryModelsComparison: {
    slug: 'delivery-models-comparison',
    basePath: `${SDAAS_IMAGE_BASE}/delivery-models-comparison`,
    name: 'Software delivery models comparison',
    description:
      'Side-by-side comparison of project-by-project delivery and ongoing monthly development subscription.',
    alt: 'Comparison between project-by-project software delivery and an ongoing monthly development subscription.',
    width: 1535,
    height: 1024,
    clusterReuse: true,
  },
  scatteredToStructured: {
    slug: 'scattered-to-structured',
    basePath: `${SDAAS_IMAGE_BASE}/scattered-to-structured`,
    name: 'From scattered requests to structured delivery',
    description:
      'Before-and-after illustration moving from ad-hoc requests to a shared backlog with prioritised monthly delivery.',
    alt: 'Transformation from scattered software requests to a structured monthly delivery system with backlog, QA and reporting.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
  deliveryProcess: {
    slug: 'delivery-process',
    basePath: `${SDAAS_IMAGE_BASE}/delivery-process`,
    name: 'Monthly software delivery process',
    description:
      'Step-by-step view of how requirements move from intake through development, QA and release.',
    alt: 'Step-by-step monthly software delivery process from requirement submission through release.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
  monthlyCapacity: {
    slug: 'monthly-capacity',
    basePath: `${SDAAS_IMAGE_BASE}/monthly-capacity`,
    name: 'Monthly development capacity allocation',
    description:
      'Illustrative example of how monthly software development capacity may be allocated across priorities.',
    alt: 'Illustrative allocation of monthly software development capacity across feature development, integrations, fixes and QA.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
  subscriptionVsFixedPrice: {
    slug: 'subscription-vs-fixed-price',
    basePath: `${SDAAS_IMAGE_BASE}/subscription-vs-fixed-price`,
    name: 'Subscription vs fixed-price vs hiring comparison',
    description:
      'Comparison matrix for subscription, fixed-price and direct hiring engagement models.',
    alt: 'Comparison matrix for software development subscription, fixed-price projects and direct hiring.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
  onboardingJourney: {
    slug: 'onboarding-journey',
    basePath: `${SDAAS_IMAGE_BASE}/onboarding-journey`,
    name: 'Software development subscription onboarding journey',
    description:
      'Onboarding steps from consultation through access setup to the first delivery cycle.',
    alt: 'Onboarding journey for a software development subscription from consultation to first delivery cycle.',
    width: 1536,
    height: 1024,
    clusterReuse: false,
  },
  consultationCta: {
    slug: 'consultation-cta',
    basePath: `${SDAAS_IMAGE_BASE}/consultation-cta`,
    name: 'Capacity recommendation consultation',
    description:
      'Consultation-focused visual encouraging businesses to request a practical capacity recommendation.',
    alt: 'Consultation visual for businesses reviewing monthly software development capacity options.',
    width: 1536,
    height: 1024,
    clusterReuse: false,
  },
  trustAndGovernance: {
    slug: 'trust-and-governance',
    basePath: `${SDAAS_IMAGE_BASE}/trust-and-governance`,
    name: 'Trust and governance framework',
    description:
      'Overview of governance practices covering ownership, access, communication, QA and handover.',
    alt: 'Trust and governance framework covering ownership, access control, communication, quality assurance and handover.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
  capabilitiesOverview: {
    slug: 'capabilities-overview',
    basePath: `${SDAAS_IMAGE_BASE}/capabilities-overview`,
    name: 'Capabilities overview and monthly development plan',
    description:
      'Overview of software delivery capabilities that can be prioritised within monthly development capacity.',
    alt: 'Overview of monthly software development capabilities including features, integrations, fixes, QA and planning.',
    width: 1536,
    height: 1024,
    clusterReuse: true,
  },
} as const satisfies Record<string, SdaasImageAsset>;

export const SDAAS_CLUSTER_REUSABLE_IMAGES = Object.values(SDAAS_COMMERCIAL_IMAGES).filter(
  (image) => image.clusterReuse,
);

export const SDAAS_RESPONSIVE_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px';

export function buildSdaasImageObjectSchema(siteUrl: string, canonical: string, image: SdaasImageAsset) {
  const contentUrl = `${siteUrl}${image.basePath}.webp`;

  return {
    '@type': 'ImageObject',
    '@id': `${contentUrl}#image`,
    name: image.name,
    description: image.description,
    contentUrl,
    url: contentUrl,
    width: image.width,
    height: image.height,
    creator: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#primewayz-uk`,
      name: 'Primewayz UK',
    },
    copyrightHolder: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#primewayz-uk`,
      name: 'Primewayz UK',
    },
    isPartOf: { '@id': `${canonical}#webpage` },
  };
}
