/**
 * Typed analytics helpers for the free digital systems review funnel.
 * Allowed properties only — never name, email, company, website, context,
 * submissionId, or chatSessionId.
 */

export type FreeReviewAnalyticsEvent =
  | 'free_review_page_view'
  | 'free_review_form_start'
  | 'free_review_form_submit'
  | 'free_review_form_error'
  | 'free_review_thank_you_view'
  | 'free_review_book_call_click';

export type FreeReviewAnalyticsProps = {
  service_area?: string;
  preferred_next_step?: string;
  source_location?: string;
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
    sourceLocation?: string;
    serviceArea?: string;
    preferredNextStep?: string;
    route?: string;
    errorCategory?: string;
    resultCategory?: string;
  },
): FreeReviewAnalyticsProps {
  const payload: FreeReviewAnalyticsProps = {};
  if (props.sourceLocation) payload.source_location = props.sourceLocation;
  if (props.serviceArea) payload.service_area = props.serviceArea;
  if (props.preferredNextStep) payload.preferred_next_step = props.preferredNextStep;
  if (props.route) payload.route = props.route;
  if (props.errorCategory) payload.error_category = props.errorCategory;
  if (props.resultCategory) payload.result_category = props.resultCategory;
  return payload;
}

export function assertNoProhibitedAnalyticsProps(
  payload: Record<string, unknown>,
): void {
  for (const key of PROHIBITED_KEYS) {
    if (key in payload) {
      throw new Error(`${key} must not appear in analytics payloads`);
    }
  }
}

/** @deprecated Prefer assertNoProhibitedAnalyticsProps */
export function assertNoChatSessionIdInAnalyticsPayload(
  payload: Record<string, unknown>,
): void {
  assertNoProhibitedAnalyticsProps(payload);
}
