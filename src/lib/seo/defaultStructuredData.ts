import { FAQ_FLAT_ITEMS, type FaqItem } from '../../content/faqPageContent.ts';

/** Stable site-wide description used by WebSite schema and homepage SEO. */
export const PRIMEWAYZ_UK_SITE_DESCRIPTION =
  'Primewayz helps UK SMEs improve website visibility, CRM workflows, software delivery, application support and remote IT capacity through structured digital support.';

export const PRIMEWAYZ_UK_SERVICE_TYPES = [
  'Website visibility and conversion support',
  'CRM integration and workflow automation',
  'Software and product engineering',
  'Managed application and website support',
  'Remote IT team extension',
] as const;

export function getSiteOrigin(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '');
}

export function getSiteRoot(siteUrl: string): string {
  return `${getSiteOrigin(siteUrl)}/`;
}

export function getOrganizationId(siteUrl: string): string {
  return `${getSiteOrigin(siteUrl)}/#primewayz-uk`;
}

export function getWebSiteId(siteUrl: string): string {
  return `${getSiteOrigin(siteUrl)}/#website`;
}

export function getProfessionalServiceId(siteUrl: string): string {
  return `${getSiteOrigin(siteUrl)}/#professional-service`;
}

export function buildOrganizationEntity(siteUrl: string) {
  return {
    '@type': 'Organization',
    '@id': getOrganizationId(siteUrl),
    name: 'Primewayz UK',
    url: getSiteRoot(siteUrl),
    logo: `${getSiteOrigin(siteUrl)}/primewayz-uk-dark-logo.png`,
  };
}

export function buildWebSiteEntity(siteUrl: string) {
  return {
    '@type': 'WebSite',
    '@id': getWebSiteId(siteUrl),
    url: getSiteRoot(siteUrl),
    name: 'Primewayz UK',
    description: PRIMEWAYZ_UK_SITE_DESCRIPTION,
    publisher: { '@id': getOrganizationId(siteUrl) },
    inLanguage: 'en-GB',
  };
}

export function buildWebPageEntity(
  siteUrl: string,
  canonical: string,
  title: string,
  description: string,
) {
  return {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { '@id': getWebSiteId(siteUrl) },
    about: { '@id': getOrganizationId(siteUrl) },
    inLanguage: 'en-GB',
  };
}

export function buildProfessionalServiceEntity(siteUrl: string) {
  return {
    '@type': 'ProfessionalService',
    '@id': getProfessionalServiceId(siteUrl),
    name: 'Primewayz UK',
    url: getSiteRoot(siteUrl),
    description: PRIMEWAYZ_UK_SITE_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    serviceType: [...PRIMEWAYZ_UK_SERVICE_TYPES],
    audience: { '@type': 'BusinessAudience', audienceType: 'UK small businesses and SMEs' },
    provider: { '@id': getOrganizationId(siteUrl) },
  };
}

export function buildDefaultStructuredData(
  siteUrl: string,
  canonical: string,
  title: string,
  description: string,
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationEntity(siteUrl),
      buildWebSiteEntity(siteUrl),
      buildWebPageEntity(siteUrl, canonical, title, description),
    ],
  };
}

export function buildHomepageStructuredData(
  siteUrl: string,
  canonical: string,
  title: string,
  description: string,
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationEntity(siteUrl),
      buildWebSiteEntity(siteUrl),
      buildWebPageEntity(siteUrl, canonical, title, description),
      buildProfessionalServiceEntity(siteUrl),
    ],
  };
}

export function buildFaqPageStructuredData(
  siteUrl: string,
  canonical: string,
  title: string,
  description: string,
  faqItems: readonly FaqItem[] = FAQ_FLAT_ITEMS,
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationEntity(siteUrl),
      buildWebSiteEntity(siteUrl),
      buildWebPageEntity(siteUrl, canonical, title, description),
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };
}
