import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { Window as HappyDomWindow } from 'happy-dom';
import { isStrongChatSessionId } from '../../lib/chat/chatSessionId.ts';
import { RRB_SILVER_APPROVED_ANSWERS, RRB_SILVER_CHAT_WIDGET } from '../../lib/chat/tenantContent/rrbSilverCampaign.ts';
import { VISITOR_CHAT_HUMAN_JOINED_NOTICE } from '../../lib/chat/visitorChatIdentity.ts';
import { VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS } from '../../lib/chat/visitorChatAnalyticsCore.ts';
import { PW_CHAT_EMBED_ANALYTICS_EVENTS } from './analytics.ts';
import { PW_CHAT_FORBIDDEN_PAYLOAD_KEYS } from './apiClient.ts';
import { installPrimewayzChat } from './install.ts';
import { PW_CHAT_EMBED_VERSION } from './version.ts';
import type { PwChatWidgetHandle } from './widget.ts';

type HostWindow = Window & typeof globalThis;
type Call = { method: string; path: string; body: Record<string, unknown> | null; init: RequestInit };
type FakeResponse = { status: number; body?: unknown; headers?: Record<string, string> };

const STRONG_ID = '3f2b8c1e-7a4d-4e9b-8c2a-1d5e6f7a8b9c';
const API = 'https://uk.primewayz.com';

const openWindows: Array<{ happyDOM: { close: () => Promise<void> } }> = [];
const liveHandles: PwChatWidgetHandle[] = [];
afterEach(async () => {
  for (const handle of liveHandles.splice(0)) handle.destroy();
  mock.timers.reset();
  for (const win of openWindows.splice(0)) await win.happyDOM.close();
});

function availability(overrides: Record<string, unknown> = {}) {
  return {
    status: 'assistant',
    title: 'x',
    subtitle: 'x',
    responseExpectation: 'We usually respond within one business day.',
    businessHours: 'Mon-Fri',
    canAcceptMessages: true,
    canBookCall: false,
    serverTime: '',
    tenantId: 'pw-infotech',
    scheduling: { enabled: false, provider: null, eventTypeKey: null, publicBookingUrl: null },
    ...overrides,
  };
}

function createBackend(routes: Partial<Record<string, (call: Call) => FakeResponse>> = {}) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init: RequestInit): Promise<Response> => {
    const parsed = new URL(url);
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    const call: Call = { method: init.method ?? 'GET', path: parsed.pathname, body, init };
    calls.push(call);
    const key = parsed.pathname.startsWith('/api/chat/') && call.method === 'GET'
      && !['/api/chat/availability'].includes(parsed.pathname)
      ? 'history'
      : `${call.method} ${parsed.pathname}`;
    const defaults: Record<string, () => FakeResponse> = {
      'GET /api/platform/capabilities': () => ({ status: 200, body: { capabilities: { chat: true, scheduling: true } } }),
      'GET /api/chat/availability': () => ({ status: 200, body: availability() }),
      history: () => ({ status: 200, body: [] }),
      'POST /api/chat/heartbeat': () => ({ status: 200, body: { ok: true } }),
      'POST /api/chat/session': () => ({ status: 200, body: { ok: true, leadCaptured: true } }),
      'POST /api/chat/respond': (() => {
        let n = 100;
        return () => {
          n += 2;
          return {
            status: 200,
            body: {
              userMessage: { id: n, text: body?.message, sender: 'user', timestamp: new Date().toISOString() },
              botMessage: { id: n + 1, text: 'Thanks, the team will follow up.', sender: 'bot', timestamp: new Date().toISOString() },
              availability: availability(),
            },
          };
        };
      })(),
    };
    const handler = routes[key] ?? defaults[key];
    const response = handler ? handler(call) : { status: 404, body: { error: 'not found' } };
    const headers = response.headers ?? {};
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: { get: (name: string) => headers[name] ?? null },
      json: async () => response.body ?? null,
    } as unknown as Response;
  };
  return { calls, fetchImpl };
}

function createWindow(options: {
  config?: unknown;
  url?: string;
  width?: number;
  storage?: Record<string, string>;
} = {}): HostWindow {
  const win = new HappyDomWindow({
    url: options.url ?? 'https://primewayz.com/services/?utm_source=linkedin&token=secret',
    width: options.width ?? 1280,
    height: 800,
  });
  openWindows.push(win as unknown as { happyDOM: { close: () => Promise<void> } });
  const host = win as unknown as HostWindow;
  for (const [key, value] of Object.entries(options.storage ?? {})) host.localStorage.setItem(key, value);
  const config = options.config === undefined
    ? { apiBaseUrl: API, siteKey: 'primewayz-infotech', pageType: 'page' }
    : options.config;
  if (config !== null) {
    const script = host.document.createElement('script');
    script.type = 'application/json';
    script.id = 'pwi-chat-config';
    script.textContent = typeof config === 'string' ? config : JSON.stringify(config);
    host.document.body.appendChild(script);
  }
  return host;
}

const nodeTimers = {
  setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
  clearTimeout: (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

async function flush(rounds = 8) {
  for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => setImmediate(resolve));
}

async function advance(ms: number) {
  mock.timers.tick(ms);
  await flush();
}

async function boot(win: HostWindow, backend = createBackend(), sink?: (name: string, params: Record<string, unknown>) => void) {
  const handle = await installPrimewayzChat(win, {
    fetchImpl: backend.fetchImpl,
    analyticsSink: sink ?? (() => {}),
    timers: nodeTimers,
  });
  await flush();
  if (handle) liveHandles.push(handle);
  return { handle: handle as PwChatWidgetHandle | null, backend };
}

const q = <T extends Element = HTMLElement>(handle: PwChatWidgetHandle, selector: string) =>
  handle.shadow.querySelector(selector) as T | null;

async function sendText(handle: PwChatWidgetHandle, text: string) {
  const textarea = q<HTMLTextAreaElement>(handle, '.pw-chat-textarea')!;
  textarea.value = text;
  q<HTMLFormElement>(handle, '.pw-chat-composer')!.dispatchEvent(new (textarea.ownerDocument.defaultView as unknown as HostWindow).Event('submit', { cancelable: true }));
  await flush();
}

const historyCalls = (calls: Call[]) => calls.filter((c) => c.method === 'GET' && /^\/api\/chat\/(?!availability)/.test(c.path));
const posts = (calls: Call[], path: string) => calls.filter((c) => c.method === 'POST' && c.path === path);

// --- Boot ---

test('boot: malformed config JSON fails silently with no widget and no requests', async () => {
  const win = createWindow({ config: '{not json' });
  const { handle, backend } = await boot(win);
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.equal(backend.calls.length, 0);
});

test('boot: missing config renders nothing', async () => {
  const win = createWindow({ config: null });
  const { handle, backend } = await boot(win);
  assert.equal(handle, null);
  assert.equal(backend.calls.length, 0);
});

test('boot: capabilities.chat !== true renders nothing and skips availability', async () => {
  const win = createWindow();
  const backend = createBackend({
    'GET /api/platform/capabilities': () => ({ status: 200, body: { capabilities: { chat: false, scheduling: true } } }),
  });
  const { handle } = await boot(win, backend);
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.deepEqual(backend.calls.map((c) => c.path), ['/api/platform/capabilities']);
});

test('boot: script loaded twice creates exactly one widget', async () => {
  const win = createWindow();
  const backend = createBackend();
  const first = installPrimewayzChat(win, { fetchImpl: backend.fetchImpl, timers: nodeTimers, analyticsSink: () => {} });
  const second = installPrimewayzChat(win, { fetchImpl: backend.fetchImpl, timers: nodeTimers, analyticsSink: () => {} });
  assert.equal(second, null);
  const handle = await first;
  if (handle) liveHandles.push(handle);
  await flush();
  assert.equal(win.document.querySelectorAll('#pw-chat-root').length, 1);
  assert.equal(backend.calls.filter((c) => c.path === '/api/platform/capabilities').length, 1);
  const api = (win as unknown as { PrimewayzChat: { version: string; open: unknown; close: unknown } }).PrimewayzChat;
  assert.deepEqual(Object.keys(api).sort(), ['close', 'open', 'registerObstacle', 'version']);
});

test('boot: requests go to the configured UK API with credentials omit and no-store', async () => {
  const win = createWindow();
  const { handle, backend } = await boot(win);
  assert.ok(handle);
  handle.open();
  await flush();
  assert.ok(backend.calls.length >= 3);
  for (const call of backend.calls) {
    assert.equal(call.init.credentials, 'omit');
    assert.equal(call.init.cache, 'no-store');
  }
});

// --- Shadow DOM ---

test('shadow DOM: launcher and panel render inside a closed shadow root only', async () => {
  const win = createWindow();
  const { handle } = await boot(win);
  assert.ok(handle);
  const host = win.document.getElementById('pw-chat-root')!;
  assert.equal(host.shadowRoot, null);
  assert.ok(q(handle, 'button.pw-chat-launcher'));
  assert.ok(q(handle, 'section.pw-chat-panel[role="dialog"]'));
  assert.ok(q(handle, 'style'));
  assert.equal(win.document.querySelectorAll('button, style, .pw-chat-launcher').length, 0);
  for (const node of Array.from(handle.shadow.querySelectorAll('[class]'))) {
    for (const cls of Array.from(node.classList)) assert.match(cls, /^pw-chat-/);
  }
  assert.equal(q(handle, '.pw-chat-launcher')!.getAttribute('aria-label')?.startsWith('Open Primewayz Assistant'), true);
});

// --- Session and storage ---

test('session: passive load writes no storage; first open creates a UUID v4 session', async () => {
  const win = createWindow();
  const { handle, backend } = await boot(win);
  assert.ok(handle);
  assert.equal(win.localStorage.length, 0);
  assert.equal(win.sessionStorage.length, 0);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 0);
  assert.equal(historyCalls(backend.calls).length, 0);

  handle.open();
  await flush();
  const stored = win.localStorage.getItem('primewayz_chat_session_id');
  assert.ok(isStrongChatSessionId(stored));
  assert.equal(win.sessionStorage.getItem('primewayz_chat_panel_open'), 'true');
  assert.equal(win.sessionStorage.getItem('primewayz_chat_open_tracked'), 'true');
  assert.equal(win.sessionStorage.getItem('primewayz_chat_first_landing'), '/services/');
  assert.equal(win.localStorage.getItem('primewayz_chat_visitor_email'), null);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat')[0]!.body!.sessionId, stored);
});

