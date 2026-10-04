/**
 * Embedded visitor chat controller. Talks only to the existing Primewayz UK
 * public chat API and renders into a closed shadow root.
 *
 * Passive page load may read storage and call capabilities, availability and
 * (for a returning visitor) history. Session creation, storage writes and
 * heartbeats start only after the visitor opens the widget.
 */

import {
  generateChatSessionId,
  shouldReplaceRejectedChatSessionId,
} from '../../lib/chat/chatSessionId.ts';
import { PUBLIC_CHAT_INPUT_LIMITS } from '../../lib/chat/publicChatInputLimits.ts';
import {
  buildVisitorChatRouteContexts,
  matchVisitorChatRouteContext,
  type VisitorChatRouteContext,
} from '../../lib/chat/visitorChatContext.ts';
import {
  mapVisitorChatHistoryMessage,
  resolveLatestResponderSender,
  shouldApplyVisitorPollHistory,
} from '../../lib/chat/visitorChatHistoryMerge.ts';
import { findPersistedUserMessageMatch } from '../../lib/chat/visitorChatMessageReconcile.ts';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/chat/visitorChatBodyScroll.ts';
import { buildMobileSheetViewportStyle } from '../../lib/chat/visitorChatMobileLayout.ts';
import { resolveVisitorChatPollIntervalMs } from '../../lib/chat/visitorChatPolling.ts';
import {
  applyVisitorChatHistoryBaseline,
  applyVisitorChatOpenTransition,
  applyVisitorChatPollRound,
  type VisitorPollConsumerState,
} from '../../lib/chat/visitorChatPollReconcile.ts';
import { runSafeMessageRetry } from '../../lib/chat/visitorChatSafeRetry.ts';
import {
  DEFAULT_CHAT_AVAILABILITY,
  isTeamAwayStatus,
  normalizeChatAvailabilityStatus,
  type ChatAvailability,
  type VisitorChatMessage,
} from '../../lib/chat/visitorChatTypes.ts';
import type { VisitorChatAnalyticsSink } from '../../lib/chat/visitorChatAnalyticsCore.ts';
import {
  buildVisitorLauncherAriaLabel,
  formatVisitorUnreadBadge,
  getVisitorChatHeaderTitle,
  resolveVisitorHeaderStatus,
  resolveVisitorPresenceTone,
  VISITOR_CHAT_MESSAGE_SAVED,
  VISITOR_HEADER_STATUS_LABELS,
  type VisitorHeaderStatus,
} from '../../lib/chat/visitorChatUi.ts';
import {
  createDefaultPwChatAnalyticsSink,
  createPwChatTracker,
  type PwChatFailureReason,
} from './analytics.ts';
import {
  createPwChatApiClient,
  sendWithSessionRecovery,
  type PwChatApiResult,
  type PwChatFetch,
  type PwChatSessionHandle,
} from './apiClient.ts';
import type { PwChatEmbedConfig, PwChatIntentConfig } from './config.ts';
import {
  computeLauncherBottom,
  isPwChatMobileViewport,
  PW_CHAT_COLLISION_SELECTORS,
  readVisibleObstacleRect,
  type RectLike,
} from './layout.ts';
import {
  buildPwChatDom,
  PW_CHAT_HOST_ID,
  renderIntents,
  renderMessages,
  setTone,
  type PwChatTone,
} from './renderer.ts';
import { createPwChatStorage } from './storage.ts';
import { PW_CHAT_EMBED_VERSION } from './version.ts';

export const PW_CHAT_HEARTBEAT_MS = 30000;
export const PW_CHAT_AVAILABILITY_REFRESH_MS = 60000;
const POLL_DEGRADED_AFTER_FAILURES = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_CONTEXT: VisitorChatRouteContext<string> = {
  key: 'generic',
  match: () => true,
  greeting: 'How can we help?',
  supportingText: 'Ask a question or describe what you need. The Primewayz team reviews every conversation.',
};

type Timers = {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
};

type SecureRandomSource = Parameters<typeof generateChatSessionId>[0];

export type PwChatWidgetDeps = {
  win: Window & typeof globalThis;
  config: PwChatEmbedConfig;
  fetchImpl: PwChatFetch;
  analyticsSink?: VisitorChatAnalyticsSink;
  timers?: Timers;
  randomSource?: SecureRandomSource;
  now?: () => number;
};

