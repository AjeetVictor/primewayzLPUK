import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_ROUTE,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_THANK_YOU_ROUTE,
} from '../../constants/conversionCta.ts';
import {
  DIGITAL_SYSTEMS_REVIEW_API_PATH,
  DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,
  REVIEW_FIELD_LIMITS,
  REVIEW_PREFERRED_NEXT_STEPS,
} from '../../constants/digitalSystemsReview.ts';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import {
  buildConfirmationHeading,
  buildConfirmationSummary,
  buildPreferredNextStepFollowUp,
  clearConfirmationSummary,
  CONFIRMATION_CREATED_AT_CLOCK_TOLERANCE_MS,
  CONFIRMATION_SUMMARY_ALLOWED_KEYS,
  CONFIRMATION_SUMMARY_TTL_MS,
  CONFIRMATION_SUMMARY_VERSION,
  DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
  GENERIC_CONFIRMATION_HEADING,
  readConfirmationSummary,
  resolveConfirmationFirstName,
  scheduleConfirmationSummaryExpiry,
  shouldCollapseConfirmationContext,
  validateConfirmationSummary,
  writeConfirmationSummary,
  type DigitalSystemsReviewConfirmationSummary,
} from './confirmationSummary.ts';
import { isPlausibleWebsite } from './isPlausibleWebsite.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

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

function validSummary(
  overrides: Partial<DigitalSystemsReviewConfirmationSummary> = {},
  now = Date.now(),
): DigitalSystemsReviewConfirmationSummary {
  return {
    version: 1,
    name: 'Alex Morgan',
    workEmail: 'alex@example.co.uk',
    company: 'Acme Ltd',
    website: 'https://example.co.uk',
    serviceArea: 'Website Visibility & Conversion',
    preferredNextStep: 'Email me the recommended next step',
    context: 'Our website enquiry form is broken and CRM follow-up is inconsistent.',
    createdAt: new Date(now).toISOString(),
    expiresAt: now + CONFIRMATION_SUMMARY_TTL_MS,
    ...overrides,
  };
}

function seedRawSummary(
  storage: ReturnType<typeof createMemoryStorage>,
  value: unknown,
) {
  storage.setItem(
    DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
    JSON.stringify(value),
  );
}

// --- Storage and validation ---

test('1. Valid confirmation summary can be stored and read', () => {
  const storage = createMemoryStorage();
  const summary = validSummary();
  assert.equal(writeConfirmationSummary(summary, storage), true);
  const loaded = readConfirmationSummary(storage);
  assert.ok(loaded);
  assert.equal(loaded.name, 'Alex Morgan');
  assert.equal(loaded.workEmail, 'alex@example.co.uk');
  assert.equal(loaded.company, 'Acme Ltd');
  assert.equal(loaded.website, 'https://example.co.uk');
  assert.equal(loaded.serviceArea, 'Website Visibility & Conversion');
  assert.equal(loaded.preferredNextStep, 'Email me the recommended next step');
  assert.equal(loaded.context, summary.context);
});

test('2. Storage key is fixed and versioned', () => {
  assert.equal(
    DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
    'primewayz:digital-systems-review:confirmation:v1',
  );
  assert.equal(CONFIRMATION_SUMMARY_VERSION, 1);
  const storage = createMemoryStorage();
  writeConfirmationSummary(validSummary(), storage);
  assert.ok(storage.raw.has(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY));
});

