import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_ROUTES, LEGACY_ROUTE_REDIRECTS } from '../../constants/canonicalRoutes.ts';
import { SDAAS_SEO } from '../../data/sdaas/commercialPage.ts';
import { FAQ_FLAT_ITEMS } from '../../content/faqPageContent.ts';
import { HOW_IT_WORKS_STEPS } from '../../content/howItWorksPageContent.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const HOMEPAGE_SECTIONS = [
  'Hero',
  'WebsiteProblemSection',
  'ServiceRoutesSection',
  'AuditLedProcessSection',
  'SuccessStories',
  'CommercialClaritySection',
  'HomepageContactSection',
] as const;

const REMOVED_HOMEPAGE_SECTIONS = [
  'OutcomePillarsSection',
  'TrustPillarSection',
  'EnquiriesPillarSection',
  'MonthlySupportRhythmSection',
  'WhatWeReviewFirstSection',
  'InsightsSection',
  'Philosophy',
  'HowItWorks',
  'TechStack',
  'RemoteItCapacitySection',
  'FAQ',
] as const;

const CANONICAL_SERVICE_PATHS = [
  '/website-visibility-support',
  '/crm-automation-support',
  '/software-development-subscription-uk',
  '/maintenance',
  '/remote-it-resources',
] as const;

test('homepage MainContent keeps approved semantic section order once', () => {
  const app = read('src/App.tsx');
  const mainMatch = app.match(/const MainContent[\s\S]*?<\/main>\s*\);/);
  assert.ok(mainMatch, 'MainContent definition missing');
  const main = mainMatch[0];

  for (const section of HOMEPAGE_SECTIONS) {
    assert.equal(
      (main.match(new RegExp(`<${section}\\b`, 'g')) || []).length,
      1,
      `${section} should render once`,
    );
  }

  for (const section of REMOVED_HOMEPAGE_SECTIONS) {
    assert.doesNotMatch(main, new RegExp(`<${section}\\b`));
  }

  assert.match(
    main,
    /<Hero \/>[\s\S]*<WebsiteProblemSection \/>[\s\S]*<ServiceRoutesSection \/>[\s\S]*<AuditLedProcessSection \/>[\s\S]*<SuccessStories \/>[\s\S]*<CommercialClaritySection \/>[\s\S]*<HomepageContactSection \/>/,
  );
});

test('homepage has one H1 with approved text and preserved CTA hierarchy', () => {
  const hero = read('src/components/Hero.tsx');
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.match(hero, /Reliable digital systems/);
  assert.match(hero, /for growing/);
  assert.match(hero, /UK businesses/);
  assert.match(hero, /homepage_hero_primary/);
  assert.match(hero, /homepage_hero_secondary/);
  assert.match(hero, /homepage_hero_website_checker/);
  assert.match(hero, /uk-sme-digital-visibility-checker|WEBSITE_CHECKER|websiteCheckerPlacement/);

  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /Request a free digital systems review|FREE_REVIEW_CTA_LABEL/);
  assert.match(group, /Book a discovery call|DISCOVERY_CALL_CTA_LABEL/);
  assert.match(group, /Run the free website audit|WEBSITE_CHECKER_CTA_LABEL/);
  assert.match(group, /data-homepage-website-audit-cta="strip"/);
});

test('homepage service routes include five canonical owners without legacy aliases', () => {
  const section = read('src/components/sections/ServiceRoutesSection.tsx');
  assert.match(section, /CANONICAL_ROUTES\.websiteVisibilitySupport/);
  assert.match(section, /CANONICAL_ROUTES\.crmAutomationSupport/);
  assert.match(section, /CANONICAL_ROUTES\.softwareDevelopmentSubscription/);
  assert.match(section, /CANONICAL_ROUTES\.maintenance/);
  assert.match(section, /CANONICAL_ROUTES\.remoteItResources/);
  assert.doesNotMatch(
    section,
    /software-product-delivery|crm-integration-support-uk|remote-it-resource-augmentation|website-maintenance-subscription-uk/,
  );
});

