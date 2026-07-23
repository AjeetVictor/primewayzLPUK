import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DEFAULT_REVIEW_SOURCE_LOCATION,
  DIGITAL_SYSTEMS_REVIEW_API_PATH,
  DIGITAL_SYSTEMS_REVIEW_PATH,
  DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH,
  REVIEW_FIELD_LIMITS,
  REVIEW_PREFERRED_NEXT_STEPS,
  REVIEW_SERVICE_AREAS,
  resolveFreeReviewServiceArea,
  type DigitalSystemsReviewSourceLocation,
  type ReviewServiceArea,
} from '../../constants/digitalSystemsReview';
import {
  FREE_REVIEW_CTA_LABEL,
} from '../../constants/conversionCta';
import { COMPANY_TRUST_LINKS } from '../../constants/companyTrustLinks';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { apiUrl } from '../../utils/apiUrl';
import { trackConversionEvent } from '../../lib/analytics';
import { getFirstLandingPage } from '../../lib/chatSource';
import { getFirstUtmParams, getLatestUtmParams } from '../../lib/utm';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from '../../lib/digitalSystemsReview/analytics';
import { mapClientUtmParamsToAttribution } from '../../lib/digitalSystemsReview/attribution';
import { readOptionalChatSessionIdFromStorage } from '../../lib/digitalSystemsReview/chatSessionId';
import { writeFreeReviewSuccessMarker } from '../../lib/digitalSystemsReview/successMarker';

type FormState = {
  name: string;
  workEmail: string;
  company: string;
  website: string;
  serviceArea: string;
  context: string;
  preferredNextStep: string;
  acknowledgement: boolean;
  companyWebsite: string;
};

type FormErrors = Partial<Record<keyof FormState | 'form', string>>;

const initialForm: FormState = {
  name: '',
  workEmail: '',
  company: '',
  website: '',
  serviceArea: '',
  context: '',
  preferredNextStep: '',
  acknowledgement: false,
  companyWebsite: '',
};

function createSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  }
  return `dsr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function safeLandingPage(): string {
  try {
    return getFirstLandingPage() || DIGITAL_SYSTEMS_REVIEW_PATH;
  } catch {
    return DIGITAL_SYSTEMS_REVIEW_PATH;
  }
}

function safeReferrer(): string | undefined {
  try {
    return typeof document !== 'undefined' ? document.referrer || undefined : undefined;
  } catch {
    return undefined;
  }
}

function safeUtm() {
  try {
    return {
      firstTouchAttribution: mapClientUtmParamsToAttribution(getFirstUtmParams()),
      latestTouchAttribution: mapClientUtmParamsToAttribution(getLatestUtmParams()),
    };
  } catch {
    return {
      firstTouchAttribution: null,
      latestTouchAttribution: null,
    };
  }
}

function isPlausibleWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > REVIEW_FIELD_LIMITS.websiteMax) return false;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const parsed = new URL(candidate);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && !parsed.username
      && !parsed.password
      && parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

type DigitalSystemsReviewFormProps = {
  sourceLocation?: DigitalSystemsReviewSourceLocation;
  /** Optional allowlisted service-area preselection; remains editable. */
  initialServiceArea?: ReviewServiceArea;
};

export function DigitalSystemsReviewForm({
  sourceLocation = DEFAULT_REVIEW_SOURCE_LOCATION,
  initialServiceArea,
}: DigitalSystemsReviewFormProps) {
  const navigate = useNavigate();
  const formId = useId();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    serviceArea: initialServiceArea ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [submissionId] = useState(createSubmissionId);
  const submittingLockRef = useRef(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errors]);

  const analyticsServiceArea = () =>
    resolveFreeReviewServiceArea(form.serviceArea) ?? undefined;

  const markStart = () => {
    if (started) return;
    setStarted(true);
    const analyticsPayload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation,
      serviceArea: analyticsServiceArea(),
      preferredNextStep: form.preferredNextStep || undefined,
      route: DIGITAL_SYSTEMS_REVIEW_PATH,
    });
    assertNoProhibitedAnalyticsProps(analyticsPayload);
    trackConversionEvent('free_review_form_start', analyticsPayload);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    markStart();
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const emitError = (errorCategory: string) => {
    const analyticsPayload = buildDigitalSystemsReviewAnalyticsPayload({
      sourceLocation,
      serviceArea: analyticsServiceArea(),
      preferredNextStep: form.preferredNextStep || undefined,
      route: DIGITAL_SYSTEMS_REVIEW_PATH,
      errorCategory,
    });
    assertNoProhibitedAnalyticsProps(analyticsPayload);
    trackConversionEvent('free_review_form_error', analyticsPayload);
  };

  const validateClient = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const name = form.name.trim();
    if (name.length < REVIEW_FIELD_LIMITS.nameMin) {
      nextErrors.name = 'Please enter your name.';
    } else if (name.length > REVIEW_FIELD_LIMITS.nameMax) {
      nextErrors.name = 'Name is too long.';
    }

    const workEmail = form.workEmail.trim();
    if (workEmail.length > REVIEW_FIELD_LIMITS.emailMax) {
      nextErrors.workEmail = 'Work email is too long.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail) || /[\s,]/.test(workEmail)) {
      nextErrors.workEmail = 'Please enter a valid work email.';
    }

    const company = form.company.trim();
    if (company.length < REVIEW_FIELD_LIMITS.companyMin) {
      nextErrors.company = 'Please enter your company.';
    } else if (company.length > REVIEW_FIELD_LIMITS.companyMax) {
      nextErrors.company = 'Company is too long.';
    }

    const website = form.website.trim();
    if (website) {
      if (website.length > REVIEW_FIELD_LIMITS.websiteMax) {
        nextErrors.website = 'Website is too long.';
      } else if (!isPlausibleWebsite(website)) {
        nextErrors.website = 'Please enter a valid website URL.';
      }
    }

    if (!form.serviceArea) {
      nextErrors.serviceArea = 'Please select what you need help with.';
    }
    if (form.context.trim().length < REVIEW_FIELD_LIMITS.contextMin) {
      nextErrors.context = `Please share a short description (at least ${REVIEW_FIELD_LIMITS.contextMin} characters).`;
    }
    if (form.context.trim().length > REVIEW_FIELD_LIMITS.contextMax) {
      nextErrors.context = 'Context is too long.';
    }
    if (!form.preferredNextStep) {
      nextErrors.preferredNextStep = 'Please choose a preferred next step.';
    }
    if (!form.acknowledgement) {
      nextErrors.acknowledgement =
        'Please confirm you understand how the submitted information will be used.';
    }
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingLockRef.current || submitting) return;

    const nextErrors = validateClient();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      emitError('validation');
      return;
    }

    setErrors({});
    submittingLockRef.current = true;
    setSubmitting(true);

    const { firstTouchAttribution, latestTouchAttribution } = safeUtm();
    const chatSessionId = readOptionalChatSessionIdFromStorage();

    const payload = {
      submissionId,
      name: form.name.trim(),
      workEmail: form.workEmail.trim().toLowerCase(),
      company: form.company.trim(),
      website: form.website.trim() || undefined,
      serviceArea: form.serviceArea,
      context: form.context.trim(),
      preferredNextStep: form.preferredNextStep,
      acknowledgement: true,
      companyWebsite: form.companyWebsite,
      sourceLocation,
      landingPage: safeLandingPage(),
      referrer: safeReferrer(),
      firstTouchAttribution,
      latestTouchAttribution,
      ...(chatSessionId ? { chatSessionId } : {}),
    };

    try {
      const response = await fetch(apiUrl(DIGITAL_SYSTEMS_REVIEW_API_PATH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 429) {
        setErrors({
          form:
            data?.error
            || 'Too many requests were submitted recently. Please wait a short while and try again, or use the general contact page.',
        });
        emitError('rate_limited');
        return;
      }

      if (response.status === 503 || response.status >= 500) {
        setErrors({
          form:
            'We could not save your request right now. Please try again shortly, or use the general contact page.',
        });
        emitError('temporary_failure');
        return;
      }

      if (!response.ok) {
        setErrors({
          form: data?.error || 'Could not submit your review request. Please try again.',
        });
        emitError('validation');
        return;
      }

      const resultCategory =
        typeof data?.resultCategory === 'string' ? data.resultCategory : 'created';

      const analyticsPayload = buildDigitalSystemsReviewAnalyticsPayload({
        sourceLocation,
        serviceArea: analyticsServiceArea(),
        preferredNextStep: form.preferredNextStep,
        route: DIGITAL_SYSTEMS_REVIEW_PATH,
        resultCategory,
      });
      assertNoProhibitedAnalyticsProps(analyticsPayload);
      trackConversionEvent('free_review_form_submit', analyticsPayload);

      // Non-PII one-time marker only (created|duplicate). Never block navigation.
      writeFreeReviewSuccessMarker(resultCategory);

      navigate(DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH, { replace: true });
    } catch {
      setErrors({
        form:
          'Could not submit your review request. Please check your connection, or use the general contact page.',
      });
      emitError('network');
    } finally {
      submittingLockRef.current = false;
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full min-h-[48px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue';
  const errorIds = {
    name: `${formId}-name-error`,
    workEmail: `${formId}-email-error`,
    company: `${formId}-company-error`,
    website: `${formId}-website-error`,
    serviceArea: `${formId}-service-error`,
    context: `${formId}-context-error`,
    preferredNextStep: `${formId}-next-error`,
    acknowledgement: `${formId}-ack-error`,
    form: `${formId}-form-error`,
  };

  const errorEntries = Object.entries(errors).filter(([, message]) => Boolean(message));

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errorEntries.length > 0 ? (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={`${formId}-error-summary-title`}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <p id={`${formId}-error-summary-title`} className="font-semibold">
            There {errorEntries.length === 1 ? 'is a problem' : 'are problems'} with your submission
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorEntries.map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
          <p className="mt-3">
            If you prefer, you can also{' '}
            <Link to={CANONICAL_ROUTES.contact} className="font-semibold underline">
              contact us
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-name`} className="mb-1.5 block text-sm font-semibold text-slate-800">
            Name <span className="text-red-600" aria-hidden>*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            required
            maxLength={REVIEW_FIELD_LIMITS.nameMax}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorIds.name : undefined}
          />
          {errors.name ? (
            <p id={errorIds.name} className="mt-1 text-xs font-medium text-red-600" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${formId}-email`} className="mb-1.5 block text-sm font-semibold text-slate-800">
            Work email <span className="text-red-600" aria-hidden>*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id={`${formId}-email`}
            name="workEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={REVIEW_FIELD_LIMITS.emailMax}
            value={form.workEmail}
            onChange={(e) => update('workEmail', e.target.value)}
            className={fieldClass}
            aria-invalid={Boolean(errors.workEmail)}
            aria-describedby={errors.workEmail ? errorIds.workEmail : undefined}
          />
          {errors.workEmail ? (
            <p id={errorIds.workEmail} className="mt-1 text-xs font-medium text-red-600" role="alert">
              {errors.workEmail}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-company`} className="mb-1.5 block text-sm font-semibold text-slate-800">
            Company <span className="text-red-600" aria-hidden>*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id={`${formId}-company`}
            name="company"
            autoComplete="organization"
            required
            maxLength={REVIEW_FIELD_LIMITS.companyMax}
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            className={fieldClass}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? errorIds.company : undefined}
          />
          {errors.company ? (
            <p id={errorIds.company} className="mt-1 text-xs font-medium text-red-600" role="alert">
              {errors.company}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${formId}-website`} className="mb-1.5 block text-sm font-semibold text-slate-800">
            Website <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id={`${formId}-website`}
            name="website"
            type="url"
            autoComplete="url"
            maxLength={REVIEW_FIELD_LIMITS.websiteMax}
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            className={fieldClass}
            placeholder="https://"
            aria-invalid={Boolean(errors.website)}
            aria-describedby={
              errors.website
                ? `${formId}-website-hint ${errorIds.website}`
                : `${formId}-website-hint`
            }
          />
          <p id={`${formId}-website-hint`} className="mt-1 text-xs text-slate-500">
            Optional. Include your public website if it helps the review.
          </p>
          {errors.website ? (
            <p id={errorIds.website} className="mt-1 text-xs font-medium text-red-600" role="alert">
              {errors.website}
            </p>
          ) : null}
        </div>
      </div>

      {/* Visually hidden honeypot — leave blank */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={`${formId}-hp`}>Company website</label>
        <input
          id={`${formId}-hp`}
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.companyWebsite}
          onChange={(e) => update('companyWebsite', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={`${formId}-service`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          What do you need help with? <span className="text-red-600" aria-hidden>*</span>
          <span className="sr-only">(required)</span>
        </label>
        <select
          id={`${formId}-service`}
          name="serviceArea"
          required
          value={form.serviceArea}
          onChange={(e) => update('serviceArea', e.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(errors.serviceArea)}
          aria-describedby={errors.serviceArea ? errorIds.serviceArea : undefined}
        >
          <option value="">Select an option</option>
          {REVIEW_SERVICE_AREAS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.serviceArea ? (
          <p id={errorIds.serviceArea} className="mt-1 text-xs font-medium text-red-600" role="alert">
            {errors.serviceArea}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-context`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Short context <span className="text-red-600" aria-hidden>*</span>
          <span className="sr-only">(required)</span>
        </label>
        <textarea
          id={`${formId}-context`}
          name="context"
          rows={4}
          required
          maxLength={REVIEW_FIELD_LIMITS.contextMax}
          value={form.context}
          onChange={(e) => update('context', e.target.value)}
          className={`${fieldClass} min-h-[120px] resize-y`}
          placeholder="Tell us where your website, CRM, software or support model is creating friction."
          aria-invalid={Boolean(errors.context)}
          aria-describedby={`${formId}-context-hint${errors.context ? ` ${errorIds.context}` : ''}`}
        />
        <p id={`${formId}-context-hint`} className="mt-1 text-xs text-slate-500">
          {REVIEW_FIELD_LIMITS.contextMin}–{REVIEW_FIELD_LIMITS.contextMax} characters.
        </p>
        {errors.context ? (
          <p id={errorIds.context} className="mt-1 text-xs font-medium text-red-600" role="alert">
            {errors.context}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-next`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Preferred next step <span className="text-red-600" aria-hidden>*</span>
          <span className="sr-only">(required)</span>
        </label>
        <select
          id={`${formId}-next`}
          name="preferredNextStep"
          required
          value={form.preferredNextStep}
          onChange={(e) => update('preferredNextStep', e.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(errors.preferredNextStep)}
          aria-describedby={errors.preferredNextStep ? errorIds.preferredNextStep : undefined}
        >
          <option value="">Select a next step</option>
          {REVIEW_PREFERRED_NEXT_STEPS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.preferredNextStep ? (
          <p
            id={errorIds.preferredNextStep}
            className="mt-1 text-xs font-medium text-red-600"
            role="alert"
          >
            {errors.preferredNextStep}
          </p>
        ) : null}
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            id={`${formId}-ack`}
            type="checkbox"
            checked={form.acknowledgement}
            onChange={(e) => update('acknowledgement', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            aria-invalid={Boolean(errors.acknowledgement)}
            aria-describedby={errors.acknowledgement ? errorIds.acknowledgement : undefined}
            required
          />
          <span>
            I understand that Primewayz will use the information submitted to review and respond to
            this request. See our{' '}
            <Link
              to={COMPANY_TRUST_LINKS.privacyPolicy}
              className="font-semibold text-brand-blue underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.acknowledgement ? (
          <p
            id={errorIds.acknowledgement}
            className="mt-1 text-xs font-medium text-red-600"
            role="alert"
          >
            {errors.acknowledgement}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#000A2D]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          FREE_REVIEW_CTA_LABEL
        )}
      </button>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Prefer not to use this form?{' '}
        <Link to={CANONICAL_ROUTES.contact} className="font-semibold text-brand-blue underline">
          Contact us
        </Link>
        .
      </p>
    </form>
  );
}
