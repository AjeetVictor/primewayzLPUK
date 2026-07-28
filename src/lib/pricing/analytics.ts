import { trackConversionEvent } from '../analytics';
import { getPricingPolicyVersion } from '../../data/pricing/policy';
import type { StoredPricingSelectionV1 } from './pricingSelection';
import { toAnalyticsPlanPayload } from './pricingSelection';

const firedEvents = new Set<string>();

function eventKey(name: string, suffix: string): string {
  return `${name}:${suffix}`;
}

function markOnce(key: string): boolean {
  if (firedEvents.has(key)) return false;
  firedEvents.add(key);
  return true;
}

/** Reset fired-event guard — test helper only. */
export function resetPricingAnalyticsGuardForTests(): void {
  firedEvents.clear();
}

export function buildPricingAnalyticsParams(
  params: Record<string, unknown> = {},
  selection?: StoredPricingSelectionV1 | null,
) {
  return {
    pricing_policy_version: getPricingPolicyVersion(),
    ...toAnalyticsPlanPayload(selection ?? null),
    ...params,
  };
}

export function trackPricingPageView(params: {
  page_path: string;
  page_location?: string;
  section_name?: string;
  selection?: StoredPricingSelectionV1 | null;
}) {
  const key = eventKey('pricing_page_view', params.page_path);
  if (!markOnce(key)) return;

  trackConversionEvent(
    'pricing_page_view',
    buildPricingAnalyticsParams(
      {
        page_path: params.page_path,
        page_location: params.page_location,
        section_name: params.section_name ?? 'pricing_page',
      },
      params.selection,
    ),
  );
}

export function trackPricingPlanHighlighted(params: {
  selected_plan: string;
  page_path: string;
  source?: string;
}) {
  trackConversionEvent(
    'pricing_plan_highlighted',
    buildPricingAnalyticsParams({
      selected_plan: params.selected_plan,
      page_path: params.page_path,
      source_section: params.source,
    }),
  );
}

export function trackPricingPlanChanged(params: {
  selected_plan: string;
  page_path: string;
  source_section?: string;
}) {
  trackConversionEvent(
    'pricing_plan_changed',
    buildPricingAnalyticsParams({
      selected_plan: params.selected_plan,
      page_path: params.page_path,
      source_section: params.source_section,
    }),
  );
}

export function trackPricingComparisonView(params: { page_path: string }) {
  const key = eventKey('pricing_comparison_view', params.page_path);
  if (!markOnce(key)) return;
  trackConversionEvent('pricing_comparison_view', buildPricingAnalyticsParams(params));
}

export function trackPricingFaqOpen(params: { question_id: string; page_path: string }) {
  trackConversionEvent(
    'pricing_faq_open',
    buildPricingAnalyticsParams({
      question_id: params.question_id,
      page_path: params.page_path,
    }),
  );
}

export function trackPricingCtaClick(params: {
  cta_text: string;
  cta_location: string;
  page_path: string;
  selection?: StoredPricingSelectionV1 | null;
  journey_type?: string;
}) {
  trackConversionEvent(
    'pricing_cta_click',
    buildPricingAnalyticsParams(
      {
        cta_text: params.cta_text,
        cta_location: params.cta_location,
        page_path: params.page_path,
        journey_type: params.journey_type,
      },
      params.selection,
    ),
  );
}

export function trackLeadFormStart(params: {
  form_name: string;
  page_path: string;
  journey_type?: string;
  service_interest?: string;
  selection?: StoredPricingSelectionV1 | null;
}) {
  const key = eventKey('lead_form_start', `${params.form_name}:${params.page_path}`);
  if (!markOnce(key)) return;

  trackConversionEvent(
    'lead_form_start',
    buildPricingAnalyticsParams(
      {
        form_name: params.form_name,
        page_path: params.page_path,
        journey_type: params.journey_type,
        service_interest: params.service_interest,
      },
      params.selection,
    ),
  );
}

export function trackLeadFormSubmit(params: {
  form_name: string;
  page_path: string;
  journey_type?: string;
  service_interest?: string;
  selection?: StoredPricingSelectionV1 | null;
}) {
  trackConversionEvent(
    'lead_form_submit',
    buildPricingAnalyticsParams(
      {
        form_name: params.form_name,
        page_path: params.page_path,
        journey_type: params.journey_type,
        service_interest: params.service_interest,
      },
      params.selection,
    ),
  );
}

export function trackLeadFormSuccess(params: {
  form_name: string;
  page_path: string;
  journey_type?: string;
  selection?: StoredPricingSelectionV1 | null;
}) {
  trackConversionEvent(
    'lead_form_success',
    buildPricingAnalyticsParams(
      {
        form_name: params.form_name,
        page_path: params.page_path,
        journey_type: params.journey_type,
      },
      params.selection,
    ),
  );
}

export const PROHIBITED_ANALYTICS_KEYS = [
  'email',
  'workEmail',
  'telephone',
  'phone',
  'name',
  'message',
  'context',
  'company',
] as const;

export function assertNoPiiInAnalyticsPayload(payload: Record<string, unknown>): void {
  for (const key of PROHIBITED_ANALYTICS_KEYS) {
    if (key in payload) {
      throw new Error(`PII key "${key}" must not be sent to analytics`);
    }
  }
}

export function buildSafeAnalyticsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  assertNoPiiInAnalyticsPayload(payload);
  return payload;
}
