import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_ROUTE,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_SOURCE_LOCATIONS,
  FREE_REVIEW_THANK_YOU_ROUTE,
  PHASE2_CTA_ROLLOUT_FILES,
  WEBSITE_CHECKER_CTA_LABEL,
  WEBSITE_CHECKER_DESTINATION,
} from '../../constants/conversionCta.ts';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes.ts';
import {
  DEFAULT_REVIEW_SOURCE_LOCATION,
  DIGITAL_SYSTEMS_REVIEW_PATH,
  DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,
  REVIEW_PREFERRED_NEXT_STEPS,
  REVIEW_SERVICE_AREAS,
} from '../../constants/digitalSystemsReview.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

test('conversion config exposes approved labels and routes', () => {
  assert.equal(FREE_REVIEW_CTA_LABEL, 'Request a free digital systems review');
  assert.equal(DISCOVERY_CALL_CTA_LABEL, 'Book a discovery call');
  assert.equal(WEBSITE_CHECKER_CTA_LABEL, 'Run the free website visibility check');
  assert.equal(FREE_REVIEW_ROUTE, '/digital-systems-review');
  assert.equal(FREE_REVIEW_THANK_YOU_ROUTE, '/thank-you/digital-systems-review');
  assert.equal(DIGITAL_SYSTEMS_REVIEW_PATH, FREE_REVIEW_ROUTE);
  assert.equal(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH, FREE_REVIEW_THANK_YOU_ROUTE);
  assert.equal(CANONICAL_ROUTES.digitalSystemsReview, FREE_REVIEW_ROUTE);
  assert.equal(CANONICAL_ROUTES.digitalSystemsReviewThankYou, FREE_REVIEW_THANK_YOU_ROUTE);
  assert.equal(DISCOVERY_CALL_DESTINATION, '/contact-us#book-call');
  assert.equal(WEBSITE_CHECKER_DESTINATION, '/uk-sme-digital-visibility-checker');
});

test('service and next-step allowlists match approved copy', () => {
  assert.deepEqual([...FREE_REVIEW_SERVICE_AREAS], [...REVIEW_SERVICE_AREAS]);
  assert.ok(REVIEW_SERVICE_AREAS.includes('Not sure yet'));
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Email me the recommended next step'));
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Arrange a short discovery call'));
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [...REVIEW_PREFERRED_NEXT_STEPS]);
});

test('source location allowlist includes required values and defaults to page', () => {
  for (const value of [
    'digital_systems_review_page',
    'chat_widget',
    'homepage',
    'navigation',
    'footer',
    'services_page',
    'service_page',
    'success_story',
    'article',
    'website_checker',
  ]) {
    assert.ok(FREE_REVIEW_SOURCE_LOCATIONS.includes(value as never), value);
  }
  assert.equal(DEFAULT_REVIEW_SOURCE_LOCATION, 'digital_systems_review_page');
  assert.notEqual(DEFAULT_REVIEW_SOURCE_LOCATION, 'chat_widget');
});

test('configuration does not introduce phone, budget, or company-size fields', () => {
  const configSource = fs.readFileSync(
    path.join(root, 'src/constants/conversionCta.ts'),
    'utf8',
  );
  const reviewConstants = fs.readFileSync(
    path.join(root, 'src/constants/digitalSystemsReview.ts'),
    'utf8',
  );
  const combined = `${configSource}\n${reviewConstants}`;
  assert.doesNotMatch(combined, /\bphone\b/i);
  assert.doesNotMatch(combined, /\bbudget\b/i);
  assert.doesNotMatch(combined, /company[-_ ]?size/i);
  assert.ok(PHASE2_CTA_ROLLOUT_FILES.length > 0);
});
