import { CANONICAL_ROUTES } from './canonicalRoutes';

export type MainNavLink = {
  name: string;
  href: string;
  matchPath?: string;
};

/** Primary header navigation aligned to v2 mockup */
export const mainNavLinks: MainNavLink[] = [
  { name: 'How it works', href: CANONICAL_ROUTES.howItWorks },
  { name: 'Pricing', href: CANONICAL_ROUTES.pricing },
  { name: 'Insights', href: CANONICAL_ROUTES.blog, matchPath: '/blog' },
  { name: 'Contact', href: CANONICAL_ROUTES.contact, matchPath: '/contact-us' },
];

export const AUDIT_CHECKER_PATH = CANONICAL_ROUTES.freeAudit;
