import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { isStrongChatSessionId } from '../../lib/chat/chatSessionId.ts';
import {
  buildVisitorChatRouteContexts,
  matchVisitorChatRouteContext,
  resolveVisitorChatRouteContext,
} from '../../lib/chat/visitorChatContext.ts';
import { buildVisitorChatAnalyticsPayload } from '../../lib/chat/visitorChatAnalytics.ts';
import { VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS } from '../../lib/chat/visitorChatAnalyticsCore.ts';
import {
  mapVisitorChatHistoryMessage,
  shouldApplyVisitorPollHistory,
} from '../../lib/chat/visitorChatHistoryMerge.ts';
import {
  buildPwChatAnalyticsPayload,
  createDefaultPwChatAnalyticsSink,
  createPwChatTracker,
  PW_CHAT_EMBED_ANALYTICS_EVENTS,
} from './analytics.ts';
import {
  parseRetryAfterSeconds,
  PW_CHAT_FORBIDDEN_PAYLOAD_KEYS,
  sendWithSessionRecovery,
  stripServerOwnedIdentity,
  type PwChatApiResult,
} from './apiClient.ts';
import { DEFAULT_PW_CHAT_STORAGE_KEYS, normalizeApiBaseUrl, parsePwChatConfig } from './config.ts';
import { computeLauncherBottom, rectsIntersect } from './layout.ts';
import { resolvePwChatBookingUrl, toAttributionPageUrl } from './widget.ts';
import { DEFAULT_CHAT_AVAILABILITY } from '../../lib/chat/visitorChatTypes.ts';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function result(status: number, body: unknown = null): PwChatApiResult {
  return {
    ok: status >= 200 && status < 300,
    status,
    body,
    code: body && typeof body === 'object' ? ((body as { code?: string }).code ?? null) : null,
    retryAfterSeconds: null,
    networkError: status === 0,
  };
}

// --- Config ---

test('config: valid minimal config parses with default storage keys', () => {
  const config = parsePwChatConfig({ apiBaseUrl: 'https://uk.primewayz.com/', siteKey: 'primewayz-infotech' });
  assert.ok(config);
  assert.equal(config.apiBaseUrl, 'https://uk.primewayz.com');
  assert.deepEqual(config.storageKeys, DEFAULT_PW_CHAT_STORAGE_KEYS);
  assert.equal(config.storageKeys.sessionId, 'primewayz_chat_session_id');
  assert.deepEqual(config.intents, []);
});

test('config: malformed or missing required fields fail quietly (null)', () => {
  assert.equal(parsePwChatConfig(null), null);
  assert.equal(parsePwChatConfig('string'), null);
  assert.equal(parsePwChatConfig([]), null);
  assert.equal(parsePwChatConfig({ siteKey: 'x' }), null);
  assert.equal(parsePwChatConfig({ apiBaseUrl: 'https://uk.primewayz.com' }), null);
  assert.equal(parsePwChatConfig({ apiBaseUrl: 'https://uk.primewayz.com', siteKey: '<script>' }), null);
});

test('config: apiBaseUrl must be https (http only on localhost), with no credentials/query/hash', () => {
  assert.equal(normalizeApiBaseUrl('http://uk.primewayz.com'), null);
  assert.equal(normalizeApiBaseUrl('javascript:alert(1)'), null);
  assert.equal(normalizeApiBaseUrl('https://user:pw@uk.primewayz.com'), null);
  assert.equal(normalizeApiBaseUrl('https://uk.primewayz.com/?x=1'), null);
  assert.equal(normalizeApiBaseUrl('http://localhost:3000/'), 'http://localhost:3000');
});

test('config: optional malformed fields are dropped, identity fields are ignored', () => {
  const config = parsePwChatConfig({
    apiBaseUrl: 'https://uk.primewayz.com',
    siteKey: 'primewayz-infotech',
    tenantId: 'pw-uk',
    market: 'UK',
    storageKeys: { sessionId: 'bad key with spaces', visitorName: 'custom_name' },
    intents: [{ key: 'ok', label: 'Fine' }, { key: 'bad key', label: 'x' }, 'nope'],
    contexts: [{ key: 'svc', paths: ['/services'], greeting: 'Hi' }, { key: 'nopath', greeting: 'x' }],
    pageContext: { greeting: 42 },
  });
  assert.ok(config);
  assert.equal(config.storageKeys.sessionId, 'primewayz_chat_session_id');
  assert.equal(config.storageKeys.visitorName, 'custom_name');
  assert.deepEqual(config.intents, [{ key: 'ok', label: 'Fine' }]);
  assert.equal(config.contexts.length, 1);
  assert.equal(config.pageContext, null);
  assert.equal('tenantId' in config, false);
  assert.equal('market' in config, false);
});

