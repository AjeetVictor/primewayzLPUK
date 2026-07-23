import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_THANK_YOU_ROUTE,
} from '../constants/conversionCta';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { trackConversionEvent, trackBookCallClick } from '../lib/analytics';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from '../lib/digitalSystemsReview/analytics';
import { consumeFreeReviewSuccessMarker } from '../lib/digitalSystemsReview/successMarker';

const PAGE_TITLE = 'Digital Systems Review Request Received | Primewayz';

export function DigitalSystemsReviewThankYouPage() {
  useEffect(() => {
    const marker = consumeFreeReviewSuccessMarker();
    if (!marker) return;

    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      route: FREE_REVIEW_THANK_YOU_ROUTE,
      resultCategory: marker,
    });
    assertNoProhibitedAnalyticsProps(payload);
    trackConversionEvent('free_review_thank_you_view', payload);
  }, []);

  const onBookCallClick = () => {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      route: FREE_REVIEW_THANK_YOU_ROUTE,
    });
    assertNoProhibitedAnalyticsProps(payload);
    trackConversionEvent('free_review_book_call_click', payload);
    trackBookCallClick(DISCOVERY_CALL_CTA_LABEL, 'digital_systems_review_thank_you');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f8fafc_50%,_#ffffff_100%)] text-slate-950">
      <title>{PAGE_TITLE}</title>
      <meta name="robots" content="noindex, follow" />
      <link rel="canonical" href={`https://uk.primewayz.com${FREE_REVIEW_THANK_YOU_ROUTE}`} />

      <section className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[720px]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Request received
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Thank you — your review request has been received
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-700 sm:text-lg">
            Primewayz will review the submitted information and respond with a focus on the most
            useful next step. You do not need to submit the form again.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to={CANONICAL_ROUTES.services}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#000A2D] px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              Return to services
            </Link>
            <Link
              to={DISCOVERY_CALL_DESTINATION}
              onClick={onBookCallClick}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              {DISCOVERY_CALL_CTA_LABEL}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
