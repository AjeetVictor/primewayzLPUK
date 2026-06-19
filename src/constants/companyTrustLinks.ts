/** Public trust, profile, and navigation links for Primewayz UK. */
export const COMPANY_TRUST_LINKS = {
  linkedin: 'https://www.linkedin.com/company/primewayz-uk/',
  privacyPolicy: '/privacy-policy',
  termsOfService: '/terms-of-service',
  cookiePolicy: '/cookie-policy',
  contact: '/contact-us',
  about: '/about-us',
  successStories: '/success-stories',
  blog: '/blog',
  services: '/services',
  webPresenceAudit: '/#free-web-presence-audit',
  digitalVisibilityChecker: '/uk-sme-digital-visibility-checker',
} as const;

// TODO: Add Google Business Profile / Maps listing URL here once the verified public link is confirmed.

export const COMPANY_SOCIAL_LINKS = [
  {
    href: COMPANY_TRUST_LINKS.linkedin,
    label: 'LinkedIn',
    ariaLabel: 'Primewayz UK on LinkedIn',
  },
] as const;