// --- Shared context refactor ---

test('shared context: UK resolver behaviour is unchanged', () => {
  assert.equal(resolveVisitorChatRouteContext('/').key, 'homepage');
  assert.equal(resolveVisitorChatRouteContext('/maintenance').key, 'managed_support');
  assert.equal(resolveVisitorChatRouteContext('/blog/a').key, 'articles');
  assert.equal(resolveVisitorChatRouteContext('/unknown').key, 'generic');
  assert.equal(resolveVisitorChatRouteContext('/?ref=x').key, 'homepage');
});

test('shared context: injected JSON contexts match exact paths and prefixes, else fallback', () => {
  const fallback = { key: 'generic', match: () => true, greeting: 'g', supportingText: '' };
  const contexts = buildVisitorChatRouteContexts([
    { key: 'web', paths: ['/web-development/'], greeting: 'Web?' },
    { key: 'blog', pathPrefixes: ['/blog'], greeting: 'Blog?' },
  ]);
  assert.equal(matchVisitorChatRouteContext('/web-development', contexts, fallback).key, 'web');
  assert.equal(matchVisitorChatRouteContext('/blog/post-1', contexts, fallback).key, 'blog');
  assert.equal(matchVisitorChatRouteContext('/blogging', contexts, fallback).key, 'generic');
  assert.equal(matchVisitorChatRouteContext('/maintenance', contexts, fallback).key, 'generic');
});

test('embed source does not import UK-only chat modules', () => {
  for (const file of ['widget.ts', 'renderer.ts', 'analytics.ts', 'apiClient.ts', 'config.ts', 'install.ts', 'index.ts']) {
    const source = read(`src/embed/chat/${file}`);
    assert.doesNotMatch(source, /visitorChatIntents|lib\/analytics|chatSource|conversionCta|canonicalRoutes|resolveChatBookingDestination|react/i, file);
  }
});

// --- API client ---

test('api: Retry-After seconds and HTTP-date are parsed and bounded', () => {
  assert.equal(parseRetryAfterSeconds('7'), 7);
  assert.equal(parseRetryAfterSeconds(null), 30);
  assert.equal(parseRetryAfterSeconds('99999'), 3600);
  const now = Date.parse('2026-10-04T10:00:00Z');
  assert.equal(parseRetryAfterSeconds('Sun, 04 Oct 2026 10:00:20 GMT', now), 20);
});

test('api: server-owned identity keys are stripped from every payload', () => {
  const body = stripServerOwnedIdentity({
    sessionId: 'x', tenantId: 'pw-uk', market: 'UK', sourceSite: 's', sourceOrigin: 'o', sourceChannel: 'c',
  });
  for (const key of PW_CHAT_FORBIDDEN_PAYLOAD_KEYS) assert.equal(key in body, false);
  assert.equal(body.sessionId, 'x');
});

test('api: weak unknown id rotates once and retries once', async () => {
  let id = 'legacy1';
  const rotations: string[] = [];
  const sent: string[] = [];
  const res = await sendWithSessionRecovery(
    { current: () => id, rotate: (rejected) => { rotations.push(rejected); id = '0f8fad5b-d9cb-469f-a165-70867728950e'; return id; } },
    async (sessionId) => {
      sent.push(sessionId);
      return sessionId === 'legacy1' ? result(400, { code: 'session_id_invalid' }) : result(200, {});
    },
  );
  assert.equal(res.ok, true);
  assert.deepEqual(rotations, ['legacy1']);
  assert.equal(sent.length, 2);
  assert.ok(isStrongChatSessionId(sent[1]));
});

test('api: 403, 429, 5xx, network and strong-id rejections never rotate', async () => {
  for (const [sessionId, response] of [
    ['legacy1', result(403, { code: 'forbidden' })],
    ['legacy1', result(429, { code: 'rate_limited' })],
    ['legacy1', result(500, {})],
    ['legacy1', result(0)],
    ['0f8fad5b-d9cb-469f-a165-70867728950e', result(400, { code: 'session_id_invalid' })],
  ] as const) {
    let rotated = false;
    let sends = 0;
    await sendWithSessionRecovery(
      { current: () => sessionId, rotate: () => { rotated = true; return 'x'; } },
      async () => { sends += 1; return response; },
    );
    assert.equal(rotated, false, `status ${response.status}`);
    assert.equal(sends, 1);
  }
});

