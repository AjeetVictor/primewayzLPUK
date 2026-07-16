/**
 * Internal measurement framework for commercial cluster pages.
 * Wire these event names in GA4 / Looker / Search Console dashboards.
 */
export const COMMERCIAL_PAGE_METRICS = {
  search: [
    'impressions_uk',
    'non_branded_clicks',
    'average_position',
    'new_ranking_keywords',
    'ctr_by_query',
    'ctr_by_page',
  ],
  behaviour: [
    'sdaas_cta_click',
    'sdaas_section_view',
    'sdaas_faq_open',
    'sdaas_snapshot_toggle',
    'sdaas_form_start',
    'sdaas_form_submit',
    'sdaas_guide_click',
    'sdaas_article_click',
    'sdaas_pillar_cta_click',
    'sdaas_pillar_service_click',
    'sdaas_pillar_related_article_click',
    'sdaas_pillar_section_view',
    'sdaas_pillar_faq_open',
    'sdaas_comparison_cta_click',
    'sdaas_comparison_service_click',
    'sdaas_comparison_pillar_click',
    'sdaas_comparison_related_article_click',
    'sdaas_comparison_section_view',
    'sdaas_comparison_faq_open',
    'sdaas_use_cases_cta_click',
    'sdaas_use_cases_service_click',
    'sdaas_use_cases_pillar_click',
    'sdaas_use_cases_comparison_click',
    'sdaas_use_cases_related_article_click',
    'sdaas_use_cases_section_view',
    'sdaas_use_cases_faq_open',
  ],
  business: [
    'qualified_enquiry',
    'meeting_booked',
    'proposal_requested',
    'deal_closed',
    'revenue_influenced',
  ],
} as const;

export type CommercialSectionKey =
  | 'chaos'
  | 'definition'
  | 'audience'
  | 'deliverables'
  | 'process'
  | 'capacity'
  | 'fit'
  | 'comparison'
  | 'trust'
  | 'onboarding'
  | 'pricing'
  | 'faq'
  | 'final_cta';
