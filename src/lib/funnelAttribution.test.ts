import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFunnelAttribution } from './funnelAttribution';
import { normalizeUtmValue, readUtmParamsFromSearch } from './utm';

test('funnel attribution contains only safe standardized route and placement fields', () => {
  assert.deepEqual(
    buildFunnelAttribution({
      serviceInterest: 'Software & Product Engineering',
      sourcePage: '/pricing?email=private@example.com',
      submissionPage: '/contact-us#form',
      ctaPlacement: 'pricing_plan_detail_modal_secondary',
      selectedPlan: 'essential',
    }),
    {
      service_interest: 'Software & Product Engineering',
      source_page: '/pricing',
      submission_page: '/contact-us',
      cta_location: 'pricing_plan_detail_modal_secondary',
      selected_plan: 'essential',
    },
  );
});

test('funnel attribution rejects external routes, PII-like labels and unknown pricing plans', () => {
  assert.deepEqual(
    buildFunnelAttribution({
      serviceInterest: 'person@example.com',
      sourcePage: '//external.example/path',
      submissionPage: 'https://external.example/',
      ctaPlacement: '12345678901',
      selectedPlan: 'not-a-plan',
    }),
    { source_page: '/' },
  );
});

test('UTM values are bounded, control-free and reject obvious email values', () => {
  assert.equal(normalizeUtmValue(`  campaign\n${'x'.repeat(200)}  `)?.length, 160);
  assert.equal(normalizeUtmValue('person@example.com'), null);
  assert.deepEqual(readUtmParamsFromSearch('?utm_source=%0Agoogle%20ads&utm_campaign=summer'), {
    utm_source: 'google ads',
    utm_medium: null,
    utm_campaign: 'summer',
    utm_content: null,
    utm_term: null,
  });
});