test('api: every request uses credentials omit and cache no-store', () => {
  const source = read('src/embed/chat/apiClient.ts');
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /cache: 'no-store'/);
  assert.doesNotMatch(source, /admin-ajax|wp-json/);
});

// --- Analytics ---

test('analytics: payload is allowlisted, path-only and PII-free', () => {
  const payload = buildPwChatAnalyticsPayload({
    route: '/services/?email=a@b.com#x',
    pageType: 'page',
    availabilityState: 'assistant',
    intentKey: 'web',
  });
  assert.deepEqual(payload, {
    placement: 'chat_widget',
    route: '/services/',
    page_type: 'page',
    availability_state: 'assistant',
    intent_key: 'web',
  });
  for (const key of VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS) assert.equal(key in payload, false);
});

test('analytics: values carrying emails or session ids are dropped', () => {
  const payload = buildPwChatAnalyticsPayload({
    route: '/u/jane@example.com',
    intentKey: '0f8fad5b-d9cb-469f-a165-70867728950e',
  });
  assert.equal('route' in payload, false);
  assert.equal('intent_key' in payload, false);
});

test('analytics: shared prohibited list now also covers server-owned source identity', () => {
  for (const key of ['tenantId', 'market', 'sourceSite', 'sourceOrigin', 'sourceChannel']) {
    assert.ok((VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS as readonly string[]).includes(key));
  }
  assert.deepEqual(buildVisitorChatAnalyticsPayload({ route: '/x?y=1', availabilityState: 'online' }), {
    placement: 'chat_widget', route: '/x', availability_state: 'online',
  });
});

test('analytics: default sink prefers PWSCTrackEvent, then gtag, then dataLayer', () => {
  const calls: string[] = [];
  const full = {
    PWSCTrackEvent: () => calls.push('pwsc'),
    gtag: () => calls.push('gtag'),
    dataLayer: { push: () => calls.push('dl') },
  };
  createDefaultPwChatAnalyticsSink(full as unknown as Window, () => true)('chat_open', {});
  const gtagOnly = { gtag: (...args: unknown[]) => calls.push(`gtag:${String(args[1])}`), dataLayer: [] };
  createDefaultPwChatAnalyticsSink(gtagOnly as unknown as Window, () => true)('chat_open', {});
  const dataLayer: unknown[] = [];
  createDefaultPwChatAnalyticsSink({ dataLayer } as unknown as Window, () => true)('chat_open', { placement: 'chat_widget' });
  assert.deepEqual(calls, ['pwsc', 'gtag:chat_open']);
  assert.deepEqual(dataLayer, [{ event: 'chat_open', placement: 'chat_widget' }]);
  assert.doesNotThrow(() => createDefaultPwChatAnalyticsSink({ PWSCTrackEvent: () => { throw new Error('x'); } } as unknown as Window, () => true)('chat_open', {}));
});

test('analytics: embedded chat emits nothing until analytics consent', () => {
  const calls: string[] = [];
  const sink = createDefaultPwChatAnalyticsSink(
    {
      PWSCTrackEvent: () => calls.push('event'),
      gtag: () => calls.push('gtag'),
      dataLayer: [],
    } as unknown as Window,
    () => false,
  );
  sink('chat_open', {});
  assert.deepEqual(calls, []);
});

test('analytics: tracker only emits the six supported events', () => {
  assert.deepEqual([...PW_CHAT_EMBED_ANALYTICS_EVENTS], [
    'chat_open', 'chat_message_sent', 'chat_lead_captured',
    'chat_human_handoff_requested', 'chat_message_send_failed', 'chat_appointment_requested',
  ]);
  const seen: Array<[string, Record<string, unknown>]> = [];
  createPwChatTracker((name, params) => seen.push([name, params]))('chat_message_send_failed', { failureReason: 'rate_limited' });
  assert.deepEqual(seen, [['chat_message_send_failed', { placement: 'chat_widget', failure_reason: 'rate_limited' }]]);
});

// --- Booking gate ---

