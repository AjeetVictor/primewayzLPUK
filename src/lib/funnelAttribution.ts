import { isPricingPlanSlug } from '../data/pricing/helpers';
import { getFirstLandingPage } from './chatSource';

function safeRoute(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const route = value.trim().split(/[?#]/, 1)[0];
  return route.startsWith('/') && !route.startsWith('//') && route.length <= 240
    ? route
    : undefined;
}

function safeLabel(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const label = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!label || label.length > maxLength || /@|(?:\+?\d[\d\s().-]{7,}\d)/.test(label)) {
    return undefined;
  }
  return label;
}

export function buildFunnelAttribution(input: {
  serviceInterest?: unknown;
  sourcePage?: unknown;
  submissionPage?: unknown;
  ctaPlacement?: unknown;
  selectedPlan?: unknown;
}): Record<string, string> {
  const payload: Record<string, string> = {};
  const service = safeLabel(input.serviceInterest, 100);
  const sourcePage = safeRoute(input.sourcePage) ?? getFirstLandingPage();
  const submissionPage = safeRoute(input.submissionPage);
  const ctaPlacement = safeLabel(input.ctaPlacement, 80);
  const selectedPlan =
    typeof input.selectedPlan === 'string' && isPricingPlanSlug(input.selectedPlan)
      ? input.selectedPlan
      : undefined;

  if (service) payload.service_interest = service;
  payload.source_page = sourcePage;
  if (submissionPage) payload.submission_page = submissionPage;
  if (ctaPlacement) payload.cta_location = ctaPlacement;
  if (selectedPlan) payload.selected_plan = selectedPlan;
  return payload;
}
