import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_REVIEW_CTA_LABEL,
  FREE_REVIEW_CTA_PLACEMENTS,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_ROUTE,
  FREE_REVIEW_SOURCE_QUERY_PARAM,
  GENERAL_CONTACT_DESTINATION,
  WEBSITE_CHECKER_DESTINATION,
  buildFreeReviewCtaUrl,
  resolveFreeReviewSourceLocation,
} from '../../constants/conversionCta.ts';
import { COMPANY_TRUST_LINKS } from '../../constants/companyTrustLinks.ts';
import {
  DEFAULT_REVIEW_SOURCE_LOCATION,
  DIGITAL_SYSTEMS_REVIEW_PATH,
  DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,
  REVIEW_PREFERRED_NEXT_STEPS,
} from '../../constants/digitalSystemsReview.ts';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import { validateAndNormalizeDigitalSystemsReviewLead } from './validateReviewLead.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const PHASE2A_BASE_COMMIT = 'e370bbaa1a3c10ef8f20df0960bc85424f12b78d';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertUnchangedSinceBase(relativePath: string): void {
  const posixPath = relativePath.replace(/\\/g, '/');
  try {
    execFileSync(
      'git',
      ['diff', '--quiet', PHASE2A_BASE_COMMIT, '--', posixPath],
      { cwd: root },
    );
  } catch {
    assert.fail(`${relativePath} must be unchanged since base commit ${PHASE2A_BASE_COMMIT}`);
  }
}

test('buildFreeReviewCtaUrl(homepage) returns approved relative URL', () => {
  assert.equal(
    buildFreeReviewCtaUrl('homepage'),
    '/digital-systems-review?review_source=homepage',
  );
});

test('direct review visits resolve to digital_systems_review_page', () => {
  assert.equal(resolveFreeReviewSourceLocation(null), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation(undefined), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation(''), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation('   '), 'digital_systems_review_page');
  assert.equal(DEFAULT_REVIEW_SOURCE_LOCATION, 'digital_systems_review_page');
});

test('review_source=homepage resolves to homepage', () => {
  assert.equal(resolveFreeReviewSourceLocation('homepage'), 'homepage');
});

test('unknown review_source values resolve to digital_systems_review_page', () => {
  assert.equal(resolveFreeReviewSourceLocation('unknown_place'), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation('HOME PAGE'), 'digital_systems_review_page');
  assert.equal(resolveFreeReviewSourceLocation('hero'), 'digital_systems_review_page');
});

test('full URLs, protocol-relative and malformed values are rejected', () => {
  const rejected = [
    'https://evil.example/x',
    'http://uk.primewayz.com/digital-systems-review',
    '//evil.example',
    '/digital-systems-review',
    '../homepage',
    'homepage%20',
    'homepage&x=1',
    'homepage=extra',
    'homepage,footer',
    'homepage footer',
    { source: 'homepage' },
    42,
    ['homepage', 'footer'],
    ['homepage', 'homepage'],
  ];
  for (const value of rejected) {
    assert.equal(
      resolveFreeReviewSourceLocation(value),
      'digital_systems_review_page',
      `expected reject for ${JSON.stringify(value)}`,
    );
  }
  // Single-item array of an allowlisted value is accepted (getAll length 1).
  assert.equal(resolveFreeReviewSourceLocation(['homepage']), 'homepage');
});

test('canonical review URL remains query-free', () => {
  assert.equal(FREE_REVIEW_ROUTE, '/digital-systems-review');
  assert.equal(DIGITAL_SYSTEMS_REVIEW_PATH, '/digital-systems-review');
  assert.equal(buildFreeReviewCtaUrl('digital_systems_review_page'), '/digital-systems-review');
  assert.equal(FREE_REVIEW_SOURCE_QUERY_PARAM, 'review_source');

  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(
    page,
    /rel="canonical"[^>]*href=\{`https:\/\/uk\.primewayz\.com\$\{DIGITAL_SYSTEMS_REVIEW_PATH\}`\}/,
  );
  assert.doesNotMatch(page, /canonical[\s\S]*review_source/);
});

