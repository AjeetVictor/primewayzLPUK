import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { CONTACT_PAGE_PATH, BOOK_CALL_HASH } from '../constants/contactBooking';
import { FREE_REVIEW_CTA_PLACEMENTS, FREE_REVIEW_SERVICE_AREAS, type FreeReviewServiceArea } from '../constants/conversionCta';
import { APPROVED_PUBLIC_STORY_SLUGS } from '../data/successStories';
import { isPricingPlanSlug, type PricingPlanSlug } from '../data/pricing/helpers';

export const BOOKING_CONTEXT_QUERY = { serviceArea: 'booking_service', sourceRoute: 'booking_route', ctaPlacement: 'booking_placement', selectedPlan: 'booking_plan' } as const;
export const BOOKING_CTA_PLACEMENTS = [...FREE_REVIEW_CTA_PLACEMENTS, 'pricing_plan_detail_modal_secondary', 'pricing_final_cta', 'contact_option_booking', 'digital_systems_review_page', 'digital_systems_review_thank_you'] as const;
export type BookingCtaPlacement = (typeof BOOKING_CTA_PLACEMENTS)[number];
export type BookingContext = { serviceArea?: FreeReviewServiceArea; sourceRoute?: string; ctaPlacement?: BookingCtaPlacement; selectedPlan?: PricingPlanSlug };
const SERVICE_AREAS = new Set<string>(FREE_REVIEW_SERVICE_AREAS);
const CTA_PLACEMENTS = new Set<string>(BOOKING_CTA_PLACEMENTS);
const APPROVED_SOURCE_ROUTES = new Set<string>(['/', ...Object.values(CANONICAL_ROUTES), ...APPROVED_PUBLIC_STORY_SLUGS.map((slug) => `/success-stories/${slug}`)]);
function singleValue(params: URLSearchParams, key: string): string | null { const values = params.getAll(key); return values.length === 1 ? values[0].trim() : null; }
export function resolveBookingContext(params: URLSearchParams): BookingContext {
  const context: BookingContext = {};
  const serviceArea = singleValue(params, BOOKING_CONTEXT_QUERY.serviceArea);
  const sourceRoute = singleValue(params, BOOKING_CONTEXT_QUERY.sourceRoute);
  const ctaPlacement = singleValue(params, BOOKING_CONTEXT_QUERY.ctaPlacement);
  const selectedPlan = singleValue(params, BOOKING_CONTEXT_QUERY.selectedPlan);
  if (serviceArea && SERVICE_AREAS.has(serviceArea)) context.serviceArea = serviceArea as FreeReviewServiceArea;
  if (sourceRoute && APPROVED_SOURCE_ROUTES.has(sourceRoute)) context.sourceRoute = sourceRoute;
  if (ctaPlacement && CTA_PLACEMENTS.has(ctaPlacement)) context.ctaPlacement = ctaPlacement as BookingCtaPlacement;
  if (selectedPlan && isPricingPlanSlug(selectedPlan)) context.selectedPlan = selectedPlan;
  return context;
}
export function buildBookCallUrl(context: BookingContext = {}): string {
  const params = new URLSearchParams();
  if (context.serviceArea && SERVICE_AREAS.has(context.serviceArea)) params.set(BOOKING_CONTEXT_QUERY.serviceArea, context.serviceArea);
  if (context.sourceRoute && APPROVED_SOURCE_ROUTES.has(context.sourceRoute)) params.set(BOOKING_CONTEXT_QUERY.sourceRoute, context.sourceRoute);
  if (context.ctaPlacement && CTA_PLACEMENTS.has(context.ctaPlacement)) params.set(BOOKING_CONTEXT_QUERY.ctaPlacement, context.ctaPlacement);
  if (context.selectedPlan && isPricingPlanSlug(context.selectedPlan)) params.set(BOOKING_CONTEXT_QUERY.selectedPlan, context.selectedPlan);
  const query = params.toString();
  return `${CONTACT_PAGE_PATH}${query ? `?${query}` : ''}#${BOOK_CALL_HASH}`;
}
export function bookingContextAnalyticsPayload(context: BookingContext): Record<string, string> {
  const payload: Record<string, string> = {};
  if (context.serviceArea) payload.service_interest = context.serviceArea;
  if (context.sourceRoute) payload.originating_page = context.sourceRoute;
  if (context.ctaPlacement) payload.originating_cta_placement = context.ctaPlacement;
  if (context.selectedPlan) payload.selected_plan = context.selectedPlan;
  return payload;
}
