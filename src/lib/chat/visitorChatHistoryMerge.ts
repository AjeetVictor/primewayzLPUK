/**
 * History merge helpers for visitor chat polling and retry reconciliation.
 */

import type { VisitorChatMessage } from './visitorChatTypes.ts';

export function countComparableMessages(messages: readonly VisitorChatMessage[]): number {
  return messages.filter(
    (msg) =>
      msg.sender !== 'system'
      && msg.deliveryStatus !== 'failed'
      && !String(msg.id).startsWith('local-pending'),
  ).length;
}

export function mergeRemoteHistoryWithLocalState(
  previous: readonly VisitorChatMessage[],
  remote: readonly VisitorChatMessage[],
): VisitorChatMessage[] {
  const pendingLocal = previous.filter(
    (msg) => msg.deliveryStatus === 'sending' || msg.deliveryStatus === 'failed',
  );
  const clientSystemNotices = previous.filter((msg) => msg.sender === 'system');
  const remoteIds = new Set(remote.map((msg) => msg.id));

  const keepPending = pendingLocal.filter((msg) => !remoteIds.has(msg.id));
  const keepSystem = clientSystemNotices.filter(
    (msg) => !remote.some((remoteMsg) => remoteMsg.id === msg.id),
  );

  return [...remote, ...keepSystem, ...keepPending];
}

export function resolveLatestResponderSender(
  messages: readonly VisitorChatMessage[],
): 'bot' | 'admin' | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]!;
    if (msg.deletedAt) continue;
    if (msg.sender === 'admin') return 'admin';
    if (msg.sender === 'bot') return 'bot';
  }
  return null;
}

export function findLatestAdminMessage(
  messages: readonly VisitorChatMessage[],
): VisitorChatMessage | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]!;
    if (msg.sender === 'admin' && !msg.deletedAt) return msg;
  }
  return null;
}
