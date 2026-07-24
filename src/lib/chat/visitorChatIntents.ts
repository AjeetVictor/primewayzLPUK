/**
 * Typed visitor intent registry for Phase 2F-1 chat guidance.
 * No free-text classification — intents are explicit visitor choices only.
 */

import {
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  DISCOVERY_CALL_CTA_LABEL,
  buildFreeReviewCtaUrl,
  type FreeReviewServiceArea,
} from '../../constants/conversionCta.ts';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes.ts';

export const VISITOR_CHAT_INTENT_KEYS = [
  'website_visibility',
  'crm_workflow',
  'software_product',
  'managed_support',
  'remote_capacity',
  'unsure',
] as const;

export type VisitorChatIntentKey = (typeof VISITOR_CHAT_INTENT_KEYS)[number];

export type VisitorChatClarificationOption = {
  key: string;
  label: string;
};

export type VisitorChatIntentDefinition = {
  key: VisitorChatIntentKey;
  label: string;
  clarificationPrompt: string;
  clarifications: readonly VisitorChatClarificationOption[];
  serviceArea: FreeReviewServiceArea;
  serviceRoute: string;
  serviceLinkLabel: string;
  recommendationTitle: string;
  recommendationExplanation: string;
  reviewHref: string;
  bookingHref: string;
};

const INTENT_SERVICE_AREA: Record<VisitorChatIntentKey, FreeReviewServiceArea> = {
  website_visibility: 'Website Visibility & Conversion',
  crm_workflow: 'CRM & Workflow Automation',
  software_product: 'Software & Product Engineering',
  managed_support: 'Managed Application & Website Support',
  remote_capacity: 'Remote IT Team Extension',
  unsure: 'Not sure yet',
};

const INTENT_SERVICE_ROUTE: Record<VisitorChatIntentKey, string> = {
  website_visibility: CANONICAL_ROUTES.websiteVisibilitySupport,
  crm_workflow: CANONICAL_ROUTES.crmAutomationSupport,
  software_product: CANONICAL_ROUTES.softwareDevelopmentSubscription,
  managed_support: CANONICAL_ROUTES.maintenance,
  remote_capacity: CANONICAL_ROUTES.remoteItResources,
  unsure: CANONICAL_ROUTES.services,
};

const INTENT_SERVICE_LINK_LABEL: Record<VisitorChatIntentKey, string> = {
  website_visibility: 'Explore website visibility support',
  crm_workflow: 'Explore CRM and workflow support',
  software_product: 'Explore software development support',
  managed_support: 'Explore managed application support',
  remote_capacity: 'Explore remote IT capacity',
  unsure: 'Explore our services',
};

const INTENT_RECOMMENDATION: Record<
  VisitorChatIntentKey,
  { title: string; explanation: string }
> = {
  website_visibility: {
    title: 'Start with a digital systems review',
    explanation:
      'We can assess how your site attracts and converts enquiries before recommending the next step.',
  },
  crm_workflow: {
    title: 'Clarify the CRM or workflow gap',
    explanation:
      'A short review helps identify whether the priority is CRM improvement, system connections, or automation.',
  },
  software_product: {
    title: 'Review delivery priorities',
    explanation:
      'Share what you need to improve or build so we can recommend a practical delivery path.',
  },
  managed_support: {
    title: 'Stabilise the application first',
    explanation:
      'A review helps confirm whether maintenance, fixes, or ongoing support is the right next step.',
  },
  remote_capacity: {
    title: 'Match capacity to delivery needs',
    explanation:
      'Tell us where delivery is constrained so we can outline a suitable remote technical capacity option.',
  },
  unsure: {
    title: 'Begin with a free systems review',
    explanation:
      'If the priority is unclear, a Digital Systems Review is a calm way to identify the best starting point.',
  },
};

const INTENT_CLARIFICATIONS: Record<
  VisitorChatIntentKey,
  { prompt: string; options: readonly VisitorChatClarificationOption[] }
> = {
  website_visibility: {
    prompt: 'Which situation is closest?',
    options: [
      { key: 'low_enquiries', label: 'Enquiries or visibility feel too low' },
      { key: 'unclear_journey', label: 'The website journey is unclear' },
      { key: 'seo_content', label: 'SEO or content needs improvement' },
      { key: 'still_assessing', label: 'I am still assessing the problem' },
    ],
  },
  crm_workflow: {
    prompt: 'Which situation is closest?',
    options: [
      { key: 'crm_improvement', label: 'An existing CRM needs improvement' },
      { key: 'systems_disconnected', label: 'Systems are not connected' },
      { key: 'manual_process', label: 'A manual process needs automation' },
      { key: 'still_assessing', label: 'I am still assessing the problem' },
    ],
  },
  software_product: {
    prompt: 'Which situation is closest?',
    options: [
      { key: 'improve_app', label: 'Improving an existing application' },
      { key: 'new_functionality', label: 'Planning new functionality' },
      { key: 'delivery_capacity', label: 'Reviewing delivery capacity' },
      { key: 'still_assessing', label: 'I am still assessing the problem' },
    ],
  },
  managed_support: {
    prompt: 'Which situation is closest?',
    options: [
      { key: 'bugs_stability', label: 'Bugs or stability issues' },
      { key: 'ongoing_maintenance', label: 'Need ongoing maintenance' },
      { key: 'handover_support', label: 'Need reliable handover support' },
      { key: 'still_assessing', label: 'I am still assessing the problem' },
    ],
  },
  remote_capacity: {
    prompt: 'Which situation is closest?',
    options: [
      { key: 'extra_developers', label: 'Need extra development capacity' },
      { key: 'specialist_skills', label: 'Need specialist technical skills' },
      { key: 'delivery_cover', label: 'Need cover for delivery deadlines' },
      { key: 'still_assessing', label: 'I am still assessing the problem' },
    ],
  },
  unsure: {
    prompt: 'Which feels most useful right now?',
    options: [
      { key: 'visibility', label: 'Getting more enquiries or visibility' },
      { key: 'systems', label: 'Connecting systems or workflows' },
      { key: 'software', label: 'Improving or building software' },
      { key: 'guidance', label: 'I need help choosing a starting point' },
    ],
  },
};