test('session: unknown legacy id is marked on load, rotated once on open, then used', async () => {
  const win = createWindow({ storage: { primewayz_chat_session_id: 'abc123' } });
  const backend = createBackend({
    history: (call) => (call.path.endsWith('/abc123')
      ? { status: 400, body: { code: 'session_id_invalid', error: 'Invalid chat session identifier.' } }
      : { status: 200, body: [] }),
  });
  const { handle } = await boot(win, backend);
  assert.ok(handle);
  assert.equal(win.localStorage.getItem('primewayz_chat_session_id'), 'abc123');
  handle.open();
  await flush();
  const rotated = win.localStorage.getItem('primewayz_chat_session_id');
  assert.ok(isStrongChatSessionId(rotated));
  assert.equal(posts(backend.calls, '/api/chat/heartbeat')[0]!.body!.sessionId, rotated);
});

test('session: session_id_invalid on POST rotates once and retries once', async () => {
  const win = createWindow({ storage: { primewayz_chat_session_id: 'legacy-9' } });
  const backend = createBackend({
    'POST /api/chat/heartbeat': (call) => (call.body!.sessionId === 'legacy-9'
      ? { status: 400, body: { code: 'session_id_invalid' } }
      : { status: 200, body: { ok: true } }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  const beats = posts(backend.calls, '/api/chat/heartbeat');
  assert.equal(beats.length, 2);
  assert.equal(beats[0]!.body!.sessionId, 'legacy-9');
  assert.ok(isStrongChatSessionId(beats[1]!.body!.sessionId));
  assert.equal(win.localStorage.getItem('primewayz_chat_session_id'), beats[1]!.body!.sessionId);
});

for (const status of [403, 429, 500]) {
  test(`session: ${status} never rotates the stored id`, async () => {
    const win = createWindow({ storage: { primewayz_chat_session_id: 'legacy-9' } });
    const backend = createBackend({
      'POST /api/chat/heartbeat': () => ({ status, body: { code: status === 429 ? 'rate_limited' : 'x' }, headers: { 'Retry-After': '5' } }),
      'POST /api/chat/respond': () => ({ status, body: { code: status === 429 ? 'rate_limited' : 'x' }, headers: { 'Retry-After': '5' } }),
    });
    const { handle } = await boot(win, backend);
    handle!.open();
    await flush();
    await sendText(handle!, 'Hello');
    assert.equal(win.localStorage.getItem('primewayz_chat_session_id'), 'legacy-9');
    assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 1);
  });
}

// --- Tenant safety ---

test('tenant safety: no request carries tenant/market/source identity or siteKey', async () => {
  const win = createWindow();
  const { handle, backend } = await boot(win);
  handle!.open();
  await flush();
  await sendText(handle!, 'Need a quote');
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="text"]')!.value = 'Jane Doe';
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="email"]')!.value = 'jane@example.com';
  q<HTMLFormElement>(handle!, '.pw-chat-lead')!.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();

  const bodies = backend.calls.filter((c) => c.body).map((c) => c.body!);
  assert.ok(bodies.length >= 3);
  for (const body of bodies) {
    for (const key of PW_CHAT_FORBIDDEN_PAYLOAD_KEYS) assert.equal(key in body, false, key);
    assert.equal('siteKey' in body, false);
    assert.doesNotMatch(JSON.stringify(body), /primewayz-infotech|pw-infotech/);
  }
  for (const call of backend.calls) assert.equal(new URL(`${API}${call.path}`).search, '');
  const heartbeat = posts(backend.calls, '/api/chat/heartbeat')[0]!.body!;
  assert.equal(heartbeat.currentPageUrl, 'https://primewayz.com/services/?utm_source=linkedin');
  assert.equal(heartbeat.utmSource, 'linkedin');
  assert.deepEqual(Object.keys(posts(backend.calls, '/api/chat/respond')[0]!.body!).sort(), ['message', 'sessionId']);
});

// --- Polling ---

test('polling: 45s while closed with history, 5s while open, paused while hidden', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow({ storage: { primewayz_chat_session_id: STRONG_ID } });
  const backend = createBackend({
    history: () => ({ status: 200, body: [{ id: 1, text: 'Hello', sender: 'bot', timestamp: new Date().toISOString() }] }),
  });
  const { handle } = await boot(win, backend);
  assert.ok(handle);
  assert.equal(historyCalls(backend.calls).length, 1);

  await advance(44999);
  assert.equal(historyCalls(backend.calls).length, 1);
  await advance(1);
  assert.equal(historyCalls(backend.calls).length, 2);

  handle.open();
  await advance(0);
  assert.equal(historyCalls(backend.calls).length, 3);
  await advance(5000);
  assert.equal(historyCalls(backend.calls).length, 4);
  await advance(5000);
  assert.equal(historyCalls(backend.calls).length, 5);

  Object.defineProperty(win.document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  win.document.dispatchEvent(new win.Event('visibilitychange'));
  const heartbeatsBefore = posts(backend.calls, '/api/chat/heartbeat').length;
  await advance(60000);
  assert.equal(historyCalls(backend.calls).length, 5);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, heartbeatsBefore);

  Object.defineProperty(win.document, 'visibilityState', { configurable: true, get: () => 'visible' });
  win.document.dispatchEvent(new win.Event('visibilitychange'));
  await advance(0);
  assert.equal(historyCalls(backend.calls).length, 6);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, heartbeatsBefore + 1);
  await advance(5000);
  assert.equal(historyCalls(backend.calls).length, 7);
  handle.destroy();
});