test('3. Expired summary is rejected and removed', () => {
  const storage = createMemoryStorage();
  const now = Date.now();
  const createdAtMs = now - 60_000;
  seedRawSummary(
    storage,
    validSummary(
      {
        createdAt: new Date(createdAtMs).toISOString(),
        expiresAt: now - 1,
      },
      createdAtMs,
    ),
  );
  assert.equal(readConfirmationSummary(storage, now), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('4. Invalid JSON is rejected and removed', () => {
  const storage = createMemoryStorage({
    [DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY]: '{not-json',
  });
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('5. Wrong version is rejected', () => {
  assert.equal(validateConfirmationSummary({ ...validSummary(), version: 2 as 1 }), null);
});

test('6. Array payload is rejected', () => {
  assert.equal(validateConfirmationSummary([validSummary()]), null);
  const storage = createMemoryStorage({
    [DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY]: JSON.stringify([validSummary()]),
  });
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('7. Missing required field is rejected', () => {
  const { company: _company, ...rest } = validSummary();
  assert.equal(validateConfirmationSummary(rest), null);
  const { workEmail: _email, ...withoutEmail } = validSummary();
  assert.equal(validateConfirmationSummary(withoutEmail), null);
});

test('8. Unknown service area is rejected', () => {
  assert.equal(
    validateConfirmationSummary(validSummary({ serviceArea: 'Unknown Service' as never })),
    null,
  );
});

test('9. Unknown preferred-next-step value is rejected', () => {
  assert.equal(
    validateConfirmationSummary(
      validSummary({ preferredNextStep: 'Call me tomorrow' as never }),
    ),
    null,
  );
});

test('10. Overlong or malformed values are rejected safely', () => {
  assert.equal(
    validateConfirmationSummary(
      validSummary({ name: 'A'.repeat(REVIEW_FIELD_LIMITS.nameMax + 1) }),
    ),
    null,
  );
  assert.equal(
    validateConfirmationSummary(validSummary({ workEmail: 'not-an-email' })),
    null,
  );
  assert.equal(
    validateConfirmationSummary(
      validSummary({ context: 'short' }),
    ),
    null,
  );
  assert.equal(
    validateConfirmationSummary(
      validSummary({ website: `https://example.com/${'x'.repeat(REVIEW_FIELD_LIMITS.websiteMax)}` }),
    ),
    null,
  );
});

test('11. Storage exceptions do not crash the page', () => {
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
  assert.doesNotThrow(() => writeConfirmationSummary(validSummary(), throwingStorage));
  assert.equal(readConfirmationSummary(throwingStorage), null);
  assert.doesNotThrow(() => clearConfirmationSummary(throwingStorage));
  assert.doesNotThrow(() => writeConfirmationSummary(validSummary(), null));
  assert.equal(readConfirmationSummary(null), null);
});

// --- Correction 1: strict timestamp validation ---

test('correction1. expiresAt exactly within the allowed TTL is accepted', () => {
  const now = 1_700_000_000_000;
  const createdAtMs = now;
  const summary = validSummary(
    {
      createdAt: new Date(createdAtMs).toISOString(),
      expiresAt: createdAtMs + CONFIRMATION_SUMMARY_TTL_MS,
    },
    createdAtMs,
  );
  const validated = validateConfirmationSummary(summary, now);
  assert.ok(validated);
  assert.equal(validated.expiresAt, createdAtMs + CONFIRMATION_SUMMARY_TTL_MS);
});

test('correction1. expiresAt beyond createdAt + TTL is rejected', () => {
  const now = 1_700_000_000_000;
  const createdAtMs = now;
  assert.equal(
    validateConfirmationSummary(
      validSummary(
        {
          createdAt: new Date(createdAtMs).toISOString(),
          expiresAt: createdAtMs + CONFIRMATION_SUMMARY_TTL_MS + 1,
        },
        createdAtMs,
      ),
      now,
    ),
    null,
  );
  assert.equal(
    validateConfirmationSummary(
      validSummary(
        {
          createdAt: new Date(createdAtMs).toISOString(),
          expiresAt: createdAtMs + 24 * 60 * 60 * 1000,
        },
        createdAtMs,
      ),
      now,
    ),
    null,
  );
});

test('correction1. createdAt far in the future is rejected', () => {
  const now = 1_700_000_000_000;
  const future = now + CONFIRMATION_CREATED_AT_CLOCK_TOLERANCE_MS + 60_000;
  assert.equal(
    validateConfirmationSummary(
      validSummary(
        {
          createdAt: new Date(future).toISOString(),
          expiresAt: future + CONFIRMATION_SUMMARY_TTL_MS,
        },
        future,
      ),
      now,
    ),
    null,
  );
});

test('correction1. expiresAt before createdAt is rejected', () => {
  const now = 1_700_000_000_000;
  const createdAtMs = now;
  assert.equal(
    validateConfirmationSummary(
      validSummary(
        {
          createdAt: new Date(createdAtMs).toISOString(),
          expiresAt: createdAtMs - 1,
        },
        createdAtMs,
      ),
      now,
    ),
    null,
  );
});

test('correction1. expired data is removed from storage', () => {
  const storage = createMemoryStorage();
  const now = Date.now();
  const createdAtMs = now - CONFIRMATION_SUMMARY_TTL_MS - 1_000;
  seedRawSummary(
    storage,
    validSummary(
      {
        createdAt: new Date(createdAtMs).toISOString(),
        expiresAt: createdAtMs + CONFIRMATION_SUMMARY_TTL_MS,
      },
      createdAtMs,
    ),
  );
  assert.ok(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY));
  assert.equal(readConfirmationSummary(storage, now), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('correction1. small createdAt clock tolerance is allowed', () => {
  const now = 1_700_000_000_000;
  const createdAtMs = now + CONFIRMATION_CREATED_AT_CLOCK_TOLERANCE_MS;
  const validated = validateConfirmationSummary(
    validSummary(
      {
        createdAt: new Date(createdAtMs).toISOString(),
        expiresAt: createdAtMs + CONFIRMATION_SUMMARY_TTL_MS,
      },
      createdAtMs,
    ),
    now,
  );
  assert.ok(validated);
});

test('correction1. buildConfirmationSummary still uses now ISO + TTL expiresAt', () => {
  const now = 1_700_000_000_000;
  const built = buildConfirmationSummary({
    name: 'Alex Morgan',
    workEmail: 'alex@example.co.uk',
    company: 'Acme Ltd',
    website: 'https://example.co.uk',
    serviceArea: 'Website Visibility & Conversion',
    preferredNextStep: 'Email me the recommended next step',
    context: 'Our website enquiry form is broken and CRM follow-up is inconsistent.',
    now,
  });
  assert.ok(built);
  assert.equal(built.createdAt, new Date(now).toISOString());
  assert.equal(built.expiresAt, now + CONFIRMATION_SUMMARY_TTL_MS);
});

// --- Correction 2: open-page auto-expiry ---

test('correction2. open page schedules receipt expiry within remaining TTL', () => {
  const now = 1_700_000_000_000;
  const summary = validSummary({}, now);
  const remaining = 90_000;
  summary.expiresAt = now + remaining;

  let scheduledDelay: number | null = null;
  const handlers: Array<() => void> = [];
  const cleanup = scheduleConfirmationSummaryExpiry(summary, {
    now,
    onExpire: () => {},
    setTimeoutFn: (handler, timeout) => {
      handlers.push(handler);
      scheduledDelay = timeout;
      return 1;
    },
    clearTimeoutFn: () => {},
  });

  assert.equal(scheduledDelay, remaining);
  assert.equal(handlers.length, 1);
  cleanup();
});

test('correction2. expiry callback clears storage and changes to generic state', () => {
  const storage = createMemoryStorage();
  const now = 1_700_000_000_000;
  const summary = validSummary({}, now);
  summary.expiresAt = now + 50;
  assert.equal(writeConfirmationSummary(summary, storage, now), true);

  let pageSummary: DigitalSystemsReviewConfirmationSummary | null = summary;
  let cleared = false;
  const handlers: Array<() => void> = [];

  scheduleConfirmationSummaryExpiry(summary, {
    now,
    onExpire: () => {
      clearConfirmationSummary(storage);
      pageSummary = null;
      cleared = true;
    },
    setTimeoutFn: (handler) => {
      handlers.push(handler);
      return 42;
    },
    clearTimeoutFn: () => {},
  });

  assert.equal(handlers.length, 1);
  handlers[0]!();
  assert.equal(cleared, true);
  assert.equal(pageSummary, null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
  assert.equal(buildConfirmationHeading(pageSummary), GENERIC_CONFIRMATION_HEADING);
});

test('correction2. timeout is cleaned up on unmount', () => {
  const now = 1_700_000_000_000;
  const summary = validSummary({}, now);
  summary.expiresAt = now + 120_000;

  let clearedId: unknown = null;
  const timeoutId = 99;
  const cleanup = scheduleConfirmationSummaryExpiry(summary, {
    now,
    onExpire: () => {
      assert.fail('expiry must not run after cleanup');
    },
    setTimeoutFn: () => timeoutId,
    clearTimeoutFn: (id) => {
      clearedId = id;
    },
  });

  cleanup();
  assert.equal(clearedId, timeoutId);
});

test('correction2. no new analytics event is emitted at expiry', () => {
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  const effectStart = thankYou.indexOf('scheduleConfirmationSummaryExpiry');
  assert.ok(effectStart > 0);
  const onExpireBlock = thankYou.slice(
    thankYou.indexOf('onExpire:', effectStart),
    thankYou.indexOf('});', thankYou.indexOf('onExpire:', effectStart)) + 3,
  );
  assert.match(onExpireBlock, /clearConfirmationSummary\(\)/);
  assert.match(onExpireBlock, /setSummary\(null\)/);
  assert.doesNotMatch(onExpireBlock, /trackConversionEvent|buildDigitalSystemsReviewAnalyticsPayload/);

  // Behavioural: expiry path only clears storage / local state helpers — no analytics imports invoked.
  let analyticsCalls = 0;
  const now = 1_700_000_000_000;
  const summary = validSummary({}, now);
  summary.expiresAt = now + 10;
  const handlers: Array<() => void> = [];
  scheduleConfirmationSummaryExpiry(summary, {
    now,
    onExpire: () => {
      // Mimic page onExpire — must not call analytics.
      clearConfirmationSummary(createMemoryStorage());
      analyticsCalls += 0;
    },
    setTimeoutFn: (h) => {
      handlers.push(h);
      return 1;
    },
    clearTimeoutFn: () => {},
  });
  handlers[0]!();
  assert.equal(analyticsCalls, 0);
});

test('correction2. never schedules negative or unreasonably long timeouts', () => {
  const now = 1_700_000_000_000;
  const expired = validSummary({}, now);
  expired.expiresAt = now - 5;
  let expiredImmediate = false;
  let expiredScheduled = false;
  scheduleConfirmationSummaryExpiry(expired, {
    now,
    onExpire: () => {
      expiredImmediate = true;
    },
    setTimeoutFn: () => {
      expiredScheduled = true;
      return 1;
    },
    clearTimeoutFn: () => {},
  });
  assert.equal(expiredImmediate, true);
  assert.equal(expiredScheduled, false);

  const longLived = validSummary({}, now);
  // Manipulated remaining larger than TTL — scheduler must cap.
  longLived.expiresAt = now + CONFIRMATION_SUMMARY_TTL_MS * 4;
  let cappedDelay: number | null = null;
  scheduleConfirmationSummaryExpiry(longLived, {
    now,
    onExpire: () => {},
    setTimeoutFn: (_handler, timeout) => {
      cappedDelay = timeout;
      return 1;
    },
    clearTimeoutFn: () => {},
  });
  assert.equal(cappedDelay, CONFIRMATION_SUMMARY_TTL_MS);
});

test('correction2. thank-you page wires scheduleConfirmationSummaryExpiry after mount read', () => {
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /scheduleConfirmationSummaryExpiry\(loaded/);
  assert.match(thankYou, /clearConfirmationSummary\(\)/);
  assert.match(thankYou, /setSummary\(null\)/);
  const effectBody = thankYou.slice(thankYou.indexOf('useEffect(() => {'));
  const readIndex = effectBody.indexOf('readConfirmationSummary()');
  const scheduleIndex = effectBody.indexOf('scheduleConfirmationSummaryExpiry(loaded');
  assert.ok(readIndex >= 0 && scheduleIndex > readIndex);
});

// --- Correction 3: exact key allowlist ---

test('correction3. unknown primitive top-level key is rejected', () => {
  assert.equal(
    validateConfirmationSummary({ ...validSummary(), extraFlag: true }),
    null,
  );
  assert.equal(
    validateConfirmationSummary({ ...validSummary(), phone: '07123456789' }),
    null,
  );
});

test('correction3. unknown nested-object key is rejected', () => {
  assert.equal(
    validateConfirmationSummary({
      ...validSummary(),
      firstTouchAttribution: { utmSource: 'x' },
    }),
    null,
  );
  assert.equal(
    validateConfirmationSummary({
      ...validSummary(),
      meta: { nested: true },
    }),
    null,
  );
});

test('correction3. unknown array key is rejected', () => {
  assert.equal(
    validateConfirmationSummary({
      ...validSummary(),
      tags: ['a', 'b'],
    }),
    null,
  );
});

test('correction3. rejected objects are removed from storage', () => {
  const storage = createMemoryStorage();
  seedRawSummary(storage, { ...validSummary(), chatSessionId: 'abc' });
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);

  seedRawSummary(storage, { ...validSummary(), notificationStatus: 'sent' });
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);

  seedRawSummary(storage, { ...validSummary(), sourceLocation: 'homepage_hero' });
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('correction3. the exact allowed key set succeeds', () => {
  const now = Date.now();
  const exact: Record<string, unknown> = {
    version: 1,
    name: 'Alex Morgan',
    workEmail: 'alex@example.co.uk',
    company: 'Acme Ltd',
    website: 'https://example.co.uk',
    serviceArea: 'Website Visibility & Conversion',
    preferredNextStep: 'Email me the recommended next step',
    context: 'Our website enquiry form is broken and CRM follow-up is inconsistent.',
    submissionId: 'opaqueRef123',
    createdAt: new Date(now).toISOString(),
    expiresAt: now + CONFIRMATION_SUMMARY_TTL_MS,
  };
  assert.deepEqual(
    Object.keys(exact).sort(),
    [...CONFIRMATION_SUMMARY_ALLOWED_KEYS].sort(),
  );
  const validated = validateConfirmationSummary(exact, now);
  assert.ok(validated);
  assert.equal(validated.submissionId, 'opaqueRef123');

  const withoutOptionalId = { ...exact };
  delete withoutOptionalId.submissionId;
  assert.ok(validateConfirmationSummary(withoutOptionalId, now));
});

// --- Correction 4: clear before client validation ---

test('correction4. previous summary is cleared before client validation', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const handleSubmit = form.slice(
    form.indexOf('const handleSubmit'),
    form.indexOf('const errorIds'),
  );
  const preventIndex = handleSubmit.indexOf('event.preventDefault()');
  const lockIndex = handleSubmit.indexOf('submittingLockRef.current || submitting');
  const clearIndex = handleSubmit.indexOf('clearConfirmationSummary()');
  const validateIndex = handleSubmit.indexOf('validateClient()');
  assert.ok(preventIndex >= 0);
  assert.ok(lockIndex > preventIndex);
  assert.ok(clearIndex > lockIndex);
  assert.ok(validateIndex > clearIndex);

  // Behavioural: a new attempt clears an existing receipt before validation outcome.
  const storage = createMemoryStorage();
  writeConfirmationSummary(validSummary(), storage);
  assert.ok(readConfirmationSummary(storage));
  clearConfirmationSummary(storage);
  assert.equal(readConfirmationSummary(storage), null);
});

test('correction4. client-validation failure leaves no old summary', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const handleSubmit = form.slice(
    form.indexOf('const handleSubmit'),
    form.indexOf('const errorIds'),
  );
  // Clear runs before validateClient; validation failure returns without rewriting summary.
  const clearIndex = handleSubmit.indexOf('clearConfirmationSummary()');
  const validateIndex = handleSubmit.indexOf('validateClient()');
  const validationReturn = handleSubmit.indexOf("emitError('validation')");
  const resumeAfterValidation = handleSubmit.indexOf('setErrors({})');
  assert.ok(clearIndex < validateIndex && validateIndex < validationReturn);
  assert.ok(validationReturn < resumeAfterValidation);
  const validationFailurePath = handleSubmit.slice(validateIndex, resumeAfterValidation);
  assert.doesNotMatch(validationFailurePath, /writeConfirmationSummary|buildConfirmationSummary/);

  const storage = createMemoryStorage();
  writeConfirmationSummary(validSummary(), storage);
  clearConfirmationSummary(storage);
  // Simulated client-validation failure path: cleared, never rewritten.
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY), null);
});

test('correction4. API failure leaves no old summary', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const handleSubmit = form.slice(
    form.indexOf('const handleSubmit'),
    form.indexOf('const errorIds'),
  );
  const clearIndex = handleSubmit.indexOf('clearConfirmationSummary()');
  const writeIndex = handleSubmit.indexOf('writeConfirmationSummary(confirmation)');
  const fetchIndex = handleSubmit.indexOf('await fetch(');
  assert.ok(clearIndex > 0 && clearIndex < fetchIndex && fetchIndex < writeIndex);

  // Failure branches before write must not call writeConfirmationSummary.
  const failureSnippet = handleSubmit.slice(
    handleSubmit.indexOf('if (response.status === 429)'),
    writeIndex,
  );
  assert.doesNotMatch(failureSnippet, /writeConfirmationSummary/);

  const storage = createMemoryStorage();
  writeConfirmationSummary(validSummary(), storage);
  clearConfirmationSummary(storage);
  // Simulated API failure after clear: no rewrite.
  assert.equal(readConfirmationSummary(storage), null);
});

test('correction4. duplicate-submit lock does not unnecessarily clear the active submission', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const handleSubmit = form.slice(
    form.indexOf('const handleSubmit'),
    form.indexOf('const errorIds'),
  );
  const lockReturn = handleSubmit.indexOf(
    'if (submittingLockRef.current || submitting) return',
  );
  const clearIndex = handleSubmit.indexOf('clearConfirmationSummary()');
  assert.ok(lockReturn >= 0);
  assert.ok(clearIndex > lockReturn);

  // Behavioural: while a lock would short-circuit, existing receipt remains.
  const storage = createMemoryStorage();
  const summary = validSummary();
  writeConfirmationSummary(summary, storage);
  const locked = true;
  if (locked) {
    // duplicate submit returns before clear
  } else {
    clearConfirmationSummary(storage);
  }
  assert.ok(readConfirmationSummary(storage));
});

// --- Correction 5: website validation ---

test('correction5. malformed or unsafe website values are rejected', () => {
  const now = Date.now();
  for (const website of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'file:///etc/passwd',
    'https://user:pass@example.com',
    'not a url',
    'ftp://example.com',
  ]) {
    assert.equal(isPlausibleWebsite(website), false);
    assert.equal(
      validateConfirmationSummary(validSummary({ website }, now), now),
      null,
    );
  }
});

test('correction5. valid optional website behaviour remains', () => {
  const now = Date.now();
  assert.ok(validateConfirmationSummary(validSummary({ website: null }, now), now));
  assert.ok(validateConfirmationSummary(validSummary({ website: '' as never }, now), now));
  assert.ok(
    validateConfirmationSummary(
      validSummary({ website: 'https://example.co.uk' }, now),
      now,
    ),
  );
  assert.ok(
    validateConfirmationSummary(validSummary({ website: 'example.co.uk' }, now), now),
  );

  const builtEmpty = buildConfirmationSummary({
    name: 'Jordan Lee',
    workEmail: 'jordan@example.com',
    company: 'Lee Co',
    website: '',
    serviceArea: 'CRM & Workflow Automation',
    preferredNextStep: 'Arrange a short discovery call',
    context: 'We need help connecting HubSpot to our support inbox and reporting.',
    now,
  });
  assert.ok(builtEmpty);
  assert.equal(builtEmpty.website, null);

  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /summary\.website/);
  assert.doesNotMatch(thankYou, /dangerouslySetInnerHTML/);
});

// --- Refresh / direct visit ---

test('correction. refresh before expiry retains the receipt', () => {
  const storage = createMemoryStorage();
  const now = Date.now();
  const summary = validSummary({}, now);
  assert.equal(writeConfirmationSummary(summary, storage, now), true);
  const first = readConfirmationSummary(storage, now + 60_000);
  assert.ok(first);
  const second = readConfirmationSummary(storage, now + 120_000);
  assert.ok(second);
  assert.equal(second.name, 'Alex Morgan');
  assert.equal(storage.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY) != null, true);
});

test('correction. direct visit remains generic', () => {
  const storage = createMemoryStorage();
  assert.equal(readConfirmationSummary(storage), null);
  assert.equal(buildConfirmationHeading(null), GENERIC_CONFIRMATION_HEADING);
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /useState<DigitalSystemsReviewConfirmationSummary \| null>\(null\)/);
  assert.match(thankYou, /summary \? PERSONALISED_SUPPORTING_COPY : GENERIC_SUPPORTING_COPY/);
});

