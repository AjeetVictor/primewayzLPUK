import { useEffect, useId, useState } from 'react';
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
import {
  buildConfirmationHeading,
  buildPreferredNextStepFollowUp,
  clearConfirmationSummary,
  readConfirmationSummary,
  scheduleConfirmationSummaryExpiry,
  shouldCollapseConfirmationContext,
  type DigitalSystemsReviewConfirmationSummary,
} from '../lib/digitalSystemsReview/confirmationSummary';
import { consumeFreeReviewSuccessMarker } from '../lib/digitalSystemsReview/successMarker';

const PAGE_TITLE = 'Digital Systems Review Request Received | Primewayz';

const GENERIC_SUPPORTING_COPY =
  'Primewayz will review the submitted information and respond with a focus on the most useful next step. You do not need to submit the form again.';

const PERSONALISED_SUPPORTING_COPY =
  'Primewayz will review the information below and respond with a focus on the most useful next step. You do not need to submit the form again.';

function ConfirmationContextBlock({ context }: { context: string }) {
  const disclosureId = useId();
  const collapse = shouldCollapseConfirmationContext(context);
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby={`${disclosureId}-title`} className="mt-8">
      <h2 id={`${disclosureId}-title`} className="text-lg font-bold text-slate-900">
        What you shared
      </h2>
      <div
        id={`${disclosureId}-body`}
        className={`mt-3 overflow-x-hidden break-words rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap sm:px-5 ${
          collapse && !expanded ? 'max-h-48 overflow-y-hidden' : ''
        }`}
      >
        {context}
      </div>
      {collapse ? (
        <button
          type="button"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          aria-expanded={expanded}
          aria-controls={`${disclosureId}-body`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show full details'}
        </button>
      ) : null}
    </section>
  );
}

function PersonalisedDetails({
  summary,
}: {
  summary: DigitalSystemsReviewConfirmationSummary;
}) {
  const summaryId = useId();
  const nextStepFollowUp = buildPreferredNextStepFollowUp(summary);

  return (
    <>
      <section
        aria-labelledby={`${summaryId}-heading`}
        className="mt-10 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6"
      >
        <h2 id={`${summaryId}-heading`} className="text-lg font-bold text-slate-900">
          Request summary
        </h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-800">Name</dt>
            <dd className="mt-1 break-words text-slate-700">{summary.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Work email</dt>
            <dd className="mt-1 break-words text-slate-700">{summary.workEmail}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Company</dt>
            <dd className="mt-1 break-words text-slate-700">{summary.company}</dd>
          </div>
          {summary.website ? (
            <div>
              <dt className="font-semibold text-slate-800">Website</dt>
              <dd className="mt-1 break-words text-slate-700">{summary.website}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-slate-800">Review focus</dt>
            <dd className="mt-1 break-words text-slate-700">{summary.serviceArea}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Preferred next step</dt>
            <dd className="mt-1 break-words text-slate-700">{summary.preferredNextStep}</dd>
          </div>
          {summary.submissionId ? (
            <div>
              <dt className="font-semibold text-slate-800">Request reference</dt>
              <dd className="mt-1 break-words font-mono text-xs text-slate-600">
                {summary.submissionId}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <ConfirmationContextBlock context={summary.context} />

      <section aria-labelledby={`${summaryId}-next`} className="mt-8">
        <h2 id={`${summaryId}-next`} className="text-lg font-bold text-slate-900">
          What happens next
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
          Primewayz will review your current systems, priorities and submitted context to identify
          the most useful starting point.
        </p>
        <p className="mt-3 break-words text-sm leading-6 text-slate-700 sm:text-base">
          {nextStepFollowUp}
        </p>
      </section>
    </>
  );
}

export function DigitalSystemsReviewThankYouPage() {
  // SSR and first client paint stay generic to avoid hydration mismatches.
  const [summary, setSummary] = useState<DigitalSystemsReviewConfirmationSummary | null>(null);

  useEffect(() => {
    const loaded = readConfirmationSummary();
    setSummary(loaded);

    const marker = consumeFreeReviewSuccessMarker();
    if (marker) {
      const payload = buildDigitalSystemsReviewAnalyticsPayload({
        route: FREE_REVIEW_THANK_YOU_ROUTE,
        resultCategory: marker,
      });
      assertNoProhibitedAnalyticsProps(payload);
      trackConversionEvent('free_review_thank_you_view', payload);
    }

    if (!loaded) return undefined;

    // Auto-expire the open personalised receipt without requiring a refresh.
    // Do not emit another analytics event when the receipt expires.
    return scheduleConfirmationSummaryExpiry(loaded, {
      onExpire: () => {
        clearConfirmationSummary();
        setSummary(null);
      },
    });
  }, []);

  const onBookCallClick = () => {
    const payload = buildDigitalSystemsReviewAnalyticsPayload({
      route: FREE_REVIEW_THANK_YOU_ROUTE,
    });
    assertNoProhibitedAnalyticsProps(payload);
    trackConversionEvent('free_review_book_call_click', payload);
    trackBookCallClick(DISCOVERY_CALL_CTA_LABEL, 'digital_systems_review_thank_you');
  };

  const heading = buildConfirmationHeading(summary);
  const supportingCopy = summary ? PERSONALISED_SUPPORTING_COPY : GENERIC_SUPPORTING_COPY;

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
            {heading}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-700 sm:text-lg">
            {supportingCopy}
          </p>

          {summary ? <PersonalisedDetails summary={summary} /> : null}

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
