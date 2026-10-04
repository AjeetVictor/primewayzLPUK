/**
 * Pluggable, non-PII analytics for the embedded chat. Payload keys are an
 * allowlist; the shared prohibited-key guard is applied to every payload.
 */

import {
  assertNoProhibitedVisitorChatAnalyticsProps,
  normalizeVisitorChatAvailabilityState,
  toVisitorChatAnalyticsRoute,
  type VisitorChatAnalyticsSink,
} from '../../lib/chat/visitorChatAnalyticsCore.ts';

export const PW_CHAT_EMBED_ANALYTICS_EVENTS = [
  'chat_open',
  'chat_message_sent',
  'chat_lead_captured',
  'chat_human_handoff_requested',
  'chat_message_send_failed',
  'chat_appointment_requested',
] as const;

export type PwChatEmbedAnalyticsEvent = (typeof PW_CHAT_EMBED_ANALYTICS_EVENTS)[number];

export type PwChatFailureReason =
  | 'invalid_input'
  | 'forbidden'
  | 'rate_limited'
  | 'server_error'
  | 'network_error';

export type PwChatAnalyticsProps = {
  route?: string;
  pageType?: string | null;
  availabilityState?: string;
  intentKey?: string | null;
  failureReason?: PwChatFailureReason;
};

const UUID_LIKE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Rejects values that could carry an email address or a session identifier. */
function isSafeValue(value: string): boolean {
  return value.length <= 120 && !value.includes('@') && !UUID_LIKE.test(value);
}

export function buildPwChatAnalyticsPayload(props: PwChatAnalyticsProps = {}): Record<string, string> {
  const payload: Record<string, string> = { placement: 'chat_widget' };
  const add = (key: string, value: string | null | undefined) => {
    if (value && isSafeValue(value)) payload[key] = value;
  };

  if (props.route) add('route', toVisitorChatAnalyticsRoute(props.route));
  add('page_type', props.pageType);
  add('availability_state', normalizeVisitorChatAvailabilityState(props.availabilityState));
  add('intent_key', props.intentKey);
  add('failure_reason', props.failureReason);

  assertNoProhibitedVisitorChatAnalyticsProps(payload);
  return payload;
}

type AnalyticsWindow = Window & {
  PWSCTrackEvent?: (eventName: string, params?: Record<string, unknown>) => void;
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

/** Uses the first available host transport: Site Controls, then gtag, then dataLayer. */
export function createDefaultPwChatAnalyticsSink(win: Window): VisitorChatAnalyticsSink {
  return (eventName, params) => {
    const host = win as AnalyticsWindow;
    try {
      if (typeof host.PWSCTrackEvent === 'function') {
        host.PWSCTrackEvent(eventName, params);
      } else if (typeof host.gtag === 'function') {
        host.gtag('event', eventName, params);
      } else if (Array.isArray(host.dataLayer)) {
        host.dataLayer.push({ event: eventName, ...params });
      }
    } catch {
      // Analytics must never break the widget or the host page.
    }
  };
}

export function createPwChatTracker(sink: VisitorChatAnalyticsSink) {
  return (eventName: PwChatEmbedAnalyticsEvent, props?: PwChatAnalyticsProps) => {
    let payload: Record<string, string>;
    try {
      payload = buildPwChatAnalyticsPayload(props);
    } catch {
      return;
    }
    sink(eventName, payload);
  };
}
