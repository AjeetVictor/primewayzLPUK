import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAQ_FLAT_ITEMS } from '../../content/faqPageContent.ts';
import {
  buildDefaultStructuredData,
  buildFaqPageStructuredData,
  buildHomepageStructuredData,
  buildOrganizationEntity,
  buildProfessionalServiceEntity,
  buildWebSiteEntity,
  getOrganizationId,
  getProfessionalServiceId,
  getSiteOrigin,
  getSiteRoot,
  getWebSiteId,
  PRIMEWAYZ_UK_SITE_DESCRIPTION,
} from './defaultStructuredData.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const siteUrl = 'https://uk.primewayz.com';
const siteUrlVariants = [
  'https://uk.primewayz.com',
  'https://uk.primewayz.com/',
] as const;
const expectedOrigin = 'https://uk.primewayz.com';
const expectedRoot = 'https://uk.primewayz.com/';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function graphTypes(data: { '@graph': Array<{ '@type': string }> }): string[] {
  return data['@graph'].map((node) => node['@type']);
}

function graphOfType(
  data: { '@graph': Array<Record<string, unknown>> },
  type: string,
): Array<Record<string, unknown>> {
  return data['@graph'].filter((node) => node['@type'] === type);
}

test('homepage structured data has exactly one ProfessionalService at the site root', () => {
  const data = buildHomepageStructuredData(
    siteUrl,
    `${siteUrl}/`,
    'Digital Transformation Services for UK SMEs | Primewayz UK',
    PRIMEWAYZ_UK_SITE_DESCRIPTION,
  );

  const services = graphOfType(data, 'ProfessionalService');
  assert.equal(services.length, 1);
  assert.equal(services[0].url, `${siteUrl}/`);
  assert.equal(services[0]['@id'], `${siteUrl}/#professional-service`);
  assert.equal((services[0].provider as { '@id': string })['@id'], `${siteUrl}/#primewayz-uk`);
  assert.deepEqual(graphTypes(data).sort(), [
    'Organization',
    'ProfessionalService',
    'WebPage',
    'WebSite',
  ]);
});

test('default structured data excludes ProfessionalService and keeps stable WebSite copy', () => {
  const privacy = buildDefaultStructuredData(
    siteUrl,
    `${siteUrl}/privacy-policy`,
    'Privacy Policy | Primewayz UK',
    'How Primewayz UK collects, uses and protects personal information for UK website visitors and business enquiries.',
  );
  const pricing = buildDefaultStructuredData(
    siteUrl,
    `${siteUrl}/pricing`,
    'Primewayz UK Pricing & Engagement Options',
    'Review Primewayz UK engagement options including Foundation Sprint, structured monthly delivery, Maintenance Mode and enterprise or complex delivery.',
  );
  const howItWorks = buildDefaultStructuredData(
    siteUrl,
    `${siteUrl}/how-it-works`,
    'How Primewayz UK Digital Delivery Works',
    'Understand how Primewayz UK reviews priorities, selects a delivery model, delivers work and moves into ongoing support where appropriate.',
  );
  const terms = buildDefaultStructuredData(
    siteUrl,
    `${siteUrl}/terms-of-service`,
    'Terms of Service | Primewayz UK',
    'Terms governing use of the Primewayz UK website and related digital systems support services for UK businesses.',
  );
  const cookies = buildDefaultStructuredData(
    siteUrl,
    `${siteUrl}/cookie-policy`,
    'Cookie Policy | Primewayz UK',
    'How Primewayz UK uses cookies and similar technologies on the UK website.',
  );

  for (const page of [privacy, pricing, howItWorks, terms, cookies]) {
    assert.equal(graphOfType(page, 'ProfessionalService').length, 0);
    assert.deepEqual(graphTypes(page).sort(), ['Organization', 'WebPage', 'WebSite']);
  }

  const websites = [privacy, pricing, howItWorks, terms, cookies].map(
    (page) => graphOfType(page, 'WebSite')[0],
  );
  for (const website of websites) {
    assert.equal(website.url, expectedRoot);
    assert.equal(website.description, PRIMEWAYZ_UK_SITE_DESCRIPTION);
  }

  assert.deepEqual(buildWebSiteEntity(siteUrl).description, PRIMEWAYZ_UK_SITE_DESCRIPTION);
});

test('each generic page WebPage uses its own canonical, title and description', () => {
  const pages = [
    {
      path: '/privacy-policy',
      title: 'Privacy Policy | Primewayz UK',
      description:
        'How Primewayz UK collects, uses and protects personal information for UK website visitors and business enquiries.',
    },
    {
      path: '/pricing',
      title: 'Primewayz UK Pricing & Engagement Options',
      description:
        'Review Primewayz UK engagement options including Foundation Sprint, structured monthly delivery, Maintenance Mode and enterprise or complex delivery.',
    },
    {
      path: '/how-it-works',
      title: 'How Primewayz UK Digital Delivery Works',
      description:
        'Understand how Primewayz UK reviews priorities, selects a delivery model, delivers work and moves into ongoing support where appropriate.',
    },
  ] as const;

  for (const page of pages) {
    const canonical = `${siteUrl}${page.path}`;
    const data = buildDefaultStructuredData(siteUrl, canonical, page.title, page.description);
    const webPages = graphOfType(data, 'WebPage');

    assert.equal(webPages.length, 1);
    assert.equal(webPages[0]['@id'], `${canonical}#webpage`);
    assert.equal(webPages[0].url, canonical);
    assert.equal(webPages[0].name, page.title);
    assert.equal(webPages[0].description, page.description);
    assert.equal((webPages[0].isPartOf as { '@id': string })['@id'], `${siteUrl}/#website`);
    assert.equal((webPages[0].about as { '@id': string })['@id'], `${siteUrl}/#primewayz-uk`);
    assert.equal(webPages[0].inLanguage, 'en-GB');
  }
});

