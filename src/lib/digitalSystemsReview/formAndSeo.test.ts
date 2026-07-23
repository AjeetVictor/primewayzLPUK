import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import {
  normalizeOptionalChatSessionId,
  readOptionalChatSessionIdFromStorage,
} from './chatSessionId.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

test('form source has accessible labels, acknowledgement, honeypot, and no chat identity prefill', () => {
  const formPath = path.join(root, 'src/components/forms/DigitalSystemsReviewForm.tsx');
  const source = fs.readFileSync(formPath, 'utf8');

  assert.match(source, /htmlFor=/);
  assert.match(source, /autoComplete=/);
  assert.match(source, /errorSummaryRef|error-summary/);
  assert.match(source, /companyWebsite/);
  assert.match(source, /acknowledgement/);
  assert.match(source, /I understand that Primewayz will use the information submitted/);
  assert.match(source, /Privacy Policy/);
  assert.match(source, /submittingLockRef/);
  assert.match(source, /createSubmissionId|submissionId/);
  assert.match(source, /readOptionalChatSessionIdFromStorage/);
  assert.match(source, /getFirstUtmParams|firstTouchAttribution/);
  assert.match(source, /getLatestUtmParams|latestTouchAttribution/);
  assert.match(source, /writeFreeReviewSuccessMarker/);
  assert.match(source, /DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH/);
  assert.match(source, /maxLength=\{REVIEW_FIELD_LIMITS\.nameMax\}/);
  assert.match(source, /maxLength=\{REVIEW_FIELD_LIMITS\.emailMax\}/);
  assert.match(source, /errorIds\.website|website-error/);
  assert.match(source, /mapClientUtmParamsToAttribution/);
  assert.match(source, /Website is too long|valid website URL/);
  assert.doesNotMatch(source, /chat_user_name|chat_user_email/);
  assert.doesNotMatch(source, /\bphone\b/i);
  assert.doesNotMatch(source, /\bbudget\b/i);
  assert.doesNotMatch(source, /companySize|company size/i);
  assert.doesNotMatch(source, /navigate\([^)]*state\s*:/);
  assert.doesNotMatch(source, /localStorage\.setItem/);
});

test('analytics payload excludes prohibited PII and identifiers', () => {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'digital_systems_review_page',
    serviceArea: 'Website Visibility & Conversion',
    preferredNextStep: 'Email me the recommended next step',
    route: '/digital-systems-review',
    resultCategory: 'created',
    errorCategory: 'validation',
  });
  assert.equal(payload.source_location, 'digital_systems_review_page');
  assert.equal(payload.service_area, 'Website Visibility & Conversion');
  assertNoProhibitedAnalyticsProps(payload as Record<string, unknown>);
  assert.throws(
    () => assertNoProhibitedAnalyticsProps({ chatSessionId: 'x' }),
    /chatSessionId/,
  );
  assert.throws(
    () => assertNoProhibitedAnalyticsProps({ submissionId: 'x' }),
    /submissionId/,
  );
});

test('optional chat session storage read is safe', () => {
  assert.equal(readOptionalChatSessionIdFromStorage(null), undefined);
  const store = new Map<string, string>();
  const fakeStorage = {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
  };
  assert.equal(readOptionalChatSessionIdFromStorage(fakeStorage), undefined);
  store.set('chat_session_id', 'opaque99');
  assert.equal(readOptionalChatSessionIdFromStorage(fakeStorage), 'opaque99');
  assert.equal(normalizeOptionalChatSessionId('opaque99'), 'opaque99');
});

test('landing and thank-you pages keep claim-safe copy and one H1 each', () => {
  const landing = fs.readFileSync(
    path.join(root, 'src/components/DigitalSystemsReviewPage.tsx'),
    'utf8',
  );
  const thankYou = fs.readFileSync(
    path.join(root, 'src/components/DigitalSystemsReviewThankYouPage.tsx'),
    'utf8',
  );

  assert.equal((landing.match(/<h1\b/g) || []).length, 1);
  assert.equal((thankYou.match(/<h1\b/g) || []).length, 1);
  assert.match(landing, /Free initial review/);
  assert.match(landing, /What you’ll receive|What you'll receive/);
  assert.match(landing, /not an authenticated technical audit/);
  assert.match(thankYou, /buildConfirmationHeading|GENERIC_CONFIRMATION_HEADING/);
  assert.match(thankYou, /Return to services/);
  assert.match(thankYou, /DISCOVERY_CALL_CTA_LABEL/);
  assert.match(thankYou, /consumeFreeReviewSuccessMarker/);
  assert.match(landing, /free_review_book_call_click/);
  assert.match(landing, /onBookCallClick/);
  assert.match(landing, /useSearchParams/);
  assert.match(landing, /resolveFreeReviewSourceLocation/);
  assert.match(landing, /sourceLocation=\{sourceLocation\}/);

  const confirmation = fs.readFileSync(
    path.join(root, 'src/lib/digitalSystemsReview/confirmationSummary.ts'),
    'utf8',
  );
  assert.match(confirmation, /Thank you — your review request has been received/);

  const combined = `${landing}\n${thankYou}`;
  assert.match(combined, /It is not an authenticated technical audit,\s*security assessment or implementation estimate/);
  assert.doesNotMatch(combined, /\bguaranteed\b/i);
  assert.doesNotMatch(combined, /within one UK business day|response within/i);
  assert.doesNotMatch(combined, /\bNDA\b/);
  assert.doesNotMatch(combined, /improve your ranking|conversion rate|cost savings/i);
  assert.doesNotMatch(combined, /AggregateRating|FAQPage|"@type":\s*"Product"/);
});

test('sitemap includes review landing without invented lastmod and excludes thank-you', () => {
  const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/uk\.primewayz\.com\/digital-systems-review/);
  assert.doesNotMatch(sitemap, /thank-you\/digital-systems-review/);
  const blockMatch = sitemap.match(
    /<url>\s*<loc>https:\/\/uk\.primewayz\.com\/digital-systems-review<\/loc>[\s\S]*?<\/url>/,
  );
  assert.ok(blockMatch);
  assert.doesNotMatch(blockMatch![0], /<lastmod>/);
});

test('server SEO strings and API wiring are present', () => {
  const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
  assert.match(server, /Free Digital Systems Review for UK SMEs \| Primewayz/);
  assert.match(server, /Digital Systems Review Request Received \| Primewayz/);
  assert.match(server, /thank-you\/digital-systems-review/);
  assert.match(server, /noindex[\s\S]*thank-you\/digital-systems-review|thank-you\/digital-systems-review[\s\S]*noindex/);
  assert.match(server, /checkDigitalSystemsReviewRateLimit/);
  assert.match(server, /resultCategory/);
  assert.match(server, /503/);
});
