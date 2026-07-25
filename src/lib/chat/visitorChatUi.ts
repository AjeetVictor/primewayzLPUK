/**
 * Shared visitor chat UI copy and status helpers (Phase 2F-1 / 2F-1.1).
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
  | 'team_online'
  | 'team_away'
  | 'automated_guidance'
  | 'human_response_received'
  | 'waiting_for_team'
  | 'unavailable';

export const VISITOR_HEADER_STATUS_LABELS: Record<VisitorHeaderStatus, string> = {
  team_online: 'Team online',
  team_away: 'Team currently away',
  automated_guidance: 'Automated guidance available',
  human_response_received: 'Human response received',
  waiting_for_team: 'Waiting for the Primewayz team',
  unavailable: 'Chat temporarily unavailable',
};

export type VisitorPresenceTone = 'online' | 'away' | 'automated' | 'unavailable';

export const VISITOR_PRESENCE_STATUS_LABELS: Record<VisitorPresenceTone, string> = {
  online: 'Team online',
  away: 'Team away',
  automated: 'Automated guidance available',
  unavailable: 'Chat temporarily unavailable',
};

/**
 * Presence colours must not use `emerald-*`: this project's theme remaps
 * emerald to brand blue, which made "Team online" appear blue on device.
 */
export const VISITOR_PRESENCE_DOT_CLASS: Record<VisitorPresenceTone, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  automated: 'bg-slate-400',
  unavailable: 'bg-red-500',
};

export const VISITOR_HEADER_STATUS_DOT_CLASS: Record<VisitorHeaderStatus, string> = {
  team_online: 'bg-green-500',
  team_away: 'bg-amber-500',
  automated_guidance: 'bg-slate-400',
  human_response_received: 'bg-green-500',
  waiting_for_team: 'bg-amber-500',
  unavailable: 'bg-red-500',
};

/**
 * Launcher presence comes from availability / service health.
 * A recent human reply must not permanently force online.
 */
export function resolveVisitorPresenceTone(params: {
  availabilityStatus: ChatAvailabilityStatus;
  serviceAvailable: boolean;
}): VisitorPresenceTone {
  if (!params.serviceAvailable) return 'unavailable';
  if (params.availabilityStatus === 'online') return 'online';
  if (params.availabilityStatus === 'away') return 'away';
  if (params.availabilityStatus === 'assistant') return 'automated';
  // offline / unknown → away (amber), not error-red
  return 'away';
}

export function resolveVisitorHeaderStatus(params: {
  availabilityStatus: ChatAvailabilityStatus;
  hasAdminReply: boolean;
  waitingForTeam: boolean;
  serviceAvailable?: boolean;
}): VisitorHeaderStatus {
  if (params.serviceAvailable === false) return 'unavailable';
  // Temporary human-response state — does not change launcher presence.
  if (params.hasAdminReply) return 'human_response_received';
  if (params.waitingForTeam) return 'waiting_for_team';
  if (params.availabilityStatus === 'online') return 'team_online';
  if (params.availabilityStatus === 'assistant') return 'automated_guidance';
  return 'team_away';
}

export function formatVisitorUnreadBadge(unreadCount: number): string | null {
  if (unreadCount <= 0) return null;
  if (unreadCount > 9) return '9+';
  return String(unreadCount);
}

export function buildVisitorLauncherAriaLabel(params: {
  presence: VisitorPresenceTone;
  unreadCount: number;
}): string {
  const status = VISITOR_PRESENCE_STATUS_LABELS[params.presence];
  const base = `${VISITOR_CHAT_LAUNCHER_NAME}. ${status}.`;
  if (params.unreadCount <= 0) return base;
  if (params.unreadCount === 1) return `${base} 1 unread reply.`;
  return `${base} ${params.unreadCount} unread replies.`;
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
