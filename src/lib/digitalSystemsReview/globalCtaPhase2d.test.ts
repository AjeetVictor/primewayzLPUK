import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  FREE_REVIEW_CTA_PLACEMENTS,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_SOURCE_LOCATIONS,
  WEBSITE_CHECKER_DESTINATION,
  buildFreeReviewCtaUrl,
  resolveFreeReviewSourceLocation,
  type FreeReviewCtaPlacement,
} from '../../constants/conversionCta.ts';
import { BOOK_CALL_URL, CONTACT_PAGE_PATH } from '../../constants/contactBooking.ts';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes.ts';
import {
  REVIEW_PREFERRED_NEXT_STEPS,
} from '../../constants/digitalSystemsReview.ts';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const PHASE2D_PLACEMENTS = [
  'navigation_desktop_primary',
  'navigation_desktop_secondary',
  'navigation_mobile_primary',
  'navigation_mobile_secondary',
  'footer_primary',
  'footer_secondary',
  'footer_website_checker',
  'about_primary',
  'about_secondary',
] as const satisfies readonly FreeReviewCtaPlacement[];

const EXPECTED_NAV_URL =
  '/digital-systems-review?review_source=navigation&review_service=Not+sure+yet';
const EXPECTED_FOOTER_URL =
  '/digital-systems-review?review_source=footer&review_service=Not+sure+yet';
const EXPECTED_ABOUT_URL =
  '/digital-systems-review?review_source=about_page&review_service=Not+sure+yet';

// --- Navbar ---

test('1–4 desktop primary review CTA uses navigation + Not sure yet + allowlisted placement', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /DigitalSystemsReviewCtaLink/);
  assert.match(nav, /kind="review"/);
  assert.match(nav, /placement="navigation_desktop_primary"/);
  assert.match(nav, /sourceLocation=\{NAV_SOURCE\}|sourceLocation="navigation"/);
  assert.match(nav, /NAV_SOURCE = 'navigation'|sourceLocation="navigation"/);
  assert.match(nav, /NAV_SERVICE = 'Not sure yet'|serviceArea="Not sure yet"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('navigation_desktop_primary'));
  assert.equal(buildFreeReviewCtaUrl('navigation', 'Not sure yet'), EXPECTED_NAV_URL);
});

test('5–6 desktop booking action remains with allowlisted secondary placement', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /kind="discovery"/);
  assert.match(nav, /placement="navigation_desktop_secondary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('navigation_desktop_secondary'));
});

test('7 Free website audit is removed from desktop Navbar CTA area', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.doesNotMatch(nav, /SelfAuditCta/);
  assert.doesNotMatch(nav, /Free website audit/);
  assert.doesNotMatch(nav, /utmContent="header_nav"/);
});

test('8–10 phone, navigation links and Services menu remain', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /tel:\+447588741740/);
  assert.match(nav, /\+44 7588 741740/);
  assert.match(nav, /mainNavLinks\.map/);
  assert.match(nav, /ServicesMegaMenu/);
});

test('11–14 mobile primary review CTA uses navigation + Not sure yet + allowlisted placement', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /placement="navigation_mobile_primary"/);
  assert.match(nav, /id="mobile-menu"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('navigation_mobile_primary'));
});

test('15–16 mobile booking action remains with allowlisted secondary placement', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /placement="navigation_mobile_secondary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('navigation_mobile_secondary'));
});

test('17 Free website audit is removed from mobile CTA area', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.doesNotMatch(nav, /ctaLocation="header_nav_mobile"/);
  assert.doesNotMatch(nav, /SelfAuditCta/);
});

test('18 mobile menu accessibility behaviour remains', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.match(nav, /aria-expanded=\{isOpen\}/);
  assert.match(nav, /aria-controls="mobile-menu"/);
  assert.match(nav, /Escape/);
  assert.match(nav, /document\.body\.style\.overflow/);
  assert.match(nav, /setIsOpen\(false\)/);
  assert.match(nav, /location\.pathname/);
  assert.match(nav, /min-h-\[44px\]/);
});

// --- Footer ---

