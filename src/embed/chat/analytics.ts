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
  __PRIMEWAYZ_ANALYTICS_CONSENT__?: boolean;
  PWSCTrackEvent?: (eventName: string, params?: Record<string, unknown>) => void;
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

export type PwChatAnalyticsSinkOptions = {
  /** Explicit tenant/host kill-switch from embed config. */
  analyticsEnabled?: boolean;
};

/**
 * Consent model for multi-tenant embeds:
 * - `analyticsEnabled === false` → never emit
 * - custom `consentCheck` → caller owns the decision
 * - `__PRIMEWAYZ_ANALYTICS_CONSENT__ === false` → denied (UK banner / explicit deny)
 * - `__PRIMEWAYZ_ANALYTICS_CONSENT__ === true` → allowed
 * - unset consent → host-owned: allow only when a host analytics transport is already present
 *   (gtag / dataLayer / PWSCTrackEvent). Hosts that load those after their own consent gate
 *   do not need the Primewayz UK consent flag.
 */
export function resolvePwChatAnalyticsConsent(
  win: Window,
  consentCheck?: () => boolean,
  options: PwChatAnalyticsSinkOptions = {},
): boolean {
  if (options.analyticsEnabled === false) return false;
  if (consentCheck) return consentCheck();
  const host = win as AnalyticsWindow;
  if (host.__PRIMEWAYZ_ANALYTICS_CONSENT__ === false) return false;
  if (host.__PRIMEWAYZ_ANALYTICS_CONSENT__ === true) return true;
  return (
    typeof host.PWSCTrackEvent === 'function'
    || typeof host.gtag === 'function'
    || Array.isArray(host.dataLayer)
  );
}

/** Uses the first available host transport: Site Controls, then gtag, then dataLayer. */
export function createDefaultPwChatAnalyticsSink(
  win: Window,
  consentCheck?: () => boolean,
  options: PwChatAnalyticsSinkOptions = {},
): VisitorChatAnalyticsSink {
  return (eventName, params) => {
    if (!resolvePwChatAnalyticsConsent(win, consentCheck, options)) return;
    const host = win as AnalyticsWindow;
    try {
      if (typeof host.PWSCTrackEvent === 'function') {
        host.PWSCTrackEvent(eventName, params);
      } else if (typeof host.gtag === 'function') {
        // Prefer gtag alone so GTM-backed gtag does not also get a raw dataLayer push.
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
    try {
      sink(eventName, payload);
    } catch {
      // Host analytics adapters must never interrupt chat.
    }
  };
}
