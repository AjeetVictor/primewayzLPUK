/**
 * Operational chat semantics shared by read-only operational consumers
 * (the WordPress integration API) so business rules are defined once, server-side.
 *
 * Workflow facts this module relies on (server.ts):
 * - A visitor message is stored as sender 'user' with answered = false. The visitor
 *   route then sets status admin_needed, stores a canned (non-LLM) bot reply and sets
 *   status bot_replied. Non-terminal statuses are overwritten on every visitor message.
 * - Only a non-internal Admin reply marks the session's visitor messages answered and
 *   sets status admin_replied. Internal notes change neither.
 * - closed / spam are terminal and never overwritten automatically.
 */

import { createHash } from 'node:crypto';
import { getMessageDisplayText } from '../chatTypes.ts';

export type ChatActor = 'visitor' | 'assistant' | 'team';

const SENDER_TO_ACTOR: Readonly<Record<string, ChatActor>> = {
  user: 'visitor',
  bot: 'assistant',
  admin: 'team',
};

/** Maps stored ChatMessage.sender to the canonical actor. Unknown senders return null. */
export function toChatActor(sender: string | null | undefined): ChatActor | null {
  return (sender && SENDER_TO_ACTOR[sender]) || null;
}

export const ATTENTION_EXCLUDED_STATUSES = ['closed', 'spam'] as const;

/**
 * A visitor message still awaiting a team response: visitor-sent, not answered by a
 * non-internal Admin reply, not an internal note, not deleted. Used verbatim as a
 * Prisma ChatMessage where-fragment so per-row flags and the attention count share it.
 */
export const UNANSWERED_VISITOR_MESSAGE_WHERE = {
  sender: 'user',
  answered: false,
  isInternalNote: false,
  deletedAt: null,
} as const;

/**
 * A conversation needs attention when it is not closed / spam and has at least one
 * visitor message no team member has replied to since (UNANSWERED_VISITOR_MESSAGE_WHERE).
 * A canned assistant acknowledgement does not count as a response.
 */
export function conversationNeedsAttention(input: {
  status: string | null | undefined;
  unansweredVisitorMessageCount: number;
}): boolean {
  if (input.status && (ATTENTION_EXCLUDED_STATUSES as readonly string[]).includes(input.status)) return false;
  return input.unansweredVisitorMessageCount > 0;
}

export type OperationalConversationStatus =
  | 'waiting_for_team'
  | 'team_replied'
  | 'assistant_replied'
  | 'open'
  | 'closed';

/**
 * waiting_for_team  needsAttention is true
 * closed            stored status closed or spam
 * team_replied      latest visible message is from the team
 * assistant_replied latest visible message is the assistant and nothing is waiting
 * open              anything else (no messages yet, or visitor message already answered)
 */
export function toOperationalConversationStatus(input: {
  status: string | null | undefined;
  needsAttention: boolean;
  lastActor: ChatActor | null;
}): OperationalConversationStatus {
  if (input.status === 'closed' || input.status === 'spam') return 'closed';
  if (input.needsAttention) return 'waiting_for_team';
  if (input.lastActor === 'team') return 'team_replied';
  if (input.lastActor === 'assistant') return 'assistant_replied';
  return 'open';
}

export const MESSAGE_PREVIEW_MAX_LENGTH = 200;

/** Plain-text, single-line, bounded preview. Deleted messages become a placeholder. */
export function toPlainTextPreview(
  message: { text: string | null | undefined; deletedAt?: Date | string | null },
  maxLength: number = MESSAGE_PREVIEW_MAX_LENGTH,
): string {
  const display = getMessageDisplayText({ text: message.text ?? '', deletedAt: message.deletedAt ? String(message.deletedAt) : null });
  const plain = display
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 3).trimEnd()}...`;
}

const VISITOR_NAME_MAX_LENGTH = 80;

/** Short non-reversible reference so operators can tell anonymous visitors apart. */
export function toVisitorReference(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex').slice(0, 6).toUpperCase();
}

/** Visitor name when present; never an email address. Otherwise "Visitor • ABC123". */
export function toVisitorLabel(input: { name: string | null | undefined; sessionId: string }): string {
  const name = (input.name ?? '').replace(/\s+/g, ' ').trim();
  if (name && !name.includes('@')) return name.slice(0, VISITOR_NAME_MAX_LENGTH);
  return `Visitor • ${toVisitorReference(input.sessionId)}`;
}

const ORIGINATING_PAGE_MAX_LENGTH = 191;

/** Path only: query strings and fragments (UTM values, tokens) are dropped. */
export function toOriginatingPagePath(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  let pathname: string;
  try {
    pathname = new URL(raw, 'https://placeholder.invalid').pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0] ?? '';
  }
  return pathname ? pathname.slice(0, ORIGINATING_PAGE_MAX_LENGTH) : null;
}
