import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../utils/apiUrl';
import { COMPANY_TRUST_LINKS } from '../../constants/companyTrustLinks';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';
import {
  budgetRangeOptions,
  helpNeedOptions,
  SDAAS_CAPACITY_REQUEST_PATH,
  timeframeOptions,
} from '../../data/sdaas/commercialPage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN = 2;
const NAME_MAX = 80;

type FormState = {
  firstName: string;
  workEmail: string;
  companyName: string;
  websiteUrl: string;
  helpNeed: string;
  technology: string;
  timeframe: string;
  budgetRange: string;
  marketingConsent: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>> & { form?: string };

const initialState: FormState = {
  firstName: '',
  workEmail: '',
  companyName: '',
  websiteUrl: '',
  helpNeed: '',
  technology: '',
  timeframe: '',
  budgetRange: '',
  marketingConsent: false,
};

function sanitizeText(value: string, max = 500): string {
  return value.replace(/[<>]/g, '').trim().slice(0, max);
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  const firstName = sanitizeText(form.firstName, NAME_MAX);
  if (firstName.length < NAME_MIN) {
    errors.firstName = 'Please enter your first name.';
  }

  const email = sanitizeText(form.workEmail, 120).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    errors.workEmail = 'Please enter a valid work email address.';
  }

  if (sanitizeText(form.companyName, 120).length < 2) {
    errors.companyName = 'Please enter your company name.';
  }

  const website = sanitizeText(form.websiteUrl, 200);
  if (!website) {
    errors.websiteUrl = 'Please enter your website or product URL.';
  }

  if (!form.helpNeed) {
    errors.helpNeed = 'Please select what you need help with.';
  }

  return errors;
}

function buildMessage(form: FormState): string {
  return [
    'SDaaS capacity recommendation request.',
    `Company: ${sanitizeText(form.companyName, 120)}.`,
    `Website/product: ${sanitizeText(form.websiteUrl, 200)}.`,
    `Help need: ${sanitizeText(form.helpNeed, 120)}.`,
    form.technology ? `Technology: ${sanitizeText(form.technology, 200)}.` : null,
    form.timeframe ? `Preferred start: ${sanitizeText(form.timeframe, 80)}.` : null,
    form.budgetRange ? `Estimated monthly budget range: ${sanitizeText(form.budgetRange, 80)}.` : null,
    `Marketing consent: ${form.marketingConsent ? 'yes' : 'no'}.`,
    `Source page: ${SDAAS_CAPACITY_REQUEST_PATH}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function SdaasCapacityRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errors]);

  const markFormStart = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackSdaasEvent('sdaas_form_start', {
      cta_location: 'capacity_form',
      source_page: SDAAS_CAPACITY_REQUEST_PATH,
    });
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    markFormStart();
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizeText(form.firstName, NAME_MAX),
          email: sanitizeText(form.workEmail, 120).toLowerCase(),
          message: buildMessage(form),
          phone: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      trackSdaasEvent('sdaas_form_submit', {
        cta_location: 'capacity_form',
        source_page: SDAAS_CAPACITY_REQUEST_PATH,
        help_need: form.helpNeed,
      });

      setSubmitted(true);
      setForm(initialState);
      startedRef.current = false;
    } catch {
      setErrors({
        form: 'We could not send your request just now. Please try again or email us via the contact page.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-slate-900"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Request received</h2>
        <p className="mt-3 text-base leading-7 text-slate-700">
          Thank you. We will review your systems and workload and recommend whether a subscription,
          a defined project or a discovery phase is the better route.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to={CANONICAL_ROUTES.softwareDevelopmentSubscription}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Back to the service page
          </Link>
          <Link
            to={CANONICAL_ROUTES.bookCall}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-400"
          >
            Book a consultation
          </Link>
        </div>
      </div>
    );
  }

  const errorEntries = Object.entries(errors).filter(([key]) => key !== 'form');

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-describedby="sdaas-form-intro"
    >
      <p id="sdaas-form-intro" className="text-sm leading-6 text-slate-600">
        Tell us about the software you are maintaining or improving. Required fields are marked with an
        asterisk.
      </p>

      {(errors.form || errorEntries.length > 0) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Please correct the following:</p>
              {errors.form ? <p className="mt-1">{errors.form}</p> : null}
              {errorEntries.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errorEntries.map(([key, message]) => (
                    <li key={key}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          id="sdaas-first-name"
          label="First name"
          required
          autoComplete="given-name"
          value={form.firstName}
          error={errors.firstName}
          onChange={(value) => updateField('firstName', value)}
        />
        <Field
          id="sdaas-work-email"
          label="Work email"
          type="email"
          required
          autoComplete="email"
          value={form.workEmail}
          error={errors.workEmail}
          onChange={(value) => updateField('workEmail', value)}
        />
        <Field
          id="sdaas-company"
          label="Company name"
          required
          autoComplete="organization"
          value={form.companyName}
          error={errors.companyName}
          onChange={(value) => updateField('companyName', value)}
        />
        <Field
          id="sdaas-website"
          label="Website or product URL"
          required
          autoComplete="url"
          inputMode="url"
          placeholder="https://"
          value={form.websiteUrl}
          error={errors.websiteUrl}
          onChange={(value) => updateField('websiteUrl', value)}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="sdaas-help-need" className="block text-sm font-semibold text-slate-900">
          What do you need help with? <span aria-hidden="true">*</span>
        </label>
        <select
          id="sdaas-help-need"
          required
          value={form.helpNeed}
          aria-invalid={Boolean(errors.helpNeed)}
          aria-describedby={errors.helpNeed ? 'sdaas-help-need-error' : undefined}
          onChange={(event) => updateField('helpNeed', event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <option value="">Select an option</option>
          {helpNeedOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.helpNeed ? (
          <p id="sdaas-help-need-error" className="mt-1 text-sm text-red-700">
            {errors.helpNeed}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field
          id="sdaas-technology"
          label="Current technology, if known"
          value={form.technology}
          onChange={(value) => updateField('technology', value)}
        />
        <div>
          <label htmlFor="sdaas-timeframe" className="block text-sm font-semibold text-slate-900">
            Preferred start timeframe
          </label>
          <select
            id="sdaas-timeframe"
            value={form.timeframe}
            onChange={(event) => updateField('timeframe', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Optional</option>
            {timeframeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sdaas-budget" className="block text-sm font-semibold text-slate-900">
            Estimated monthly budget range
          </label>
          <select
            id="sdaas-budget"
            value={form.budgetRange}
            onChange={(event) => updateField('budgetRange', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Optional</option>
            {budgetRangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="sr-only">Marketing consent</legend>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(event) => updateField('marketingConsent', event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            I would like to receive occasional product and delivery updates from Primewayz UK. See our{' '}
            <Link to={COMPANY_TRUST_LINKS.privacyPolicy} className="font-semibold text-emerald-700 underline">
              Privacy Policy
            </Link>
            . You can unsubscribe at any time.
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending request…
          </>
        ) : (
          'Request a Capacity Recommendation'
        )}
      </button>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
  error?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  error,
}: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