export type PwChatWidgetHandle = {
  open: () => void;
  close: () => void;
  destroy: () => void;
  host: HTMLElement;
  shadow: ShadowRoot;
};

type ErrorState = {
  reason: PwChatFailureReason | 'lead';
  message: string;
  retryable: boolean;
} | null;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseAvailability(body: unknown): ChatAvailability | null {
  if (!isObject(body) || typeof body.status !== 'string') return null;
  const scheduling = isObject(body.scheduling) ? body.scheduling : null;
  return {
    ...DEFAULT_CHAT_AVAILABILITY,
    status: normalizeChatAvailabilityStatus(body.status),
    responseExpectation: typeof body.responseExpectation === 'string' ? body.responseExpectation : '',
    businessHours: typeof body.businessHours === 'string' ? body.businessHours : DEFAULT_CHAT_AVAILABILITY.businessHours,
    canAcceptMessages: body.canAcceptMessages !== false,
    canBookCall: body.canBookCall === true,
    scheduling: {
      enabled: scheduling?.enabled === true,
      provider: typeof scheduling?.provider === 'string' ? scheduling.provider : null,
      eventTypeKey: typeof scheduling?.eventTypeKey === 'string' ? scheduling.eventTypeKey : null,
      publicBookingUrl: typeof scheduling?.publicBookingUrl === 'string' ? scheduling.publicBookingUrl : null,
    },
  };
}

/** Booking is offered only when the backend allows it from chat AND scheduling is enabled. */
export function resolvePwChatBookingUrl(availability: ChatAvailability | null): string | null {
  if (!availability || availability.canBookCall !== true) return null;
  if (availability.scheduling?.enabled !== true) return null;
  const raw = availability.scheduling.publicBookingUrl;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function headerTone(status: VisitorHeaderStatus): PwChatTone {
  if (status === 'team_online' || status === 'human_response_received') return 'online';
  if (status === 'automated_guidance') return 'automated';
  if (status === 'unavailable') return 'unavailable';
  return 'away';
}

/** Page URL for backend attribution: origin + path, keeping only utm_* query parameters. */
export function toAttributionPageUrl(href: string): string | undefined {
  try {
    const url = new URL(href);
    const kept = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) kept.append(key, value);
    });
    const query = kept.toString();
    return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
  } catch {
    return undefined;
  }
}

