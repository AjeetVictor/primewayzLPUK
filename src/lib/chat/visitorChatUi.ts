/**
 * Shared visitor chat UI copy and status helpers (Phase 2F-1).
 */

import type { ChatAvailabilityStatus } from './visitorChatTypes.ts';
import {
  VISITOR_CHAT_ASSISTANT_NAME,
  VISITOR_CHAT_HEADER_SUBTITLE,
  VISITOR_CHAT_NEUTRAL_NAME,
  VISITOR_CHAT_TEAM_NAME,
} from './visitorChatIdentity.ts';

export type VisitorMessageDeliveryStatus = 'sending' | 'sent' | 'failed';

export type VisitorAttachmentUploadStatus =
  | 'uploading'
  | 'uploaded'
  | 'failed';

export const VISITOR_MESSAGE_STATUS_LABELS: Record<
  VisitorMessageDeliveryStatus,
  string
> = {
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Could not send',
};

export const VISITOR_ATTACHMENT_STATUS_LABELS: Record<
  VisitorAttachmentUploadStatus,
  string
> = {
  uploading: 'Uploading…',
  uploaded: 'Uploaded',
  failed: 'Upload failed',
};

export const VISITOR_CHAT_OFFLINE_TITLE = 'The Primewayz team is currently away.';
export const VISITOR_CHAT_OFFLINE_BODY =
  'You can leave your requirement here, continue with a Digital Systems Review, or book a discovery call.';

export const VISITOR_CHAT_MESSAGE_SAVED =
  'Your message has been saved. You may close this window.';

export const VISITOR_CHAT_LAUNCHER_NAME = 'Open Primewayz chat';
export const VISITOR_CHAT_REGION_NAME = 'Primewayz chat';

export type VisitorHeaderStatus =
  | 'team_available'
  | 'team_away'
  | 'human_response_received'
  | 'waiting_for_team';

export const VISITOR_HEADER_STATUS_LABELS: Record<VisitorHeaderStatus, string> = {
  team_available: 'Team available',
  team_away: 'Team currently away',
  human_response_received: 'Human response received',
  waiting_for_team: 'Waiting for the Primewayz team',
};

export function resolveVisitorHeaderStatus(params: {
  availabilityStatus: ChatAvailabilityStatus;
  hasAdminReply: boolean;
  waitingForTeam: boolean;
}): VisitorHeaderStatus {
  if (params.hasAdminReply) return 'human_response_received';
  if (params.waitingForTeam) return 'waiting_for_team';
  if (params.availabilityStatus === 'online') return 'team_available';
  return 'team_away';
}

export function getVisitorChatHeaderTitle(
  latestResponder: 'bot' | 'admin' | null,
): string {
  if (latestResponder === 'admin') return VISITOR_CHAT_TEAM_NAME;
  if (latestResponder === 'bot') return VISITOR_CHAT_ASSISTANT_NAME;
  return VISITOR_CHAT_NEUTRAL_NAME;
}

export function getVisitorChatHeaderSubtitle(): string {
  return VISITOR_CHAT_HEADER_SUBTITLE;
}

/** Truthful offline alternatives — no invented reply-time promises. */
export const VISITOR_CHAT_OFFLINE_ACTIONS = [
  'review',
  'leave_message',
  'booking',
] as const;

export function containsUnconfiguredReplyTimePromise(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\b(immediate|instantly|same[- ]day|within\s+\d+\s*(minute|min|hour|hr)s?|24\/7|twenty[- ]four)\b/.test(
      lower,
    )
  );
}
