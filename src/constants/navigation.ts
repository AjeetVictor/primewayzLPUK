export type MainNavLink = {
  name: string;
  href: string;
  matchPath?: string;
};

/** Primary header navigation aligned to v2 mockup */
export const mainNavLinks: MainNavLink[] = [
  { name: 'How it works', href: '/#how-it-works' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Insights', href: '/blog', matchPath: '/blog' },
  { name: 'About', href: '/about-us', matchPath: '/about-us' },
];

export const AUDIT_CHECKER_PATH = '/uk-sme-digital-visibility-checker';
