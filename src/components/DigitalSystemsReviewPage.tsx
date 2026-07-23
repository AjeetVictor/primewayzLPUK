import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DigitalSystemsReviewForm } from './forms/DigitalSystemsReviewForm';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  FREE_REVIEW_SERVICE_QUERY_PARAM,
  FREE_REVIEW_SOURCE_QUERY_PARAM,
  WEBSITE_CHECKER_CTA_LABEL,
  WEBSITE_CHECKER_DESTINATION,
  resolveFreeReviewServiceArea,
  resolveFreeReviewSourceLocation,
} from '../constants/conversionCta';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { DIGITAL_SYSTEMS_REVIEW_PATH } from '../constants/digitalSystemsReview';
import { trackBookCallClick, trackConversionEvent } from '../lib/analytics';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from '../lib/digitalSystemsReview/analytics';

const PAGE_TITLE = 'Free Digital Systems Review for UK SMEs | Primewayz';
const PAGE_DESCRIPTION =
  'Ask Primewayz to review where your website, CRM, software or support model is creating friction and identify the most useful next step.';

export function DigitalSystemsReviewPage() {
  const [searchParams] = useSearchParams();

  const sourceLocation = useMemo(() => {
    const rawValues = searchParams.getAll(FREE_REVIEW_SOURCE_QUERY_PARAM);
    if (rawValues.length === 0) {
      return resolveFreeReviewSourceLocation(null);
    }
    if (rawValues.length > 1) {
      return resolveFreeReviewSourceLocation(rawValues);
    }
    return resolveFreeReviewSourceLocation(rawValues[0]);
  }, [searchParams]);

  const initialServiceArea = useMemo(() => {
    const rawValues = searchParams.getAll(FREE_REVIEW_SERVICE_QUERY_PARAM);
    if (rawValues.length === 0) {
      return resolveFreeReviewServiceArea(null);
    }
    if (rawValues.length > 1) {
      return resolveFreeReviewServiceArea(rawValues);
    }
    return resolveFreeReviewServiceArea(rawValues[0]);
  }, [searchParams]);

  useEffect(() => {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation,
      route: DIGITAL_SYSTEMS_REVIEW_PATH,
      ...(initialServiceArea ? { serviceArea: initialServiceArea } : {}),
    });
    assertNoProhibitedAnalyticsProps(payload);
    trackConversionEvent('free_review_page_view', payload);
  }, [sourceLocation, initialServiceArea]);

  const onBookCallClick = () => {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation,
      route: DIGITAL_SYSTEMS_REVIEW_PATH,
    });
    assertNoProhibitedAnalyticsProps(payload);
    trackConversionEvent('free_review_book_call_click', payload);
    trackBookCallClick(DISCOVERY_CALL_CTA_LABEL, 'digital_systems_review_page');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f8fafc_45%,_#ffffff_100%)] text-slate-950">
      <title>{PAGE_TITLE}</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={`https://uk.primewayz.com${DIGITAL_SYSTEMS_REVIEW_PATH}`} />

      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.2), transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[800px]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Free initial review
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {FREE_REVIEW_CTA_LABEL}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Tell us where your website, CRM, software or support model is creating friction. We’ll
            review the context and identify the most useful next step.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-8">
            <DigitalSystemsReviewForm
              sourceLocation={sourceLocation}
              initialServiceArea={initialServiceArea ?? undefined}
            />
          </div>

          <aside className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">What you’ll receive</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>A review of the submitted context</li>
                <li>Identification of the main issues, unknowns or priorities</li>
                <li>A recommended next step</li>
                <li>No obligation to proceed</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Scope of this review</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This is an initial consultant-led review based on the information you provide and
                relevant publicly available context. It is not an authenticated technical audit,
                security assessment or implementation estimate.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">How we handle your request</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Submitted information is treated confidentially within Primewayz</li>
                <li>We handle the details you share responsibly and only for this request</li>
                <li>You receive clear next-step guidance based on the context provided</li>
                <li>There is no obligation to proceed after the review</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Prefer a self-service check?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A self-service website visibility check based on public signals.
              </p>
              <Link
                to={WEBSITE_CHECKER_DESTINATION}
                className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                {WEBSITE_CHECKER_CTA_LABEL}
              </Link>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <Link
                to={DISCOVERY_CALL_DESTINATION}
                onClick={onBookCallClick}
                className="font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                {DISCOVERY_CALL_CTA_LABEL}
              </Link>
              <Link
                to={CANONICAL_ROUTES.contact}
                className="font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                General contact
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
