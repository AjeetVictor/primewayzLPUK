export const GA_MEASUREMENT_ID =
  import.meta.env?.VITE_GA_MEASUREMENT_ID || 'G-669V6LN0B7';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isGaEnabled(): boolean {
  return Boolean(
    GA_MEASUREMENT_ID &&
      typeof window !== 'undefined' &&
      typeof window.gtag === 'function'
  );
}

export function initGA(): void {
  // GA base script is loaded from index.html.
}

export function trackPageView(path: string): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    service_region: 'UK',
    business_model: 'subscription_software_delivery',
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGaEnabled() || !window.gtag) return;

  window.gtag('event', eventName, {
    service_region: 'UK',
    business_model: 'subscription_software_delivery',
    page_path: window.location.pathname,
    page_title: document.title,
    transport_type: 'beacon',
    ...params,
  });
}

export function trackCtaClick(
  ctaText: string,
  ctaLocation: string,
  extraParams?: Record<string, unknown>
): void {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    ...extraParams,
  });
}

type ChatAnalyticsStatus = 'online' | 'away' | 'offline' | 'assistant' | string;

function normalizeChatAnalyticsStatus(status?: ChatAnalyticsStatus): string {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'offline') return 'offline';
  if (status === 'assistant') return 'assistant';
  return 'unknown';
}

function getMessageLengthBucket(messageLength?: number): 'empty' | 'short' | 'medium' | 'long' {
  const length = Number(messageLength || 0);

  if (length <= 0) return 'empty';
  if (length <= 80) return 'short';
  if (length <= 300) return 'medium';
  return 'long';
}

function getAttachmentSizeBucket(sizeBytes?: number): 'unknown' | 'small' | 'medium' | 'large' {
  const size = Number(sizeBytes || 0);

  if (!size || Number.isNaN(size)) return 'unknown';
  if (size <= 1_000_000) return 'small';
  if (size <= 5_000_000) return 'medium';
  return 'large';
}

export function trackChatOpen(params?: {
  chatStatus?: ChatAnalyticsStatus;
  chatTitle?: string;
  ctaLocation?: string;
}): void {
  trackEvent('chat_open', {
    chat_status: normalizeChatAnalyticsStatus(params?.chatStatus),
    chat_title: params?.chatTitle || 'unknown',
    cta_location: params?.ctaLocation || 'chat_launcher',
  });
}

export function trackChatMessageSent(params?: {
  chatStatus?: ChatAnalyticsStatus;
  messageLength?: number;
  attachmentCount?: number;
  botReplySent?: boolean;
  ctaLocation?: string;
}): void {
  const attachmentCount = Number(params?.attachmentCount || 0);

  trackEvent('chat_message_sent', {
    chat_status: normalizeChatAnalyticsStatus(params?.chatStatus),
    message_length_bucket: getMessageLengthBucket(params?.messageLength),
    has_attachment: attachmentCount > 0,
    attachment_count: attachmentCount,
    bot_reply_sent: Boolean(params?.botReplySent),
    cta_location: params?.ctaLocation || 'live_chat',
    lead_type: 'chat_message',
  });
}

export function trackChatAppointmentRequested(params?: {
  chatStatus?: ChatAnalyticsStatus;
  hasMessage?: boolean;
  ctaLocation?: string;
}): void {
  trackEvent('chat_appointment_requested', {
    chat_status: normalizeChatAnalyticsStatus(params?.chatStatus),
    has_message: Boolean(params?.hasMessage),
    cta_location: params?.ctaLocation || 'chat_appointment_form',
    lead_type: 'appointment_request',
  });
}

export function trackChatAttachmentUploaded(params?: {
  chatStatus?: ChatAnalyticsStatus;
  attachmentKind?: string;
  sizeBytes?: number;
  ctaLocation?: string;
}): void {
  const kind = params?.attachmentKind === 'image' ? 'image' : 'file';

  trackEvent('chat_attachment_uploaded', {
    chat_status: normalizeChatAnalyticsStatus(params?.chatStatus),
    attachment_kind: kind,
    attachment_size_bucket: getAttachmentSizeBucket(params?.sizeBytes),
    cta_location: params?.ctaLocation || 'live_chat_attachment',
  });
}

export function trackAdminChatReply(params?: {
  sessionId?: string;
  hasAttachment?: boolean;
  isInternalNote?: boolean;
  isQuickReply?: boolean;
  conversationStatus?: string;
}): void {
  trackEvent('admin_chat_reply', {
    session_id: params?.sessionId || 'unknown',
    has_attachment: Boolean(params?.hasAttachment),
    is_internal_note: Boolean(params?.isInternalNote),
    is_quick_reply: Boolean(params?.isQuickReply),
    conversation_status: params?.conversationStatus || 'unknown',
    lead_type: 'admin_reply',
  });
}

export function trackChatLeadConverted(params?: {
  sessionId?: string;
  conversionType?: 'lead_qualified' | 'booked_call' | 'closed_won' | string;
  serviceInterest?: string | null;
  sourcePage?: string | null;
}): void {
  trackEvent('chat_lead_converted', {
    session_id: params?.sessionId || 'unknown',
    conversion_type: params?.conversionType || 'lead_qualified',
    service_interest: params?.serviceInterest || 'unknown',
    source_page: params?.sourcePage || 'unknown',
    lead_type: 'chat_conversion',
  });
}

