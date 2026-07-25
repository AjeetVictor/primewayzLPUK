/**
 * Phase 2F-1.1: reliable unread badge + launcher presence.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  applyVisitorChatHistoryBaseline,
  applyVisitorChatOpenTransition,
  applyVisitorChatPollRound,
  isVisitorChatLocalValidationHost,
  type VisitorPollConsumerState,
} from './visitorChatPollReconcile.ts';
import type { VisitorChatMessage } from './visitorChatTypes.ts';
import {
  buildVisitorLauncherAriaLabel,
  formatVisitorUnreadBadge,
  resolveVisitorHeaderStatus,
  resolveVisitorPresenceTone,
  VISITOR_HEADER_STATUS_DOT_CLASS,
  VISITOR_HEADER_STATUS_LABELS,
  VISITOR_PRESENCE_DOT_CLASS,
  VISITOR_PRESENCE_STATUS_LABELS,
} from './visitorChatUi.ts';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function msg(
  partial: Partial<VisitorChatMessage> & Pick<VisitorChatMessage, 'id' | 'sender' | 'text'>,
): VisitorChatMessage {
  return {
    timestamp: new Date('2026-07-24T12:00:00.000Z'),
    deliveryStatus: 'sent',
    ...partial,
  };
}

function closedKnownSession(
  messages: VisitorChatMessage[],
  lastSeenAdminId: string | null = null,
): VisitorPollConsumerState {
  return {
    messages,
    lastSeenAdminId,
    hasKnownSessionHistory: true,
    humanJoinedNoticeShown: Boolean(lastSeenAdminId),
    unreadCount: 0,
    chatIsOpen: false,
  };
}

describe('Phase 2F-1.1 unread poll consumer', () => {
  test('first real-style poll while minimised gives unread 1', () => {
    let state = closedKnownSession([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
    ]);

    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'Human reply' }),
    ], { createNoticeId: () => 'system-1' });

    assert.equal(state.unreadCount, 1);
    assert.equal(state.lastSeenAdminId, '3');
  });

  test('identical second poll does not increment unread', () => {
    let state = closedKnownSession([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
    ]);

    const remote = [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'Human reply' }),
    ];

    state = applyVisitorChatPollRound(state, remote, { createNoticeId: () => 'system-1' });
    state = applyVisitorChatPollRound(state, remote, { createNoticeId: () => 'system-2' });

    assert.equal(state.unreadCount, 1);
    assert.equal(state.lastSeenAdminId, '3');
  });

  test('later admin reply increments unread to 2', () => {
    let state = closedKnownSession([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
    ]);

    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'First' }),
    ], { createNoticeId: () => 'system-1' });

    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'First' }),
      msg({ id: '5', sender: 'admin', text: 'Second' }),
    ]);

    assert.equal(state.unreadCount, 2);
    assert.equal(state.lastSeenAdminId, '5');
  });

  test('opening clears unread', () => {
    let state = closedKnownSession([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
    ]);
    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '3', sender: 'admin', text: 'Reply' }),
    ], { createNoticeId: () => 'system-1' });
    assert.equal(state.unreadCount, 1);

    state = { ...state, chatIsOpen: true, unreadCount: 0 };
    state = applyVisitorChatPollRound(state, state.messages.filter((m) => m.sender !== 'system'));
    assert.equal(state.unreadCount, 0);
  });

  test('refresh/history baseline does not recreate unread', () => {
    const baseline = applyVisitorChatHistoryBaseline([
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '9', sender: 'admin', text: 'Already viewed' }),
    ], { createNoticeId: () => 'system-baseline' });

    assert.equal(baseline.unreadCount, 0);
    assert.equal(baseline.lastSeenAdminId, '9');

    const afterIdenticalPoll = applyVisitorChatPollRound(
      { ...baseline, chatIsOpen: false },
      [
        msg({ id: '1', sender: 'user', text: 'Hello' }),
        msg({ id: '9', sender: 'admin', text: 'Already viewed' }),
      ],
    );
    assert.equal(afterIdenticalPoll.unreadCount, 0);
  });

  test('stale open reconcile then close still credits a later new admin reply', () => {
    // Models the production race: an in-flight poll while open advances the
    // admin baseline with unreadDelta=0; a later closed poll must still badge.
    let state: VisitorPollConsumerState = {
      messages: [
        msg({ id: '1', sender: 'user', text: 'Hello' }),
        msg({ id: '2', sender: 'bot', text: 'Ack' }),
      ],
      lastSeenAdminId: null,
      hasKnownSessionHistory: true,
      humanJoinedNoticeShown: false,
      unreadCount: 0,
      chatIsOpen: true,
    };

    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'Seen while open' }),
    ], { createNoticeId: () => 'system-1' });
    assert.equal(state.unreadCount, 0);

    state = { ...state, chatIsOpen: false };
    state = applyVisitorChatPollRound(state, [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: '2', sender: 'bot', text: 'Ack' }),
      msg({ id: '3', sender: 'admin', text: 'Seen while open' }),
      msg({ id: '4', sender: 'admin', text: 'After minimise' }),
    ]);
    assert.equal(state.unreadCount, 1);
  });

  test('opening with stale rendered messages cannot regress the latest seen admin id', () => {
    // messagesRef still shows admin "old"; poll already advanced lastSeenAdminId
    // to "new" before React re-rendered. Opening must clear unread without
    // moving lastSeenAdminId backwards.
    const staleRendered = [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: 'old', sender: 'admin', text: 'Previous admin' }),
    ];
    const remoteWithNew = [
      msg({ id: '1', sender: 'user', text: 'Hello' }),
      msg({ id: 'old', sender: 'admin', text: 'Previous admin' }),
      msg({ id: 'new', sender: 'admin', text: 'Latest admin' }),
    ];

    let state = closedKnownSession(staleRendered, 'old');
    state = applyVisitorChatPollRound(state, remoteWithNew, {
      createNoticeId: () => 'system-1',
    });
    assert.equal(state.unreadCount, 1);
    assert.equal(state.lastSeenAdminId, 'new');

    // Simulate: refs advanced, but UI still holds stale messagesRef snapshot.
    const openRefs = {
      messagesRef: staleRendered,
      lastSeenAdminId: state.lastSeenAdminId,
      unreadCount: state.unreadCount,
    };
    assert.equal(openRefs.messagesRef.at(-1)?.id, 'old');

    state = applyVisitorChatOpenTransition({
      ...state,
      messages: openRefs.messagesRef,
    });
    assert.equal(state.unreadCount, 0);
    assert.equal(state.chatIsOpen, true);
    assert.equal(state.lastSeenAdminId, 'new');

    state = { ...state, chatIsOpen: false };
    state = applyVisitorChatPollRound(state, remoteWithNew);
    assert.equal(state.unreadCount, 0);
    assert.equal(state.lastSeenAdminId, 'new');
  });
});

describe('Phase 2F-1.1 launcher presence and badge helpers', () => {
  test('online presence uses green semantic state', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'online', serviceAvailable: true }),
      'online',
    );
    assert.match(VISITOR_PRESENCE_DOT_CLASS.online, /emerald|green/);
  });

  test('away uses amber', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'away', serviceAvailable: true }),
      'away',
    );
    assert.match(VISITOR_PRESENCE_DOT_CLASS.away, /amber/);
  });

  test('automated/unknown uses grey', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'assistant', serviceAvailable: true }),
      'automated',
    );
    assert.match(VISITOR_PRESENCE_DOT_CLASS.automated, /slate|gray|grey/i);
  });

  test('service failure uses red', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'online', serviceAvailable: false }),
      'unavailable',
    );
    assert.match(VISITOR_PRESENCE_DOT_CLASS.unavailable, /red/);
  });

  test('unread badge and presence labels stay distinct', () => {
    assert.equal(formatVisitorUnreadBadge(0), null);
    assert.equal(formatVisitorUnreadBadge(1), '1');
    assert.equal(formatVisitorUnreadBadge(9), '9');
    assert.equal(formatVisitorUnreadBadge(10), '9+');
    // Presence uses a lower-right dot; unread uses upper-right numeric badge.
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /-right-1 -top-1[\s\S]*chat-unread-badge|chat-unread-badge[\s\S]*-right-1 -top-1/);
    assert.match(liveChat, /-bottom-0\.5 -right-0\.5[\s\S]*chat-presence-dot|chat-presence-dot[\s\S]*-bottom-0\.5 -right-0\.5/);
  });

  test('badge shows 9+ above nine', () => {
    assert.equal(formatVisitorUnreadBadge(9), '9');
    assert.equal(formatVisitorUnreadBadge(10), '9+');
    assert.equal(formatVisitorUnreadBadge(99), '9+');
  });

  test('aria-label contains status and correct singular/plural unread text', () => {
    assert.equal(
      buildVisitorLauncherAriaLabel({ presence: 'online', unreadCount: 0 }),
      'Open Primewayz Assistant. Team online.',
    );
    assert.equal(
      buildVisitorLauncherAriaLabel({ presence: 'away', unreadCount: 1 }),
      'Open Primewayz Assistant. Team away. 1 unread reply.',
    );
    assert.equal(
      buildVisitorLauncherAriaLabel({ presence: 'automated', unreadCount: 3 }),
      'Open Primewayz Assistant. Automated guidance available. 3 unread replies.',
    );
    assert.equal(
      buildVisitorLauncherAriaLabel({ presence: 'unavailable', unreadCount: 0 }),
      'Open Primewayz Assistant. Chat temporarily unavailable.',
    );
  });

  test('open-panel status aligns with launcher presence hierarchy', () => {
    assert.equal(
      resolveVisitorHeaderStatus({
        availabilityStatus: 'online',
        hasAdminReply: false,
        waitingForTeam: false,
      }),
      'team_online',
    );
    assert.equal(VISITOR_HEADER_STATUS_LABELS.team_online, 'Team online');
    assert.equal(VISITOR_HEADER_STATUS_LABELS.team_away, 'Team currently away');
    assert.equal(
      VISITOR_HEADER_STATUS_LABELS.automated_guidance,
      'Automated guidance available',
    );
    assert.equal(
      VISITOR_HEADER_STATUS_LABELS.human_response_received,
      'Human response received',
    );
    assert.equal(
      VISITOR_HEADER_STATUS_LABELS.unavailable,
      'Chat temporarily unavailable',
    );
    assert.equal(
      resolveVisitorHeaderStatus({
        availabilityStatus: 'away',
        hasAdminReply: true,
        waitingForTeam: false,
        serviceAvailable: true,
      }),
      'human_response_received',
    );
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'away', serviceAvailable: true }),
      'away',
    );
    assert.match(VISITOR_HEADER_STATUS_DOT_CLASS.unavailable, /red/);
    assert.equal(VISITOR_PRESENCE_STATUS_LABELS.online, 'Team online');
  });
});

describe('Phase 2F-1.1 LiveChat wiring', () => {
  test('LiveChat uses chatIsOpenRef for poll reconcile and green unread badge', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /chatIsOpenRef/);
    assert.match(liveChat, /chatIsOpenRef\.current = false/);
    assert.match(liveChat, /chatIsOpen: chatIsOpenRef\.current/);
    assert.match(liveChat, /findLatestAdminMessage/);
    assert.match(liveChat, /messagesRef\.current/);
    assert.match(liveChat, /bg-green-500/);
    assert.match(liveChat, /data-testid="chat-unread-badge"/);
    assert.match(liveChat, /data-testid="chat-presence-dot"/);
    assert.match(liveChat, /buildVisitorLauncherAriaLabel/);
    assert.match(liveChat, /resolveVisitorPresenceTone/);
    assert.match(liveChat, /void pollHistory\(\)/);
    assert.match(liveChat, /primewayz-visitor-chat-force-poll/);
    assert.match(liveChat, /isVisitorChatLocalValidationHost/);
    assert.match(
      liveChat,
      /messagesRef\.current = result\.messages;\s*lastSeenAdminIdRef\.current = result\.latestAdminId;\s*setMessages\(result\.messages\)/,
    );
    assert.match(
      liveChat,
      /messagesRef\.current = baseline\.messages;\s*lastSeenAdminIdRef\.current = baseline\.latestAdminId/,
    );
    assert.doesNotMatch(
      liveChat,
      /openChatWidget[\s\S]*findLatestAdminMessage\(messagesRef\.current\)/,
    );
    assert.doesNotMatch(liveChat, /chatIsOpen: isOpen && !isMinimized/);
    assert.doesNotMatch(liveChat, /bg-brand-magenta/);
  });

  test('force-poll hook is localhost-only and unavailable on production hostnames', () => {
    assert.equal(isVisitorChatLocalValidationHost('localhost'), true);
    assert.equal(isVisitorChatLocalValidationHost('127.0.0.1'), true);
    assert.equal(isVisitorChatLocalValidationHost('uk.primewayz.com'), false);
    assert.equal(isVisitorChatLocalValidationHost('primewayz.com'), false);

    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /isVisitorChatLocalValidationHost/);
    assert.match(
      liveChat,
      /isLocalValidationHost[\s\S]*primewayz-visitor-chat-force-poll|if \(!isLocalValidationHost\)/,
    );
  });

  test('mobile launcher chrome has overflow-safe padding and no permanent pulse', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /p-1/);
    assert.doesNotMatch(liveChat, /animate-pulse|animate-ping|@keyframes/);
    assert.match(liveChat, /prefersReducedMotion|prefers-reduced-motion/);
    assert.match(liveChat, /max-w-\[calc\(100vw-2rem\)\]/);
  });
});
