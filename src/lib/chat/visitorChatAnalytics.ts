/**
 * Non-PII visitor chat analytics for Phase 2F-1.
 * Never include name, email, company, free-text, transcript, filenames, or session IDs.
 */

import { trackEvent } from '../analytics.ts';
import type { VisitorChatIntentKey } from './visitorChatIntents.ts';

export const VISITOR_CHAT_ANALYTICS_EVENTS = [
  'chat_open',
  'chat_intent_selected',
  'chat_recommendation_shown',
  'chat_service_click',
  'chat_review_started',
  'chat_booking_click',
  'chat_human_handoff_requested',
  'chat_message_send_failed',
  'chat_message_retry',
] as const;

export type VisitorChatAnalyticsEvent = (typeof VISITOR_CHAT_ANALYTICS_EVENTS)[number];

export type VisitorChatAvailabilityState =
  | 'online'
  | 'away'
  | 'offline'
  | 'assistant'
  | 'unknown';

export type VisitorChatRecommendationType = 'review' | 'service' | 'booking' | 'panel';

export type VisitorChatAnalyticsProps = {
  route?: string;
  intent_key?: VisitorChatIntentKey;
  service_area?: string;
  recommendation_type?: VisitorChatRecommendationType;
  availability_state?: VisitorChatAvailabilityState;
  placement?: 'chat_widget';
};

const PROHIBITED_ANALYTICS_KEYS = [
  'name',
  'email',
  'workEmail',
  'work_email',
  'company',
  'phone',
  'message',
  'text',
  'transcript',
  'filename',
  'originalName',
  'fileName',
  'attachment_url',
  'attachmentUrl',
  'sessionId',
  'session_id',
  'chatSessionId',
  'chat_session_id',
  'id',
  'ip',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export function assertNoProhibitedVisitorChatAnalyticsProps(
  payload: object,
): void {
  const record = payload as Record<string, unknown>;
  for (const key of PROHIBITED_ANALYTICS_KEYS) {
    if (key in record) {
      throw new Error(`${key} must not appear in visitor chat analytics payloads`);
    }
  }
}

export function buildVisitorChatAnalyticsPayload(
  props: {
    route?: string;
    intentKey?: VisitorChatIntentKey;
    serviceArea?: string;
    recommendationType?: VisitorChatRecommendationType;
    availabilityState?: string;
  } = {},
): VisitorChatAnalyticsProps {
  const payload: VisitorChatAnalyticsProps = {
    placement: 'chat_widget',
  };

  if (props.route) payload.route = props.route.split('?')[0]?.split('#')[0] || '/';
  if (props.intentKey) payload.intent_key = props.intentKey;
  if (props.serviceArea) payload.service_area = props.serviceArea;

  if (props.recommendationType) {
    payload.recommendation_type = props.recommendationType;
  }

  const availability = normalizeAvailabilityState(props.availabilityState);
  if (availability) payload.availability_state = availability;

  assertNoProhibitedVisitorChatAnalyticsProps(payload);
  return payload;
}

function normalizeAvailabilityState(
  status?: string,
): VisitorChatAvailabilityState | undefined {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'offline') return 'offline';
  if (status === 'assistant') return 'assistant';
  if (status == null || status === '') return undefined;
  return 'unknown';
}

export function trackVisitorChatEvent(
  eventName: VisitorChatAnalyticsEvent,
  props?: Parameters<typeof buildVisitorChatAnalyticsPayload>[0],
): void {
  const payload = buildVisitorChatAnalyticsPayload(props);
  trackEvent(eventName, payload);
}
