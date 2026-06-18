export const CONVERSATION_STATUSES = [
  'new',
  'bot_replied',
  'admin_needed',
  'admin_replied',
  'lead_qualified',
  'follow_up_due',
  'booked_call',
  'closed',
  'spam',
] as const;

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const TERMINAL_CONVERSATION_STATUSES: ConversationStatus[] = ['closed', 'spam'];

export const CHAT_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'unread', label: 'Unread' },
  { key: 'admin_needed', label: 'Admin needed' },
  { key: 'admin_replied', label: 'Admin replied' },
  { key: 'lead_qualified', label: 'Lead qualified' },
  { key: 'closed', label: 'Closed' },
] as const;

export type ChatStatusFilterKey = (typeof CHAT_STATUS_FILTERS)[number]['key'];

export const QUICK_REPLY_TEMPLATES = [
  'Thanks for reaching out! A member of our UK team will respond shortly.',
  'Could you share a bit more about your project timeline and goals?',
  'We would love to book a discovery call. Would any of these times work for you?',
  'We have received your details and will follow up within one UK business day.',
  'Our monthly subscription plans start with a Foundation Sprint. Would you like an overview?',
] as const;

export interface ChatReplyPreview {
  id: number;
  text: string;
  sender: string;
  deletedAt?: string | null;
}

export interface ChatMessageRecord {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: string;
  answered?: boolean;
  replyToId?: number | null;
  replyTo?: ChatReplyPreview | null;
  isInternalNote?: boolean;
  deletedAt?: string | null;
  deletedBy?: number | null;
  editedAt?: string | null;
  attachments?: Array<{
    id: number;
    url: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    kind: 'image' | 'document';
  }>;
  session?: {
    name: string | null;
    email: string | null;
  };
}

export interface ChatSessionRecord {
  id: string;
  name: string | null;
  email: string | null;
  visitorLastSeenAt?: string | null;
  status?: ConversationStatus | string;
  firstLandingPage?: string | null;
  currentPageUrl?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  serviceInterest?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  messages: { text: string; timestamp: string }[];
}

export function formatConversationStatus(status?: string): string {
  if (!status) return 'new';
  return status.replace(/_/g, ' ');
}

export function getStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'admin_replied':
    case 'lead_qualified':
      return 'bg-emerald-100 text-emerald-700';
    case 'bot_replied':
      return 'bg-blue-100 text-blue-700';
    case 'admin_needed':
    case 'follow_up_due':
      return 'bg-amber-100 text-amber-700';
    case 'booked_call':
      return 'bg-indigo-100 text-indigo-700';
    case 'closed':
      return 'bg-zinc-200 text-zinc-600';
    case 'spam':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-zinc-100 text-zinc-600';
  }
}

export function getMessageDisplayText(message: Pick<ChatMessageRecord, 'text' | 'deletedAt'>): string {
  if (message.deletedAt) return 'Message deleted';
  return message.text;
}

export function getReplyPreviewText(replyTo?: ChatReplyPreview | null): string {
  if (!replyTo) return '';
  if (replyTo.deletedAt) return 'Message deleted';
  const trimmed = replyTo.text.trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}...`;
}