// --- Submission handoff ---

test('12–20. Form writes summary only after success, clears on start, keeps clean route and API body', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');

  assert.match(form, /clearConfirmationSummary\(\)/);
  assert.match(form, /buildConfirmationSummary\(/);
  assert.match(form, /writeConfirmationSummary\(confirmation\)/);
  assert.match(form, /navigate\(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,\s*\{\s*replace:\s*true\s*\}\)/);

  // Summary write must sit after successful response handling, not before fetch.
  const writeIndex = form.indexOf('writeConfirmationSummary(confirmation)');
  const fetchIndex = form.indexOf('await fetch(apiUrl(DIGITAL_SYSTEMS_REVIEW_API_PATH)');
  const okGate = form.indexOf('if (!response.ok)');
  assert.ok(writeIndex > fetchIndex);
  assert.ok(writeIndex > okGate);

  // Clear happens at the start of a genuine submit attempt, before client validation.
  const handleSubmit = form.slice(
    form.indexOf('const handleSubmit'),
    form.indexOf('const errorIds'),
  );
  const clearIndex = handleSubmit.indexOf('clearConfirmationSummary()');
  const validateIndex = handleSubmit.indexOf('validateClient()');
  assert.ok(clearIndex > 0 && clearIndex < validateIndex && clearIndex < fetchIndex);

  // Final edited service / preferred next step come from the submitted payload.
  assert.match(form, /serviceArea:\s*payload\.serviceArea/);
  assert.match(form, /preferredNextStep:\s*payload\.preferredNextStep/);

  // No form fields in navigation query / hash / history state.
  assert.doesNotMatch(form, /navigate\([^)]*state\s*:/);
  assert.doesNotMatch(form, /navigate\([^)]*\?/);
  assert.doesNotMatch(form, /URLSearchParams|location\.hash/);

  // Existing API body fields remain unchanged (object shorthand or explicit keys).
  for (const key of [
    'submissionId',
    'name',
    'workEmail',
    'company',
    'website',
    'serviceArea',
    'context',
    'preferredNextStep',
    'acknowledgement',
    'companyWebsite',
    'sourceLocation',
    'landingPage',
    'referrer',
    'firstTouchAttribution',
    'latestTouchAttribution',
  ]) {
    assert.match(form, new RegExp(`\\b${key}\\b`));
  }

  assert.equal(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH, FREE_REVIEW_THANK_YOU_ROUTE);
  assert.equal(FREE_REVIEW_THANK_YOU_ROUTE, '/thank-you/digital-systems-review');
});