const INTENT_LABELS: Record<VisitorChatIntentKey, string> = {
  website_visibility: 'Get more visibility or enquiries',
  crm_workflow: 'Connect CRM and business workflows',
  software_product: 'Improve or build software',
  managed_support: 'Get support for an existing application',
  remote_capacity: 'Add technical delivery capacity',
  unsure: 'I am not sure where to begin',
};

function buildIntent(key: VisitorChatIntentKey): VisitorChatIntentDefinition {
  const clarification = INTENT_CLARIFICATIONS[key];
  const recommendation = INTENT_RECOMMENDATION[key];
  const serviceArea = INTENT_SERVICE_AREA[key];

  return {
    key,
    label: INTENT_LABELS[key],
    clarificationPrompt: clarification.prompt,
    clarifications: clarification.options,
    serviceArea,
    serviceRoute: INTENT_SERVICE_ROUTE[key],
    serviceLinkLabel: INTENT_SERVICE_LINK_LABEL[key],
    recommendationTitle: recommendation.title,
    recommendationExplanation: recommendation.explanation,
    reviewHref: buildFreeReviewCtaUrl('chat_widget', serviceArea),
    bookingHref: DISCOVERY_CALL_DESTINATION,
  };
}

export const VISITOR_CHAT_INTENTS: readonly VisitorChatIntentDefinition[] =
  VISITOR_CHAT_INTENT_KEYS.map(buildIntent);

export const VISITOR_CHAT_INTENT_BY_KEY: Record<
  VisitorChatIntentKey,
  VisitorChatIntentDefinition
> = Object.fromEntries(
  VISITOR_CHAT_INTENTS.map((intent) => [intent.key, intent]),
) as Record<VisitorChatIntentKey, VisitorChatIntentDefinition>;

export const VISITOR_CHAT_ENTRY_HEADING = 'What are you trying to improve?' as const;

export const VISITOR_CHAT_REVIEW_ACTION_LABEL = FREE_REVIEW_CTA_LABEL;
export const VISITOR_CHAT_BOOKING_ACTION_LABEL = DISCOVERY_CALL_CTA_LABEL;

/** Allowlisted internal service routes used by chat recommendations. */
export const VISITOR_CHAT_ALLOWLISTED_SERVICE_ROUTES = [
  CANONICAL_ROUTES.websiteVisibilitySupport,
  CANONICAL_ROUTES.crmAutomationSupport,
  CANONICAL_ROUTES.softwareDevelopmentSubscription,
  CANONICAL_ROUTES.maintenance,
  CANONICAL_ROUTES.remoteItResources,
  CANONICAL_ROUTES.services,
] as const;

export function getVisitorChatIntent(
  key: string | null | undefined,
): VisitorChatIntentDefinition | null {
  if (!key) return null;
  if (!VISITOR_CHAT_INTENT_KEYS.includes(key as VisitorChatIntentKey)) return null;
  return VISITOR_CHAT_INTENT_BY_KEY[key as VisitorChatIntentKey];
}

export function isAllowlistedServiceRoute(route: string): boolean {
  return (VISITOR_CHAT_ALLOWLISTED_SERVICE_ROUTES as readonly string[]).includes(route);
}

export function mapIntentKeyToServiceArea(
  key: string | null | undefined,
): FreeReviewServiceArea | null {
  const intent = getVisitorChatIntent(key);
  return intent?.serviceArea ?? null;
}

export type VisitorChatRecommendationActions = {
  reviewHref: string;
  reviewLabel: string;
  serviceHref: string;
  serviceLabel: string;
  bookingHref: string;
  bookingLabel: string;
};

export function buildVisitorChatRecommendationActions(
  intent: VisitorChatIntentDefinition,
): VisitorChatRecommendationActions {
  return {
    reviewHref: intent.reviewHref,
    reviewLabel: VISITOR_CHAT_REVIEW_ACTION_LABEL,
    serviceHref: intent.serviceRoute,
    serviceLabel: intent.serviceLinkLabel,
    bookingHref: intent.bookingHref,
    bookingLabel: VISITOR_CHAT_BOOKING_ACTION_LABEL,
  };
}

/** Exactly three primary next-step actions — never more. */
export function listRecommendationActionTypes(): readonly [
  'review',
  'service',
  'booking',
] {
  return ['review', 'service', 'booking'];
}
