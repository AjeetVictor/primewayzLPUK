import { trackConversionEvent } from './analytics';
import { getFullUtmAnalyticsPayload } from './utm';

export type SdaasEventName =
  | 'sdaas_cta_click'
  | 'sdaas_form_start'
  | 'sdaas_form_submit'
  | 'sdaas_guide_click'
  | 'sdaas_article_click'
  | 'sdaas_section_view'
  | 'sdaas_faq_open'
  | 'sdaas_snapshot_toggle'
  | 'sdaas_pillar_cta_click'
  | 'sdaas_pillar_service_click'
  | 'sdaas_pillar_related_article_click'
  | 'sdaas_pillar_section_view'
  | 'sdaas_pillar_faq_open'
  | 'sdaas_comparison_cta_click'
  | 'sdaas_comparison_service_click'
  | 'sdaas_comparison_pillar_click'
  | 'sdaas_comparison_related_article_click'
  | 'sdaas_comparison_section_view'
  | 'sdaas_comparison_faq_open'
  | 'sdaas_use_cases_cta_click'
  | 'sdaas_use_cases_service_click'
  | 'sdaas_use_cases_pillar_click'
  | 'sdaas_use_cases_comparison_click'
  | 'sdaas_use_cases_related_article_click'
  | 'sdaas_use_cases_section_view'
  | 'sdaas_use_cases_faq_open'
  | 'sdaas_supporting_article_cta_click'
  | 'sdaas_supporting_article_service_click'
  | 'sdaas_supporting_article_related_click'
  | 'sdaas_supporting_article_section_view'
  | 'sdaas_supporting_article_faq_open';

export type SdaasCtaLocation =
  | 'hero_primary'
  | 'hero_secondary'
  | 'process_section'
  | 'pricing_section'
  | 'faq_section'
  | 'final_cta'
  | 'navigation'
  | 'homepage_card'
  | 'related_service_link'
  | 'form_page'
  | 'capacity_form'
  | 'pillar_intro'
  | 'pillar_decision'
  | 'pillar_conclusion'
  | 'pillar_related';

type SdaasTrackParams = {
  cta_location?: SdaasCtaLocation | string;
  cta_label?: string;
  destination?: string;
  source_page?: string;
  content_cluster?: string;
  link_context?: string;
  section_id?: string;
  section_name?: string;
  question_index?: number;
  question_text?: string;
  [key: string]: unknown;
};

/**
 * Track SDaaS conversion events without personal form data.
 * Respects the existing analytics abstraction (dataLayer + GA).
 */
export function trackSdaasEvent(eventName: SdaasEventName, params?: SdaasTrackParams): void {
  const sourcePage =
    params?.source_page ||
    (typeof window !== 'undefined' ? window.location.pathname : undefined);
  const utm = getFullUtmAnalyticsPayload();

  trackConversionEvent(eventName, {
    ...utm,
    traffic_source: typeof document !== 'undefined' ? document.referrer || 'direct' : undefined,
    campaign_source: utm.utm_source,
    campaign_medium: utm.utm_medium,
    campaign_name: utm.utm_campaign,
    source_page: sourcePage,
    content_cluster: params?.content_cluster || 'sdaas',
    ...params,
  });
}