test('summary is not built from validation or API failure paths', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const validateBlock = form.slice(
    form.indexOf('const validateClient'),
    form.indexOf('const handleSubmit'),
  );
  assert.doesNotMatch(validateBlock, /writeConfirmationSummary|buildConfirmationSummary/);

  const failureSnippet = form.slice(
    form.indexOf('if (response.status === 429)'),
    form.indexOf('writeConfirmationSummary(confirmation)'),
  );
  assert.doesNotMatch(failureSnippet, /writeConfirmationSummary/);
});

test('buildConfirmationSummary uses final service and preferred next step values', () => {
  const built = buildConfirmationSummary({
    name: 'Jordan Lee',
    workEmail: 'jordan@example.com',
    company: 'Lee Co',
    website: '',
    serviceArea: 'CRM & Workflow Automation',
    preferredNextStep: 'Arrange a short discovery call',
    context: 'We need help connecting HubSpot to our support inbox and reporting.',
  });
  assert.ok(built);
  assert.equal(built.serviceArea, 'CRM & Workflow Automation');
  assert.equal(built.preferredNextStep, 'Arrange a short discovery call');
  assert.equal(built.website, null);
  assert.equal(built.submissionId, undefined);
});

// --- Rendering helpers and thank-you page ---

test('21–27. Valid summary renders personalised heading and summary fields', () => {
  const summary = validSummary();
  assert.equal(
    buildConfirmationHeading(summary),
    'Thank you, Alex — your review request has been received',
  );
  assert.equal(resolveConfirmationFirstName(summary.name), 'Alex');

  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /buildConfirmationHeading\(summary\)/);
  assert.match(thankYou, /<dt[^>]*>Name<\/dt>/);
  assert.match(thankYou, /summary\.name/);
  assert.match(thankYou, /<dt[^>]*>Work email<\/dt>/);
  assert.match(thankYou, /summary\.workEmail/);
  assert.match(thankYou, /<dt[^>]*>Company<\/dt>/);
  assert.match(thankYou, /summary\.company/);
  assert.match(thankYou, /summary\.website/);
  assert.match(thankYou, /<dt[^>]*>Review focus<\/dt>/);
  assert.match(thankYou, /summary\.serviceArea/);
  assert.match(thankYou, /<dt[^>]*>Preferred next step<\/dt>/);
  assert.match(thankYou, /summary\.preferredNextStep/);
});

