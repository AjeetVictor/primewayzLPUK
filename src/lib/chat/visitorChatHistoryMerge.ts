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

const VISITOR_CHAT_SENDERS = new Set<VisitorChatMessage['sender']>(['user', 'bot', 'admin', 'system']);

/** Maps an untrusted GET /api/chat/:sessionId row to a client message (text stays plain text). */
export function mapVisitorChatHistoryMessage(row: unknown): VisitorChatMessage | null {
  if (!row || typeof row !== 'object') return null;
  const m = row as Record<string, unknown>;
  if (m.id == null) return null;
  const sender = VISITOR_CHAT_SENDERS.has(m.sender as VisitorChatMessage['sender'])
    ? (m.sender as VisitorChatMessage['sender'])
    : 'bot';
  const timestamp = new Date(String(m.timestamp ?? ''));
  return {
    id: String(m.id),
    text: typeof m.text === 'string' ? m.text : '',
    sender,
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    editedAt: typeof m.editedAt === 'string' ? m.editedAt : null,
    deletedAt: typeof m.deletedAt === 'string' ? m.deletedAt : null,
    attachments: Array.isArray(m.attachments) ? (m.attachments as VisitorChatMessage['attachments']) : [],
    deliveryStatus: 'sent',
  };
}

/**
 * Poll results replace local state only when the server history differs from
 * what is rendered. An empty remote history never clears local messages.
 */
export function shouldApplyVisitorPollHistory(params: {
  remote: readonly VisitorChatMessage[];
  local: readonly VisitorChatMessage[];
  lastSeenAdminId: string | null;
}): boolean {
  if (params.remote.length === 0) return false;
  const latestRemote = [...params.remote].reverse().find((msg) => msg.sender !== 'system');
  const latestLocal = [...params.local]
    .reverse()
    .find(
      (msg) =>
        msg.sender !== 'system'
        && !String(msg.id).startsWith('local-')
        && msg.deliveryStatus !== 'failed',
    );
  const latestAdminId = findLatestAdminMessage(params.remote)?.id ?? null;
  return (
    countComparableMessages(params.remote) !== countComparableMessages(params.local)
    || latestRemote?.id !== latestLocal?.id
    || latestAdminId !== params.lastSeenAdminId
  );
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
