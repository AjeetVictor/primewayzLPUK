import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_REVIEW_SUCCESS_PENDING_KEY,
} from '../../constants/digitalSystemsReview.ts';
import {
  consumeFreeReviewSuccessMarker,
  writeFreeReviewSuccessMarker,
} from './successMarker.ts';
import { buildDigitalSystemsReviewAnalyticsPayload } from './analytics.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function createMemoryStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial || {}));
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    raw: store,
  };
}

test('successful form response sets only the one-time non-PII marker', () => {
  const storage = createMemoryStorage();
  writeFreeReviewSuccessMarker('created', storage);
  assert.equal(storage.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY), 'created');

  writeFreeReviewSuccessMarker('duplicate', storage);
  assert.equal(storage.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY), 'duplicate');

  writeFreeReviewSuccessMarker('validation_error', storage);
  assert.equal(storage.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY), 'duplicate');

  const value = storage.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY);
  assert.ok(value === 'created' || value === 'duplicate');
  assert.doesNotMatch(value || '', /@|name|email|company|website|submission|chat/i);
});

test('thank-you conversion fires once after success then not on refresh', () => {
  const storage = createMemoryStorage();
  writeFreeReviewSuccessMarker('created', storage);

  const first = consumeFreeReviewSuccessMarker(storage);
  assert.equal(first, 'created');
  assert.equal(storage.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY), null);

  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    route: '/thank-you/digital-systems-review',
    resultCategory: first,
  });
  assert.equal(payload.result_category, 'created');
  assert.equal(payload.route, '/thank-you/digital-systems-review');
  assert.equal(payload.source_location, undefined);

  const second = consumeFreeReviewSuccessMarker(storage);
  assert.equal(second, null);
});

test('direct thank-you access emits no conversion marker', () => {
  const storage = createMemoryStorage();
  assert.equal(consumeFreeReviewSuccessMarker(storage), null);
});

test('session-storage failure does not throw or block navigation helpers', () => {
  const throwingStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  assert.doesNotThrow(() => writeFreeReviewSuccessMarker('created', throwingStorage));
  assert.equal(consumeFreeReviewSuccessMarker(throwingStorage), null);
  assert.doesNotThrow(() => writeFreeReviewSuccessMarker('created', null));
  assert.equal(consumeFreeReviewSuccessMarker(null), null);
});

test('form and thank-you sources use marker without PII in URL or history state', () => {
  const form = fs.readFileSync(
    path.join(root, 'src/components/forms/DigitalSystemsReviewForm.tsx'),
    'utf8',
  );
  const thankYou = fs.readFileSync(
    path.join(root, 'src/components/DigitalSystemsReviewThankYouPage.tsx'),
    'utf8',
  );

  assert.match(form, /writeFreeReviewSuccessMarker\(resultCategory\)/);
  assert.match(form, /navigate\(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,\s*\{\s*replace:\s*true\s*\}\)/);
  assert.doesNotMatch(form, /navigate\([^)]*state\s*:/);
  assert.doesNotMatch(form, /localStorage/);
  assert.doesNotMatch(form, /searchParams|URLSearchParams|location\.hash/);

  assert.match(thankYou, /consumeFreeReviewSuccessMarker/);
  assert.match(thankYou, /free_review_thank_you_view/);
  assert.match(thankYou, /resultCategory:\s*marker/);
  assert.doesNotMatch(thankYou, /localStorage/);
  assert.doesNotMatch(thankYou, /useLocation|location\.state|searchParams/);
});

test('landing-page booking emits free_review_book_call_click', () => {
  const landing = fs.readFileSync(
    path.join(root, 'src/components/DigitalSystemsReviewPage.tsx'),
    'utf8',
  );
  assert.match(landing, /free_review_book_call_click/);
  assert.match(landing, /onBookCallClick/);
  assert.match(landing, /trackBookCallClick/);
  assert.match(landing, /sourceLocation:\s*DEFAULT_REVIEW_SOURCE_LOCATION/);
  assert.doesNotMatch(landing, /chatSessionId|submissionId|workEmail/);
});

test('marker constant is non-PII session key', () => {
  assert.equal(FREE_REVIEW_SUCCESS_PENDING_KEY, 'primewayz_free_review_success_pending');
});