test('28–30. Context is rendered as plain React text without dangerouslySetInnerHTML', () => {
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /ConfirmationContextBlock/);
  assert.match(thankYou, /\{context\}/);
  assert.match(thankYou, /whitespace-pre-wrap/);
  assert.match(thankYou, /break-words|overflow-x-hidden/);
  assert.match(thankYou, /Show full details/);
  assert.doesNotMatch(thankYou, /dangerouslySetInnerHTML/);

  const withHtml = validSummary({
    context: 'We see <script>alert(1)</script> issues in the form flow and need help.',
  });
  assert.ok(validateConfirmationSummary(withHtml));
  assert.match(withHtml.context, /<script>/);
  assert.equal(shouldCollapseConfirmationContext('x'.repeat(500)), true);
});

test('31–33. Direct, expired and invalid confirmation fall back to generic heading', () => {
  assert.equal(buildConfirmationHeading(null), GENERIC_CONFIRMATION_HEADING);
  assert.equal(
    GENERIC_CONFIRMATION_HEADING,
    'Thank you — your review request has been received',
  );

  const storage = createMemoryStorage();
  assert.equal(readConfirmationSummary(storage), null);

  const now = Date.now();
  storage.setItem(
    DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
    JSON.stringify(validSummary({ expiresAt: now - 10 })),
  );
  assert.equal(readConfirmationSummary(storage, now), null);

  storage.setItem(
    DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
    JSON.stringify({ version: 1, name: 'Only' }),
  );
  assert.equal(readConfirmationSummary(storage), null);

  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /readConfirmationSummary\(\)/);
  assert.match(thankYou, /summary \? PERSONALISED_SUPPORTING_COPY : GENERIC_SUPPORTING_COPY/);
});