test('booking: requires canBookCall AND scheduling.enabled AND an https URL', () => {
  const base = DEFAULT_CHAT_AVAILABILITY;
  const scheduling = { enabled: true, provider: 'calendly', eventTypeKey: 'x', publicBookingUrl: 'https://calendly.com/pw/call' };
  assert.equal(resolvePwChatBookingUrl(base), null);
  assert.equal(resolvePwChatBookingUrl({ ...base, canBookCall: true, scheduling: { ...scheduling, enabled: false } }), null);
  assert.equal(resolvePwChatBookingUrl({ ...base, canBookCall: false, scheduling }), null);
  assert.equal(resolvePwChatBookingUrl({ ...base, canBookCall: true, scheduling: { ...scheduling, publicBookingUrl: 'javascript:alert(1)' } }), null);
  assert.equal(resolvePwChatBookingUrl({ ...base, canBookCall: true, scheduling: { ...scheduling, publicBookingUrl: 'http://calendly.com/x' } }), null);
  assert.equal(resolvePwChatBookingUrl({ ...base, canBookCall: true, scheduling }), 'https://calendly.com/pw/call');
});

// --- Attribution ---

test('attribution: page URL keeps origin, path and utm_* only', () => {
  assert.equal(
    toAttributionPageUrl('https://primewayz.com/services/?utm_source=li&token=secret&email=a%40b.com#top'),
    'https://primewayz.com/services/?utm_source=li',
  );
  assert.equal(toAttributionPageUrl('https://primewayz.com/'), 'https://primewayz.com/');
});

// --- Shared history helpers ---

test('history mapper keeps text as plain strings and whitelists senders', () => {
  const msg = mapVisitorChatHistoryMessage({ id: 5, text: '<b>x</b>', sender: 'root', timestamp: 'nope' });
  assert.ok(msg);
  assert.equal(msg.text, '<b>x</b>');
  assert.equal(msg.sender, 'bot');
  assert.equal(msg.id, '5');
  assert.equal(mapVisitorChatHistoryMessage(null), null);
  assert.equal(mapVisitorChatHistoryMessage({ text: 'no id' }), null);
});

test('poll apply guard: empty remote never clears local messages', () => {
  const local = [{ id: '1', text: 'a', sender: 'user' as const, timestamp: new Date(), deliveryStatus: 'sent' as const }];
  assert.equal(shouldApplyVisitorPollHistory({ remote: [], local, lastSeenAdminId: null }), false);
  assert.equal(shouldApplyVisitorPollHistory({ remote: local, local, lastSeenAdminId: null }), false);
  const withAdmin = [...local, { id: '2', text: 'hi', sender: 'admin' as const, timestamp: new Date() }];
  assert.equal(shouldApplyVisitorPollHistory({ remote: withAdmin, local, lastSeenAdminId: null }), true);
});

// --- Layout ---

test('layout: launcher stays at 18px when #back-to-top is absent or elsewhere', () => {
  assert.equal(computeLauncherBottom({ viewportWidth: 1280, viewportHeight: 800, obstacles: [] }), 18);
  const farLeft = { left: 10, right: 50, top: 740, bottom: 780 };
  assert.equal(computeLauncherBottom({ viewportWidth: 1280, viewportHeight: 800, obstacles: [farLeft] }), 18);
});

test('layout: launcher lifts above an overlapping #back-to-top with a 12px gap', () => {
  const backToTop = { left: 1220, right: 1260, top: 740, bottom: 780 };
  assert.equal(rectsIntersect({ left: 1206, right: 1262, top: 726, bottom: 782 }, backToTop), true);
  assert.equal(computeLauncherBottom({ viewportWidth: 1280, viewportHeight: 800, obstacles: [backToTop] }), 72);
});

// --- Build isolation ---

test('build: embed config is separate and the main Vite build keeps base "/"', () => {
  const main = read('vite.config.ts');
  assert.match(main, /base:\s*'\/'/);
  assert.doesNotMatch(main, /embed/);
  const embed = read('vite.embed.config.ts');
  assert.match(embed, /formats:\s*\['iife'\]/);
  assert.match(embed, /dist\/embed/);
  assert.doesNotMatch(embed, /plugin-react|tailwind/);
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
  assert.equal(pkg.scripts.build, 'npm run build:client && npm run build:ssr');
  assert.match(pkg.scripts['build:chat-embed'], /vite\.embed\.config\.ts/);
});

test('security: embed never parses HTML strings or uses Math.random', () => {
  for (const file of fs.readdirSync(path.join(root, 'src/embed/chat')).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
    const source = read(`src/embed/chat/${file}`);
    assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|Math\.random|eval\(/, file);
  }
});
