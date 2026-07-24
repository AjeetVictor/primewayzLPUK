/**
 * Shared visitor chat transport types (client-side).
 * Sender values stay compatible with existing API contracts.
 */

export type ChatAvailabilityStatus = 'online' | 'away' | 'offline' | 'assistant';

export type ChatAvailability = {
  status: ChatAvailabilityStatus;
  title: string;
  subtitle: string;
  responseExpectation: string;
  businessHours: string;
  canAcceptMessages: boolean;
  canBookCall: boolean;
  serverTime: string;
};

export const DEFAULT_CHAT_AVAILABILITY: ChatAvailability = {
  status: 'assistant',
  title: 'Primewayz Assistant',
  subtitle: 'Automated guidance and team follow-up',
  responseExpectation: 'The Primewayz team replies during UK business hours.',
  businessHours: 'Mon-Fri, UK business hours',
  canAcceptMessages: true,
  canBookCall: true,
  serverTime: '',
};

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
