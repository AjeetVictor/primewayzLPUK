/**
 * Human-attention visibility for the admin inbox.
 *
 * A canned bot acknowledgement stores status `bot_replied` even when the visitor
 * message stays unanswered. Escalation is therefore read from that persisted
 * message state. Closed and spam conversations stay out of the queue. This module
 * does not create alerts: ChatAlert remains the single notification record.
 */

export const HUMAN_ATTENTION_EXCLUDED_STATUSES = ['closed', 'spam'] as const;

export type AttentionMessage = {
  sender?: string | null;
  answered?: boolean | null;
  isInternalNote?: boolean | null;
  deletedAt?: string | Date | null;
};

export function visitorMessageNeedsHumanReply(message: AttentionMessage): boolean {
  return message.sender === 'user'
    && message.answered === false
    && !message.isInternalNote
    && !message.deletedAt;
}

export function conversationRequiresHumanAttention(input: {
  status?: string | null;
  unansweredVisitorMessageCount?: number;
  needsAttention?: boolean;
  messages?: readonly AttentionMessage[];
}): boolean {
  if (input.status && (HUMAN_ATTENTION_EXCLUDED_STATUSES as readonly string[]).includes(input.status)) {
    return false;
  }
  if ((input.unansweredVisitorMessageCount ?? 0) > 0) return true;
  if (input.messages?.some(visitorMessageNeedsHumanReply)) return true;
  if (input.status === 'admin_needed') return true;
  return input.needsAttention === true;
}

export function matchesAdminChatStatusFilter(
  filter: string,
  input: {
    status?: string | null;
    unreadCount?: number;
    unansweredVisitorMessageCount?: number;
    needsAttention?: boolean;
    messages?: readonly AttentionMessage[];
  },
): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return (input.unreadCount ?? 0) > 0;
  if (filter === 'admin_needed') return conversationRequiresHumanAttention(input);
  return (input.status || 'new') === filter;
}

export function annotateAdminSessionsWithAttention<T>(
  sessions: readonly T[],
  counts: ReadonlyArray<{ sessionId: string; count: number }>,
): Array<T & { needsAttention: boolean }> {
  const bySession = new Map(counts.map((row) => [row.sessionId, row.count]));
  return sessions.map((session) => {
    const row = session as { id?: unknown; status?: unknown };
    const id = typeof row.id === 'string' ? row.id : '';
    const status = typeof row.status === 'string' ? row.status : null;
    return {
      ...session,
      needsAttention: conversationRequiresHumanAttention({
        status,
        unansweredVisitorMessageCount: bySession.get(id) ?? 0,
      }),
    };
  });
}