test('19–22 footer primary review CTA uses footer + Not sure yet + allowlisted placement', () => {
  const footer = read('src/components/Footer.tsx');
  assert.match(footer, /DigitalSystemsReviewCtaGroup/);
  assert.match(footer, /sourceLocation="footer"/);
  assert.match(footer, /serviceArea="Not sure yet"/);
  assert.match(footer, /primaryPlacement="footer_primary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('footer_primary'));
  assert.equal(buildFreeReviewCtaUrl('footer', 'Not sure yet'), EXPECTED_FOOTER_URL);
});

test('23–24 footer booking action remains with allowlisted secondary placement', () => {
  const footer = read('src/components/Footer.tsx');
  assert.match(footer, /secondaryPlacement="footer_secondary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('footer_secondary'));
});

test('25–26 footer website checker remains as tertiary with allowlisted placement', () => {
  const footer = read('src/components/Footer.tsx');
  assert.match(footer, /websiteCheckerPlacement="footer_website_checker"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('footer_website_checker'));
  assert.equal(WEBSITE_CHECKER_DESTINATION, CANONICAL_ROUTES.freeAudit);
});

test('27–29 footer legal links, contact details and ordinary navigation remain', () => {
  const footer = read('src/components/Footer.tsx');
  assert.match(footer, /Privacy Policy/);
  assert.match(footer, /Terms of Service/);
  assert.match(footer, /Cookies Policy/);
  assert.match(footer, /tel:\+447588741740/);
  assert.match(footer, /mailto:info@primewayz\.com/);
  assert.match(footer, /Shelton Street/);
  assert.match(footer, /FooterLinkList title="Services"/);
  assert.match(footer, /FooterLinkList title="Company"/);
  assert.match(footer, /FooterLinkList title="Resources"/);
  assert.match(footer, /SelfAuditCta/);
  assert.match(footer, /data-footer-conversion-group/);
  assert.equal((footer.match(/data-footer-conversion-group/g) || []).length, 1);
  assert.equal((footer.match(/<DigitalSystemsReviewCtaGroup\b/g) || []).length, 1);
});

// --- About ---

test('30–33 about primary review CTA uses about_page + Not sure yet + allowlisted placement', () => {
  const about = read('src/components/AboutUsPage.tsx');
  assert.match(about, /DigitalSystemsReviewCtaGroup/);
  assert.match(about, /sourceLocation="about_page"/);
  assert.match(about, /serviceArea="Not sure yet"/);
  assert.match(about, /primaryPlacement="about_primary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('about_primary'));
  assert.equal(buildFreeReviewCtaUrl('about_page', 'Not sure yet'), EXPECTED_ABOUT_URL);
});

test('34–35 about booking action remains with allowlisted secondary placement', () => {
  const about = read('src/components/AboutUsPage.tsx');
  assert.match(about, /secondaryPlacement="about_secondary"/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('about_secondary'));
  assert.doesNotMatch(about, /websiteCheckerPlacement/);
});

test('36–37 about retains one H1 and content/service links', () => {
  const about = read('src/components/AboutUsPage.tsx');
  assert.equal((about.match(/<h1\b/g) || []).length, 1);
  assert.match(about, /About Primewayz UK/);
  assert.match(about, /Who we support/);
  assert.match(about, /How we work/);
  assert.match(about, /COMPANY_TRUST_LINKS\.contact/);
  assert.match(about, /COMPANY_TRUST_LINKS\.successStories/);
  assert.match(about, /COMPANY_TRUST_LINKS\.blog/);
});

// --- Global safety ---

test('38–39 about_page is allowlisted; invalid source falls back safely', () => {
  assert.ok(FREE_REVIEW_SOURCE_LOCATIONS.includes('about_page'));
  assert.ok(FREE_REVIEW_SOURCE_LOCATIONS.includes('navigation'));
  assert.ok(FREE_REVIEW_SOURCE_LOCATIONS.includes('footer'));
  assert.equal(resolveFreeReviewSourceLocation('about_page'), 'about_page');
  assert.equal(resolveFreeReviewSourceLocation('not_a_real_source'), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation('ABOUT_PAGE'), 'digital_systems_review_page');
});

test('40 review URLs contain no PII', () => {
  for (const url of [EXPECTED_NAV_URL, EXPECTED_FOOTER_URL, EXPECTED_ABOUT_URL]) {
    assert.doesNotMatch(url, /@|name=|email=|phone=|company=/i);
    assert.match(url, /^\/digital-systems-review\?/);
  }
});

test('41 analytics contain only approved properties', () => {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'navigation',
    ctaPlacement: 'navigation_desktop_primary',
    route: '/',
    serviceArea: 'Not sure yet',
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    'cta_placement',
    'route',
    'service_area',
    'source_location',
  ]);
  assertNoProhibitedAnalyticsProps(payload);

  const link = read('src/components/conversion/DigitalSystemsReviewCtaLink.tsx');
  assert.match(link, /free_review_cta_click/);
  assert.match(link, /free_review_book_call_click/);
  assert.match(link, /assertNoProhibitedAnalyticsProps/);
  assert.match(link, /buildFreeReviewCtaUrl/);
  assert.match(link, /trackBookCallClick/);
  assert.doesNotMatch(link, /viewport|menu_open|page_title|chatSessionId|submissionId/i);
});

test('42 both preferred-next-step values remain', () => {
  assert.ok(FREE_REVIEW_PREFERRED_NEXT_STEPS.includes('Email me the recommended next step'));
  assert.ok(FREE_REVIEW_PREFERRED_NEXT_STEPS.includes('Arrange a short discovery call'));
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [...REVIEW_PREFERRED_NEXT_STEPS]);
  assert.ok(FREE_REVIEW_SERVICE_AREAS.includes('Not sure yet'));
});