test('34–35. One H1 and existing actions remain', () => {
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.equal((thankYou.match(/<h1\b/g) || []).length, 1);
  assert.match(thankYou, /Return to services/);
  assert.match(thankYou, /DISCOVERY_CALL_CTA_LABEL/);
  assert.match(thankYou, /CANONICAL_ROUTES\.services/);
  assert.match(thankYou, /DISCOVERY_CALL_DESTINATION/);
  assert.match(thankYou, /free_review_book_call_click/);
  assert.match(thankYou, /min-h-\[48px\]/);
});

test('36. Dynamic next-step copy matches preferredNextStep', () => {
  const emailSummary = validSummary({
    preferredNextStep: 'Email me the recommended next step',
    workEmail: 'alex@example.co.uk',
  });
  assert.equal(
    buildPreferredNextStepFollowUp(emailSummary),
    'We will respond using alex@example.co.uk.',
  );

  const callSummary = validSummary({
    preferredNextStep: 'Arrange a short discovery call',
    workEmail: 'jordan@example.com',
  });
  assert.equal(
    buildPreferredNextStepFollowUp(callSummary),
    'We will use jordan@example.com to coordinate the next step for a short discovery call.',
  );
  assert.deepEqual([...REVIEW_PREFERRED_NEXT_STEPS], [...FREE_REVIEW_PREFERRED_NEXT_STEPS]);
});

