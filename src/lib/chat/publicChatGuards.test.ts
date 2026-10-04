import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { resolveSourceContext, SourceResolutionError } from '../platform/sourceResolver.ts';
import { toPersistedSourceContext } from '../platform/sourceContext.ts';
import {
  assertPublicChatReferencesOwned,
  buildPublicChatSessionSourceData,
  enforcePublicChatRateLimit,
  isPermittedAdminChatReplySender,
  isPublicChatClientIpAttributable,
  PUBLIC_CHAT_INPUT_LIMITS,
  PUBLIC_CHAT_RATE_LIMITS,
  PublicChatRequestError,
  resetPublicChatRateLimitsForTests,
  toPublicChatSessionResponse,
  validateChatAppointmentInput,
  validateChatHeartbeatInput,
  validateChatRespondInput,
  validateChatSessionInput,
  validateExistingOrNewChatSessionId,
  type PublicChatReferenceStore,
} from './publicChatGuards.ts';

const uk = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat' });
const infotech = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' });
const STRONG_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const LEGACY_ID = 'k3j9x2';
const DEV_ENV = { NODE_ENV: 'development' } as NodeJS.ProcessEnv;

function expectGuardError(fn: () => unknown, status: number, code: string): PublicChatRequestError {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof PublicChatRequestError, 'expected PublicChatRequestError');
  assert.equal(caught.status, status);
  assert.equal(caught.code, code);
  return caught;
}

beforeEach(() => resetPublicChatRateLimitsForTests());

// --- Session ids ---

test('new UUID v4 session id is accepted', () => {
  assert.deepEqual(
    validateExistingOrNewChatSessionId({ sessionId: STRONG_ID, existingSession: null, source: uk }),
    { sessionId: STRONG_ID, isExisting: false },
  );
});

test('new weak session id is rejected with session_id_invalid', () => {
  const error = expectGuardError(
    () => validateExistingOrNewChatSessionId({ sessionId: LEGACY_ID, existingSession: null, source: uk }),
    400,
    'session_id_invalid',
  );
  assert.deepEqual(error.toResponseBody(), {
    error: 'Invalid chat session identifier.',
    code: 'session_id_invalid',
  });
});

test('existing legacy weak session id is accepted for its own tenant', () => {
  assert.deepEqual(
    validateExistingOrNewChatSessionId({ sessionId: LEGACY_ID, existingSession: { tenantId: 'pw-uk' }, source: uk }),
    { sessionId: LEGACY_ID, isExisting: true },
  );
  assert.equal(
    validateExistingOrNewChatSessionId({ sessionId: LEGACY_ID, existingSession: { tenantId: null }, source: uk })
      .isExisting,
    true,
    'pre-tenant legacy UK sessions keep working',
  );
});

test('cross-tenant legacy session is still rejected', () => {
  assert.throws(
    () => validateExistingOrNewChatSessionId({ sessionId: LEGACY_ID, existingSession: { tenantId: 'pw-uk' }, source: infotech }),
    SourceResolutionError,
  );
  assert.throws(
    () => validateExistingOrNewChatSessionId({ sessionId: LEGACY_ID, existingSession: { tenantId: null }, source: infotech }),
    SourceResolutionError,
  );
  assert.throws(
    () => validateExistingOrNewChatSessionId({ sessionId: STRONG_ID, existingSession: { tenantId: 'pw-infotech' }, source: uk }),
    SourceResolutionError,
  );
});

test('malformed session ids return session_id_invalid before any lookup', () => {
  for (const sessionId of [123, {}, ['a'], '', 'x'.repeat(192)]) {
    expectGuardError(
      () => validateExistingOrNewChatSessionId({ sessionId, existingSession: null, source: uk }),
      400,
      'session_id_invalid',
    );
  }
});

// --- Rate limiting ---

function allowed(input: Parameters<typeof enforcePublicChatRateLimit>[0]): boolean {
  try {
    enforcePublicChatRateLimit({ env: DEV_ENV, ...input });
    return true;
  } catch (error) {
    if (error instanceof PublicChatRequestError && error.status === 429) return false;
    throw error;
  }
}