function toReferrerAttribution(referrer: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

function serverErrorText(body: unknown): string | null {
  if (!isObject(body) || typeof body.error !== 'string') return null;
  const text = body.error.trim();
  return text && text.length <= 200 ? text : null;
}

export async function startPwChatWidget(deps: PwChatWidgetDeps): Promise<PwChatWidgetHandle | null> {
  const { win, config } = deps;
  const doc = win.document;
  const now = deps.now ?? (() => Date.now());
  const timers: Timers = deps.timers ?? {
    setTimeout: (fn, ms) => win.setTimeout(fn, ms),
    clearTimeout: (id) => win.clearTimeout(id as number),
  };
  const api = createPwChatApiClient({ apiBaseUrl: config.apiBaseUrl, fetchImpl: deps.fetchImpl });
  const track = createPwChatTracker(deps.analyticsSink ?? createDefaultPwChatAnalyticsSink(win));
  const storage = createPwChatStorage(win, config.storageKeys);

  const capabilities = await api.get('/api/platform/capabilities');
  if (!capabilities.ok || !isObject(capabilities.body)) return null;
  const capabilityFlags = capabilities.body.capabilities;
  if (!isObject(capabilityFlags) || capabilityFlags.chat !== true) return null;

  const availabilityResult = await api.get('/api/chat/availability');
  if (availabilityResult.status === 403) return null;
  if (doc.getElementById(PW_CHAT_HOST_ID)) return null;

  // --- state ---
  let availability = parseAvailability(availabilityResult.body) ?? DEFAULT_CHAT_AVAILABILITY;
  let serviceDegraded = !availabilityResult.ok;
  let forbidden = false;
  let isOpen = false;
  let destroyed = false;
  let storageReady = false;
  let pendingRotation = false;
  let sessionId: string | null = storage.readSessionId();
  let contact = storage.readVisitorContact();
  let firstLanding: string | null = null;
  let conv: VisitorPollConsumerState = applyVisitorChatHistoryBaseline([]);
  let pollFailures = 0;
  let sending = false;
  let rateLimitedUntil = 0;
  let error: ErrorState = null;
  let failedDraft: { text: string; timestamp: Date } | null = null;
  let showLeadForm = false;
  let leadDismissed = false;
  let leadSaving = false;
  let selectedIntent: string | null = null;
  let documentVisible = doc.visibilityState !== 'hidden';
  let isMobile = isPwChatMobileViewport(win.innerWidth);
  let bodyLocked = false;
  let savedScrollY = 0;
  let localCounter = 0;
  let lastMessageSignature = '';
  let lastIntentSignature = '';
  const retryInFlight = new Set<string>();
  const cleanups: Array<() => void> = [];

  const timerIds: Record<'poll' | 'heartbeat' | 'availability' | 'rateLimit' | 'layout', unknown> = {
    poll: null, heartbeat: null, availability: null, rateLimit: null, layout: null,
  };
  const clearTimer = (name: keyof typeof timerIds) => {
    if (timerIds[name] != null) timers.clearTimeout(timerIds[name]);
    timerIds[name] = null;
  };
  let pollGeneration = 0;
  let heartbeatGeneration = 0;

  // --- DOM ---
  const host = doc.createElement('div');
  host.id = PW_CHAT_HOST_ID;
  host.setAttribute('data-pw-chat-version', PW_CHAT_EMBED_VERSION);
  host.style.cssText = 'all: initial;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const dom = buildPwChatDom(doc, shadow);
  doc.body.appendChild(host);

  const pagePath = () => {
    if (config.pageUrl) {
      try {
        return new URL(config.pageUrl).pathname || '/';
      } catch {
        // fall through to the live location
      }
    }
    return win.location.pathname || '/';
  };
  const routeContext = matchVisitorChatRouteContext(
    pagePath(),
    buildVisitorChatRouteContexts(config.contexts),
    GENERIC_CONTEXT,
  );
  const intro = routeContext === GENERIC_CONTEXT && config.pageContext
    ? config.pageContext
    : { greeting: routeContext.greeting, supportingText: routeContext.supportingText };

  const analyticsBase = () => ({
    route: win.location.pathname,
    pageType: config.pageType ?? (config.isFrontPage ? 'front_page' : null),
    availabilityState: availability.status,
    intentKey: selectedIntent,
  });

  const announce = (text: string) => {
    dom.announcer.textContent = '';
    timers.setTimeout(() => { dom.announcer.textContent = text; }, 50);
  };

  const contextPayload = (): Record<string, unknown> => {
    const params = new URLSearchParams(win.location.search);
    const utm = (key: string) => params.get(key)?.slice(0, 191) || undefined;
    return {
      currentPageUrl: toAttributionPageUrl(win.location.href),
      firstLandingPage: firstLanding ?? undefined,
      referrer: toReferrerAttribution(doc.referrer),
      utmSource: utm('utm_source'),
      utmMedium: utm('utm_medium'),
      utmCampaign: utm('utm_campaign'),
      utmContent: utm('utm_content'),
    };
  };

  // A rejected id is unknown to the server, so there is no remote conversation to reset.
  const session: PwChatSessionHandle = {
    current: () => sessionId ?? '',
    rotate: (rejectedId) => {
      if (!storageReady) {
        pendingRotation = true;
        return null;
      }
      if (sessionId !== rejectedId) return sessionId;
      sessionId = generateChatSessionId(deps.randomSource);
      storage.writeSessionId(sessionId);
      return sessionId;
    },
  };

  /** Called on open: creates or repairs the stored session id. */
  const ensureSession = () => {
    if (!sessionId || pendingRotation) {
      sessionId = generateChatSessionId(deps.randomSource);
      storage.writeSessionId(sessionId);
      pendingRotation = false;
    }
    storageReady = true;
    firstLanding = storage.ensureFirstLanding(win.location.pathname || '/');
  };

  // --- rendering ---
  const render = () => {
    if (destroyed) return;
    const latestResponder = resolveLatestResponderSender(conv.messages);
    const hasAdminReply = latestResponder === 'admin';
    const serviceAvailable = !serviceDegraded && !forbidden;
    const availabilityStatus = normalizeChatAvailabilityStatus(availability.status);
    const waitingForTeam = conv.messages.some(
      (msg) => msg.sender === 'user' && msg.deliveryStatus !== 'failed',
    ) && !hasAdminReply && !sending;

    const presence = resolveVisitorPresenceTone({ availabilityStatus, serviceAvailable });
    setTone(dom.launcherDot, presence);
    dom.launcher.setAttribute('aria-label', buildVisitorLauncherAriaLabel({
      presence,
      unreadCount: conv.unreadCount,
    }));
    const badgeText = formatVisitorUnreadBadge(conv.unreadCount);
    dom.badge.hidden = !badgeText;
    dom.badge.textContent = badgeText ?? '';
    dom.launcher.hidden = isOpen;
    dom.launcher.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    dom.panel.hidden = !isOpen;

    const headerStatus = resolveVisitorHeaderStatus({
      availabilityStatus,
      hasAdminReply,
      waitingForTeam: waitingForTeam && Boolean(contact.email),
      serviceAvailable,
    });
    dom.title.textContent = getVisitorChatHeaderTitle(latestResponder);
    dom.statusText.textContent = VISITOR_HEADER_STATUS_LABELS[headerStatus];
    setTone(dom.statusDot, headerTone(headerStatus));

    dom.introGreeting.textContent = intro.greeting;
    dom.introText.textContent = intro.supportingText;
    dom.introText.hidden = !intro.supportingText;
    dom.expectation.textContent = availability.responseExpectation;
    dom.expectation.hidden = !availability.responseExpectation;
    const visibleIntents = conv.messages.length === 0 ? config.intents : [];
    const intentSignature = `${visibleIntents.length}|${selectedIntent ?? ''}`;
    if (intentSignature !== lastIntentSignature) {
      lastIntentSignature = intentSignature;
      renderIntents(doc, dom.intents, visibleIntents, selectedIntent, selectIntent);
    }
    const messageSignature = conv.messages
      .map((msg) => `${msg.id}:${msg.deliveryStatus ?? ''}:${msg.deletedAt ?? ''}:${msg.editedAt ?? ''}:${msg.text.length}`)
      .join('|');
    if (messageSignature !== lastMessageSignature) {
      lastMessageSignature = messageSignature;
      renderMessages(doc, dom.log, dom.messageList, conv.messages);
    }

    dom.leadForm.hidden = !showLeadForm;
    dom.leadSave.disabled = leadSaving;
    dom.leadError.hidden = error?.reason !== 'lead';
    dom.leadError.textContent = error?.reason === 'lead' ? error.message : '';

    const composerError = error && error.reason !== 'lead' ? error : null;
    dom.notice.hidden = !composerError;
    dom.noticeText.textContent = composerError?.message ?? '';
    dom.noticeRetry.hidden = !composerError?.retryable;

    const rateLimited = now() < rateLimitedUntil;
    const acceptingMessages = availability.canAcceptMessages && !forbidden;
    dom.sendButton.disabled = sending || rateLimited || !acceptingMessages;
    dom.textarea.disabled = forbidden;
    dom.textarea.placeholder = acceptingMessages ? 'Type your message' : 'Messaging is currently unavailable';

    const bookingUrl = resolvePwChatBookingUrl(availability);
    dom.booking.hidden = !bookingUrl || forbidden;
    if (bookingUrl) dom.bookingLink.href = bookingUrl;
    else dom.bookingLink.removeAttribute('href');

    applyMobileSheet();
  };

  // --- layout ---
  const applyLauncherPosition = () => {
    if (destroyed) return;
    const obstacles: RectLike[] = [];
    for (const selector of PW_CHAT_COLLISION_SELECTORS) {
      const rect = readVisibleObstacleRect(win, doc.querySelector(selector));
      if (rect) obstacles.push(rect);
    }
    const bottom = computeLauncherBottom({
      viewportWidth: win.innerWidth,
      viewportHeight: win.innerHeight,
      obstacles,
    });
    dom.root.style.setProperty('--pw-chat-bottom', `${bottom}px`);
  };

  let layoutFrame = false;
  const scheduleLayout = () => {
    if (layoutFrame) return;
    layoutFrame = true;
    const run = () => {
      layoutFrame = false;
      applyLauncherPosition();
    };
    if (typeof win.requestAnimationFrame === 'function') win.requestAnimationFrame(run);
    else run();
    // Host controls often fade in with a CSS transition; re-check once it settles.
    clearTimer('layout');
    timerIds.layout = timers.setTimeout(applyLauncherPosition, 350);
  };

  const applyMobileSheet = () => {
    if (isOpen && isMobile) {
      const sheet = buildMobileSheetViewportStyle(win.visualViewport ?? null);
      Object.assign(dom.panel.style, sheet);
      if (!bodyLocked) {
        savedScrollY = lockBodyScroll({ currentScrollY: win.scrollY, bodyStyle: doc.body.style });
        bodyLocked = true;
      }
    } else {
      dom.panel.removeAttribute('style');
      if (bodyLocked) {
        unlockBodyScroll({
          restorePosition: true,
          savedScrollY,
          bodyStyle: doc.body.style,
          scrollTo: (x, y) => win.scrollTo(x, y),
        });
        bodyLocked = false;
      }
    }
  };

  // --- availability ---
  const refreshAvailability = async () => {
    const result = await api.get('/api/chat/availability');
    if (destroyed) return;
    if (result.status === 403) {
      forbidden = true;
    } else if (result.ok) {
      availability = parseAvailability(result.body) ?? availability;
      serviceDegraded = false;
    } else if (result.status !== 429) {
      serviceDegraded = true;
    }
    render();
  };

  const scheduleAvailability = () => {
    clearTimer('availability');
    if (!isOpen || !documentVisible || forbidden) return;
    timerIds.availability = timers.setTimeout(async () => {
      await refreshAvailability();
      scheduleAvailability();
    }, PW_CHAT_AVAILABILITY_REFRESH_MS);
  };

  // --- history polling ---
  const markForbidden = () => {
    forbidden = true;
    clearTimer('poll');
    clearTimer('heartbeat');
    clearTimer('availability');
  };

  const applyRemoteHistory = (result: PwChatApiResult, baseline: boolean): boolean => {
    if (!result.ok || !Array.isArray(result.body)) return false;
    const remote = result.body
      .map(mapVisitorChatHistoryMessage)
      .filter((msg): msg is VisitorChatMessage => Boolean(msg));
    const before = conv.unreadCount;
    if (baseline) {
      conv = { ...applyVisitorChatHistoryBaseline(remote), chatIsOpen: isOpen };
    } else if (shouldApplyVisitorPollHistory({
      remote,
      local: conv.messages,
      lastSeenAdminId: conv.lastSeenAdminId,
    })) {
      conv = applyVisitorChatPollRound(conv, remote);
    } else if (remote.length > 0 && !conv.hasKnownSessionHistory) {
      conv = { ...conv, hasKnownSessionHistory: true };
    }
    if (conv.unreadCount > before) {
      announce(conv.unreadCount === 1 ? '1 unread reply' : `${conv.unreadCount} unread replies`);
    }
    return true;
  };

  let pollInFlight = false;
  const pollOnce = async (): Promise<number | null> => {
    if (!sessionId || pendingRotation || forbidden || pollInFlight) return null;
    pollInFlight = true;
    try {
      const result = await sendWithSessionRecovery(session, (id) =>
        api.get(`/api/chat/${encodeURIComponent(id)}`));
      if (destroyed) return null;
      if (result.status === 403) {
        markForbidden();
      } else if (result.status === 429) {
        render();
        return (result.retryAfterSeconds ?? 30) * 1000;
      } else if (applyRemoteHistory(result, false)) {
        pollFailures = 0;
        serviceDegraded = false;
      } else if (!pendingRotation) {
        pollFailures += 1;
        if (pollFailures >= POLL_DEGRADED_AFTER_FAILURES) serviceDegraded = true;
      }
      render();
      return null;
    } finally {
      pollInFlight = false;
    }
  };

  const schedulePoll = (immediate: boolean) => {
    clearTimer('poll');
    const generation = ++pollGeneration;
    if (destroyed || !sessionId || pendingRotation || forbidden) return;
    const interval = resolveVisitorChatPollIntervalMs({
      isOpen,
      isMinimized: false,
      isDocumentVisible: documentVisible,
      hasKnownSessionHistory: conv.hasKnownSessionHistory,
    });
    if (interval == null) return;
    const effective = pollFailures >= POLL_DEGRADED_AFTER_FAILURES ? interval * 2 : interval;
    timerIds.poll = timers.setTimeout(async () => {
      if (generation !== pollGeneration) return;
      const backoffMs = await pollOnce();
      if (generation !== pollGeneration) return;
      if (backoffMs) {
        clearTimer('poll');
        timerIds.poll = timers.setTimeout(() => schedulePoll(true), backoffMs);
        return;
      }
      schedulePoll(false);
    }, immediate ? 0 : effective);
  };

  // --- heartbeat ---
  let heartbeatBackoffUntil = 0;
  const heartbeatOnce = async () => {
    if (!isOpen || !documentVisible || forbidden || !sessionId) return;
    if (now() < heartbeatBackoffUntil) return;
    const result = await sendWithSessionRecovery(session, (id) =>
      api.post('/api/chat/heartbeat', { sessionId: id, ...contextPayload() }));
    if (destroyed) return;
    if (result.status === 403) {
      markForbidden();
      render();
    } else if (result.status === 429) {
      heartbeatBackoffUntil = now() + (result.retryAfterSeconds ?? 30) * 1000;
    }
  };

  const scheduleHeartbeat = (immediate: boolean) => {
    clearTimer('heartbeat');
    const generation = ++heartbeatGeneration;
    if (!isOpen || !documentVisible || forbidden) return;
    const tick = async () => {
      if (generation !== heartbeatGeneration) return;
      await heartbeatOnce();
      if (generation !== heartbeatGeneration) return;
      timerIds.heartbeat = timers.setTimeout(tick, PW_CHAT_HEARTBEAT_MS);
    };
    if (immediate) void tick();
    else timerIds.heartbeat = timers.setTimeout(tick, PW_CHAT_HEARTBEAT_MS);
  };

  // --- sending ---
  const setRateLimit = (seconds: number) => {
    rateLimitedUntil = now() + seconds * 1000;
    clearTimer('rateLimit');
    timerIds.rateLimit = timers.setTimeout(() => {
      rateLimitedUntil = 0;
      if (error?.reason === 'rate_limited') error = null;
      render();
    }, seconds * 1000);
  };

  const failureFor = (result: PwChatApiResult): { reason: PwChatFailureReason; message: string; retryable: boolean } => {
    if (result.networkError) {
      return { reason: 'network_error', message: 'Message not sent. Check your connection and try again.', retryable: true };
    }
    if (result.status === 400 && result.code === 'invalid_input') {
      return {
        reason: 'invalid_input',
        message: serverErrorText(result.body) ?? 'Please check your message and try again.',
        retryable: false,
      };
    }
    if (result.status === 403) {
      return { reason: 'forbidden', message: 'Chat is unavailable right now. Please try again later.', retryable: false };
    }
    if (result.status === 429) {
      const seconds = result.retryAfterSeconds ?? 30;
      return {
        reason: 'rate_limited',
        message: `You are sending messages too quickly. Please wait ${seconds} seconds and try again.`,
        retryable: false,
      };
    }
    return { reason: 'server_error', message: 'Message not sent. Please try again.', retryable: true };
  };

  const performSend = async (text: string): Promise<void> => {
    const local: VisitorChatMessage = {
      id: `local-pending-${++localCounter}`,
      text,
      sender: 'user',
      timestamp: new Date(now()),
      deliveryStatus: 'sending',
      retryPayload: { text, attachmentIds: [] },
    };
    sending = true;
    error = null;
    conv = { ...conv, messages: [...conv.messages, local] };
    render();
    announce('Sending');

    const result = await sendWithSessionRecovery(session, (id) =>
      api.post('/api/chat/respond', { sessionId: id, message: text }));
    if (destroyed) return;
    sending = false;

    if (result.ok && isObject(result.body)) {
      const userMessage = mapVisitorChatHistoryMessage(result.body.userMessage);
      const botMessage = mapVisitorChatHistoryMessage(result.body.botMessage);
      const messages = conv.messages.map((msg) => (msg.id === local.id ? (userMessage ?? { ...msg, deliveryStatus: 'sent' as const, retryPayload: undefined }) : msg));
      if (botMessage && !messages.some((msg) => msg.id === botMessage.id)) messages.push(botMessage);
      conv = { ...conv, messages, hasKnownSessionHistory: true };
      const nextAvailability = parseAvailability(result.body.availability);
      if (nextAvailability) availability = nextAvailability;
      failedDraft = null;
      if (dom.textarea.value.trim() === text) dom.textarea.value = '';
      if (!contact.email && !leadDismissed && isTeamAwayStatus(availability.status)) showLeadForm = true;
      track('chat_message_sent', analyticsBase());
      announce('Sent');
      render();
      schedulePoll(false);
      return;
    }

    conv = { ...conv, messages: conv.messages.filter((msg) => msg.id !== local.id) };
    const failure = failureFor(result);
    error = failure;
    if (failure.reason === 'rate_limited') setRateLimit(result.retryAfterSeconds ?? 30);
    if (failure.reason === 'forbidden') markForbidden();
    failedDraft = failure.retryable ? { text, timestamp: local.timestamp } : null;
    track('chat_message_send_failed', { ...analyticsBase(), failureReason: failure.reason });
    announce('Could not send');
    render();
  };

  const submitComposer = async () => {
    const text = dom.textarea.value.trim();
    if (!text || sending || forbidden) return;
    if (now() < rateLimitedUntil) return;
    if (text.length > PUBLIC_CHAT_INPUT_LIMITS.message) {
      error = { reason: 'invalid_input', message: 'Your message is too long.', retryable: false };
      render();
      return;
    }
    await performSend(text);
  };

  const retryFailedDraft = async () => {
    const draft = failedDraft;
    if (!draft) return;
    const text = dom.textarea.value.trim() || draft.text;
    await runSafeMessageRetry({
      messageId: 'composer-draft',
      inFlight: retryInFlight,
      reconcileBeforeRetry: async () => {
        if (text !== draft.text || !sessionId) return false;
        const history = await api.get(`/api/chat/${encodeURIComponent(sessionId)}`);
        if (!history.ok || !Array.isArray(history.body)) return false;
        const remote = history.body
          .map(mapVisitorChatHistoryMessage)
          .filter((msg): msg is VisitorChatMessage => Boolean(msg));
        const failed: VisitorChatMessage = {
          id: 'composer-draft',
          text: draft.text,
          sender: 'user',
          timestamp: draft.timestamp,
          deliveryStatus: 'failed',
          retryPayload: { text: draft.text, attachmentIds: [] },
        };
        if (!findPersistedUserMessageMatch(failed, remote)) return false;
        conv = applyVisitorChatPollRound(conv, remote);
        failedDraft = null;
        error = null;
        if (dom.textarea.value.trim() === draft.text) dom.textarea.value = '';
        announce('Sent');
        render();
        return true;
      },
      sendMessage: () => performSend(text),
    });
  };

  // --- lead capture ---
  const submitLead = async () => {
    if (leadSaving || !sessionId) return;
    const name = dom.leadName.value.trim();
    const email = dom.leadEmail.value.trim();
    if (!name || name.length > PUBLIC_CHAT_INPUT_LIMITS.name) {
      error = { reason: 'lead', message: 'Please enter your name.', retryable: false };
      render();
      dom.leadName.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email) || email.length > PUBLIC_CHAT_INPUT_LIMITS.email) {
      error = { reason: 'lead', message: 'Please enter a valid email address.', retryable: false };
      render();
      dom.leadEmail.focus();
      return;
    }
    leadSaving = true;
    error = null;
    render();
    const result = await sendWithSessionRecovery(session, (id) =>
      api.post('/api/chat/session', { sessionId: id, name, email, ...contextPayload() }));
    if (destroyed) return;
    leadSaving = false;
    if (result.ok) {
      storage.writeVisitorContact(name, email);
      contact = { name, email };
      showLeadForm = false;
      announce(VISITOR_CHAT_MESSAGE_SAVED);
      track('chat_lead_captured', analyticsBase());
      track('chat_human_handoff_requested', analyticsBase());
      render();
      dom.textarea.focus();
      return;
    }
    if (result.status === 403) markForbidden();
    error = {
      reason: 'lead',
      message: result.status === 429
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'Could not save your details. Please try again.',
      retryable: false,
    };
    announce('Contact save failed');
    render();
  };

  // --- open / close ---
  const open = () => {
    if (destroyed || isOpen) return;
    ensureSession();
    isOpen = true;
    conv = applyVisitorChatOpenTransition(conv);
    storage.writePanelOpen(true);
    if (!storage.readOpenTracked()) {
      storage.writeOpenTracked();
      track('chat_open', analyticsBase());
    }
    render();
    dom.textarea.focus();
    scheduleHeartbeat(true);
    schedulePoll(true);
    void refreshAvailability().then(scheduleAvailability);
  };

  const close = () => {
    if (destroyed || !isOpen) return;
    isOpen = false;
    conv = { ...conv, chatIsOpen: false };
    storage.writePanelOpen(false);
    clearTimer('heartbeat');
    clearTimer('availability');
    heartbeatGeneration += 1;
    render();
    schedulePoll(false);
    dom.launcher.focus();
  };

  function selectIntent(intent: PwChatIntentConfig) {
    selectedIntent = intent.key;
    if (!dom.textarea.value.trim()) dom.textarea.value = intent.label;
    render();
    dom.textarea.focus();
  }

  // --- events ---
  const listen = <T extends EventTarget>(target: T, type: string, handler: (event: Event) => void, options?: AddEventListenerOptions) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  listen(dom.launcher, 'click', open);
  listen(dom.closeButton, 'click', close);
  listen(dom.panel, 'keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  listen(dom.composer, 'submit', (event) => {
    event.preventDefault();
    void submitComposer();
  });
  listen(dom.textarea, 'keydown', (event) => {
    const key = event as KeyboardEvent;
    if (key.key === 'Enter' && !key.shiftKey && !key.isComposing) {
      event.preventDefault();
      void submitComposer();
    }
  });
  listen(dom.noticeRetry, 'click', () => { void retryFailedDraft(); });
  listen(dom.leadForm, 'submit', (event) => {
    event.preventDefault();
    void submitLead();
  });
  listen(dom.leadDismiss, 'click', () => {
    showLeadForm = false;
    leadDismissed = true;
    if (error?.reason === 'lead') error = null;
    render();
    dom.textarea.focus();
  });
  listen(dom.bookingLink, 'click', () => {
    track('chat_appointment_requested', analyticsBase());
  });
  listen(doc, 'visibilitychange', () => {
    const visible = doc.visibilityState !== 'hidden';
    if (visible === documentVisible) return;
    documentVisible = visible;
    if (visible) {
      schedulePoll(true);
      scheduleHeartbeat(true);
      scheduleAvailability();
    } else {
      clearTimer('poll');
      clearTimer('heartbeat');
      clearTimer('availability');
      pollGeneration += 1;
      heartbeatGeneration += 1;
    }
  });
  listen(win, 'resize', () => {
    isMobile = isPwChatMobileViewport(win.innerWidth);
    applyMobileSheet();
    scheduleLayout();
  });
  listen(win, 'scroll', scheduleLayout, { passive: true });
  if (win.visualViewport) {
    listen(win.visualViewport, 'resize', applyMobileSheet);
    listen(win.visualViewport, 'scroll', applyMobileSheet);
  }
  if (typeof win.MutationObserver === 'function') {
    for (const selector of PW_CHAT_COLLISION_SELECTORS) {
      const target = doc.querySelector(selector);
      if (!target) continue;
      const observer = new win.MutationObserver(scheduleLayout);
      observer.observe(target, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      cleanups.push(() => observer.disconnect());
    }
  }

  applyLauncherPosition();
  render();

  // Returning visitor: read-only history baseline (no writes, no session creation).
  if (sessionId) {
    const baseline = await api.get(`/api/chat/${encodeURIComponent(sessionId)}`);
    if (!destroyed) {
      if (baseline.status === 403) {
        markForbidden();
      } else {
        // Weak unknown ids are only marked here; rotation (a storage write) happens on open.
        if (shouldReplaceRejectedChatSessionId(sessionId, baseline.status, baseline.body)) {
          pendingRotation = true;
        } else {
          applyRemoteHistory(baseline, true);
        }
      }
      render();
      schedulePoll(false);
    }
  }

  if (!destroyed && storage.readPanelOpen() && !isMobile) open();

  return {
    open,
    close,
    host,
    shadow,
    destroy: () => {
      if (destroyed) return;
      if (bodyLocked) {
        unlockBodyScroll({ restorePosition: false, savedScrollY, bodyStyle: doc.body.style, scrollTo: () => {} });
        bodyLocked = false;
      }
      destroyed = true;
      for (const name of Object.keys(timerIds) as (keyof typeof timerIds)[]) clearTimer(name);
      pollGeneration += 1;
      heartbeatGeneration += 1;
      for (const cleanup of cleanups.splice(0)) cleanup();
      host.remove();
    },
  };
}
