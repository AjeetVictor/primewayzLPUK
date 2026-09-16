/**
 * Shared visitor chat transport types (client-side).
 * Sender values stay compatible with existing API contracts.
 */

export type ChatAvailabilityStatus = 'online' | 'away' | 'offline' | 'assistant';

export type ChatAvailabilityScheduling = {
  enabled: boolean;
  provider: string | null;
  eventTypeKey: string | null;
  publicBookingUrl: string | null;
};

export type ChatAvailability = {
  status: ChatAvailabilityStatus;
  title: string;
  subtitle: string;
  responseExpectation: string;
  businessHours: string;
  canAcceptMessages: boolean;
  canBookCall: boolean;
  serverTime: string;
  /** Server-resolved tenant — never trust browser-supplied tenantId. */
  tenantId?: string | null;
  scheduling?: ChatAvailabilityScheduling;
};

export const DEFAULT_CHAT_AVAILABILITY: ChatAvailability = {
  status: 'assistant',
  title: 'Primewayz Assistant',
  subtitle: 'Automated guidance and team follow-up',
  responseExpectation: 'The Primewayz team replies during business hours.',
  businessHours: 'Mon-Fri, business hours',
  canAcceptMessages: true,
  /** Fail closed until /api/chat/availability resolves tenant scheduling. */
  canBookCall: false,
  serverTime: '',
  tenantId: null,
  scheduling: {
    enabled: false,
    provider: null,
    eventTypeKey: null,
    publicBookingUrl: null,
  },
};

/** Appointment confirmation uses server-resolved availability.businessHours (never a UK client constant). */
export function buildAppointmentConfirmationMessage(businessHours: string): string {
  const hours = businessHours.trim() || DEFAULT_CHAT_AVAILABILITY.businessHours;
  return `Thanks, your appointment request has been received. Our team will confirm during ${hours}.`;
}

/**
 * Offline / auto bot reply after a visitor message.
 * Team label + business hours must come from resolveTenantChatPresentation (never hardcoded UK).
 */
export function buildOfflineChatBotReply(presentation: {
  teamLabel: string;
  businessHours: string;
}): string {
  const team = presentation.teamLabel.trim() || 'our team';
  const hours = presentation.businessHours.trim() || DEFAULT_CHAT_AVAILABILITY.businessHours;
  const teamPhrase = team.toLowerCase() === 'our team' ? 'our team' : `the ${team}`;
  return `Thanks for your message. We have received it and ${teamPhrase} will follow up shortly during ${hours}.`;
}

export type ChatAttachment = {
  id: number;
  url: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
};

export type PendingChatAttachment = ChatAttachment & {
  uploadStatus: 'uploading' | 'uploaded' | 'failed';
  localKey: string;
  /** Transient client-only; never sent to analytics. */
  displayName: string;
};

export type VisitorChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin' | 'system';
  timestamp: Date;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyToId?: number | null;
  replyTo?: {
    id: number;
    text: string;
    sender: string;
    deletedAt?: string | null;
  } | null;
  attachments?: ChatAttachment[];
  deliveryStatus?: 'sending' | 'sent' | 'failed';
  /** Client-only payload used for safe retry of failed sends. */
  retryPayload?: {
    text: string;
    attachmentIds: number[];
  };
};

export function normalizeChatAvailabilityStatus(
  status?: string,
): ChatAvailabilityStatus {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'assistant') return 'assistant';
  return 'offline';
}

export function isTeamAwayStatus(status: ChatAvailabilityStatus): boolean {
  return status === 'away' || status === 'offline' || status === 'assistant';
}
