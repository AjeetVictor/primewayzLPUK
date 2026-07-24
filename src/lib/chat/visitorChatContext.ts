/**
 * Page-aware visitor chat entry context.
 * Uses explicit pathname matching only — no behavioural surveillance signals.
 */

import type { VisitorChatIntentKey } from './visitorChatIntents.ts';

export type VisitorChatRouteContext = {
  key: string;
  match: (pathname: string) => boolean;
  eyebrow?: string;
  greeting: string;
  supportingText: string;
  suggestedIntent?: VisitorChatIntentKey;
  suggestedQuestion?: string;
};

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  // Ignore query/hash if accidentally passed; pathname should already be clean.
  const withoutQuery = pathname.split('?')[0]?.split('#')[0] || '/';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || '/';
}

export const VISITOR_CHAT_ROUTE_CONTEXTS: readonly VisitorChatRouteContext[] = [
  {
    key: 'homepage',
    match: (pathname) => normalizePathname(pathname) === '/',
    eyebrow: 'Primewayz UK',
    greeting: 'What are you trying to improve?',
    supportingText:
      'Tell us where digital systems are creating friction, or choose a starting point.',
    suggestedQuestion: 'Where are digital systems creating friction for your business?',
  },
  {
    key: 'website_visibility',
    match: (pathname) => {
      const path = normalizePathname(pathname);
      return (
        path === '/website-visibility-support'
        || path === '/uk-sme-digital-visibility-checker'
      );
    },
    eyebrow: 'Website visibility',
    greeting: 'Looking to improve visibility or enquiries?',
    supportingText:
      'We can help with website conversion, visibility, or ongoing website support.',
    suggestedIntent: 'website_visibility',
    suggestedQuestion: 'What would you like to improve about your website visibility?',
  },
  {
    key: 'managed_support',
    match: (pathname) => normalizePathname(pathname) === '/maintenance',
    eyebrow: 'Managed application support',
    greeting:
      'Are you dealing with reliability issues, ongoing maintenance or an inherited application?',
    supportingText:
      'Tell us what needs stabilising, maintaining or taking into ongoing support.',
    suggestedIntent: 'managed_support',
    suggestedQuestion: 'What needs stabilising, maintaining or taking into ongoing support?',
  },
  {
    key: 'crm_workflow',
    match: (pathname) => normalizePathname(pathname) === '/crm-automation-support',
    eyebrow: 'CRM and workflows',
    greeting:
      'Are you reviewing an existing CRM, connecting systems or automating a workflow?',
    supportingText:
      'Choose the closest situation, or describe what is slowing your team down.',
    suggestedIntent: 'crm_workflow',
    suggestedQuestion: 'What CRM or workflow challenge are you reviewing?',
  },
  {
    key: 'software_product',
    match: (pathname) =>
      normalizePathname(pathname) === '/software-development-subscription-uk'
      || normalizePathname(pathname).startsWith('/software-development-subscription-uk/'),
    eyebrow: 'Software delivery',
    greeting:
      'Are you improving an existing application, planning new functionality or reviewing delivery capacity?',
    supportingText:
      'Share the outcome you need, or choose a starting point below.',
    suggestedIntent: 'software_product',
    suggestedQuestion: 'What software outcome are you trying to achieve?',
  },
  {
    key: 'remote_capacity',
    match: (pathname) => normalizePathname(pathname) === '/remote-it-resources',
    eyebrow: 'Remote technical capacity',
    greeting: 'Do you need extra delivery capacity or specialist technical support?',
    supportingText:
      'Tell us where capacity is constrained, or choose the closest option.',
    suggestedIntent: 'remote_capacity',
    suggestedQuestion: 'Where do you need additional technical capacity?',
  },
  {
    key: 'success_stories',
    match: (pathname) => {
      const path = normalizePathname(pathname);
      return path === '/success-stories' || path.startsWith('/success-stories/');
    },
    eyebrow: 'Success stories',
    greeting: 'Would you like help applying a similar approach to your systems?',
    supportingText:
      'Choose what you are trying to improve, or ask how a comparable delivery model could work for you.',
    suggestedQuestion: 'Would you like help applying this approach to your systems?',
  },
  {
    key: 'articles',
    match: (pathname) => {
      const path = normalizePathname(pathname);
      return (
        path === '/blog'
        || path.startsWith('/blog/')
        || path.startsWith('/insights/')
      );
    },
    eyebrow: 'Insights',
    greeting: 'Would you like help applying this guidance to your systems?',
    supportingText:
      'Choose a starting point, or tell us what you want to improve next.',
    suggestedQuestion: 'Would you like help applying this guidance to your systems?',
  },
  {
    key: 'generic',
    match: () => true,
    eyebrow: 'Primewayz UK',
    greeting: 'What are you trying to improve?',
    supportingText:
      'Choose a starting point, or describe the outcome you need.',
    suggestedQuestion: 'How can we help with your digital systems?',
  },
];

export function resolveVisitorChatRouteContext(
  pathname: string,
): VisitorChatRouteContext {
  const normalized = normalizePathname(pathname);
  for (const context of VISITOR_CHAT_ROUTE_CONTEXTS) {
    if (context.key === 'generic') continue;
    if (context.match(normalized)) return context;
  }
  return VISITOR_CHAT_ROUTE_CONTEXTS[VISITOR_CHAT_ROUTE_CONTEXTS.length - 1]!;
}

export function isWebsiteSupportJourneyPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return (
    path === '/website-visibility-support'
    || path === '/uk-sme-digital-visibility-checker'
  );
}

export function isManagedSupportJourneyPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/maintenance';
}