test('43 homepage Phase 2A remains unchanged', () => {
  const hero = read('src/components/Hero.tsx');
  assert.match(hero, /sourceLocation="homepage"/);
  assert.match(hero, /homepage_hero_primary/);
  assert.doesNotMatch(hero, /serviceArea=/);
  assert.doesNotMatch(hero, /navigation_|footer_|about_/);

  const closing = read('src/components/sections/HomepageContactSection.tsx');
  assert.match(closing, /sourceLocation="homepage"/);
  assert.match(closing, /homepage_closing_primary/);
});

test('44 service Phase 2B remains unchanged', () => {
  const services = read('src/components/ServicesPage.tsx');
  assert.match(services, /sourceLocation="services_page"/);
  assert.match(services, /services_hero_primary/);
  assert.match(services, /serviceArea="Not sure yet"/);

  const crm = read('src/components/CrmIntegrationSupportUkPage.tsx');
  assert.match(crm, /sourceLocation="service_page"/);
  assert.match(crm, /crm_hero_primary/);
});

test('45 content Phase 2C remains unchanged', () => {
  const stories = read('src/components/SuccessStoriesPage.tsx');
  assert.match(stories, /sourceLocation="success_story"/);
  assert.match(stories, /success_stories_listing_primary/);

  const blogCta = read('src/components/blog/BlogArticleCTA.tsx');
  assert.match(blogCta, /sourceLocation="article"/);
  assert.match(blogCta, /blog_article_primary/);
});

test('46–48 hero slider files remain outside Phase 2D', () => {
  for (const file of [
    'src/components/hero/HeroSplitSlider.tsx',
    'src/components/hero/HeroContentSlider.tsx',
    'src/components/hero/heroHeadlineSlides.ts',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaLink/);
    assert.doesNotMatch(source, /buildFreeReviewCtaUrl/);
    assert.doesNotMatch(source, /navigation_desktop_primary|footer_primary|about_primary/);
  }
});

test('49–50 LiveChat and LazyLiveChat remain unchanged', () => {
  for (const file of ['src/components/LiveChat.tsx', 'src/components/LazyLiveChat.tsx']) {
    const source = read(file);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaLink/);
    assert.doesNotMatch(source, /buildFreeReviewCtaUrl/);
    assert.doesNotMatch(source, /about_page|footer_primary|navigation_desktop/);
  }
});

test('51–53 no App route, server, Prisma or migration change for Phase 2D', () => {
  const app = read('src/App.tsx');
  assert.match(app, /path="\/about-us"/);
  assert.match(app, /<Navbar \/>/);
  assert.match(app, /<Footer \/>/);
  assert.doesNotMatch(app, /navigation_desktop_primary|footer_primary|about_primary/);

  const server = read('server.ts');
  assert.doesNotMatch(server, /navigation_desktop_primary|footer_primary|about_primary/);
  assert.doesNotMatch(server, /DigitalSystemsReviewCtaLink/);

  const prismaFiles = [
    'prisma/schema.prisma',
    ...fs
      .readdirSync(path.join(root, 'prisma/migrations'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `prisma/migrations/${d.name}/migration.sql`),
  ];
  for (const file of prismaFiles) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const source = read(file);
    assert.doesNotMatch(source, /about_page|navigation_desktop_primary|footer_primary/);
  }
});

test('54–55 website checker, contact and booking destinations remain valid', () => {
  assert.equal(WEBSITE_CHECKER_DESTINATION, '/uk-sme-digital-visibility-checker');
  assert.equal(CONTACT_PAGE_PATH, '/contact-us');
  assert.equal(BOOK_CALL_URL, '/contact-us#book-call');
  assert.equal(DISCOVERY_CALL_DESTINATION, BOOK_CALL_URL);
  assert.equal(FREE_REVIEW_CTA_LABEL, 'Request a free digital systems review');

  for (const placement of PHASE2D_PLACEMENTS) {
    assert.ok(
      FREE_REVIEW_CTA_PLACEMENTS.includes(placement),
      `${placement} must be allowlisted`,
    );
  }
});
