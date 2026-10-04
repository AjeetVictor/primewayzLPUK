import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { Window as HappyDomWindow } from 'happy-dom';
import { isStrongChatSessionId } from '../../lib/chat/chatSessionId.ts';
import { VISITOR_CHAT_HUMAN_JOINED_NOTICE } from '../../lib/chat/visitorChatIdentity.ts';
import { VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS } from '../../lib/chat/visitorChatAnalyticsCore.ts';
import { PW_CHAT_EMBED_ANALYTICS_EVENTS } from './analytics.ts';
import { PW_CHAT_FORBIDDEN_PAYLOAD_KEYS } from './apiClient.ts';
import { installPrimewayzChat } from './install.ts';
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
      'POST /api/chat/session': () => ({ status: 200, body: { ok: true } }),
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
  assert.deepEqual(Object.keys(api).sort(), ['close', 'open', 'version']);
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