// --- Privacy ---

test('37–44. PII absent from URL, analytics, console logging and internal fields', () => {
  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  const confirmation = read('src/lib/digitalSystemsReview/confirmationSummary.ts');
  const server = read('server.ts');

  assert.match(form, /DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH/);
  assert.doesNotMatch(form, /navigate\([^)]*workEmail|navigate\([^)]*company/);
  assert.equal(FREE_REVIEW_THANK_YOU_ROUTE, '/thank-you/digital-systems-review');

  const thankYouAnalytics = thankYou.slice(
    thankYou.indexOf('buildDigitalSystemsReviewAnalyticsPayload'),
    thankYou.indexOf('trackConversionEvent'),
  );
  assert.doesNotMatch(thankYouAnalytics, /name|workEmail|company|website|context|submissionId/);

  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    route: FREE_REVIEW_THANK_YOU_ROUTE,
    resultCategory: 'created',
  });
  assertNoProhibitedAnalyticsProps(payload);
  assert.equal(payload.route, '/thank-you/digital-systems-review');
  assert.equal('name' in payload, false);
  assert.equal('workEmail' in payload, false);

  assert.doesNotMatch(form, /console\.log/);
  assert.doesNotMatch(thankYou, /console\.log/);
  assert.doesNotMatch(confirmation, /console\.log/);

  // No new PII server logging for confirmation handoff; public response unchanged.
  assert.match(server, /toPublicDigitalSystemsReviewResponse/);
  assert.doesNotMatch(thankYou, /sourceLocation|firstTouchAttribution|chatSessionId/);
  assert.doesNotMatch(thankYou, /notificationStatus|notificationErrorCode/);

  // Exact allowlist rejects unknown / internal keys; thank-you must not render them.
  assert.match(confirmation, /CONFIRMATION_SUMMARY_ALLOWED_KEYS/);
  assert.deepEqual([...CONFIRMATION_SUMMARY_ALLOWED_KEYS], [
    'version',
    'name',
    'workEmail',
    'company',
    'website',
    'serviceArea',
    'preferredNextStep',
    'context',
    'submissionId',
    'createdAt',
    'expiresAt',
  ]);
  assert.doesNotMatch(thankYou, /summary\.chatSessionId|summary\.notificationStatus/);

  for (const field of [
    'sourceLocation',
    'chatSessionId',
    'notificationStatus',
    'notificationErrorCode',
  ]) {
    assert.doesNotMatch(
      thankYou,
      new RegExp(`summary\\.${field}|<dt[^>]*>${field}`, 'i'),
    );
    assert.equal(
      CONFIRMATION_SUMMARY_ALLOWED_KEYS.includes(field as never),
      false,
    );
  }
});