test('normal visitor polling cadence plus admin refresh is allowed for 10 minutes', () => {
  const start = 1_700_000_000_000;
  for (let second = 0; second < 600; second += 1) {
    const now = start + second * 1000;
    if (second % 5 === 0) {
      assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '203.0.113.10', sessionId: STRONG_ID, now }));
    }
    if (second % 3 === 0) {
      assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '198.51.100.7', sessionId: STRONG_ID, now }));
    }
    if (second % 30 === 0) {
      assert.ok(allowed({ category: 'heartbeat', tenantId: 'pw-uk', clientIp: '203.0.113.10', sessionId: STRONG_ID, now }));
    }
    if (second % 60 === 0) {
      assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '203.0.113.10', now }));
    }
  }
});

test('several visitors behind one office IP can poll normally', () => {
  const now = 1_700_000_000_000;
  for (let visitor = 0; visitor < 10; visitor += 1) {
    const sessionId = `${STRONG_ID.slice(0, -2)}${String(visitor).padStart(2, '0')}`;
    for (let poll = 0; poll < 12; poll += 1) {
      assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '203.0.113.20', sessionId, now }));
    }
    assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '203.0.113.20', now }));
    assert.ok(allowed({ category: 'heartbeat', tenantId: 'pw-uk', clientIp: '203.0.113.20', sessionId, now }));
  }
});

test('abusive message sending on one session is blocked with 429 and Retry-After', () => {
  const now = 1_700_000_000_000;
  const limit = PUBLIC_CHAT_RATE_LIMITS.message.session.limit;
  for (let index = 0; index < limit; index += 1) {
    assert.ok(allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.30', sessionId: STRONG_ID, now }));
  }
  const error = expectGuardError(
    () => enforcePublicChatRateLimit({
      category: 'message',
      tenantId: 'pw-uk',
      clientIp: '203.0.113.30',
      sessionId: STRONG_ID,
      now: now + 5000,
      env: DEV_ENV,
    }),
    429,
    'rate_limited',
  );
  assert.equal(error.retryAfterSeconds, 55);
  assert.deepEqual(error.toResponseBody(), { error: 'Too many requests.', code: 'rate_limited' });

  assert.ok(
    allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.30', sessionId: STRONG_ID, now: now + 60_000 }),
    'window resets',
  );
});

test('rotating session ids from one IP is capped by the client bucket', () => {
  const now = 1_700_000_000_000;
  const limit = PUBLIC_CHAT_RATE_LIMITS.message.client.limit;
  for (let index = 0; index < limit; index += 1) {
    assert.ok(allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.40', sessionId: `rotating-${index}`, now }));
  }
  assert.equal(
    allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.40', sessionId: 'rotating-next', now }),
    false,
  );
});

test('rate limits are separated per tenant and per category', () => {
  const now = 1_700_000_000_000;
  for (let index = 0; index < PUBLIC_CHAT_RATE_LIMITS.message.session.limit; index += 1) {
    allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.50', sessionId: STRONG_ID, now });
  }
  assert.equal(allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '203.0.113.50', sessionId: STRONG_ID, now }), false);
  assert.ok(allowed({ category: 'message', tenantId: 'pw-infotech', clientIp: '203.0.113.50', sessionId: STRONG_ID, now }));
  assert.ok(allowed({ category: 'read', tenantId: 'pw-uk', clientIp: '203.0.113.50', sessionId: STRONG_ID, now }));
});

test('appointment requests use a 15 minute window', () => {
  const now = 1_700_000_000_000;
  for (let index = 0; index < PUBLIC_CHAT_RATE_LIMITS.appointment.session.limit; index += 1) {
    assert.ok(allowed({ category: 'appointment', tenantId: 'pw-uk', clientIp: '203.0.113.60', sessionId: STRONG_ID, now }));
  }
  assert.equal(
    allowed({ category: 'appointment', tenantId: 'pw-uk', clientIp: '203.0.113.60', sessionId: STRONG_ID, now: now + 10 * 60_000 }),
    false,
  );
  assert.ok(
    allowed({ category: 'appointment', tenantId: 'pw-uk', clientIp: '203.0.113.60', sessionId: STRONG_ID, now: now + 15 * 60_000 }),
  );
});

