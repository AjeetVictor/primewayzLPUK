import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { getSuccessStoryPath } from '../successStories';
import { SDAAS_FAQ_ANCHOR } from '../sdaas/commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from '../sdaas/images';
import { SDAAS_SUPPORTING_ARTICLES } from '../sdaas/supportingArticlesRegistry';

export type ContentClusterAssets = {
  hero?: string;
  servicePage: string | null;
  pillar?: string | null;
  supportingArticles?: string[];
  faq?: string;
  comparisonPages?: string[];
  guide?: string | null;
  linkedInAssets?: string[];
  reusableVisuals?: string[];
  /** Detailed live/planned article inventory for cluster governance. */
  articleRegistry?: readonly ClusterArticleEntry[];
};

export type ClusterArticleEntry = {
  route: string;
  title: string;
  contentType: 'pillar' | 'comparison' | 'decision' | 'use-cases' | 'explainer' | 'service';
  funnelStage: 'tof' | 'mof' | 'bof';
  primaryIntent: string;
  targetTopic: string;
  relatedCommercialPage: string | null;
  relatedPillarGuide: string | null;
  relatedComparisonGuide?: string | null;
  analyticsNamespace?: string;
  reusableVisuals?: readonly string[];
  status: 'live' | 'planned';
  datePublished?: string;
};

export type ContentClusterDefinition = {
  id: string;
  name: string;
  status: 'live' | 'planned';
  assets: ContentClusterAssets;
};

const SDAAS_COMPARISON_VISUALS = [
  SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice.basePath,
  SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
  SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
] as const;

const SDAAS_USE_CASES_VISUALS = [
  SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
  SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
  SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.basePath,
] as const;

const SDAAS_SUPPORTING_REGISTRY = SDAAS_SUPPORTING_ARTICLES.map(
  (article): ClusterArticleEntry => ({
    route: article.path,
    title: article.seo.h1,
    contentType: article.contentType,
    funnelStage: article.funnelStage,
    primaryIntent: article.primaryIntent,
    targetTopic: article.targetTopic,
    relatedCommercialPage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    relatedPillarGuide: SDAAS_PILLAR_GUIDE_HREF,
    relatedComparisonGuide: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
    analyticsNamespace: article.analyticsNamespace,
    reusableVisuals: article.reusableVisuals,
    status: 'live',
    datePublished: article.seo.datePublished,
  }),
);

