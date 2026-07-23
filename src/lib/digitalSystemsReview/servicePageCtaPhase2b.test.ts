import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_REVIEW_CTA_PLACEMENTS,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_ROUTE,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_SERVICE_QUERY_PARAM,
  FREE_REVIEW_SOURCE_QUERY_PARAM,
  FREE_REVIEW_THANK_YOU_ROUTE,
  buildFreeReviewCtaUrl,
  resolveFreeReviewServiceArea,
  resolveFreeReviewSourceLocation,
} from '../../constants/conversionCta.ts';
import {
  DIGITAL_SYSTEMS_REVIEW_PATH,
  DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,
  REVIEW_PREFERRED_NEXT_STEPS,
  REVIEW_SERVICE_AREAS,
} from '../../constants/digitalSystemsReview.ts';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import { validateAndNormalizeDigitalSystemsReviewLead } from './validateReviewLead.ts';
import { SDAAS_CAPACITY_REQUEST_PATH } from '../../data/sdaas/commercialPage.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function parseReviewQuery(url: string): URLSearchParams {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return new URLSearchParams(query);
}

const SERVICE_ROUTE_MAPPINGS = [
  {
    route: '/website-visibility-support',
    file: 'src/components/WebsiteMaintenanceSubscriptionUkPage.tsx',
    serviceArea: 'Website Visibility & Conversion',
    placements: [
      'website_visibility_hero_primary',
      'website_visibility_hero_secondary',
      'website_visibility_final_primary',
      'website_visibility_final_secondary',
    ],
  },
  {
    route: '/maintenance',
    file: 'src/components/WebsiteMaintenanceSubscriptionUkPage.tsx',
    serviceArea: 'Managed Application & Website Support',
    placements: [
      'managed_support_hero_primary',
      'managed_support_hero_secondary',
      'managed_support_final_primary',
      'managed_support_final_secondary',
    ],
  },
  {
    route: '/crm-automation-support',
    file: 'src/components/CrmIntegrationSupportUkPage.tsx',
    serviceArea: 'CRM & Workflow Automation',
    placements: ['crm_hero_primary', 'crm_hero_secondary', 'crm_final_primary', 'crm_final_secondary'],
  },
  {
    route: '/software-development-subscription-uk',
    file: 'src/components/SoftwareDevelopmentSubscriptionUkPage.tsx',
    serviceArea: 'Software & Product Engineering',
    placements: ['software_review_primary', 'software_review_secondary'],
  },
  {
    route: '/remote-it-resources',
    file: 'src/components/RemoteItResourceAugmentationPage.tsx',
    serviceArea: 'Remote IT Team Extension',
    placements: [
      'remote_it_hero_primary',
      'remote_it_hero_secondary',
      'remote_it_final_primary',
      'remote_it_final_secondary',
    ],
  },
  {
    route: '/services',
    file: 'src/components/ServicesPage.tsx',
    serviceArea: 'Not sure yet',
    sourceLocation: 'services_page',
    placements: [
      'services_hero_primary',
      'services_hero_secondary',
      'services_final_primary',
      'services_final_secondary',
    ],
  },
] as const;