test('loopback client IP in production without TRUST_PROXY does not become one shared bucket', () => {
  const prodNoProxy = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;
  const prodProxy = { NODE_ENV: 'production', TRUST_PROXY: '1' } as NodeJS.ProcessEnv;
  assert.equal(isPublicChatClientIpAttributable('127.0.0.1', prodNoProxy), false);
  assert.equal(isPublicChatClientIpAttributable('::ffff:127.0.0.1', prodNoProxy), false);
  assert.equal(isPublicChatClientIpAttributable('127.0.0.1', prodProxy), true);
  assert.equal(isPublicChatClientIpAttributable('203.0.113.70', prodNoProxy), true);
  assert.equal(isPublicChatClientIpAttributable('unknown', DEV_ENV), false);

  const now = 1_700_000_000_000;
  for (let visitor = 0; visitor < PUBLIC_CHAT_RATE_LIMITS.message.client.limit + 10; visitor += 1) {
    assert.ok(allowed({
      category: 'message',
      tenantId: 'pw-uk',
      clientIp: '127.0.0.1',
      sessionId: `visitor-${visitor}`,
      now,
      env: prodNoProxy,
    }));
  }
  for (let index = 1; index < PUBLIC_CHAT_RATE_LIMITS.message.session.limit; index += 1) {
    allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '127.0.0.1', sessionId: 'visitor-0', now, env: prodNoProxy });
  }
  assert.equal(
    allowed({ category: 'message', tenantId: 'pw-uk', clientIp: '127.0.0.1', sessionId: 'visitor-0', now, env: prodNoProxy }),
    false,
    'session bucket still applies',
  );
});

// --- Input validation ---

const LIVE_CHAT_SOURCE_PAYLOAD = {
  firstLandingPage: '/',
  currentPageUrl: 'https://uk.primewayz.com/services?utm_source=google',
  referrer: 'https://www.google.com/',
  utmSource: 'google',
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  firstUtmSource: 'google',
  latestUtmSource: 'google',
  deviceType: 'desktop',
  browser: 'Chrome',
  serviceInterest: 'Services overview',
};

test('current LiveChat respond payload is accepted unchanged', () => {
  assert.deepEqual(
    validateChatRespondInput({ sessionId: LEGACY_ID, message: 'Hello there', userName: 'Sam', attachmentIds: [] }),
    { message: 'Hello there', userName: 'Sam', attachmentIds: [], replyToId: null },
  );
  assert.deepEqual(
    validateChatRespondInput({ sessionId: STRONG_ID, message: 'Shared an attachment' }),
    { message: 'Shared an attachment', userName: undefined, attachmentIds: undefined, replyToId: null },
  );
});

test('message length and whitespace limits', () => {
  assert.equal(validateChatRespondInput({ message: 'a'.repeat(PUBLIC_CHAT_INPUT_LIMITS.message) }).message.length, 4000);
  assert.equal(expectGuardError(() => validateChatRespondInput({ message: 'a'.repeat(4001) }), 400, 'invalid_input').field, 'message');
  expectGuardError(() => validateChatRespondInput({ message: '   \n\t ' }), 400, 'invalid_input');
  expectGuardError(() => validateChatRespondInput({ message: { text: 'hi' } }), 400, 'invalid_input');
});

test('userName / name and email limits', () => {
  assert.equal(validateChatRespondInput({ message: 'hi', userName: 'n'.repeat(200) }).userName?.length, 200);
  expectGuardError(() => validateChatRespondInput({ message: 'hi', userName: 'n'.repeat(201) }), 400, 'invalid_input');
  expectGuardError(() => validateChatRespondInput({ message: 'hi', userName: 42 }), 400, 'invalid_input');

  const email320 = `${'e'.repeat(308)}@example.com`;
  assert.equal(email320.length, 320);
  assert.deepEqual(validateChatSessionInput({ name: 'Sam', email: email320, ...LIVE_CHAT_SOURCE_PAYLOAD }), { name: 'Sam', email: email320 });
  expectGuardError(() => validateChatSessionInput({ email: `e${email320}` }), 400, 'invalid_input');
  expectGuardError(() => validateChatSessionInput({ name: 'n'.repeat(201) }), 400, 'invalid_input');
  assert.deepEqual(
    validateChatSessionInput({ name: 'Sam', email: 'not-strict-format' }),
    { name: 'Sam', email: 'not-strict-format' },
    'no new email format rules are imposed',
  );

  assert.deepEqual(validateChatHeartbeatInput({ userName: '', userEmail: '', ...LIVE_CHAT_SOURCE_PAYLOAD }), { userName: '', userEmail: '' });
  expectGuardError(() => validateChatHeartbeatInput({ userEmail: 'e'.repeat(321) }), 400, 'invalid_input');
});