test('delivery process and enquiry journeys are not duplicated on the homepage', () => {
  const app = read('src/App.tsx');
  const process = read('src/components/sections/AuditLedProcessSection.tsx');
  assert.equal((app.match(/<AuditLedProcessSection \/>/g) || []).length, 1);
  assert.match(process, /Review/);
  assert.match(process, /Prioritise/);
  assert.match(process, /Improve/);
  assert.match(process, /Track/);
  assert.doesNotMatch(process, /md:hidden[\s\S]*hidden md:block[\s\S]*Review/);
  assert.doesNotMatch(app, /EnquiriesPillarSection|Interest → CTA|Interest -> CTA/);
});

test('unsupported trust claims are absent from homepage tree and TechStack copy', () => {
  const homepageFiles = [
    'src/App.tsx',
    'src/components/Hero.tsx',
    'src/components/sections/WebsiteProblemSection.tsx',
    'src/components/sections/ServiceRoutesSection.tsx',
    'src/components/sections/AuditLedProcessSection.tsx',
    'src/components/SuccessStories.tsx',
    'src/components/sections/CommercialClaritySection.tsx',
    'src/components/sections/HomepageContactSection.tsx',
    'src/components/TechStack.tsx',
  ];
  const combined = homepageFiles.map(read).join('\n');
  assert.doesNotMatch(combined, /4,000\+|4000\+|2,500\+|2500\+/);
  assert.doesNotMatch(combined, /almost every programming language/i);
  assert.doesNotMatch(combined, /industry-leading|best-in-class|hidden revenue leaks|AI-powered UX audit/i);
  assert.match(read('src/components/TechStack.tsx'), /modern web, backend, mobile, database, integration and cloud technologies/);
});

test('homepage and nav internal links do not use utm_ parameters', () => {
  const files = [
    'src/App.tsx',
    'src/components/Hero.tsx',
    'src/components/Footer.tsx',
    'src/constants/servicesNavigation.ts',
    'src/components/sections/WebsiteProblemSection.tsx',
    'src/components/sections/ServiceRoutesSection.tsx',
    'src/components/sections/CommercialClaritySection.tsx',
    'src/components/sections/HomepageContactSection.tsx',
    'src/components/SuccessStories.tsx',
    'src/components/SelfAuditCta.tsx',
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /utm_source=|utm_medium=|utm_campaign=|utm_content=|utm_term=/);
  }
});