test('service_page + each approved service area creates a safe relative URL', () => {
  for (const serviceArea of FREE_REVIEW_SERVICE_AREAS) {
    if (serviceArea === 'Not sure yet') continue;
    const url = buildFreeReviewCtaUrl('service_page', serviceArea);
    assert.match(url, /^\/digital-systems-review\?/);
    assert.doesNotMatch(url, /^https?:/i);
    assert.doesNotMatch(url, /^\/\//);
    const params = parseReviewQuery(url);
    assert.equal(params.get(FREE_REVIEW_SOURCE_QUERY_PARAM), 'service_page');
    assert.equal(params.get(FREE_REVIEW_SERVICE_QUERY_PARAM), serviceArea);
  }
});

test('services_page + Not sure yet creates a safe relative URL', () => {
  const url = buildFreeReviewCtaUrl('services_page', 'Not sure yet');
  const params = parseReviewQuery(url);
  assert.equal(params.get(FREE_REVIEW_SOURCE_QUERY_PARAM), 'services_page');
  assert.equal(params.get(FREE_REVIEW_SERVICE_QUERY_PARAM), 'Not sure yet');
  assert.match(url, /^\/digital-systems-review\?/);
});

test('ampersands and spaces are URL encoded correctly', () => {
  const url = buildFreeReviewCtaUrl('service_page', 'CRM & Workflow Automation');
  assert.match(url, /review_service=/);
  assert.match(url, /%26/);
  const params = parseReviewQuery(url);
  assert.equal(params.get('review_service'), 'CRM & Workflow Automation');
  assert.equal(params.get('review_source'), 'service_page');
});

test('unknown service values produce no preselection', () => {
  assert.equal(resolveFreeReviewServiceArea('Unknown Service'), null);
  assert.equal(resolveFreeReviewServiceArea(''), null);
  assert.equal(resolveFreeReviewServiceArea('   '), null);
  assert.equal(resolveFreeReviewServiceArea(null), null);
  assert.equal(resolveFreeReviewServiceArea(undefined), null);
  assert.equal(resolveFreeReviewServiceArea(42), null);
  assert.equal(resolveFreeReviewServiceArea({ area: 'CRM & Workflow Automation' }), null);
  assert.equal(resolveFreeReviewSourceLocation('service_page'), 'service_page');
  assert.equal(
    buildFreeReviewCtaUrl('service_page'),
    '/digital-systems-review?review_source=service_page',
  );
});

test('every array passed to resolveFreeReviewServiceArea returns null', () => {
  assert.equal(resolveFreeReviewServiceArea(['CRM & Workflow Automation']), null);
  assert.equal(
    resolveFreeReviewServiceArea(['CRM & Workflow Automation', 'Not sure yet']),
    null,
  );
  assert.equal(
    resolveFreeReviewServiceArea(['CRM & Workflow Automation', 'CRM & Workflow Automation']),
    null,
  );
  assert.equal(resolveFreeReviewServiceArea([]), null);
  assert.equal(resolveFreeReviewServiceArea(['Not sure yet']), null);
  for (const serviceArea of FREE_REVIEW_SERVICE_AREAS) {
    assert.equal(resolveFreeReviewServiceArea([serviceArea]), null);
  }
});

test('repeated review_service values are rejected', () => {
  assert.equal(
    resolveFreeReviewServiceArea(['CRM & Workflow Automation', 'Not sure yet']),
    null,
  );
  assert.equal(
    resolveFreeReviewServiceArea(['CRM & Workflow Automation', 'CRM & Workflow Automation']),
    null,
  );
  assert.equal(resolveFreeReviewServiceArea(['CRM & Workflow Automation']), null);

  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(
    page,
    /rawValues\.length > 1[\s\S]*resolveFreeReviewServiceArea\(rawValues\)/,
  );
  assert.match(
    page,
    /return resolveFreeReviewServiceArea\(rawValues\[0\]\)/,
  );
});

test('exactly one string query value is accepted for review_service', () => {
  for (const serviceArea of FREE_REVIEW_SERVICE_AREAS) {
    assert.equal(resolveFreeReviewServiceArea(serviceArea), serviceArea);
  }
  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(page, /searchParams\.getAll\(FREE_REVIEW_SERVICE_QUERY_PARAM\)/);
  assert.match(page, /rawValues\.length === 0/);
  assert.match(page, /rawValues\.length > 1/);
  assert.match(page, /resolveFreeReviewServiceArea\(rawValues\[0\]\)/);
});

test('full and protocol-relative URLs are rejected for service values', () => {
  for (const value of [
    'https://evil.example/x',
    'http://uk.primewayz.com/digital-systems-review',
    '//evil.example',
    'CRM & Workflow Automation://bad',
  ]) {
    assert.equal(resolveFreeReviewServiceArea(value), null, `expected reject for ${value}`);
  }
});

test('invalid service does not override a valid source', () => {
  assert.equal(resolveFreeReviewSourceLocation('service_page'), 'service_page');
  assert.equal(resolveFreeReviewServiceArea('not-a-real-area'), null);
  assert.equal(resolveFreeReviewServiceArea('Unknown Service'), null);
  const url = buildFreeReviewCtaUrl('service_page', 'CRM & Workflow Automation');
  const params = parseReviewQuery(url);
  assert.equal(params.get('review_source'), 'service_page');
  assert.equal(params.get('review_service'), 'CRM & Workflow Automation');
  // Invalid values never reach the typed CTA builder; resolve independently.
  assert.equal(resolveFreeReviewServiceArea('not-a-real-area'), null);
  assert.equal(
    buildFreeReviewCtaUrl('service_page'),
    '/digital-systems-review?review_source=service_page',
  );
});

test('homepage Phase 2A URL remains unchanged', () => {
  assert.equal(
    buildFreeReviewCtaUrl('homepage'),
    '/digital-systems-review?review_source=homepage',
  );
  assert.equal(resolveFreeReviewSourceLocation('homepage'), 'homepage');
});

test('canonical and thank-you URLs remain query-free', () => {
  assert.equal(FREE_REVIEW_ROUTE, '/digital-systems-review');
  assert.equal(DIGITAL_SYSTEMS_REVIEW_PATH, '/digital-systems-review');
  assert.equal(FREE_REVIEW_THANK_YOU_ROUTE, '/thank-you/digital-systems-review');
  assert.equal(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH, '/thank-you/digital-systems-review');
  assert.equal(buildFreeReviewCtaUrl('digital_systems_review_page'), '/digital-systems-review');

  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(
    page,
    /rel="canonical"[^>]*href=\{`https:\/\/uk\.primewayz\.com\$\{DIGITAL_SYSTEMS_REVIEW_PATH\}`\}/,
  );
  assert.doesNotMatch(page, /canonical[\s\S]{0,120}review_source|canonical[\s\S]{0,120}review_service/);

  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /navigate\(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH/);
  assert.doesNotMatch(form, /navigate\([^)]*review_source|navigate\([^)]*review_service/);
});

test('DigitalSystemsReviewPage resolves approved service values and passes initialServiceArea', () => {
  const page = read('src/components/DigitalSystemsReviewPage.tsx');
  assert.match(page, /FREE_REVIEW_SERVICE_QUERY_PARAM|review_service/);
  assert.match(page, /resolveFreeReviewServiceArea/);
  assert.match(page, /initialServiceArea/);
  assert.match(
    page,
    /<DigitalSystemsReviewForm[\s\S]*sourceLocation=\{sourceLocation\}[\s\S]*initialServiceArea=\{initialServiceArea/,
  );
  assert.match(page, /free_review_page_view/);
  assert.match(page, /initialServiceArea \? \{ serviceArea: initialServiceArea \}/);

  for (const serviceArea of FREE_REVIEW_SERVICE_AREAS) {
    assert.equal(resolveFreeReviewServiceArea(serviceArea), serviceArea);
  }
});

test('direct review visits do not force a service area', () => {
  assert.equal(resolveFreeReviewServiceArea(null), null);
  assert.equal(resolveFreeReviewServiceArea(undefined), null);
  assert.equal(resolveFreeReviewServiceArea(''), null);
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /initialServiceArea\?:/);
  assert.match(form, /serviceArea:\s*initialServiceArea\s*\?\?\s*['"]['"]/);
});

test('form initialises from initialServiceArea and remains editable', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /initialServiceArea/);
  assert.match(form, /useState<FormState>\(\(\)\s*=>/);
  assert.match(form, /update\(/);
  assert.match(form, /REVIEW_SERVICE_AREAS\.map/);
  assert.doesNotMatch(form, /setForm\([\s\S]*initialServiceArea/);
});

test('submitted payload contains final service selection and sourceLocation', () => {
  for (const sourceLocation of ['service_page', 'services_page'] as const) {
    const lead = validateAndNormalizeDigitalSystemsReviewLead({
      submissionId: `phase2b${sourceLocation}01`.slice(0, 32),
      name: 'Alex Reviewer',
      workEmail: 'alex@example.co.uk',
      company: 'Example Ltd',
      website: 'https://example.co.uk',
      serviceArea: 'CRM & Workflow Automation',
      context: 'Lead routing is inconsistent and follow-up still depends on spreadsheets across the team.',
      preferredNextStep: 'Email me the recommended next step',
      acknowledgement: true,
      sourceLocation,
    });
    assert.equal(lead.sourceLocation, sourceLocation);
    assert.equal(lead.serviceArea, 'CRM & Workflow Automation');
  }
});

test('both preferred-next-step options remain available', () => {
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Email me the recommended next step'));
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Arrange a short discovery call'));
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [...REVIEW_PREFERRED_NEXT_STEPS]);
  assert.equal(FREE_REVIEW_PREFERRED_NEXT_STEPS.length, 2);
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /REVIEW_PREFERRED_NEXT_STEPS\.map/);
});

test('route mappings and CTA placements are wired for each service journey', () => {
  for (const mapping of SERVICE_ROUTE_MAPPINGS) {
    const source = read(mapping.file);
    assert.match(source, /DigitalSystemsReviewCtaGroup/);
    assert.match(source, new RegExp(mapping.serviceArea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const expectedSource =
      'sourceLocation' in mapping ? mapping.sourceLocation : 'service_page';
    assert.match(source, new RegExp(`sourceLocation="${expectedSource}"`));
    for (const placement of mapping.placements) {
      assert.ok(
        FREE_REVIEW_CTA_PLACEMENTS.includes(placement),
        `${placement} must be in FREE_REVIEW_CTA_PLACEMENTS`,
      );
      assert.match(source, new RegExp(placement));
    }
    assert.equal((source.match(/<h1\b/g) || []).length, 1, `${mapping.route} must keep one H1`);
  }

  const maintenance = read('src/components/WebsiteMaintenanceSubscriptionUkPage.tsx');
  assert.match(maintenance, /Website Visibility & Conversion/);
  assert.match(maintenance, /Managed Application & Website Support/);
  assert.match(maintenance, /isVisibilityPage/);
  assert.match(maintenance, /\/maintenance/);
  assert.match(maintenance, /\/website-visibility-support/);
});

test('services hub hero and final review CTAs work', () => {
  const page = read('src/components/ServicesPage.tsx');
  assert.match(page, /services_hero_primary/);
  assert.match(page, /services_final_primary/);
  assert.match(page, /serviceArea="Not sure yet"/);
  assert.match(page, /sourceLocation="services_page"/);
  assert.match(page, /View engagement options/);
  assert.doesNotMatch(page, /Discuss Your Digital Priorities/);
  assert.match(page, /SelfAuditCta/);
  assert.match(page, /uk-sme-digital-visibility-checker/);
});

test('website visibility, maintenance, CRM and remote IT review CTAs work', () => {
  const visibility = read('src/components/WebsiteMaintenanceSubscriptionUkPage.tsx');
  assert.match(visibility, /website_visibility_hero_primary/);
  assert.match(visibility, /website_visibility_final_primary/);
  assert.match(visibility, /managed_support_hero_primary/);
  assert.match(visibility, /managed_support_final_primary/);
  assert.doesNotMatch(visibility, /Book a website visibility review/);
  assert.doesNotMatch(visibility, /Book a managed support review/);

  const crm = read('src/components/CrmIntegrationSupportUkPage.tsx');
  assert.match(crm, /crm_hero_primary/);
  assert.match(crm, /crm_final_primary/);
  assert.match(crm, /View CRM support areas/);
  assert.doesNotMatch(crm, /Book a CRM integration review|Book CRM integration consultation/);
  assert.match(crm, /SelfAuditCta/);

  const remote = read('src/components/RemoteItResourceAugmentationPage.tsx');
  assert.match(remote, /remote_it_hero_primary/);
  assert.match(remote, /remote_it_final_primary/);
  assert.match(remote, /#remote-it-resources/);
  assert.doesNotMatch(
    remote,
    /buildInternalUtmUrl\(\s*['"]\/remote-it-resources['"]/,
  );
  assert.match(remote, /SelfAuditCta/);
});

test('software contextual review CTA works while capacity funnel is preserved', () => {
  const page = read('src/components/SoftwareDevelopmentSubscriptionUkPage.tsx');
  assert.match(page, /software_review_primary/);
  assert.match(page, /software_review_secondary/);
  assert.match(page, /Software & Product Engineering/);
  assert.match(page, /Not ready to choose a delivery model\?/);
  assert.match(page, /Start with a review of your software priorities/);
  assert.match(page, /CapacityCtaLink/);
  assert.match(page, /location="hero_primary"/);
  assert.match(page, /location="final_cta"/);
  assert.match(page, /SDAAS_CAPACITY_REQUEST_PATH|request-capacity/);
  assert.match(page, /sdaas_cta_click|trackSdaasEvent/);
  assert.match(page, /AuthorityProofSection/);
  assert.equal(SDAAS_CAPACITY_REQUEST_PATH, '/software-development-subscription-uk/request-capacity');
});

test('review CTA analytics include approved source, placement, route and service_area', () => {
  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /serviceArea\?:/);
  assert.match(group, /buildFreeReviewCtaUrl\(sourceLocation,\s*serviceArea\)/);
  assert.match(group, /free_review_cta_click/);
  assert.match(group, /free_review_book_call_click/);
  assert.match(group, /emitReviewCtaClick\([\s\S]*serviceArea/);
  assert.match(group, /variant === 'onDark'|variant="onDark"|'onDark'/);
  assert.match(group, /FreeReviewServiceArea/);
  assert.match(group, /FreeReviewSourceLocation/);
  assert.match(group, /FreeReviewCtaPlacement/);

  const analytics = read('src/lib/digitalSystemsReview/analytics.ts');
  assert.match(analytics, /service_area\?: FreeReviewServiceArea/);
  assert.match(analytics, /serviceArea\?: FreeReviewServiceArea/);
  assert.match(analytics, /sourceLocation\?: FreeReviewSourceLocation/);
  assert.match(analytics, /ctaPlacement\?: FreeReviewCtaPlacement/);
  assert.match(
    analytics,
    /import type \{[\s\S]*FreeReviewServiceArea[\s\S]*\} from ['"]\.\.\/\.\.\/constants\/conversionCta['"]/,
  );

  for (const serviceArea of FREE_REVIEW_SERVICE_AREAS) {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation: 'service_page',
      ctaPlacement: 'crm_hero_primary',
      route: '/crm-automation-support',
      serviceArea,
    });
    assert.equal(payload.service_area, serviceArea);
    assert.equal(payload.source_location, 'service_page');
    assert.equal(payload.cta_placement, 'crm_hero_primary');
    assertNoProhibitedAnalyticsProps(payload);
  }

  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'service_page',
    ctaPlacement: 'crm_hero_primary',
    route: '/crm-automation-support',
    serviceArea: 'CRM & Workflow Automation',
  });
  assert.equal(payload.source_location, 'service_page');
  assert.equal(payload.cta_placement, 'crm_hero_primary');
  assert.equal(payload.route, '/crm-automation-support');
  assert.equal(payload.service_area, 'CRM & Workflow Automation');
  assertNoProhibitedAnalyticsProps(payload);

  const withoutService = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'homepage',
    ctaPlacement: 'homepage_hero_primary',
    route: '/',
  });
  assert.equal(withoutService.service_area, undefined);
  assert.equal(withoutService.source_location, 'homepage');
  assert.equal(withoutService.cta_placement, 'homepage_hero_primary');
});

test('invalid service values do not appear in analytics', () => {
  assert.equal(resolveFreeReviewServiceArea('Magic SEO Package'), null);
  assert.equal(resolveFreeReviewServiceArea('Unknown Service'), null);
  assert.equal(resolveFreeReviewServiceArea(['CRM & Workflow Automation']), null);

  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /resolveFreeReviewServiceArea\(form\.serviceArea\)/);
  assert.match(form, /analyticsServiceArea/);
  assert.match(
    form,
    /buildDigitalSystemsReviewAnalyticsPayload\(\{[\s\S]*?serviceArea:\s*analyticsServiceArea\(\)/,
  );
  assert.doesNotMatch(
    form,
    /buildDigitalSystemsReviewAnalyticsPayload\(\{[^}]*serviceArea:\s*form\.serviceArea/,
  );

  const homepagePayload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'homepage',
    ctaPlacement: 'homepage_hero_primary',
    route: '/',
  });
  assert.equal(homepagePayload.service_area, undefined);
  assert.equal('service_area' in homepagePayload, false);
});

test('homepage CTA analytics remain service-area-free', () => {
  const hero = read('src/components/Hero.tsx');
  assert.match(hero, /sourceLocation="homepage"/);
  assert.doesNotMatch(hero, /serviceArea=/);

  for (const placement of [
    'homepage_hero_primary',
    'homepage_hero_secondary',
    'homepage_closing_primary',
    'homepage_closing_secondary',
  ] as const) {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation: 'homepage',
      ctaPlacement: placement,
      route: '/',
    });
    assert.equal(payload.service_area, undefined);
    assert.equal(payload.source_location, 'homepage');
    assert.equal(payload.cta_placement, placement);
    assert.equal(payload.route, '/');
  }
});