test('heartbeat: every 30s while open, stops on close', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  const { handle, backend } = await boot(win);
  handle!.open();
  await flush();
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 1);
  await advance(30000);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 2);
  const keys = Object.keys(posts(backend.calls, '/api/chat/heartbeat')[0]!.body!);
  for (const key of keys) {
    assert.ok(['sessionId', 'currentPageUrl', 'firstLandingPage', 'referrer', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent'].includes(key), key);
  }
  handle!.close();
  await advance(90000);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 2);
  handle!.destroy();
});

test('polling: no polling for a first-time visitor until the widget is opened', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  const { handle, backend } = await boot(win);
  await advance(120000);
  assert.equal(historyCalls(backend.calls).length, 0);
  handle!.destroy();
});

// --- Messages, labels and handoff ---

test('messages: bot reply labelled Primewayz Assistant; admin reply labelled Primewayz Team with joined notice', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  let history: unknown[] = [];
  const backend = createBackend({ history: () => ({ status: 200, body: history }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Hello team');
  const labels = () => Array.from(handle!.shadow.querySelectorAll('.pw-chat-msg-label')).map((n) => n.textContent);
  assert.deepEqual(labels(), ['You', 'Primewayz Assistant']);
  assert.equal(q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!.value, '');

  history = [
    { id: 102, text: 'Hello team', sender: 'user', timestamp: new Date().toISOString() },
    { id: 103, text: 'Thanks, the team will follow up.', sender: 'bot', timestamp: new Date().toISOString() },
    { id: 104, text: 'Hi, Priya here.', sender: 'admin', timestamp: new Date().toISOString() },
  ];
  await advance(5000);
  assert.deepEqual(labels(), ['You', 'Primewayz Assistant', 'Primewayz Team']);
  assert.match(handle!.shadow.textContent ?? '', new RegExp(VISITOR_CHAT_HUMAN_JOINED_NOTICE));
  assert.equal(q(handle!, '.pw-chat-title')!.textContent, 'Primewayz Team');
  handle!.destroy();
});

// --- Error handling ---

test('errors: 429 keeps the draft, shows wait time and disables send until Retry-After passes', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  const backend = createBackend({
    'POST /api/chat/respond': () => ({ status: 429, body: { code: 'rate_limited' }, headers: { 'Retry-After': '7' } }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Keep me');
  assert.equal(q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!.value, 'Keep me');
  assert.match(q(handle!, '.pw-chat-notice-text')!.textContent!, /wait 7 seconds/);
  assert.equal(q<HTMLButtonElement>(handle!, '.pw-chat-composer button')!.disabled, true);
  assert.equal(handle!.shadow.querySelectorAll('.pw-chat-msg--user').length, 0);
  await advance(7000);
  assert.equal(q<HTMLButtonElement>(handle!, '.pw-chat-composer button')!.disabled, false);
  handle!.destroy();
});

test('errors: 400 invalid_input shows an inline error without retry', async () => {
  const win = createWindow();
  const backend = createBackend({
    'POST /api/chat/respond': () => ({ status: 400, body: { code: 'invalid_input', field: 'message', error: 'Message is too long.' } }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'x');
  assert.equal(q(handle!, '.pw-chat-notice-text')!.textContent, 'Message is too long.');
  assert.equal(q<HTMLButtonElement>(handle!, '.pw-chat-notice button')!.hidden, true);
});

test('errors: 403 shows unavailable state and stops background traffic', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  const backend = createBackend({ 'POST /api/chat/respond': () => ({ status: 403, body: { error: 'Origin is not allowed.' } }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Hi');
  assert.match(q(handle!, '.pw-chat-notice-text')!.textContent!, /unavailable/);
  const count = backend.calls.length;
  await advance(120000);
  assert.equal(backend.calls.length, count);
  handle!.destroy();
});

test('errors: 5xx keeps the draft, offers retry, and retry reconciles a message that was actually saved', async () => {
  const win = createWindow();
  let respondCalls = 0;
  let history: unknown[] = [];
  const backend = createBackend({
    'POST /api/chat/respond': () => {
      respondCalls += 1;
      return { status: 502, body: null };
    },
    history: () => ({ status: 200, body: history }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Persisted anyway');
  assert.equal(q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!.value, 'Persisted anyway');
  const retry = q<HTMLButtonElement>(handle!, '.pw-chat-notice button')!;
  assert.equal(retry.hidden, false);

  history = [{ id: 9, text: 'Persisted anyway', sender: 'user', timestamp: new Date().toISOString() }];
  retry.click();
  await flush();
  assert.equal(respondCalls, 1);
  assert.equal(q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!.value, '');
  assert.equal(q(handle!, '.pw-chat-notice')!.hidden, true);
});

test('errors: network failure on retry resends once per click, never loops', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = createWindow();
  let respondCalls = 0;
  const backend = createBackend({
    'POST /api/chat/respond': () => {
      respondCalls += 1;
      return { status: 503, body: null };
    },
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Try');
  q<HTMLButtonElement>(handle!, '.pw-chat-notice button')!.click();
  await flush();
  await advance(60000);
  assert.equal(respondCalls, 2);
  handle!.destroy();
});

// --- Lead capture ---

test('lead: name/email are stored only after a successful /api/chat/session', async () => {
  const win = createWindow();
  let sessionStatus = 500;
  const backend = createBackend({ 'POST /api/chat/session': () => ({ status: sessionStatus, body: {} }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Hello');
  const form = q<HTMLFormElement>(handle!, '.pw-chat-lead')!;
  assert.equal(form.hidden, false);
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="text"]')!.value = 'Jane';
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="email"]')!.value = 'jane@example.com';
  form.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  assert.equal(win.localStorage.getItem('primewayz_chat_visitor_email'), null);

  sessionStatus = 200;
  form.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  assert.equal(win.localStorage.getItem('primewayz_chat_visitor_name'), 'Jane');
  assert.equal(win.localStorage.getItem('primewayz_chat_visitor_email'), 'jane@example.com');
  assert.equal(form.hidden, true);
});

// --- Booking ---

test('booking: hidden by default and when only one backend flag allows it', async () => {
  for (const avail of [
    availability(),
    availability({ canBookCall: true }),
    availability({ scheduling: { enabled: true, provider: 'calendly', eventTypeKey: 'x', publicBookingUrl: 'https://calendly.com/pw' } }),
  ]) {
    const win = createWindow();
    const backend = createBackend({ 'GET /api/chat/availability': () => ({ status: 200, body: avail }) });
    const { handle } = await boot(win, backend);
    handle!.open();
    await flush();
    assert.equal(q(handle!, '.pw-chat-booking')!.hidden, true);
  }
});

test('booking: shown only when canBookCall and scheduling.enabled are both true', async () => {
  const win = createWindow();
  const sink: string[] = [];
  const backend = createBackend({
    'GET /api/chat/availability': () => ({
      status: 200,
      body: availability({ canBookCall: true, scheduling: { enabled: true, provider: 'calendly', eventTypeKey: 'x', publicBookingUrl: 'https://calendly.com/pw' } }),
    }),
  });
  const { handle } = await boot(win, backend, (name) => sink.push(name));
  handle!.open();
  await flush();
  assert.equal(q(handle!, '.pw-chat-booking')!.hidden, false);
  const link = q<HTMLAnchorElement>(handle!, '.pw-chat-booking a')!;
  assert.equal(link.getAttribute('href'), 'https://calendly.com/pw');
  assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  link.dispatchEvent(new win.Event('click', { cancelable: true }));
  assert.ok(sink.includes('chat_appointment_requested'));
});

// --- Analytics privacy ---

test('analytics: no PII, message text, session id or tenant id in any event', async () => {
  const win = createWindow();
  const events: Array<{ name: string; params: Record<string, unknown> }> = [];
  let fail = false;
  const backend = createBackend({
    'POST /api/chat/respond': (call) => (fail
      ? { status: 500, body: null }
      : { status: 200, body: { userMessage: { id: 1, text: call.body!.message, sender: 'user' }, botMessage: null } }),
  });
  const { handle } = await boot(win, backend, (name, params) => events.push({ name, params }));
  handle!.open();
  await flush();
  await sendText(handle!, 'My secret project details');
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="text"]')!.value = 'Jane Doe';
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="email"]')!.value = 'jane@example.com';
  q<HTMLFormElement>(handle!, '.pw-chat-lead')!.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  fail = true;
  await sendText(handle!, 'Second message');

  const names = events.map((e) => e.name);
  assert.deepEqual(names, ['chat_open', 'chat_message_sent', 'chat_lead_captured', 'chat_human_handoff_requested', 'chat_message_send_failed']);
  const sessionId = win.localStorage.getItem('primewayz_chat_session_id')!;
  for (const { name, params } of events) {
    assert.ok((PW_CHAT_EMBED_ANALYTICS_EVENTS as readonly string[]).includes(name));
    for (const key of VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS) assert.equal(key in params, false, `${name}.${key}`);
    const serialized = JSON.stringify(params);
    for (const secret of ['Jane', 'jane@example.com', 'secret project', 'Second message', sessionId, 'pw-infotech', 'primewayz-infotech', 'token=']) {
      assert.equal(serialized.includes(secret), false, `${name} leaked ${secret}`);
    }
    assert.equal(params.route, '/services/');
  }
});

test('analytics: widget loads and chats when no analytics sink is installed', async () => {
  const win = createWindow();
  const { handle, backend } = await boot(win, createBackend(), undefined);
  // Override with an undefined sink by re-using default no-op from boot; assert chat still works.
  assert.ok(handle);
  handle!.open();
  await flush();
  await sendText(handle!, 'Hello without analytics');
  assert.equal(posts(backend.calls, '/api/chat/respond').length, 1);
  assert.equal(q(handle!, '.pw-chat-msg--user')!.textContent?.includes('Hello without analytics'), true);
});

test('analytics: open emits one chat_open; load alone emits none', async () => {
  const win = createWindow();
  const events: string[] = [];
  const { handle } = await boot(win, createBackend(), (name) => events.push(name));
  await flush();
  assert.deepEqual(events, []);
  handle!.open();
  await flush();
  assert.deepEqual(events, ['chat_open']);
  handle!.close();
  handle!.open();
  await flush();
  assert.deepEqual(events, ['chat_open']);
});

test('analytics: one successful visitor message emits one chat_message_sent', async () => {
  const win = createWindow();
  const events: string[] = [];
  const { handle } = await boot(win, createBackend(), (name) => events.push(name));
  handle!.open();
  await flush();
  await sendText(handle!, 'First');
  await sendText(handle!, 'Second');
  assert.deepEqual(
    events.filter((name) => name === 'chat_message_sent'),
    ['chat_message_sent', 'chat_message_sent'],
  );
  assert.equal(events.filter((name) => name === 'chat_open').length, 1);
});

test('analytics: failed message submission emits no chat_message_sent', async () => {
  const win = createWindow();
  const events: string[] = [];
  const backend = createBackend({
    'POST /api/chat/respond': () => ({ status: 500, body: null }),
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  handle!.open();
  await flush();
  await sendText(handle!, 'Will fail');
  assert.equal(events.includes('chat_message_sent'), false);
  assert.ok(events.includes('chat_message_send_failed'));
});

test('analytics: bot and admin history messages do not emit chat_message_sent', async () => {
  const win = createWindow({ storage: { primewayz_chat_session_id: STRONG_ID } });
  const events: string[] = [];
  const backend = createBackend({
    history: () => ({
      status: 200,
      body: [
        { id: 1, text: 'Bot hello', sender: 'bot', timestamp: new Date().toISOString() },
        { id: 2, text: 'Admin hello', sender: 'admin', timestamp: new Date().toISOString() },
      ],
    }),
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  handle!.open();
  await flush();
  assert.equal(events.includes('chat_message_sent'), false);
  assert.deepEqual(events, ['chat_open']);
});

test('analytics: first successful lead capture emits one conversion; repeats do not', async () => {
  const win = createWindow();
  const events: string[] = [];
  let leadCalls = 0;
  const backend = createBackend({
    'POST /api/chat/session': () => {
      leadCalls += 1;
      return {
        status: 200,
        body: { ok: true, leadCaptured: leadCalls === 1 },
      };
    },
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  handle!.open();
  await flush();
  await sendText(handle!, 'Need help');
  const form = q<HTMLFormElement>(handle!, '.pw-chat-lead')!;
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="text"]')!.value = 'Jane';
  q<HTMLInputElement>(handle!, '.pw-chat-lead input[type="email"]')!.value = 'jane@example.com';
  form.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  assert.equal(events.filter((name) => name === 'chat_lead_captured').length, 1);

  // Simulate a second successful session write that is not a new lead.
  form.hidden = false;
  form.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  assert.equal(events.filter((name) => name === 'chat_lead_captured').length, 1);
});

test('analytics: returning visitor with stored email does not emit chat_lead_captured', async () => {
  const win = createWindow({
    storage: {
      primewayz_chat_session_id: STRONG_ID,
      primewayz_chat_visitor_name: 'Returning',
      primewayz_chat_visitor_email: 'returning@example.com',
    },
  });
  const events: string[] = [];
  const backend = createBackend({
    'POST /api/chat/session': () => ({ status: 200, body: { ok: true, leadCaptured: false } }),
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  handle!.open();
  await flush();
  await sendText(handle!, 'Hello again');
  assert.equal(q(handle!, '.pw-chat-lead')!.hidden, true);
  assert.equal(events.includes('chat_lead_captured'), false);
});

test('analytics: analyticsEnabled false produces no events while chat still works', async () => {
  const win = createWindow({
    config: { apiBaseUrl: API, siteKey: 'primewayz-infotech', analyticsEnabled: false },
  });
  // Use real default sink (no override) so analyticsEnabled is applied.
  const handle = await installPrimewayzChat(win, {
    fetchImpl: createBackend().fetchImpl,
    timers: nodeTimers,
  });
  await flush();
  assert.ok(handle);
  liveHandles.push(handle!);
  const gtagCalls: unknown[] = [];
  (win as HostWindow & { gtag?: (...args: unknown[]) => void }).gtag = (...args) => gtagCalls.push(args);
  handle!.open();
  await flush();
  await sendText(handle!, 'Still works');
  assert.deepEqual(gtagCalls, []);
  assert.ok(q(handle!, '.pw-chat-msg--user'));
});

test('analytics: throwing sink never interrupts chat send', async () => {
  const win = createWindow();
  const backend = createBackend();
  const { handle } = await boot(win, backend, () => {
    throw new Error('analytics boom');
  });
  handle!.open();
  await flush();
  await sendText(handle!, 'Must still send');
  assert.equal(posts(backend.calls, '/api/chat/respond').length, 1);
  assert.ok(q(handle!, '.pw-chat-msg--user'));
});

// --- Security ---

test('security: server message HTML is rendered as inert text', async () => {
  const payload = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script><a href="javascript:alert(1)">x</a>';
  const win = createWindow({ storage: { primewayz_chat_session_id: STRONG_ID } });
  const backend = createBackend({
    history: () => ({ status: 200, body: [{ id: 1, text: payload, sender: 'admin', timestamp: new Date().toISOString() }] }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  assert.equal(handle!.shadow.querySelector('img, script, .pw-chat-msg a'), null);
  const texts = Array.from(handle!.shadow.querySelectorAll('.pw-chat-msg--admin .pw-chat-msg-text')).map((n) => n.textContent);
  assert.deepEqual(texts, [payload]);
  assert.equal((win as unknown as { __pwned?: number }).__pwned, undefined);
});

// --- Layout ---

test('layout: launcher lifts above a visible overlapping #back-to-top and does not modify it', async () => {
  const win = createWindow();
  const backToTop = win.document.createElement('a');
  backToTop.id = 'back-to-top';
  backToTop.className = 'show';
  backToTop.getBoundingClientRect = () => ({ top: 740, bottom: 780, left: 1220, right: 1260, width: 40, height: 40, x: 1220, y: 740, toJSON: () => ({}) }) as DOMRect;
  win.document.body.appendChild(backToTop);
  const { handle } = await boot(win);
  assert.equal(q(handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '72px');
  assert.equal(backToTop.getAttribute('style'), null);
  assert.equal(backToTop.className, 'show');
});

test('layout: hidden #back-to-top leaves the launcher at the default 18px', async () => {
  const win = createWindow();
  const backToTop = win.document.createElement('a');
  backToTop.id = 'back-to-top';
  backToTop.style.display = 'none';
  win.document.body.appendChild(backToTop);
  const { handle } = await boot(win);
  assert.equal(q(handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '18px');
});

// --- Responsive / accessibility ---

test('mobile: open locks body scroll and hides launcher; close restores scrolling', async () => {
  const win = createWindow({ width: 400 });
  const { handle } = await boot(win);
  handle!.open();
  await flush();
  assert.equal(win.document.body.style.position, 'fixed');
  assert.equal(q(handle!, '.pw-chat-launcher')!.hidden, true);
  handle!.close();
  assert.equal(win.document.body.style.position, '');
  assert.equal(q(handle!, '.pw-chat-launcher')!.hidden, false);
});

test('a11y: dialog semantics, labelled close, Escape closes and focus returns to launcher', async () => {
  const win = createWindow();
  const { handle } = await boot(win);
  const launcher = q<HTMLButtonElement>(handle!, '.pw-chat-launcher')!;
  launcher.click();
  await flush();
  const panel = q(handle!, '.pw-chat-panel')!;
  assert.equal(panel.hidden, false);
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.equal(launcher.getAttribute('aria-expanded'), 'true');
  assert.equal(q(handle!, '.pw-chat-close')!.getAttribute('aria-label'), 'Close chat');
  assert.equal(q(handle!, '[role="status"][aria-live="polite"]') !== null, true);
  panel.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(panel.hidden, true);
  assert.equal(handle!.shadow.activeElement, launcher);
});

test('restore: panel open state persists across pages on desktop only', async () => {
  const desktop = createWindow();
  desktop.sessionStorage.setItem('primewayz_chat_panel_open', 'true');
  const a = await boot(desktop);
  assert.equal(q(a.handle!, '.pw-chat-panel')!.hidden, false);

  const mobile = createWindow({ width: 400 });
  mobile.sessionStorage.setItem('primewayz_chat_panel_open', 'true');
  const b = await boot(mobile);
  assert.equal(q(b.handle!, '.pw-chat-panel')!.hidden, true);
  assert.equal(mobile.document.body.style.position, '');
});

// --- Tenant branding: RentReadBuy Silver campaign (rrb-silver-campaign) ---

const SILVER_CONFIG = {
  apiBaseUrl: API,
  siteKey: 'rentreadbuy-silver',
  siteName: 'RentReadBuy Silver Membership',
  pageUrl: 'https://silver-preview.example.test/',
  pageType: 'silver_membership_landing',
  isFrontPage: true,
  storageKeys: {
    sessionId: 'rrb_silver_chat_session_id',
    visitorName: 'rrb_silver_chat_visitor_name',
    visitorEmail: 'rrb_silver_chat_visitor_email',
    panelOpen: 'rrb_silver_chat_panel_open',
    openTracked: 'rrb_silver_chat_open_tracked',
    firstLanding: 'rrb_silver_chat_first_landing',
  },
  pageContext: {
    greeting: 'Questions about Silver Membership?',
    supportingText: 'Ask about Silver: ₹899 for 3 months, with up to 2 physical books at a time.',
  },
  intents: RRB_SILVER_CHAT_WIDGET.intents.map(({ key, label }) => ({ key, label })),
};

function silverWindow(options: { width?: number; storage?: Record<string, string> } = {}) {
  return createWindow({ config: SILVER_CONFIG, url: 'https://silver-preview.example.test/', ...options });
}

function silverBackend(routes: Parameters<typeof createBackend>[0] = {}) {
  return createBackend({
    'GET /api/platform/capabilities': () => ({
      status: 200,
      body: { tenant: { key: 'rrb-silver-campaign' }, capabilities: { chat: true, scheduling: false }, chatWidget: RRB_SILVER_CHAT_WIDGET },
    }),
    'GET /api/chat/availability': () => ({ status: 200, body: availability({ tenantId: 'rrb-silver-campaign', businessHours: 'Mon-Fri, India business hours' }) }),
    ...routes,
  });
}

/** Every visible string and accessible label in the widget, excluding the stylesheet. */
function visitorFacingText(handle: PwChatWidgetHandle): string {
  const root = q(handle, '.pw-chat-root')!;
  const parts = [root.textContent ?? ''];
  for (const node of Array.from(root.querySelectorAll('*'))) {
    for (const name of ['aria-label', 'placeholder', 'title', 'alt']) {
      const value = node.getAttribute(name);
      if (value) parts.push(value);
    }
  }
  return parts.join(' | ');
}

test('branding: campaign tenant renders RentReadBuy title, greeting, intents and palette with no Primewayz text', async () => {
  const win = silverWindow();
  const { handle } = await boot(win, silverBackend());
  assert.ok(handle);
  handle.open();
  await flush();
  assert.equal(q(handle, '.pw-chat-title')!.textContent, 'RentReadBuy Reading Assistant');
  assert.equal(q(handle, '.pw-chat-intro-greeting')!.textContent, 'Questions about Silver Membership?');
  assert.match(q(handle, '.pw-chat-intro-text')!.textContent ?? '', /₹899 for 3 months/);
  assert.deepEqual(
    Array.from(handle.shadow.querySelectorAll('.pw-chat-intent')).map((n) => n.textContent),
    [...RRB_SILVER_CHAT_WIDGET.intents.map((intent) => intent.label), 'Something else'],
  );
  assert.equal(q(handle, '.pw-chat-lead-title')!.textContent, 'Leave your details so the RentReadBuy team can follow up.');
  assert.match(q(handle, '.pw-chat-launcher')!.getAttribute('aria-label') ?? '', /^Open RentReadBuy Reading Assistant\./);
  const root = q(handle, '.pw-chat-root')!;
  assert.equal(root.style.getPropertyValue('--pw-chat-launcher-bg'), '#037b80');
  assert.equal(root.style.getPropertyValue('--pw-chat-header-bg'), '#02666a');
  assert.equal(root.style.getPropertyValue('--pw-chat-accent'), '#f08a6c');
  assert.doesNotMatch(visitorFacingText(handle), /primewayz/i);
});

test('branding: tenant intents are used when the host config sends none', async () => {
  const win = createWindow({ config: { ...SILVER_CONFIG, intents: [] }, url: 'https://silver-preview.example.test/' });
  const { handle } = await boot(win, silverBackend());
  handle!.open();
  await flush();
  assert.equal(handle!.shadow.querySelectorAll('.pw-chat-intent').length, 7);
});

test('branding: a branded tenant does not render on a host with a different siteKey', async () => {
  const win = createWindow({ config: { ...SILVER_CONFIG, siteKey: 'primewayz-infotech' } });
  const { handle, backend } = await boot(win, silverBackend());
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.deepEqual(backend.calls.map((c) => c.path), ['/api/platform/capabilities']);
});

test('branding: malformed theme values from the server are ignored, never injected', async () => {
  const win = silverWindow();
  const backend = silverBackend({
    'GET /api/platform/capabilities': () => ({
      status: 200,
      body: {
        capabilities: { chat: true },
        chatWidget: { ...RRB_SILVER_CHAT_WIDGET, theme: { action: 'red; background: url(https://evil.test)', accent: '#f08a6c' } },
      },
    }),
  });
  const { handle } = await boot(win, backend);
  const root = q(handle!, '.pw-chat-root')!;
  assert.equal(root.style.getPropertyValue('--pw-chat-action'), '');
  assert.equal(root.style.getPropertyValue('--pw-chat-accent'), '#f08a6c');
});

test('branding: bot, team, waiting status and joined notice use RentReadBuy names', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const win = silverWindow({ storage: { rrb_silver_chat_visitor_email: 'reader@example.com', rrb_silver_chat_visitor_name: 'Asha' } });
  let history: unknown[] = [];
  const backend = silverBackend({ history: () => ({ status: 200, body: history }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  await sendText(handle!, 'Do you deliver to Pune?');
  const labels = () => Array.from(handle!.shadow.querySelectorAll('.pw-chat-msg-label')).map((n) => n.textContent);
  assert.deepEqual(labels(), ['You', 'RentReadBuy Reading Assistant']);
  history = [
    { id: 102, text: 'Do you deliver to Pune?', sender: 'user', timestamp: new Date().toISOString() },
    { id: 103, text: 'Thanks', sender: 'bot', timestamp: new Date().toISOString() },
    { id: 104, text: 'Hi Asha, yes we do.', sender: 'admin', timestamp: new Date().toISOString() },
  ];
  await advance(5000);
  assert.deepEqual(labels(), ['You', 'RentReadBuy Reading Assistant', 'RentReadBuy team']);
  assert.equal(q(handle!, '.pw-chat-title')!.textContent, 'RentReadBuy team');
  assert.match(visitorFacingText(handle!), /A RentReadBuy team member has joined the conversation\./);
  assert.doesNotMatch(visitorFacingText(handle!), /primewayz/i);
  handle!.destroy();
});

test('branding: unavailable availability falls back to RentReadBuy wording, not Primewayz', async () => {
  const win = silverWindow();
  const backend = silverBackend({ 'GET /api/chat/availability': () => ({ status: 500, body: null }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  assert.doesNotMatch(visitorFacingText(handle!), /primewayz/i);
});

// --- Intents and approved answers ---

test('composer: free-text is available immediately without selecting a topic', async () => {
  const win = silverWindow();
  const { handle, backend } = await boot(win, silverBackend());
  handle!.open();
  await flush();
  const textarea = q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!;
  assert.equal(textarea.disabled, false);
  assert.equal(textarea.placeholder, 'Type your message');
  await sendText(handle!, 'Can I pause membership for a month?');
  const [first] = posts(backend.calls, '/api/chat/respond');
  assert.deepEqual(first!.body, { sessionId: first!.body!.sessionId, message: 'Can I pause membership for a month?' });
  assert.equal('intentKey' in first!.body!, false);
});

test('intents: Something else clears the field and never sends an intentKey', async () => {
  const win = silverWindow();
  const { handle, backend } = await boot(win, silverBackend());
  handle!.open();
  await flush();
  const intentButtons = () => Array.from(handle!.shadow.querySelectorAll<HTMLButtonElement>('.pw-chat-intent'));
  intentButtons()[0]!.click();
  const textarea = q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!;
  assert.equal(textarea.value, 'How does Silver Membership work?');
  intentButtons().at(-1)!.click();
  assert.equal(textarea.value, '');
  assert.equal(intentButtons().at(-1)!.getAttribute('aria-pressed'), 'true');
  await sendText(handle!, 'I have a billing question');
  const [first] = posts(backend.calls, '/api/chat/respond');
  assert.equal(first!.body!.message, 'I have a billing question');
  assert.equal('intentKey' in first!.body!, false);
});

test('intents: an unedited intent question sends its intentKey; edited text and free text do not', async () => {
  const win = silverWindow();
  const { handle, backend } = await boot(win, silverBackend());
  handle!.open();
  await flush();
  const intentButtons = () => Array.from(handle!.shadow.querySelectorAll<HTMLButtonElement>('.pw-chat-intent'));
  intentButtons()[1]!.click();
  const textarea = q<HTMLTextAreaElement>(handle!, '.pw-chat-textarea')!;
  assert.equal(textarea.value, 'What is included in ₹899?');
  q<HTMLFormElement>(handle!, '.pw-chat-composer')!.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  const [first] = posts(backend.calls, '/api/chat/respond');
  assert.deepEqual(first!.body, { sessionId: first!.body!.sessionId, message: 'What is included in ₹899?', intentKey: 'silver_price_inclusions' });

  await sendText(handle!, 'What is included in ₹899? And delivery to Kochi?');
  const second = posts(backend.calls, '/api/chat/respond')[1]!;
  assert.equal('intentKey' in second.body!, false, 'edited text is a free-text question');
  for (const call of posts(backend.calls, '/api/chat/respond')) {
    for (const key of PW_CHAT_FORBIDDEN_PAYLOAD_KEYS) assert.equal(key in call.body!, false, key);
  }
});

test('intents: the approved answer from the server is rendered as the assistant reply', async () => {
  const answer = RRB_SILVER_APPROVED_ANSWERS.silver_book_limits;
  const win = silverWindow();
  const backend = silverBackend({
    'POST /api/chat/respond': (call) => ({
      status: 200,
      body: {
        userMessage: { id: 201, text: call.body?.message, sender: 'user', timestamp: new Date().toISOString() },
        botMessage: { id: 202, text: answer, sender: 'bot', timestamp: new Date().toISOString() },
        availability: availability({ tenantId: 'rrb-silver-campaign' }),
      },
    }),
  });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  Array.from(handle!.shadow.querySelectorAll<HTMLButtonElement>('.pw-chat-intent'))[2]!.click();
  q<HTMLFormElement>(handle!, '.pw-chat-composer')!.dispatchEvent(new win.Event('submit', { cancelable: true }));
  await flush();
  const botTexts = Array.from(handle!.shadow.querySelectorAll('.pw-chat-msg--bot .pw-chat-msg-text')).map((n) => n.textContent);
  assert.deepEqual(botTexts, [answer]);
});

// --- Session restoration ---

test('restore: campaign storage keys restore the session and never read the Primewayz keys', async () => {
  const win = silverWindow({ storage: { rrb_silver_chat_session_id: STRONG_ID, primewayz_chat_session_id: '11111111-1111-4111-8111-111111111111' } });
  const backend = silverBackend({
    history: () => ({ status: 200, body: [{ id: 1, text: 'Earlier answer', sender: 'bot', timestamp: new Date().toISOString() }] }),
  });
  const { handle } = await boot(win, backend);
  assert.ok(handle);
  assert.deepEqual(historyCalls(backend.calls).map((c) => c.path), [`/api/chat/${STRONG_ID}`]);
  handle.open();
  await flush();
  assert.equal(win.localStorage.getItem('rrb_silver_chat_session_id'), STRONG_ID);
  assert.equal(win.localStorage.getItem('primewayz_chat_session_id'), '11111111-1111-4111-8111-111111111111');
  const heartbeat = posts(backend.calls, '/api/chat/heartbeat')[0]!;
  assert.equal(heartbeat.body!.sessionId, STRONG_ID);
});

test('restore: a session rejected by the tenant (403) stops traffic without rotating the stored id', async () => {
  const win = silverWindow({ storage: { rrb_silver_chat_session_id: STRONG_ID } });
  const backend = silverBackend({ history: () => ({ status: 403, body: { error: 'This record belongs to a different platform entity.' } }) });
  const { handle } = await boot(win, backend);
  handle!.open();
  await flush();
  assert.equal(win.localStorage.getItem('rrb_silver_chat_session_id'), STRONG_ID);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 0);
});

// --- Launcher collision ---

function placeAt(el: Element, rect: { top: number; bottom: number; left: number; right: number }) {
  (el as HTMLElement).getBoundingClientRect = () => ({ ...rect, width: rect.right - rect.left, height: rect.bottom - rect.top, x: rect.left, y: rect.top, toJSON: () => ({}) }) as DOMRect;
}

test('layout: tenant collision selectors lift the launcher above the campaign hero pause control (both labels)', async () => {
  for (const label of ['Pause scenery animation', 'Play scenery animation']) {
    const win = silverWindow();
    const pause = win.document.createElement('button');
    pause.setAttribute('aria-label', label);
    placeAt(pause, { top: 740, bottom: 784, left: 1218, right: 1262 });
    win.document.body.appendChild(pause);
    const { handle } = await boot(win, silverBackend());
    assert.equal(q(handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '72px', label);
    assert.equal(pause.getAttribute('style'), null, 'host control is never modified');
    handle!.destroy();
  }
});

test('layout: the pause control does not affect Primewayz tenants (selectors are tenant-scoped)', async () => {
  const win = createWindow();
  const pause = win.document.createElement('button');
  pause.setAttribute('aria-label', 'Pause scenery animation');
  placeAt(pause, { top: 740, bottom: 784, left: 1218, right: 1262 });
  win.document.body.appendChild(pause);
  const { handle } = await boot(win);
  assert.equal(q(handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '18px');
});

test('layout: hosts can mark a control with data-pw-chat-avoid or configure a safe bottom offset', async () => {
  const marked = createWindow();
  const control = marked.document.createElement('div');
  control.setAttribute('data-pw-chat-avoid', '');
  placeAt(control, { top: 700, bottom: 790, left: 1200, right: 1270 });
  marked.document.body.appendChild(control);
  const a = await boot(marked);
  assert.equal(q(a.handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '112px');

  const offset = createWindow({ config: { apiBaseUrl: API, siteKey: 'primewayz-infotech', launcher: { bottomOffsetPx: 96 } } });
  const b = await boot(offset);
  assert.equal(q(b.handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '96px');

  const clamped = createWindow({ config: { apiBaseUrl: API, siteKey: 'primewayz-infotech', launcher: { bottomOffsetPx: 5000, collisionSelectors: ['::not-a-selector('] } } });
  const c = await boot(clamped);
  assert.equal(q(c.handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom'), '240px');
});

test('layout: PrimewayzChat.registerObstacle works before and after boot and can be undone', async () => {
  const win = silverWindow();
  const early = win.document.createElement('div');
  placeAt(early, { top: 740, bottom: 784, left: 1218, right: 1262 });
  win.document.body.appendChild(early);
  const api = () => (win as unknown as { PrimewayzChat: { registerObstacle: (el: Element) => () => void } }).PrimewayzChat;
  const backend = silverBackend();
  const pending = installPrimewayzChat(win, { fetchImpl: backend.fetchImpl, timers: nodeTimers, analyticsSink: () => {} });
  const unregister = api().registerObstacle(early);
  const handle = await pending;
  if (handle) liveHandles.push(handle);
  await new Promise((resolve) => setTimeout(resolve, 400));
  const bottom = () => q(handle!, '.pw-chat-root')!.style.getPropertyValue('--pw-chat-bottom');
  assert.equal(bottom(), '72px');
  unregister();
  await flush();
  handle!.registerObstacle(win.document.body.appendChild(win.document.createElement('span')));
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(bottom(), '18px');
});

// --- Mobile ---

test('mobile: branded campaign widget opens as a full-screen sheet and restores scrolling on close', async () => {
  const win = silverWindow({ width: 390 });
  const { handle } = await boot(win, silverBackend());
  handle!.open();
  await flush();
  assert.equal(win.document.body.style.position, 'fixed');
  assert.equal(q(handle!, '.pw-chat-launcher')!.hidden, true);
  assert.equal(q(handle!, '.pw-chat-title')!.textContent, 'RentReadBuy Reading Assistant');
  assert.match(handle!.shadow.querySelector('style')!.textContent ?? '', /@media \(max-width: 767px\)[\s\S]*inset: 0; width: 100vw; height: 100dvh/);
  handle!.close();
  assert.equal(win.document.body.style.position, '');
  assert.equal(q(handle!, '.pw-chat-launcher')!.hidden, false);
});

test('mobile: the panel does not auto-reopen on a phone even when the campaign panel-open flag is set', async () => {
  const win = silverWindow({ width: 390 });
  win.sessionStorage.setItem('rrb_silver_chat_panel_open', 'true');
  const { handle } = await boot(win, silverBackend());
  assert.equal(q(handle!, '.pw-chat-panel')!.hidden, true);
});

// --- Email deep link (?pw_chat=open) ---

type PublicChat = { version: string; open: () => void; close: () => void };
const publicChat = (win: HostWindow) => (win as unknown as { PrimewayzChat: PublicChat }).PrimewayzChat;

test('deep link: exact pw_chat=open opens after init and keeps utm attribution only', async () => {
  const win = createWindow({
    url: 'https://www.primewayz.com/?pw_chat=open&utm_source=email&utm_medium=signature&token=secret&email=a%40b.com',
  });
  const events: string[] = [];
  const { handle, backend } = await boot(win, createBackend(), (name) => events.push(name));
  assert.ok(handle);
  assert.equal(publicChat(win).version, PW_CHAT_EMBED_VERSION);
  assert.equal(win.document.getElementById('pw-chat-root')!.getAttribute('data-pw-chat-version'), PW_CHAT_EMBED_VERSION);
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, false);
  assert.equal(q(handle, '.pw-chat-launcher')!.getAttribute('aria-expanded'), 'true');
  await flush();
  const heartbeat = posts(backend.calls, '/api/chat/heartbeat')[0]!.body!;
  assert.equal(heartbeat.currentPageUrl, 'https://www.primewayz.com/?utm_source=email&utm_medium=signature');
  assert.equal(heartbeat.utmSource, 'email');
  assert.equal(heartbeat.utmMedium, 'signature');
  assert.equal('utmCampaign' in heartbeat, false);
  assert.equal('pw_chat' in heartbeat, false);
  const serialized = JSON.stringify(heartbeat);
  for (const secret of ['pw_chat', 'token', 'secret', 'a@b.com', 'email=']) {
    assert.equal(serialized.includes(secret), false, secret);
  }
  assert.deepEqual(events, ['chat_open']);
  publicChat(win).open();
  handle.open();
  await flush();
  assert.deepEqual(events, ['chat_open']);
});

test('deep link: no pw_chat parameter leaves the panel closed', async () => {
  const win = createWindow({ url: 'https://www.primewayz.com/?utm_source=email&utm_medium=signature' });
  const events: string[] = [];
  const { handle, backend } = await boot(win, createBackend(), (name) => events.push(name));
  assert.ok(handle);
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, true);
  assert.equal(win.localStorage.length, 0);
  assert.equal(win.sessionStorage.getItem('primewayz_chat_panel_open'), null);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 0);
  assert.deepEqual(events, []);
});

for (const search of [
  '?pw_chat=OPEN',
  '?pw_chat=Open',
  '?pw_chat=true',
  '?pw_chat=1',
  '?pw_chat=opened',
  '?pw_chat=',
  '?pw_chat=open%20',
  '?PW_chat=open',
  '?chat=open',
  '?pw_chat=closed&pw_chat=open',
]) {
  test(`deep link: ${search} does not open the widget`, async () => {
    const win = createWindow({ url: `https://www.primewayz.com/${search}` });
    const events: string[] = [];
    const { handle } = await boot(win, createBackend(), (name) => events.push(name));
    assert.ok(handle);
    assert.equal(q(handle, '.pw-chat-panel')!.hidden, true);
    assert.equal(win.localStorage.length, 0);
    assert.equal(win.sessionStorage.getItem('primewayz_chat_panel_open'), null);
    assert.deepEqual(events, []);
  });
}

test('deep link: denied capability prevents opening', async () => {
  const win = createWindow({ url: 'https://www.primewayz.com/?pw_chat=open&utm_source=email' });
  const events: string[] = [];
  const backend = createBackend({
    'GET /api/platform/capabilities': () => ({ status: 200, body: { capabilities: { chat: false, scheduling: true } } }),
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.deepEqual(backend.calls.map((call) => call.path), ['/api/platform/capabilities']);
  assert.equal(win.localStorage.length, 0);
  assert.deepEqual(events, []);
});

test('deep link: site-key mismatch prevents opening', async () => {
  const win = createWindow({
    config: { ...SILVER_CONFIG, siteKey: 'primewayz-infotech' },
    url: 'https://www.primewayz.com/?pw_chat=open&utm_source=email',
  });
  const events: string[] = [];
  const backend = silverBackend();
  const { handle } = await boot(win, backend, (name) => events.push(name));
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.deepEqual(backend.calls.map((call) => call.path), ['/api/platform/capabilities']);
  assert.deepEqual(events, []);
});

test('deep link: availability 403 prevents opening', async () => {
  const win = createWindow({ url: 'https://www.primewayz.com/?pw_chat=open' });
  const events: string[] = [];
  const backend = createBackend({
    'GET /api/chat/availability': () => ({ status: 403, body: { error: 'Origin is not allowed.' } }),
  });
  const { handle } = await boot(win, backend, (name) => events.push(name));
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.deepEqual(events, []);
  assert.equal(win.localStorage.length, 0);
});

test('deep link: missing config does not open a widget', async () => {
  const win = createWindow({ config: null, url: 'https://www.primewayz.com/?pw_chat=open' });
  const { handle, backend } = await boot(win);
  assert.equal(handle, null);
  assert.equal(win.document.getElementById('pw-chat-root'), null);
  assert.equal(backend.calls.length, 0);
});

test('deep link: mobile pw_chat=open opens the sheet; the session flag alone does not', async () => {
  const closed = createWindow({ width: 400, url: 'https://www.primewayz.com/?utm_source=email&utm_medium=signature' });
  closed.sessionStorage.setItem('primewayz_chat_panel_open', 'true');
  const withoutFlag = await boot(closed);
  assert.equal(q(withoutFlag.handle!, '.pw-chat-panel')!.hidden, true);
  assert.equal(closed.document.body.style.position, '');

  const opened = createWindow({
    width: 390,
    url: 'https://www.primewayz.com/?pw_chat=open&utm_source=email&utm_medium=signature&token=secret',
  });
  const events: string[] = [];
  const withFlag = await boot(opened, createBackend(), (name) => events.push(name));
  assert.equal(q(withFlag.handle!, '.pw-chat-panel')!.hidden, false);
  assert.equal(opened.document.body.style.position, 'fixed');
  assert.equal(q(withFlag.handle!, '.pw-chat-launcher')!.hidden, true);
  await flush();
  const heartbeat = posts(withFlag.backend.calls, '/api/chat/heartbeat')[0]!.body!;
  assert.equal(heartbeat.currentPageUrl, 'https://www.primewayz.com/?utm_source=email&utm_medium=signature');
  assert.equal(heartbeat.utmSource, 'email');
  assert.equal(heartbeat.utmMedium, 'signature');
  assert.equal(JSON.stringify(heartbeat).includes('token'), false);
  assert.deepEqual(events, ['chat_open']);
});

test('deep link: desktop session restoration still reopens when pw_chat is absent', async () => {
  const win = createWindow({ url: 'https://primewayz.com/services/?utm_source=email&token=secret' });
  win.sessionStorage.setItem('primewayz_chat_panel_open', 'true');
  const events: string[] = [];
  const { handle, backend } = await boot(win, createBackend(), (name) => events.push(name));
  assert.equal(q(handle!, '.pw-chat-panel')!.hidden, false);
  assert.deepEqual(events, ['chat_open']);
  await flush();
  const heartbeat = posts(backend.calls, '/api/chat/heartbeat')[0]!.body!;
  assert.equal(heartbeat.currentPageUrl, 'https://primewayz.com/services/?utm_source=email');
  assert.equal(JSON.stringify(heartbeat).includes('token'), false);
});

test('deep link: desktop restore plus pw_chat=open records a single chat_open', async () => {
  const win = createWindow({ url: 'https://www.primewayz.com/services/?pw_chat=open&utm_source=email&token=secret' });
  win.sessionStorage.setItem('primewayz_chat_panel_open', 'true');
  const events: string[] = [];
  const { handle, backend } = await boot(win, createBackend(), (name) => events.push(name));
  assert.equal(q(handle!, '.pw-chat-panel')!.hidden, false);
  assert.deepEqual(events, ['chat_open']);
  publicChat(win).open();
  handle!.open();
  await flush();
  assert.deepEqual(events, ['chat_open']);
  const heartbeat = posts(backend.calls, '/api/chat/heartbeat')[0]!.body!;
  assert.equal(heartbeat.currentPageUrl, 'https://www.primewayz.com/services/?utm_source=email');
  assert.equal(JSON.stringify(heartbeat).includes('pw_chat'), false);
  assert.equal(JSON.stringify(heartbeat).includes('secret'), false);
});

test('deep link: PrimewayzChat.close before initialization cancels the pending open', async () => {
  const win = createWindow({ url: 'https://www.primewayz.com/?pw_chat=open&utm_source=email' });
  const backend = createBackend();
  const events: string[] = [];
  const pending = installPrimewayzChat(win, {
    fetchImpl: backend.fetchImpl,
    timers: nodeTimers,
    analyticsSink: (name) => events.push(name),
  });
  assert.ok(pending);
  publicChat(win).close();
  const handle = await pending;
  if (handle) liveHandles.push(handle);
  await flush();
  assert.ok(handle);
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, true);
  assert.equal(q(handle, '.pw-chat-launcher')!.hidden, false);
  assert.equal(win.sessionStorage.getItem('primewayz_chat_panel_open'), null);
  assert.equal(win.localStorage.length, 0);
  assert.equal(posts(backend.calls, '/api/chat/heartbeat').length, 0);
  assert.deepEqual(events, []);
});

test('deep link: programmatic PrimewayzChat.open still opens when the query is absent', async () => {
  const win = createWindow({ url: 'https://primewayz.com/contact/' });
  const backend = createBackend();
  const events: string[] = [];
  const pending = installPrimewayzChat(win, {
    fetchImpl: backend.fetchImpl,
    timers: nodeTimers,
    analyticsSink: (name) => events.push(name),
  });
  assert.ok(pending);
  publicChat(win).open();
  const handle = await pending;
  if (handle) liveHandles.push(handle);
  await flush();
  assert.ok(handle);
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, false);
  assert.deepEqual(events, ['chat_open']);
  publicChat(win).close();
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, true);
  publicChat(win).open();
  await flush();
  assert.equal(q(handle, '.pw-chat-panel')!.hidden, false);
  assert.deepEqual(events, ['chat_open']);
});

test('branding: tenants without chatWidget keep the existing Primewayz widget unchanged', async () => {
  const win = createWindow();
  const { handle, backend } = await boot(win);
  handle!.open();
  await flush();
  assert.equal(q(handle!, '.pw-chat-title')!.textContent, 'Primewayz Assistant');
  assert.match(visitorFacingText(handle!), /Primewayz/);
  assert.equal(q(handle!, '.pw-chat-root')!.getAttribute('style')?.includes('--pw-chat-launcher-bg') ?? false, false);
  await sendText(handle!, 'Hello');
  assert.equal('intentKey' in posts(backend.calls, '/api/chat/respond')[0]!.body!, false);
});