test('software legacy route permanently redirects once to canonical subscription path', () => {
  assert.equal(
    LEGACY_ROUTE_REDIRECTS['/software-product-delivery'],
    '/software-development-subscription-uk',
  );
  assert.equal(CANONICAL_ROUTES.softwareDevelopmentSubscription, '/software-development-subscription-uk');
  const server = read('server.ts');
  assert.match(server, /res\.redirect\(301,/);
  assert.match(server, /LEGACY_ROUTE_REDIRECTS/);
  assert.doesNotMatch(server, /['"]\/software-product-delivery['"]\s*:\s*\{[\s\S]*title:/);
  assert.equal(SDAAS_SEO.title, 'Software Development Subscription UK | Primewayz');
  assert.match(
    read('src/components/SoftwareDevelopmentSubscriptionUkPage.tsx'),
    /Software Development as a Subscription for UK Businesses/,
  );
});

test('utility and legal routes have unique metadata and dedicated pages', () => {
  const server = read('server.ts');
  const expectations: Array<[string, string]> = [
    ['/privacy-policy', 'Privacy Policy | Primewayz UK'],
    ['/terms-of-service', 'Terms of Service | Primewayz UK'],
    ['/cookie-policy', 'Cookie Policy | Primewayz UK'],
    ['/faq', 'Primewayz UK Services: Frequently Asked Questions'],
    ['/how-it-works', 'How Primewayz UK Digital Delivery Works'],
    ['/pricing', 'Primewayz UK Pricing & Engagement Options'],
  ];
  for (const [route, title] of expectations) {
    assert.match(server, new RegExp(`['"]${route.replace(/\//g, '\\/')}['"]\\s*:\\s*\\{[\\s\\S]*?title:\\s*['"]${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`));
  }

  assert.match(read('src/components/LegalPage.tsx'), /Privacy Policy/);
  assert.match(read('src/components/FaqPage.tsx'), /Frequently Asked Questions/);
  assert.match(read('src/components/HowItWorksPage.tsx'), /How Primewayz UK Works/);
  assert.match(read('src/components/Pricing.tsx'), /Pricing & Engagement Options/);
  assert.match(read('src/components/pricing/PricingPageContent.tsx'), /<h1 id="pricing-hero-title"/);
  assert.equal((read('src/components/FaqPage.tsx').match(/<h1\b/g) || []).length, 1);
  assert.equal((read('src/components/HowItWorksPage.tsx').match(/<h1\b/g) || []).length, 1);
  assert.equal((read('src/components/pricing/PricingPageContent.tsx').match(/<h1\b/g) || []).length, 1);
});

test('FAQ and how-it-works routes are real pages and footer links use clean paths', () => {
  const app = read('src/App.tsx');
  assert.match(app, /path="\/faq"\s+element=\{<FaqPage/);
  assert.match(app, /path="\/how-it-works"\s+element=\{<HowItWorksPage/);
  assert.doesNotMatch(app, /Navigate to="\/#how-it-works"/);
  assert.equal(CANONICAL_ROUTES.faq, '/faq');
  assert.equal(CANONICAL_ROUTES.howItWorks, '/how-it-works');
  assert.match(read('src/components/Footer.tsx'), /CANONICAL_ROUTES\.faq|\/faq/);
  assert.match(read('src/components/Footer.tsx'), /CANONICAL_ROUTES\.howItWorks|\/how-it-works/);
  assert.ok(FAQ_FLAT_ITEMS.length >= 8);
  assert.equal(HOW_IT_WORKS_STEPS.length, 6);
  assert.match(read('server.ts'), /FAQPage|buildFaqPageStructuredData/);
});

test('default structured-data architecture keeps ProfessionalService on homepage only', () => {
  const server = read('server.ts');
  assert.match(server, /buildHomepageStructuredData\(/);
  assert.match(server, /buildDefaultStructuredData\(/);
  assert.match(
    server,
    /pagePathname === ['"]\/['"][\s\S]*buildHomepageStructuredData/,
  );
});

test('sitemap lists canonical owners and excludes legacy software/service aliases', () => {
  const sitemap = read('public/sitemap.xml');
  for (const route of CANONICAL_SERVICE_PATHS) {
    assert.match(sitemap, new RegExp(`https://uk\\.primewayz\\.com${route.replace(/\//g, '\\/')}<`));
  }
  assert.match(sitemap, /https:\/\/uk\.primewayz\.com\/faq</);
  assert.match(sitemap, /https:\/\/uk\.primewayz\.com\/how-it-works</);
  assert.match(sitemap, /https:\/\/uk\.primewayz\.com\/pricing</);
  assert.doesNotMatch(sitemap, /software-product-delivery/);
  assert.doesNotMatch(sitemap, /website-maintenance-subscription-uk/);
  assert.doesNotMatch(sitemap, /remote-it-resource-augmentation/);
  assert.doesNotMatch(sitemap, /crm-integration-support-uk/);
});

test('homepage SEO title and description are updated', () => {
  const server = read('server.ts');
  const indexHtml = read('index.html');
  const siteDescription = read('src/lib/seo/defaultStructuredData.ts');
  assert.match(server, /Digital Systems Support for UK SMEs \| Primewayz UK/);
  assert.match(server, /description:\s*PRIMEWAYZ_UK_SITE_DESCRIPTION/);
  assert.match(
    siteDescription,
    /improve website visibility, CRM workflows, software delivery, application support and remote IT capacity/,
  );
  assert.match(indexHtml, /Digital Systems Support for UK SMEs \| Primewayz UK/);
});