test('DigitalSystemsReviewPage passes resolved sourceLocation to the form', () => {
  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(page, /useSearchParams/);
  assert.match(page, /resolveFreeReviewSourceLocation/);
  assert.match(page, /FREE_REVIEW_SOURCE_QUERY_PARAM|review_source/);
  assert.match(page, /<DigitalSystemsReviewForm\s+sourceLocation=\{sourceLocation\}\s*\/>/);
  assert.match(page, /free_review_page_view/);
});

test('review form payload uses the sourceLocation prop rather than a hardcoded value', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /sourceLocation\s*=\s*DEFAULT_REVIEW_SOURCE_LOCATION/);
  assert.match(form, /sourceLocation,/);
  assert.doesNotMatch(
    form,
    /sourceLocation:\s*['"]homepage['"]|sourceLocation:\s*['"]digital_systems_review_page['"]/,
  );
  assert.match(form, /payload\s*=\s*\{[\s\S]*sourceLocation,/);
});

test('homepage-originated form payload contains sourceLocation=homepage', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    submissionId: 'phase2ahomepage01',
    name: 'Alex Reviewer',
    workEmail: 'alex@example.co.uk',
    company: 'Example Ltd',
    website: 'https://example.co.uk',
    serviceArea: 'Website Visibility & Conversion',
    context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
    preferredNextStep: 'Email me the recommended next step',
    acknowledgement: true,
    sourceLocation: 'homepage',
  });
  assert.equal(lead.sourceLocation, 'homepage');
});

test('primary hero and closing CTAs emit free_review_cta_click with placements', () => {
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  const hero = read('src/components/Hero.tsx');
  const closing = read('src/components/sections/HomepageContactSection.tsx');

  assert.match(group, /free_review_cta_click/);
  assert.match(group, /ctaPlacement|cta_placement/);
  assert.match(group, /buildFreeReviewCtaUrl/);
  assert.match(group, /FREE_REVIEW_CTA_LABEL/);

  assert.match(hero, /DigitalSystemsReviewCtaGroup/);
  assert.match(hero, /homepage_hero_primary/);
  assert.match(hero, /homepage_hero_secondary/);
  assert.match(hero, /homepage_hero_website_checker/);
  assert.match(hero, /sourceLocation="homepage"/);
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);

  assert.match(closing, /DigitalSystemsReviewCtaGroup/);
  assert.match(closing, /homepage_closing_primary/);
  assert.match(closing, /homepage_closing_secondary/);
  assert.match(closing, /sourceLocation="homepage"/);
});

test('DigitalSystemsReviewCtaGroup derives analytics route from useLocation', () => {
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /import\s*\{[^}]*useLocation[^}]*\}\s*from\s*['"]react-router-dom['"]/);
  assert.match(group, /useLocation\(\)/);
  assert.match(group, /location\.pathname\s*\|\|\s*['"]\/['"]/);
  assert.doesNotMatch(group, /window\.location/);
});

test('homepage CTA analytics payloads keep route "/" with source and placement', () => {
  const primary = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'homepage',
    ctaPlacement: 'homepage_hero_primary',
    route: '/',
  });
  const secondary = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'homepage',
    ctaPlacement: 'homepage_hero_secondary',
    route: '/',
  });
  assert.equal(primary.source_location, 'homepage');
  assert.equal(primary.cta_placement, 'homepage_hero_primary');
  assert.equal(primary.route, '/');
  assert.equal(secondary.source_location, 'homepage');
  assert.equal(secondary.cta_placement, 'homepage_hero_secondary');
  assert.equal(secondary.route, '/');
});

test('secondary actions emit free_review_book_call_click and use trackBookCallClick', () => {
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /free_review_book_call_click/);
  assert.match(group, /trackBookCallClick/);
  assert.match(group, /DISCOVERY_CALL_DESTINATION/);
  assert.match(group, /DISCOVERY_CALL_CTA_LABEL/);
});