test('no PII or identifiers enter CTA analytics', () => {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'services_page',
    ctaPlacement: 'services_hero_primary',
    route: '/services',
    serviceArea: 'Not sure yet',
  });
  assertNoProhibitedAnalyticsProps(payload);
  for (const key of [
    'name',
    'email',
    'workEmail',
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
});

test('software capacity-request CTAs remain unchanged', () => {
  const page = read('src/components/SoftwareDevelopmentSubscriptionUkPage.tsx');
  assert.match(page, /CapacityCtaLink/);
  assert.match(page, /location="hero_primary"/);
  assert.match(page, /location="final_cta"/);
  assert.match(page, /SDAAS_CAPACITY_REQUEST_PATH|request-capacity/);
  assert.match(page, /sdaas_cta_click|trackSdaasEvent/);
  assert.equal(SDAAS_CAPACITY_REQUEST_PATH, '/software-development-subscription-uk/request-capacity');
  assert.match(page, /software_review_primary/);
  assert.match(page, /serviceArea="Software & Product Engineering"/);
});

test('Navbar, Footer, LiveChat, LazyLiveChat and ProfessionalServicesCrmSupportUkPage remain untouched', () => {
  for (const file of [
    'src/components/Navbar.tsx',
    'src/components/Footer.tsx',
    'src/components/LiveChat.tsx',
    'src/components/LazyLiveChat.tsx',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /buildFreeReviewCtaUrl/);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
    assert.doesNotMatch(source, /review_service=/);
    assert.doesNotMatch(source, /FREE_REVIEW_SERVICE_QUERY_PARAM/);
  }

  const professional = 'src/components/ProfessionalServicesCrmSupportUkPage.tsx';
  assert.ok(fs.existsSync(path.join(root, professional)));
  const source = read(professional);
  assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(source, /review_service=/);
  assert.doesNotMatch(source, /buildFreeReviewCtaUrl/);
});

