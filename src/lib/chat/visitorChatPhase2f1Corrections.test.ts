/**
 * Phase 2F-1 approval correction tests:
 * safe retry lock, body-scroll unlock, pure poll reconcile.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISITOR_CHAT_HUMAN_JOINED_NOTICE } from './visitorChatIdentity.ts';
import {
  clearBodyScrollStyles,
  lockBodyScroll,
  unlockBodyScroll,
  type BodyScrollStyleTarget,
} from './visitorChatBodyScroll.ts';
import { reconcileVisitorPollState } from './visitorChatPollReconcile.ts';
import { runSafeMessageRetry } from './visitorChatSafeRetry.ts';
import type { VisitorChatMessage } from './visitorChatTypes.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function msg(
  partial: Partial<VisitorChatMessage> & Pick<VisitorChatMessage, 'id' | 'sender' | 'text'>,
): VisitorChatMessage {
  return {
    timestamp: new Date('2026-07-24T10:00:00.000Z'),
    deliveryStatus: 'sent',
    ...partial,
  };
}

function createBodyStyle(): BodyScrollStyleTarget {
  return {
    position: 'fixed',
    top: '-400px',
    left: '0',
    right: '0',
    width: '100%',
  };
}

// --- Safe retry lock ---

test('safe retry: two rapid activations produce at most one reconcile and one resend', async () => {
  const inFlight = new Set<string>();
  let reconcileCalls = 0;
  let sendCalls = 0;
  let releaseReconcile!: () => void;

  const reconcileGate = new Promise<void>((resolve) => {
    releaseReconcile = resolve;
  });

  const reconcileBeforeRetry = async () => {
    reconcileCalls += 1;
    await reconcileGate;
    return false;
  };

  const sendMessage = async () => {
    sendCalls += 1;
  };

  const first = runSafeMessageRetry({
    messageId: 'local-1',
    inFlight,
    reconcileBeforeRetry,
    sendMessage,
  });
  const second = runSafeMessageRetry({
    messageId: 'local-1',
    inFlight,
    reconcileBeforeRetry,
    sendMessage,
  });

  assert.equal(inFlight.has('local-1'), true);
  releaseReconcile();

  const outcomes = await Promise.all([first, second]);
  assert.deepEqual(outcomes.sort(), ['resent', 'skipped'].sort());
  assert.equal(reconcileCalls, 1);
  assert.equal(sendCalls, 1);
  assert.equal(inFlight.has('local-1'), false);
});

test('safe retry: lock remains through reconcile success and is cleared in finally', async () => {
  const inFlight = new Set<string>();
  let sawLockDuringReconcile = false;

  const outcome = await runSafeMessageRetry({
    messageId: 'local-2',
    inFlight,
    reconcileBeforeRetry: async () => {
      sawLockDuringReconcile = inFlight.has('local-2');
      return true;
    },
    sendMessage: async () => {
      throw new Error('send must not run after reconcile');
    },
  });

  assert.equal(outcome, 'reconciled');
  assert.equal(sawLockDuringReconcile, true);
  assert.equal(inFlight.has('local-2'), false);
});

test('safe retry: LiveChat keeps retryInFlightRef across reconcile and sendMessage', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /retryInFlightRef\.current\.add\(msg\.id\)/);
  assert.match(liveChat, /const reconciled = await reconcileBeforeRetry\(msg\)/);
  assert.match(liveChat, /await sendMessage\(msg\)/);
  assert.match(liveChat, /finally \{\s*retryInFlightRef\.current\.delete\(msg\.id\);\s*\}/s);
  // Must not clear the lock before sendMessage.
  const retryIndex = liveChat.indexOf('const retryMessage = async');
  const retryBlock = liveChat.slice(retryIndex, retryIndex + 1800);
  const finallyIndex = retryBlock.indexOf('retryInFlightRef.current.delete');
  const sendIndex = retryBlock.indexOf('await sendMessage(msg)');
  assert.ok(sendIndex > 0 && finallyIndex > sendIndex);
});

// --- Body scroll ---

test('body scroll: ordinary same-route close restores previous scroll', () => {
  const bodyStyle = createBodyStyle();
  const scrolls: Array<[number, number]> = [];
  const saved = lockBodyScroll({
    currentScrollY: 420,
    bodyStyle,
  });
  assert.equal(saved, 420);
  assert.equal(bodyStyle.position, 'fixed');

  unlockBodyScroll({
    restorePosition: true,
    savedScrollY: saved,
    bodyStyle,
    scrollTo: (x, y) => scrolls.push([x, y]),
  });

  assert.equal(bodyStyle.position, '');
  assert.equal(bodyStyle.top, '');
  assert.deepEqual(scrolls, [[0, 420]]);
});

test('body scroll: in-chat navigation clears styles and destination stays at 0', () => {
  const bodyStyle = createBodyStyle();
  const scrolls: Array<[number, number]> = [];
  let savedScrollY = lockBodyScroll({
    currentScrollY: 640,
    bodyStyle,
  });

  // Review / service / booking navigation
  unlockBodyScroll({
    restorePosition: false,
    savedScrollY,
    bodyStyle,
    scrollTo: (x, y) => scrolls.push([x, y]),
  });
  savedScrollY = 0;
  scrolls.push([0, 0]);

  assert.equal(bodyStyle.position, '');
  assert.equal(bodyStyle.top, '');
  assert.equal(savedScrollY, 0);
  assert.deepEqual(scrolls, [[0, 0]]);
});

test('body scroll: later route cleanup cannot restore previous route scroll', () => {
  const bodyStyle = createBodyStyle();
  const scrolls: Array<[number, number]> = [];
  let savedScrollY = 880;

  lockBodyScroll({
    currentScrollY: savedScrollY,
    bodyStyle,
  });

  // Navigation clears saved position before any cleanup.
  unlockBodyScroll({
    restorePosition: false,
    savedScrollY,
    bodyStyle,
    scrollTo: (x, y) => scrolls.push([x, y]),
  });
  savedScrollY = 0;
  scrolls.push([0, 0]);

  // Route-change cleanup
  unlockBodyScroll({
    restorePosition: false,
    savedScrollY,
    bodyStyle,
    scrollTo: (x, y) => scrolls.push([x, y]),
  });

  // A mistaken same-route cleanup after navigation still cannot restore 880.
  unlockBodyScroll({
    restorePosition: true,
    savedScrollY,
    bodyStyle,
    scrollTo: (x, y) => scrolls.push([x, y]),
  });

  assert.ok(!scrolls.some(([, y]) => y === 880));
  assert.deepEqual(scrolls.at(-1), [0, 0]);
});

test('body scroll: LiveChat splits clearBodyScrollStyles and unlockBodyScroll options', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /clearBodyScrollStyles/);
  assert.match(liveChat, /unlockBodyScroll\(\{ restorePosition: true \}\)/);
  assert.match(liveChat, /unlockBodyScroll\(\{ restorePosition: false \}\)/);
  assert.match(liveChat, /scrollYRef\.current = 0/);
  assert.match(liveChat, /navigateFromChat/);
});

test('clearBodyScrollStyles clears fixed body styles without scrolling', () => {
  const bodyStyle = createBodyStyle();
  clearBodyScrollStyles(bodyStyle);
  assert.deepEqual(bodyStyle, {
    position: '',
    top: '',
    left: '',
    right: '',
    width: '',
  });
});

// --- Pure poll reconcile ---

test('poll reconcile: first new admin reply on known closed conversation creates unread and notice', () => {
  const previous = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '2', sender: 'bot', text: 'Ack' }),
  ];
  const remote = [
    ...previous,
    msg({ id: '3', sender: 'admin', text: 'Human reply' }),
  ];

  const result = reconcileVisitorPollState({
    previousMessages: previous,
    remoteMessages: remote,
    previousAdminId: null,
    hasKnownSessionHistory: true,
    chatIsOpen: false,
    noticeAlreadyShown: false,
  }, {
    createNoticeId: () => 'system-1',
    now: () => new Date('2026-07-24T12:00:00.000Z'),
  });

  assert.equal(result.unreadDelta, 1);
  assert.equal(result.latestAdminId, '3');
  assert.equal(result.humanJoinedNoticeShown, true);
  assert.equal(
    result.messages.filter((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE).length,
    1,
  );
});

test('poll reconcile: identical remote history again does not duplicate notice or unread', () => {
  const notice = msg({
    id: 'system-1',
    sender: 'system',
    text: VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  });
  const remote = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '3', sender: 'admin', text: 'Human reply' }),
  ];
  const previous = [...remote, notice];

  const result = reconcileVisitorPollState({
    previousMessages: previous,
    remoteMessages: remote,
    previousAdminId: '3',
    hasKnownSessionHistory: true,
    chatIsOpen: false,
    noticeAlreadyShown: true,
  });

  assert.equal(result.unreadDelta, 0);
  assert.equal(result.latestAdminId, '3');
  assert.equal(result.humanJoinedNoticeShown, true);
  assert.equal(
    result.messages.filter((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE).length,
    1,
  );
});

test('poll reconcile: historical admin baseline does not create unread', () => {
  const remote = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '9', sender: 'admin', text: 'Earlier human reply' }),
  ];

  const result = reconcileVisitorPollState({
    previousMessages: [],
    remoteMessages: remote,
    previousAdminId: null,
    hasKnownSessionHistory: false,
    chatIsOpen: true,
    noticeAlreadyShown: false,
  }, {
    createNoticeId: () => 'system-baseline',
  });

  assert.equal(result.unreadDelta, 0);
  assert.equal(result.latestAdminId, '9');
  assert.equal(result.humanJoinedNoticeShown, true);
  assert.ok(result.messages.some((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE));
});

test('poll reconcile: new admin reply while chat open updates id without unread', () => {
  const previous = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
  ];
  const remote = [
    ...previous,
    msg({ id: '4', sender: 'admin', text: 'Live reply' }),
  ];

  const result = reconcileVisitorPollState({
    previousMessages: previous,
    remoteMessages: remote,
    previousAdminId: null,
    hasKnownSessionHistory: true,
    chatIsOpen: true,
    noticeAlreadyShown: false,
  }, {
    createNoticeId: () => 'system-open',
  });

  assert.equal(result.unreadDelta, 0);
  assert.equal(result.latestAdminId, '4');
  assert.equal(result.humanJoinedNoticeShown, true);
  assert.equal(
    result.messages.filter((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE).length,
    1,
  );
});

test('poll reconcile: later newer admin reply while closed creates unread', () => {
  const notice = msg({
    id: 'system-1',
    sender: 'system',
    text: VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  });
  const previous = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '3', sender: 'admin', text: 'First human' }),
    notice,
  ];
  const remote = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '3', sender: 'admin', text: 'First human' }),
    msg({ id: '5', sender: 'admin', text: 'Second human' }),
  ];

  const result = reconcileVisitorPollState({
    previousMessages: previous,
    remoteMessages: remote,
    previousAdminId: '3',
    hasKnownSessionHistory: true,
    chatIsOpen: false,
    noticeAlreadyShown: true,
  });

  assert.equal(result.unreadDelta, 1);
  assert.equal(result.latestAdminId, '5');
  assert.equal(
    result.messages.filter((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE).length,
    1,
  );
});

test('poll reconcile: system notices survive remote-history reconciliation', () => {
  const notice = msg({
    id: 'system-keep',
    sender: 'system',
    text: VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  });
  const previous = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '3', sender: 'admin', text: 'Human' }),
    notice,
  ];
  const remote = [
    msg({ id: '1', sender: 'user', text: 'Hello' }),
    msg({ id: '3', sender: 'admin', text: 'Human' }),
  ];

  const result = reconcileVisitorPollState({
    previousMessages: previous,
    remoteMessages: remote,
    previousAdminId: '3',
    hasKnownSessionHistory: true,
    chatIsOpen: false,
    noticeAlreadyShown: true,
  });

  assert.ok(result.messages.some((m) => m.id === 'system-keep'));
  assert.equal(
    result.messages.filter((m) => m.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE).length,
    1,
  );
  assert.equal(result.unreadDelta, 0);
});

test('poll reconcile: LiveChat consumes reconcileVisitorPollState', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /reconcileVisitorPollState/);
  assert.match(liveChat, /from '\.\.\/lib\/chat\/visitorChatPollReconcile'/);
  assert.doesNotMatch(liveChat, /lastSeenAdminIdRef\.current != null \|\| hasKnownSessionHistory/);
});