test('appointment field limits including phone', () => {
  const input = validateChatAppointmentInput({
    sessionId: STRONG_ID,
    name: 'Sam',
    email: 'sam@example.com',
    phone: '+44 20 7946 0000',
    preferredDate: '2026-10-05',
    preferredTime: '10:30',
    timezone: 'Europe/London',
    message: 'Discuss CRM support',
  });
  assert.equal(input.phone, '+44 20 7946 0000');
  expectGuardError(() => validateChatAppointmentInput({ phone: '1'.repeat(41) }), 400, 'invalid_input');
  expectGuardError(() => validateChatAppointmentInput({ message: 'm'.repeat(4001) }), 400, 'invalid_input');
  expectGuardError(() => validateChatAppointmentInput({ timezone: 'T'.repeat(65) }), 400, 'invalid_input');
  expectGuardError(() => validateChatAppointmentInput({ preferredDate: 'd'.repeat(65) }), 400, 'invalid_input');
});

test('attachmentIds must be a bounded array of positive integers', () => {
  assert.deepEqual(validateChatRespondInput({ message: 'hi', attachmentIds: [3, 3, 4] }).attachmentIds, [3, 4]);
  for (const attachmentIds of ['1', { id: 1 }, [1, '2'], [0], [-1], [1.5], [Number.NaN], Array.from({ length: 11 }, (_, i) => i + 1)]) {
    assert.equal(
      expectGuardError(() => validateChatRespondInput({ message: 'hi', attachmentIds }), 400, 'invalid_input').field,
      'attachmentIds',
    );
  }
});

test('replyToId must be a positive integer when supplied', () => {
  assert.equal(validateChatRespondInput({ message: 'hi', replyToId: 12 }).replyToId, 12);
  assert.equal(validateChatRespondInput({ message: 'hi', replyToId: null }).replyToId, null);
  expectGuardError(() => validateChatRespondInput({ message: 'hi', replyToId: '12' }), 400, 'invalid_input');
  expectGuardError(() => validateChatRespondInput({ message: 'hi', replyToId: -3 }), 400, 'invalid_input');
});

test('client-supplied campaignId is bounded', () => {
  expectGuardError(() => validateChatSessionInput({ campaignId: 'c'.repeat(192) }), 400, 'invalid_input');
  assert.doesNotThrow(() => validateChatSessionInput({ campaignId: 'c'.repeat(191) }));
});

test('attribution strings are truncated to their column sizes and never include source identity', () => {
  const data = buildPublicChatSessionSourceData({
    ...LIVE_CHAT_SOURCE_PAYLOAD,
    currentPageUrl: `https://uk.primewayz.com/?q=${'x'.repeat(5000)}`,
    referrer: 'r'.repeat(3000),
    utmSource: 'u'.repeat(500),
    firstLandingPage: `/${'p'.repeat(400)}`,
    browser: { name: 'Chrome' },
  });
  assert.equal(data.currentPageUrl?.length, 2048);
  assert.equal(data.referrer?.length, 2048);
  assert.equal(data.utmSource?.length, 191);
  assert.equal(data.firstLandingPage?.length, 191);
  assert.equal(data.browser, undefined);
  assert.equal(data.deviceType, 'desktop');
  for (const key of ['tenantId', 'market', 'sourceSite', 'sourceOrigin', 'sourceChannel']) {
    assert.equal(key in data, false, key);
  }
});

// --- Reference ownership ---

function referenceStore(records: {
  attachments: Array<{ id: number; sessionId: string }>;
  messages: Array<{ id: number; sessionId: string; isInternalNote: boolean }>;
}): PublicChatReferenceStore {
  return {
    chatAttachment: {
      count: async ({ where }) =>
        records.attachments.filter((item) => where.id.in.includes(item.id) && item.sessionId === where.sessionId).length,
    },
    chatMessage: {
      count: async ({ where }) =>
        records.messages.filter(
          (item) =>
            item.id === where.id && item.sessionId === where.sessionId && item.isInternalNote === where.isInternalNote,
        ).length,
    },
  };
}

