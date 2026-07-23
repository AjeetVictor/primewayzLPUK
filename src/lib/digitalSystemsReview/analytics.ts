/**
 * Typed analytics helpers for the free digital systems review funnel.
 * Allowed properties only — never name, email, company, website, context,
 * submissionId, or chatSessionId.
 */

import type {
  FreeReviewCtaPlacement,
  FreeReviewServiceArea,
  FreeReviewSourceLocation,
} from '../../constants/conversionCta';

export type FreeReviewAnalyticsEvent =
  | 'free_review_page_view'
  | 'free_review_form_start'
  | 'free_review_form_submit'
  | 'free_review_form_error'
  | 'free_review_thank_you_view'
  | 'free_review_book_call_click'
  | 'free_review_cta_click';

export type FreeReviewAnalyticsProps = {
  service_area?: FreeReviewServiceArea;
  preferred_next_step?: string;
  source_location?: FreeReviewSourceLocation;
  cta_placement?: FreeReviewCtaPlacement;
  route?: string;
  error_category?: string;
  result_category?: string;
};

const PROHIBITED_KEYS = [
  'name',
  'email',
  'workEmail',
  'work_email',
  'company',
  'website',
  'context',
  'submissionId',
  'submission_id',
  'chatSessionId',
  'chat_session_id',
] as const;

export function buildDigitalSystemsReviewAnalyticsPayload(
  props: {
    sourceLocation?: FreeReviewSourceLocation;
    serviceArea?: FreeReviewServiceArea;
    preferredNextStep?: string;
    ctaPlacement?: FreeReviewCtaPlacement;
    route?: string;
    errorCategory?: string;
    resultCategory?: string;
  },
): FreeReviewAnalyticsProps {
  const payload: FreeReviewAnalyticsProps = {};
  if (props.sourceLocation) payload.source_location = props.sourceLocation;
  if (props.serviceArea) payload.service_area = props.serviceArea;
  if (props.preferredNextStep) payload.preferred_next_step = props.preferredNextStep;
  if (props.ctaPlacement) payload.cta_placement = props.ctaPlacement;
  if (props.route) payload.route = props.route;
  if (props.errorCategory) payload.error_category = props.errorCategory;
  if (props.resultCategory) payload.result_category = props.resultCategory;
  return payload;
}

export function assertNoProhibitedAnalyticsProps(
  payload: object,
): void {
  const record = payload as Record<string, unknown>;
  for (const key of PROHIBITED_KEYS) {
    if (key in record) {
      throw new Error(`${key} must not appear in analytics payloads`);
    }
  }
}

/** @deprecated Prefer assertNoProhibitedAnalyticsProps */
export function assertNoChatSessionIdInAnalyticsPayload(
  payload: object,
): void {
  assertNoProhibitedAnalyticsProps(payload);
}