/** Shared cluster registry — extend when launching CRM, App Rescue, etc. */
export const contentClusters = {
  sdaas: {
    id: 'sdaas',
    name: 'Software Development as a Subscription',
    status: 'live',
    assets: {
      hero: SDAAS_COMMERCIAL_IMAGES.heroWorkflow.basePath,
      servicePage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
      pillar: SDAAS_PILLAR_GUIDE_HREF,
      supportingArticles: [
        SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
        SDAAS_USE_CASES_HREF,
        SDAAS_MONTHLY_CAPACITY_HREF,
        SDAAS_PRIORITISATION_HREF,
        SDAAS_APPLICATION_RESCUE_HREF,
        SDAAS_TECHNICAL_DEBT_HREF,
        SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
        SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
        SDAAS_CHOOSE_PARTNER_HREF,
      ],
      faq: `${CANONICAL_ROUTES.softwareDevelopmentSubscription}#${SDAAS_FAQ_ANCHOR}`,
      comparisonPages: [SDAAS_COMPARISON_VS_FIXED_PRICE_HREF, SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF],
      guide: SDAAS_PILLAR_GUIDE_HREF,
      linkedInAssets: ['launch', 'saas-vs-sdaas', 'buyer-mistakes'],
      reusableVisuals: [
        SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
        SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
        SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice.basePath,
        SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.basePath,
        SDAAS_COMMERCIAL_IMAGES.trustAndGovernance.basePath,
        SDAAS_COMMERCIAL_IMAGES.capabilitiesOverview.basePath,
      ],
      articleRegistry: [
        {
          route: CANONICAL_ROUTES.softwareDevelopmentSubscription,
          title: 'Software Development as a Subscription for UK Businesses',
          contentType: 'service',
          funnelStage: 'bof',
          primaryIntent: 'commercial conversion',
          targetTopic: 'software development subscription UK',
          relatedCommercialPage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
          relatedPillarGuide: SDAAS_PILLAR_GUIDE_HREF,
          relatedComparisonGuide: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
          analyticsNamespace: 'sdaas',
          reusableVisuals: [
            SDAAS_COMMERCIAL_IMAGES.heroWorkflow.basePath,
            SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice.basePath,
          ],
          status: 'live',
          datePublished: '2026-07-16',
        },
        {
          route: SDAAS_PILLAR_GUIDE_HREF,
          title: 'Subscription-Based Software Development: Models & Examples',
          contentType: 'pillar',
          funnelStage: 'mof',
          primaryIntent: 'educational explanation',
          targetTopic: 'subscription-based software development',
          relatedCommercialPage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
          relatedPillarGuide: SDAAS_PILLAR_GUIDE_HREF,
          relatedComparisonGuide: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
          analyticsNamespace: 'sdaas_pillar',
          reusableVisuals: [
            SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.basePath,
            SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice.basePath,
          ],
          status: 'live',
          datePublished: '2026-07-16',
        },
        {
          route: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
          title: 'Software Development Subscription vs Fixed-Price Development',
          contentType: 'comparison',
          funnelStage: 'mof',
          primaryIntent: 'commercial comparison and decision support',
          targetTopic: 'software development subscription vs fixed-price development',
          relatedCommercialPage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
          relatedPillarGuide: SDAAS_PILLAR_GUIDE_HREF,
          relatedComparisonGuide: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
          analyticsNamespace: 'sdaas_comparison',
          reusableVisuals: SDAAS_COMPARISON_VISUALS,
          status: 'live',
          datePublished: '2026-07-16',
        },
        {
          route: SDAAS_USE_CASES_HREF,
          title: '10 Software Development Subscription Use Cases for Growing Businesses',
          contentType: 'use-cases',
          funnelStage: 'mof',
          primaryIntent: 'informational-commercial use-case evaluation',
          targetTopic: 'software development subscription use cases',
          relatedCommercialPage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
          relatedPillarGuide: SDAAS_PILLAR_GUIDE_HREF,
          relatedComparisonGuide: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
          analyticsNamespace: 'sdaas_use_cases',
          reusableVisuals: SDAAS_USE_CASES_VISUALS,
          status: 'live',
          datePublished: '2026-07-16',
        },
        ...SDAAS_SUPPORTING_REGISTRY,
      ] as const satisfies readonly ClusterArticleEntry[],
    },
  },
  crmAutomation: {
    id: 'crmAutomation',
    name: 'CRM & Automation Support',
    status: 'live',
    assets: {
      servicePage: CANONICAL_ROUTES.crmAutomationSupport,
      pillar: null,
      supportingArticles: ['/blog/crm-integration-for-uk-smes'],
      guide: null,
    },
  },
  appRescue: {
    id: 'appRescue',
    name: 'Existing App Rescue',
    status: 'planned',
    assets: {
      servicePage: null,
      pillar: null,
      supportingArticles: [
        getSuccessStoryPath('wholesale-order-management-platform'),
        SDAAS_APPLICATION_RESCUE_HREF,
      ],
      guide: null,
    },
  },
  saasDevelopment: {
    id: 'saasDevelopment',
    name: 'SaaS Development',
    status: 'planned',
    assets: {
      servicePage: CANONICAL_ROUTES.softwareDevelopmentSubscription,
      pillar: null,
      guide: null,
    },
  },
  technicalSeo: {
    id: 'technicalSeo',
    name: 'Technical SEO',
    status: 'live',
    assets: {
      servicePage: CANONICAL_ROUTES.websiteVisibilitySupport,
      supportingArticles: ['/blog/technical-seo-basics-uk-small-business'],
      guide: null,
    },
  },
  businessAutomation: {
    id: 'businessAutomation',
    name: 'Business Automation',
    status: 'live',
    assets: {
      servicePage: CANONICAL_ROUTES.crmAutomationSupport,
      guide: null,
    },
  },
  digiBlend: {
    id: 'digiBlend',
    name: 'DigiBlend',
    status: 'planned',
    assets: {
      servicePage: null,
      guide: null,
    },
  },
} as const satisfies Record<string, ContentClusterDefinition>;

export type ContentClusterId = keyof typeof contentClusters;
