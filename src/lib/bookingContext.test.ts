import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOOKING_CONTEXT_QUERY,
  bookingContextAnalyticsPayload,
  buildBookCallUrl,
  resolveBookingContext,
} from './bookingContext';

test('approved booking context round-trips through the contact URL', () => {
  const url = new URL(buildBookCallUrl({
    serviceArea: 'CRM & Workflow Automation',
    sourceRoute: '/crm-automation-support',
    ctaPlacement: 'crm_hero_secondary',
    selectedPlan: 'growth',
  }), 'https://uk.primewayz.com');
  assert.equal(url.pathname, '/contact-us');
  assert.equal(url.hash, '#book-call');
  assert.deepEqual(resolveBookingContext(url.searchParams), {
    serviceArea: 'CRM & Workflow Automation',
    sourceRoute: '/crm-automation-support',
    ctaPlacement: 'crm_hero_secondary',
    selectedPlan: 'growth',
  });
});

test('direct contact visits have an empty booking context', () => {
  assert.deepEqual(resolveBookingContext(new URLSearchParams()), {});
  assert.equal(buildBookCallUrl(), '/contact-us#book-call');
});

test('invalid, duplicated and URL-like attribution values are rejected', () => {
  const params = new URLSearchParams();
  params.append(BOOKING_CONTEXT_QUERY.serviceArea, 'CRM & Workflow Automation');
  params.append(BOOKING_CONTEXT_QUERY.serviceArea, 'Not sure yet');
  params.set(BOOKING_CONTEXT_QUERY.sourceRoute, 'https://attacker.example/');
  params.set(BOOKING_CONTEXT_QUERY.ctaPlacement, 'made_up');
  params.set(BOOKING_CONTEXT_QUERY.selectedPlan, 'unlimited');
  assert.deepEqual(resolveBookingContext(params), {});
});

test('booking analytics payload contains allowlisted non-PII fields only', () => {
  const payload = bookingContextAnalyticsPayload({
    serviceArea: 'Software & Product Engineering',
    sourceRoute: '/pricing',
    ctaPlacement: 'pricing_plan_detail_modal_secondary',
    selectedPlan: 'maintenance-mode',
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    'originating_cta_placement',
    'originating_page',
    'selected_plan',
    'service_interest',
  ]);
  assert.doesNotMatch(JSON.stringify(payload), /name|email|phone|message/i);
});
