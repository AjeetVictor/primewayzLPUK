import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { getSuccessStoryPath } from '../successStories';
import { SDAAS_CAPACITY_ANCHOR, SDAAS_PROCESS_ANCHOR } from '../sdaas/commercialPage';

export type EntityTermKey =
  | 'softwareDevelopmentSubscription'
  | 'monthlyDeliveryCapacity'
  | 'sharedBacklog'
  | 'productDiscovery'
  | 'qa'
  | 'existingAppRescue'
  | 'crmAutomation'
  | 'businessAutomation'
  | 'technicalSeo'
  | 'saasDevelopment';

export type EntityTerm = {
  label: string;
  /** null = no public page yet; render as text only */
  href: string | null;
  clusterId: string;
};

/** Semantic entity graph for commercial pages and future cluster articles. */
export const ENTITY_TERMS: Record<EntityTermKey, EntityTerm> = {
  softwareDevelopmentSubscription: {
    label: 'Software Development as a Subscription',
    href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    clusterId: 'sdaas',
  },
  monthlyDeliveryCapacity: {
    label: 'monthly delivery capacity',
    href: `${CANONICAL_ROUTES.softwareDevelopmentSubscription}#${SDAAS_CAPACITY_ANCHOR}`,
    clusterId: 'sdaas',
  },
  sharedBacklog: {
    label: 'shared backlog',
    href: `${CANONICAL_ROUTES.softwareDevelopmentSubscription}#${SDAAS_CAPACITY_ANCHOR}`,
    clusterId: 'sdaas',
  },
  productDiscovery: {
    label: 'product discovery',
    href: '/blog/foundation-sprint-before-monthly-delivery',
    clusterId: 'sdaas',
  },
  qa: {
    label: 'QA',
    href: `${CANONICAL_ROUTES.softwareDevelopmentSubscription}#${SDAAS_PROCESS_ANCHOR}`,
    clusterId: 'sdaas',
  },
  existingAppRescue: {
    label: 'existing application rescue',
    href: getSuccessStoryPath('wholesale-order-management-platform'),
    clusterId: 'appRescue',
  },
  crmAutomation: {
    label: 'CRM automation',
    href: CANONICAL_ROUTES.crmAutomationSupport,
    clusterId: 'crmAutomation',
  },
  businessAutomation: {
    label: 'business automation',
    href: CANONICAL_ROUTES.crmAutomationSupport,
    clusterId: 'businessAutomation',
  },
  technicalSeo: {
    label: 'technical SEO',
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
    clusterId: 'technicalSeo',
  },
  saasDevelopment: {
    label: 'SaaS product development',
    href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    clusterId: 'saasDevelopment',
  },
};