test('visitor messages can only reference attachments and messages in their own session', async () => {
  const store = referenceStore({
    attachments: [{ id: 1, sessionId: STRONG_ID }, { id: 2, sessionId: 'other-session' }],
    messages: [
      { id: 10, sessionId: STRONG_ID, isInternalNote: false },
      { id: 11, sessionId: 'other-session', isInternalNote: false },
      { id: 12, sessionId: STRONG_ID, isInternalNote: true },
    ],
  });
  await assertPublicChatReferencesOwned(store, STRONG_ID, { attachmentIds: [1], replyToId: 10 });
  await assertPublicChatReferencesOwned(store, STRONG_ID, { attachmentIds: [], replyToId: null });

  for (const input of [
    { attachmentIds: [2], replyToId: null },
    { attachmentIds: [1, 2], replyToId: null },
    { attachmentIds: undefined, replyToId: 11 },
    { attachmentIds: undefined, replyToId: 12 },
  ]) {
    await assert.rejects(
      assertPublicChatReferencesOwned(store, STRONG_ID, input),
      (error: unknown) => error instanceof PublicChatRequestError && error.code === 'invalid_input',
    );
  }
});

// --- Responses ---

test('heartbeat / session responses do not echo visitor PII or attribution', () => {
  const fullRow = {
    id: STRONG_ID,
    status: 'bot_replied',
    name: 'Sam Visitor',
    email: 'sam@example.com',
    currentPageUrl: 'https://uk.primewayz.com/services',
    referrer: 'https://www.google.com/',
    tenantId: 'pw-uk',
    visitorLastSeenAt: new Date(),
  };
  assert.deepEqual(toPublicChatSessionResponse(fullRow), {
    ok: true,
    id: STRONG_ID,
    sessionId: STRONG_ID,
    status: 'bot_replied',
  });
  assert.deepEqual(toPublicChatSessionResponse({ id: LEGACY_ID, status: 'new' }, { unavailable: true }), {
    ok: true,
    id: LEGACY_ID,
    sessionId: LEGACY_ID,
    status: 'new',
    unavailable: true,
  });
});

// --- Admin reply sender ---

test('admin reply endpoint only accepts sender=admin', () => {
  assert.equal(isPermittedAdminChatReplySender('admin'), true);
  for (const sender of ['bot', 'user', 'system', 'ADMIN', '', undefined, null, ['admin']]) {
    assert.equal(isPermittedAdminChatReplySender(sender), false, String(sender));
  }
});

// --- Source attribution / spoofing ---

test('source attribution for Primewayz UK and Primewayz Infotech is unchanged', () => {
  assert.deepEqual(toPersistedSourceContext(uk), {
    tenantId: 'pw-uk',
    market: 'UK',
    sourceSite: 'uk.primewayz.com',
    sourceOrigin: 'https://uk.primewayz.com',
    sourceChannel: 'chat',
    campaignId: null,
  });
  assert.deepEqual(toPersistedSourceContext(infotech), {
    tenantId: 'pw-infotech',
    market: 'IN',
    sourceSite: 'primewayz.com',
    sourceOrigin: 'https://primewayz.com',
    sourceChannel: 'chat',
    campaignId: null,
  });
  const www = resolveSourceContext({ origin: 'https://www.primewayz.com', sourceChannel: 'chat' });
  assert.equal(www.tenantId, 'pw-infotech');
  assert.equal(www.sourceSite, 'primewayz.com');
});

test('public chat bodies cannot override source identity fields', () => {
  for (const key of ['tenantId', 'market', 'sourceSite', 'sourceOrigin', 'sourceChannel']) {
    assert.throws(
      () => resolveSourceContext({
        origin: 'https://primewayz.com',
        sourceChannel: 'chat',
        body: { sessionId: STRONG_ID, message: 'hi', [key]: 'pw-uk' },
      }),
      /controlled by the server/,
      key,
    );
  }
});

test('unknown origins cannot resolve a chat tenant', () => {
  assert.throws(
    () => resolveSourceContext({ origin: 'https://evil.example', sourceChannel: 'chat' }),
    SourceResolutionError,
  );
});
