/**
 * Safe retry reconciliation for failed visitor chat sends.
 *
 * Residual limitation (Phase 2F-1): without a server-side idempotency key,
 * reconciliation relies on text, attachment IDs, sender and a timestamp window.
 * Ambiguous duplicates within that window may still require manual review.
 */

import type { VisitorChatMessage } from './visitorChatTypes.ts';

/** Window for matching a failed local send to a persisted user message. */
export const MESSAGE_RECONCILE_WINDOW_MS = 5 * 60 * 1000;

function sortedAttachmentIds(message: VisitorChatMessage): number[] {
  return [...(message.attachments?.map((item) => item.id) ?? [])].sort((a, b) => a - b);
}

function payloadAttachmentIds(message: VisitorChatMessage): number[] {
  return [...(message.retryPayload?.attachmentIds ?? [])].sort((a, b) => a - b);
}

function attachmentIdsMatch(message: VisitorChatMessage, expectedIds: number[]): boolean {
  const fromMessage = sortedAttachmentIds(message);
  const ids = fromMessage.length > 0 ? fromMessage : payloadAttachmentIds(message);
  if (ids.length !== expectedIds.length) return false;
  return ids.every((id, index) => id === expectedIds[index]);
}

export function findPersistedUserMessageMatch(
  failedMessage: VisitorChatMessage,
  history: readonly VisitorChatMessage[],
): VisitorChatMessage | null {
  const payload = failedMessage.retryPayload;
  if (!payload) return null;

  const expectedText = payload.text;
  const expectedAttachmentIds = [...payload.attachmentIds].sort((a, b) => a - b);
  const failedTime = failedMessage.timestamp.getTime();

  for (const candidate of history) {
    if (candidate.sender !== 'user' || candidate.deletedAt) continue;
    const candidateTime = candidate.timestamp.getTime();
    if (Math.abs(candidateTime - failedTime) > MESSAGE_RECONCILE_WINDOW_MS) continue;
    if (candidate.text !== expectedText) continue;
    if (!attachmentIdsMatch(candidate, expectedAttachmentIds)) continue;
    return candidate;
  }

  return null;
}

/** Bot/admin reply immediately following a persisted user message in history order. */
export function findAutomatedReplyAfterUserMessage(
  history: readonly VisitorChatMessage[],
  userMessageId: string,
): VisitorChatMessage | null {
  const index = history.findIndex((msg) => msg.id === userMessageId);
  if (index < 0) return null;

  for (let i = index + 1; i < history.length; i += 1) {
    const next = history[i]!;
    if (next.sender === 'user' || next.sender === 'system' || next.deletedAt) continue;
    if (next.sender === 'bot' || next.sender === 'admin') return next;
  }

  return null;
}
