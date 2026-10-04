/**
 * Non-PII visitor chat analytics for Phase 2F-1.
 * Never include name, email, company, free-text, transcript, filenames, or session IDs.
 * Prohibited keys (name, email, filename, sessionId, ...) must not appear in payloads;
 * the list and guard live in visitorChatAnalyticsCore.ts so embedded widgets share them.
 */

import { trackEvent } from '../analytics.ts';
import type { VisitorChatIntentKey } from './visitorChatIntents.ts';
import {
  assertNoProhibitedVisitorChatAnalyticsProps,
  normalizeVisitorChatAvailabilityState,
  toVisitorChatAnalyticsRoute,
  type VisitorChatAnalyticsSink,
  type VisitorChatAvailabilityState,
} from './visitorChatAnalyticsCore.ts';

export {
  assertNoProhibitedVisitorChatAnalyticsProps,
  type VisitorChatAnalyticsSink,
  type VisitorChatAvailabilityState,
};

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

export type VisitorChatRecommendationType = 'review' | 'service' | 'booking' | 'panel';

export type VisitorChatAnalyticsProps = {
  route?: string;
  intent_key?: VisitorChatIntentKey;
  service_area?: string;
  recommendation_type?: VisitorChatRecommendationType;
  availability_state?: VisitorChatAvailabilityState;
  placement?: 'chat_widget';
};

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

  if (props.route) payload.route = toVisitorChatAnalyticsRoute(props.route);
  if (props.intentKey) payload.intent_key = props.intentKey;
  if (props.serviceArea) payload.service_area = props.serviceArea;

  if (props.recommendationType) {
    payload.recommendation_type = props.recommendationType;
  }

  const availability = normalizeVisitorChatAvailabilityState(props.availabilityState);
  if (availability) payload.availability_state = availability;

  assertNoProhibitedVisitorChatAnalyticsProps(payload);
  return payload;
}

export function trackVisitorChatEvent(
  eventName: VisitorChatAnalyticsEvent,
  props?: Parameters<typeof buildVisitorChatAnalyticsPayload>[0],
  sink: VisitorChatAnalyticsSink = trackEvent,
): void {
  const payload = buildVisitorChatAnalyticsPayload(props);
  sink(eventName, payload);
}