test('website-checker tertiary click includes only safe placement, source, route and destination metadata', () => {
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /trackCtaClick\(WEBSITE_CHECKER_CTA_LABEL,\s*websiteCheckerPlacement/);
  assert.match(
    group,
    /trackCtaClick\([\s\S]*cta_placement:\s*websiteCheckerPlacement[\s\S]*source_location:\s*sourceLocation[\s\S]*route[\s\S]*destination:\s*WEBSITE_CHECKER_DESTINATION/,
  );
  assert.doesNotMatch(
    group,
    /trackCtaClick\([\s\S]*(name|email|company|website|submissionId|chatSessionId)\s*:/,
  );
  assert.equal(WEBSITE_CHECKER_DESTINATION, '/uk-sme-digital-visibility-checker');
});

test('CTA analytics include cta_placement but no PII or identifiers', () => {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'homepage',
    ctaPlacement: 'homepage_hero_primary',
    route: '/',
  });
  assert.equal(payload.source_location, 'homepage');
  assert.equal(payload.cta_placement, 'homepage_hero_primary');
  assert.equal(payload.route, '/');
  assertNoProhibitedAnalyticsProps(payload as Record<string, unknown>);
  assert.equal(
    Object.keys(payload).sort().join(','),
    'cta_placement,route,source_location',
  );

  for (const key of [
    'name',
    'email',
    'company',
    'website',
    'submissionId',
    'chatSessionId',
  ]) {
    assert.throws(
      () => assertNoProhibitedAnalyticsProps({ [key]: 'x' }),
      new RegExp(key),
    );
  }

  assert.deepEqual([...FREE_REVIEW_CTA_PLACEMENTS], [
    'homepage_hero_primary',
    'homepage_hero_secondary',
    'homepage_closing_primary',
    'homepage_closing_secondary',
    'homepage_hero_website_checker',
  ]);

  const analytics = read('src/lib/digitalSystemsReview/analytics.ts');
  assert.match(analytics, /import\s+type\s*\{[\s\S]*FreeReviewSourceLocation/);
  assert.match(analytics, /import\s+type\s*\{[\s\S]*FreeReviewCtaPlacement/);
  assert.match(analytics, /sourceLocation\?:\s*FreeReviewSourceLocation/);
  assert.match(analytics, /ctaPlacement\?:\s*FreeReviewCtaPlacement/);
  assert.match(analytics, /source_location\?:\s*FreeReviewSourceLocation/);
  assert.match(analytics, /cta_placement\?:\s*FreeReviewCtaPlacement/);
});

test('HomepageContactSection no longer posts to /api/contact and has no form fields', () => {
  const closing = read('src/components/sections/HomepageContactSection.tsx');
  assert.doesNotMatch(closing, /\/api\/contact/);
  assert.doesNotMatch(closing, /contact_form_start|contact_form_submit/);
  assert.doesNotMatch(closing, /parseUkPhoneNumbers|cleanUkPhoneInput/);
  assert.doesNotMatch(closing, /homepage-contact-name|homepage-contact-email|homepage-contact-phone|homepage-contact-message/);
  assert.doesNotMatch(closing, /<form\b/);
  assert.doesNotMatch(closing, /type="email"|type="tel"|autoComplete="name"/);
  assert.doesNotMatch(closing, /<textarea\b/);
  assert.doesNotMatch(closing, /fetch\s*\(/);
  assert.match(closing, /id="contact"/);
  assert.match(closing, /A practical first step/);
  assert.match(closing, /Not sure which digital system needs attention first/);
  assert.match(closing, /GENERAL_CONTACT_DESTINATION|Contact Primewayz UK/);
  assert.equal(GENERAL_CONTACT_DESTINATION, '/contact-us');
});

test('HomepageContactSection privacy copy is claim-safe and links to the central Privacy Policy', () => {
  const closing = read('src/components/sections/HomepageContactSection.tsx');
  assert.match(closing, /COMPANY_TRUST_LINKS\.privacyPolicy/);
  assert.match(closing, /Privacy Policy/);
  assert.match(
    closing,
    /We handle the information you submit in line with our[\s\S]*Privacy Policy[\s\S]*and use it to review and respond to your request/,
  );
  assert.doesNotMatch(closing, /never share|never shared/i);
  assert.match(closing, /Confidential context|treated confidentially within Primewayz/);
  assert.equal(COMPANY_TRUST_LINKS.privacyPolicy, '/privacy-policy');

  const reviewForm = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(reviewForm, /COMPANY_TRUST_LINKS\.privacyPolicy/);
  assert.match(reviewForm, /I understand that Primewayz will use the information submitted/);
});

test('/contact-us page behaviour remains unchanged (source boundary)', () => {
  const contactPageCandidates = [
    'src/components/ContactUsPage.tsx',
    'src/components/ContactPage.tsx',
    'src/pages/ContactUsPage.tsx',
  ];
  const existing = contactPageCandidates.filter((p) => fs.existsSync(path.join(root, p)));
  assert.ok(existing.length >= 1, 'expected a contact page component');
  for (const file of existing) {
    const source = read(file);
    assert.match(source, /contact|book.?call|enquiry/i);
    assert.doesNotMatch(source, /buildFreeReviewCtaUrl|review_source=homepage/);
  }
});

test('WebsiteProblemSection still points to the visibility checker', () => {
  const section = read('src/components/sections/WebsiteProblemSection.tsx');
  assert.match(section, /buildSelfAuditCtaUrl|uk-sme-digital-visibility-checker/);
  assert.doesNotMatch(section, /buildFreeReviewCtaUrl|digital-systems-review\?review_source/);
  assert.equal(WEBSITE_CHECKER_DESTINATION, '/uk-sme-digital-visibility-checker');
});

test('Navbar, Footer, LiveChat and LazyLiveChat remain unchanged for Phase 2A wiring', () => {
  for (const file of [
    'src/components/Navbar.tsx',
    'src/components/Footer.tsx',
    'src/components/LiveChat.tsx',
    'src/components/LazyLiveChat.tsx',
  ]) {
    assertUnchangedSinceBase(file);
    const source = read(file);
    assert.doesNotMatch(source, /buildFreeReviewCtaUrl/);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
    assert.doesNotMatch(source, /review_source=homepage/);
    assert.doesNotMatch(source, /free_review_cta_click/);
  }
});

test('homepage has exactly one H1 via Hero and preferred next steps remain available', () => {
  const homeCandidates = [
    'src/components/HomePage.tsx',
    'src/pages/HomePage.tsx',
    'src/App.tsx',
  ];
  let homeSource = '';
  for (const candidate of homeCandidates) {
    const full = path.join(root, candidate);
    if (fs.existsSync(full)) {
      homeSource += `\n${fs.readFileSync(full, 'utf8')}`;
    }
  }
  assert.match(homeSource, /<Hero\b|from ['"].*Hero['"]/);

  const hero = read('src/components/Hero.tsx');
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.match(hero, /Reliable digital systems/);

  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Email me the recommended next step'));
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Arrange a short discovery call'));
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [...REVIEW_PREFERRED_NEXT_STEPS]);

  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /REVIEW_PREFERRED_NEXT_STEPS\.map/);
  assert.match(form, /Email me the recommended next step|REVIEW_PREFERRED_NEXT_STEPS/);
  assert.match(form, /navigate\(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH/);
  assert.equal(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH, '/thank-you/digital-systems-review');
  assert.equal(FREE_REVIEW_CTA_LABEL, 'Request a free digital systems review');
});

test('thank-you navigation stays query-free and no storage handoff is used for source', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  const combined = `${form}\n${page}\n${group}`;

  assert.doesNotMatch(form, /navigate\([^)]*review_source/);
  assert.doesNotMatch(combined, /localStorage\.setItem\([^)]*source/i);
  assert.doesNotMatch(page, /localStorage|sessionStorage|history\.state/);
  assert.doesNotMatch(group, /localStorage|sessionStorage/);
});