test('preservation: SelfAuditCta, authority proof, contact, chrome and Phase 2A remain', () => {
  for (const file of [
    'src/components/ServicesPage.tsx',
    'src/components/WebsiteMaintenanceSubscriptionUkPage.tsx',
    'src/components/CrmIntegrationSupportUkPage.tsx',
    'src/components/RemoteItResourceAugmentationPage.tsx',
  ]) {
    assert.match(read(file), /SelfAuditCta/);
  }

  for (const file of [
    'src/components/WebsiteMaintenanceSubscriptionUkPage.tsx',
    'src/components/CrmIntegrationSupportUkPage.tsx',
    'src/components/SoftwareDevelopmentSubscriptionUkPage.tsx',
    'src/components/RemoteItResourceAugmentationPage.tsx',
  ]) {
    assert.match(read(file), /AuthorityProofSection/);
  }

  const contactCandidates = [
    'src/components/ContactUsPage.tsx',
    'src/components/ContactPage.tsx',
  ];
  const contactFile = contactCandidates.find((p) => fs.existsSync(path.join(root, p)));
  assert.ok(contactFile, 'expected a contact page component');
  const contact = read(contactFile!);
  assert.doesNotMatch(contact, /buildFreeReviewCtaUrl|review_service=/);

  const hero = read('src/components/Hero.tsx');
  assert.match(hero, /sourceLocation="homepage"/);
  assert.doesNotMatch(hero, /serviceArea=/);
  assert.match(hero, /homepage_hero_primary/);

  assert.deepEqual([...REVIEW_SERVICE_AREAS], [...FREE_REVIEW_SERVICE_AREAS]);
});
