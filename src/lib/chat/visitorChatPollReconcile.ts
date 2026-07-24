/**
 * Pure visitor-chat polling transition: merge remote history, unread delta,
 * and the one-time human-joined notice.
 */

import { VISITOR_CHAT_HUMAN_JOINED_NOTICE } from './visitorChatIdentity.ts';
import {
  findLatestAdminMessage,
  mergeRemoteHistoryWithLocalState,
} from './visitorChatHistoryMerge.ts';
import type { VisitorChatMessage } from './visitorChatTypes.ts';

export type ReconcileVisitorPollStateParams = {
  previousMessages: VisitorChatMessage[];
  remoteMessages: VisitorChatMessage[];
  previousAdminId: string | null;
  hasKnownSessionHistory: boolean;
  chatIsOpen: boolean;
  noticeAlreadyShown: boolean;
};

export type ReconcileVisitorPollStateResult = {
  messages: VisitorChatMessage[];
  latestAdminId: string | null;
  unreadDelta: number;
  humanJoinedNoticeShown: boolean;
};

export type ReconcileVisitorPollStateOptions = {
  createNoticeId?: () => string;
  now?: () => Date;
};

function hasHumanJoinedNotice(messages: readonly VisitorChatMessage[]): boolean {
  return messages.some(
    (msg) =>
      msg.sender === 'system' && msg.text === VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  );
}

export function reconcileVisitorPollState(
  params: ReconcileVisitorPollStateParams,
  options: ReconcileVisitorPollStateOptions = {},
): ReconcileVisitorPollStateResult {
  const createNoticeId =
    options.createNoticeId
    ?? (() => `system-human-joined-${Date.now()}`);
  const now = options.now ?? (() => new Date());

  let messages = mergeRemoteHistoryWithLocalState(
    params.previousMessages,
    params.remoteMessages,
  );

  const latestAdmin = findLatestAdminMessage(params.remoteMessages);
  let latestAdminId = params.previousAdminId;
  let unreadDelta = 0;
  let humanJoinedNoticeShown = params.noticeAlreadyShown;

  if (!latestAdmin) {
    return {
      messages,
      latestAdminId,
      unreadDelta,
      humanJoinedNoticeShown,
    };
  }

  const adminIsNew = params.previousAdminId !== latestAdmin.id;
  latestAdminId = latestAdmin.id;

  if (!hasHumanJoinedNotice(messages)) {
    messages = [
      ...messages,
      {
        id: createNoticeId(),
        text: VISITOR_CHAT_HUMAN_JOINED_NOTICE,
        sender: 'system',
        timestamp: now(),
      },
    ];
  }
  humanJoinedNoticeShown = true;

  if (adminIsNew && !params.chatIsOpen) {
    // First genuinely new admin reply on a known closed conversation, or a
    // later newer admin reply after a prior baseline. Historical baseline load
    // passes hasKnownSessionHistory=false and previousAdminId=null → delta 0.
    if (params.previousAdminId != null || params.hasKnownSessionHistory) {
      unreadDelta = 1;
    }
  }

  return {
    messages,
    latestAdminId,
    unreadDelta,
    humanJoinedNoticeShown,
  };
}

/**
 * Stateful poll consumer used by LiveChat and executable unread-path tests.
 * Mirrors the production merge: unread accumulates only from unreadDelta.
 */
export type VisitorPollConsumerState = {
  messages: VisitorChatMessage[];
  lastSeenAdminId: string | null;
  hasKnownSessionHistory: boolean;
  humanJoinedNoticeShown: boolean;
  unreadCount: number;
  chatIsOpen: boolean;
};

export function applyVisitorChatPollRound(
  state: VisitorPollConsumerState,
  remoteMessages: VisitorChatMessage[],
  options: ReconcileVisitorPollStateOptions = {},
): VisitorPollConsumerState {
  const result = reconcileVisitorPollState(
    {
      previousMessages: state.messages,
      remoteMessages,
      previousAdminId: state.lastSeenAdminId,
      hasKnownSessionHistory: state.hasKnownSessionHistory,
      chatIsOpen: state.chatIsOpen,
      noticeAlreadyShown: state.humanJoinedNoticeShown,
    },
    options,
  );

  return {
    messages: result.messages,
    lastSeenAdminId: result.latestAdminId,
    hasKnownSessionHistory:
      state.hasKnownSessionHistory || remoteMessages.length > 0,
    humanJoinedNoticeShown: result.humanJoinedNoticeShown,
    unreadCount: state.unreadCount + result.unreadDelta,
    chatIsOpen: state.chatIsOpen,
  };
}

/** Baseline history load: establish admin id without creating unread. */
export function applyVisitorChatHistoryBaseline(
  remoteMessages: VisitorChatMessage[],
  options: ReconcileVisitorPollStateOptions = {},
): VisitorPollConsumerState {
  const result = reconcileVisitorPollState(
    {
      previousMessages: [],
      remoteMessages,
      previousAdminId: null,
      hasKnownSessionHistory: false,
      chatIsOpen: true,
      noticeAlreadyShown: false,
    },
    options,
  );

  return {
    messages: result.messages,
    lastSeenAdminId: result.latestAdminId,
    hasKnownSessionHistory: remoteMessages.length > 0,
    humanJoinedNoticeShown: result.humanJoinedNoticeShown,
    unreadCount: 0,
    chatIsOpen: false,
  };
}

/**
 * Open-transition: clear unread and mark open without touching lastSeenAdminId.
 * Opening must never regress the seen-admin baseline from stale rendered messages.
 */
export function applyVisitorChatOpenTransition(
  state: VisitorPollConsumerState,
): VisitorPollConsumerState {
  return {
    ...state,
    chatIsOpen: true,
    unreadCount: 0,
  };
}

/** Browser validation force-poll hook is localhost-only. */
export function isVisitorChatLocalValidationHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