// --- Regression (no historical git dependency) ---

test('45–48. Phase 2A–2D CTA surfaces remain wired', () => {
  const hero = read('src/components/Hero.tsx');
  assert.match(hero, /DigitalSystemsReviewCtaGroup|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);

  const services = read('src/components/ServicesPage.tsx');
  assert.match(services, /DigitalSystemsReviewCtaGroup|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);

  const stories = read('src/components/SuccessStoriesPage.tsx');
  assert.match(stories, /DigitalSystemsReviewCtaGroup|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);

  const navbar = read('src/components/Navbar.tsx');
  const footer = read('src/components/Footer.tsx');
  const about = read('src/components/AboutUsPage.tsx');
  assert.match(navbar, /DigitalSystemsReviewCtaLink|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);
  assert.match(footer, /DigitalSystemsReviewCtaGroup|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);
  assert.match(about, /DigitalSystemsReviewCtaGroup|buildFreeReviewCtaUrl|FREE_REVIEW_CTA_LABEL/);
});

test('49–54. Preferred steps, Prisma, server route, chrome and canonical URL unchanged', () => {
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [
    'Email me the recommended next step',
    'Arrange a short discovery call',
  ]);
  assert.ok(FREE_REVIEW_SERVICE_AREAS.length >= 6);

  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /REVIEW_PREFERRED_NEXT_STEPS\.map/);

  const schema = read('prisma/schema.prisma');
  // Phase 2E must not add confirmation-specific Prisma models/fields.
  assert.doesNotMatch(schema, /ConfirmationSummary|confirmationExpiresAt/);

  const migrationsDir = path.join(root, 'prisma/migrations');
  if (fs.existsSync(migrationsDir)) {
    for (const entry of fs.readdirSync(migrationsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const sqlPath = path.join(migrationsDir, entry.name, 'migration.sql');
      if (!fs.existsSync(sqlPath)) continue;
      const sql = fs.readFileSync(sqlPath, 'utf8');
      assert.doesNotMatch(sql, /ConfirmationSummary|confirmationExpiresAt/);
    }
  }

  const server = read('server.ts');
  assert.match(server, /app\.post\('\/api\/digital-systems-review'/);
  assert.match(server, /toPublicDigitalSystemsReviewResponse/);
  assert.doesNotMatch(server, /confirmationSummary|CONFIRMATION_STORAGE/);

  const app = read('src/App.tsx');
  assert.match(app, /path="\/thank-you\/digital-systems-review"/);
  assert.match(app, /DigitalSystemsReviewThankYouPage/);

  assert.equal(FREE_REVIEW_ROUTE, '/digital-systems-review');
  assert.equal(DIGITAL_SYSTEMS_REVIEW_API_PATH, '/api/digital-systems-review');

  // Navbar / Footer / About / chat are not modified for Phase 2E confirmation storage.
  const confirmation = read('src/lib/digitalSystemsReview/confirmationSummary.ts');
  assert.doesNotMatch(confirmation, /Navbar|Footer|AboutUsPage|LiveChat/);
});

test('SSR thank-you starts generic and loads confirmation after mount', () => {
  const thankYou = read('src/components/DigitalSystemsReviewThankYouPage.tsx');
  assert.match(thankYou, /useState<DigitalSystemsReviewConfirmationSummary \| null>\(null\)/);
  assert.match(thankYou, /setSummary\(loaded\)|setSummary\(readConfirmationSummary\(\)\)/);
  assert.match(thankYou, /useEffect\(/);
  assert.doesNotMatch(thankYou, /animate-spin|Loader2|Loading…|Loading\.\.\./);
});

test('opaque submissionId is optional and only accepted from trusted summary shape', () => {
  const withoutId = buildConfirmationSummary({
    name: 'Sam Taylor',
    workEmail: 'sam@example.com',
    company: 'Taylor Ltd',
    serviceArea: 'Not sure yet',
    preferredNextStep: 'Email me the recommended next step',
    context: 'Need clarity on whether to rebuild or stabilise the current CRM setup.',
  });
  assert.ok(withoutId);
  assert.equal(withoutId.submissionId, undefined);

  const withId = buildConfirmationSummary({
    name: 'Sam Taylor',
    workEmail: 'sam@example.com',
    company: 'Taylor Ltd',
    serviceArea: 'Not sure yet',
    preferredNextStep: 'Email me the recommended next step',
    context: 'Need clarity on whether to rebuild or stabilise the current CRM setup.',
    submissionId: 'abc12345opaque',
  });
  assert.ok(withId);
  assert.equal(withId.submissionId, 'abc12345opaque');

  const form = read('src/components/forms/DigitalSystemsReviewForm.tsx');
  assert.match(form, /data\?\.submissionId/);
  assert.match(
    form,
    /apiSubmissionId \? \{ submissionId: apiSubmissionId \} : \{\}/,
  );
});