test('FAQ structured data includes Organization, WebSite, WebPage and FAQPage matching FAQ_FLAT_ITEMS', () => {
  const canonical = `${siteUrl}/faq`;
  const title = 'Primewayz UK Services: Frequently Asked Questions';
  const description =
    'Answers about Digital Systems Review, website audit, monthly delivery, software ownership, maintenance, capacity changes and confidentiality.';
  const data = buildFaqPageStructuredData(siteUrl, canonical, title, description);

  assert.deepEqual(graphTypes(data).sort(), [
    'FAQPage',
    'Organization',
    'WebPage',
    'WebSite',
  ]);
  assert.equal(graphOfType(data, 'ProfessionalService').length, 0);

  const faqPages = graphOfType(data, 'FAQPage');
  assert.equal(faqPages.length, 1);
  const mainEntity = faqPages[0].mainEntity as Array<{
    '@type': string;
    name: string;
    acceptedAnswer: { '@type': string; text: string };
  }>;
  assert.equal(mainEntity.length, FAQ_FLAT_ITEMS.length);

  mainEntity.forEach((entity, index) => {
    assert.equal(entity['@type'], 'Question');
    assert.equal(entity.name, FAQ_FLAT_ITEMS[index].question);
    assert.equal(entity.acceptedAnswer['@type'], 'Answer');
    assert.equal(entity.acceptedAnswer.text, FAQ_FLAT_ITEMS[index].answer);
  });

  const website = graphOfType(data, 'WebSite')[0];
  assert.equal(website.url, expectedRoot);
  assert.equal(website.description, PRIMEWAYZ_UK_SITE_DESCRIPTION);
});

test('site URL normalisation yields identical entity IDs and root URLs with or without trailing slash', () => {
  for (const input of siteUrlVariants) {
    assert.equal(getSiteOrigin(input), expectedOrigin);
    assert.equal(getSiteRoot(input), expectedRoot);
    assert.equal(getOrganizationId(input), `${expectedOrigin}/#primewayz-uk`);
    assert.equal(getWebSiteId(input), `${expectedOrigin}/#website`);
    assert.equal(getProfessionalServiceId(input), `${expectedOrigin}/#professional-service`);

    const organization = buildOrganizationEntity(input);
    const website = buildWebSiteEntity(input);
    const professionalService = buildProfessionalServiceEntity(input);

    assert.equal(organization['@id'], `${expectedOrigin}/#primewayz-uk`);
    assert.equal(website['@id'], `${expectedOrigin}/#website`);
    assert.equal(professionalService['@id'], `${expectedOrigin}/#professional-service`);
    assert.equal(organization.url, expectedRoot);
    assert.equal(website.url, expectedRoot);
    assert.equal(professionalService.url, expectedRoot);
    assert.equal(organization.logo, `${expectedOrigin}/primewayz-uk-dark-logo.png`);
  }

  assert.deepEqual(
    {
      organizationId: getOrganizationId(siteUrlVariants[0]),
      webSiteId: getWebSiteId(siteUrlVariants[0]),
      professionalServiceId: getProfessionalServiceId(siteUrlVariants[0]),
      organizationUrl: buildOrganizationEntity(siteUrlVariants[0]).url,
      webSiteUrl: buildWebSiteEntity(siteUrlVariants[0]).url,
      professionalServiceUrl: buildProfessionalServiceEntity(siteUrlVariants[0]).url,
      logo: buildOrganizationEntity(siteUrlVariants[0]).logo,
    },
    {
      organizationId: getOrganizationId(siteUrlVariants[1]),
      webSiteId: getWebSiteId(siteUrlVariants[1]),
      professionalServiceId: getProfessionalServiceId(siteUrlVariants[1]),
      organizationUrl: buildOrganizationEntity(siteUrlVariants[1]).url,
      webSiteUrl: buildWebSiteEntity(siteUrlVariants[1]).url,
      professionalServiceUrl: buildProfessionalServiceEntity(siteUrlVariants[1]).url,
      logo: buildOrganizationEntity(siteUrlVariants[1]).logo,
    },
  );
});

test('WebPage url and @id keep the supplied canonical without site-root normalisation', () => {
  const canonical = `${siteUrl}/pricing`;
  const data = buildDefaultStructuredData(
    `${siteUrl}/`,
    canonical,
    'Primewayz UK Pricing & Engagement Options',
    'Review Primewayz UK engagement options including Foundation Sprint, structured monthly delivery, Maintenance Mode and enterprise or complex delivery.',
  );
  const webPage = graphOfType(data, 'WebPage')[0];

  assert.equal(webPage.url, canonical);
  assert.equal(webPage['@id'], `${canonical}#webpage`);
});

test('server wires homepage, FAQ and default builders without ProfessionalService on utility routes', () => {
  const server = read('server.ts');
  assert.match(server, /buildHomepageStructuredData\(/);
  assert.match(server, /buildDefaultStructuredData\(/);
  assert.match(server, /buildFaqPageStructuredData\(/);
  assert.match(server, /pagePathname === ['"]\/['"]/);
  assert.match(server, /PRIMEWAYZ_UK_SITE_DESCRIPTION/);
  assert.doesNotMatch(
    server,
    /function buildDefaultStructuredData\(|function buildFaqPageStructuredData\(|function buildHomepageStructuredData\(/,
  );
});
