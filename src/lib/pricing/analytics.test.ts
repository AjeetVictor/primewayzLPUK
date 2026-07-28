import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSafeAnalyticsPayload,
  PROHIBITED_ANALYTICS_KEYS,
  resetPricingAnalyticsGuardForTests,
  trackLeadFormStart,
  trackPricingPageView,
} from './analytics';

test('pricing analytics prohibited keys are defined', () => {
  assert.ok(PROHIBITED_ANALYTICS_KEYS.includes('email'));
  assert.ok(PROHIBITED_ANALYTICS_KEYS.includes('name'));
});

test('buildSafeAnalyticsPayload rejects PII keys', () => {
  assert.throws(() => buildSafeAnalyticsPayload({ email: 'test@example.com' }));
});

test('trackPricingPageView builds payload without PII', () => {
  resetPricingAnalyticsGuardForTests();
  assert.doesNotThrow(() =>
    trackPricingPageView({ page_path: '/pricing', section_name: 'pricing_page' }),
  );
});

test('trackLeadFormStart accepts journey metadata without PII', () => {
  resetPricingAnalyticsGuardForTests();
  assert.doesNotThrow(() =>
    trackLeadFormStart({
      form_name: 'digital_systems_review',
      page_path: '/digital-systems-review',
      journey_type: 'digital_systems_review',
      service_interest: 'Website updates',
    }),
  );
});
