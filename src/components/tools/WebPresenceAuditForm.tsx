import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Globe2,
  Loader2,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import { trackEvent } from '../../lib/analytics';
import { captureUtmParams, getUtmAnalyticsPayload } from '../../lib/utm';
import { apiUrl } from '../../utils/apiUrl';
import { normaliseWebsiteUrl } from '../../utils/normalizeWebsiteUrl';
import { WebPresenceAuditResult } from './WebPresenceAuditResult';

const businessTypes = [
  'Local service business',
  'Professional services',
  'Financial services',
  'Ecommerce business',
  'Software / IT services',
  'Healthcare / clinic',
  'Education / training',
  'Restaurant / hospitality',
  'Other',
] as const;

const benefits = [
  'SEO and technical visibility checks',
  'Trust and contact signal review',
  'Lead capture and enquiry path checks',
  'UK/local relevance indicators',
  'Reputation, social, and analytics readiness',
] as const;

const loadingSteps = [
  'Validating website URL',
  'Resolving public domain safely',
  'Reading homepage content',
  'Discovering contact, about, service, privacy, and terms pages',
  'Checking SEO and indexability signals',
  'Reviewing trust and contact signals',
  'Inspecting lead capture and CTA paths',
  'Checking UK/local relevance indicators',
  'Looking for social, reputation, and analytics readiness',
  'Preparing your audit report',
] as const;

type FormState = {
  websiteUrl: string;
  businessName: string;
  businessType: string;
  targetCountry: string;
  location: string;
  phone: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormState | 'form', string>>;

export type WebPresenceAuditFormProps = {
  variant?: 'homepage' | 'landing';
  showIntro?: boolean;
  analyticsLocation?: string;
  anchorId?: string;
  defaultTargetCountry?: string;
  defaultBusinessType?: string;
};

function createInitialState(targetCountry: string, businessType: string): FormState {
  return {
    websiteUrl: '',
    businessName: '',
    businessType,
    targetCountry,
    location: '',
    phone: '',
    email: '',
  };
}

function isValidPublicWebsiteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return false;
    return true;
  } catch {
    return false;
  }
}

function validateForm(form: FormState): { errors: FormErrors; normalizedUrl?: string } {
  const errors: FormErrors = {};
  const normalizedUrl = normaliseWebsiteUrl(form.websiteUrl);

  if (!form.websiteUrl.trim()) errors.websiteUrl = 'Website URL is required.';
  else if (!isValidPublicWebsiteUrl(normalizedUrl)) errors.websiteUrl = 'Enter a valid public website URL or domain.';
  if (!form.businessName.trim()) errors.businessName = 'Business name is required.';
  if (!form.businessType) errors.businessType = 'Select a business type.';
  if (!form.targetCountry.trim()) errors.targetCountry = 'Target country is required.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address or leave it blank.';
  }

  return { errors, normalizedUrl: normalizedUrl || undefined };
}

function AuditLoadingPanel({ activeStep }: { activeStep: number }) {
  const progress = Math.min(94, 10 + activeStep * 9);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/70 p-5" role="status" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#000A2D] text-white shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="absolute inset-0 rounded-xl ring-4 ring-blue-300/30 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="font-black text-slate-950">Building your audit report</p>
            <span className="text-xs font-bold tabular-nums text-blue-800">{progress}%</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{loadingSteps[activeStep]}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500 transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {loadingSteps.slice(0, 6).map((step, index) => {
          const completed = index < activeStep;
          const active = index === activeStep;
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                active ? 'bg-white text-blue-900 shadow-sm' : completed ? 'text-emerald-800' : 'text-slate-400'
              }`}
            >
              {completed ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditIntroPanel({ headingId }: { headingId: string }) {
  return (
    <div className="relative overflow-hidden bg-[#000A2D] p-7 text-white sm:p-10 lg:p-12">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
          <Sparkles className="h-3.5 w-3.5" />
          Free UK SME tool
        </p>
        <h2 id={headingId} className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
          Is your website enquiry-ready?
        </h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-slate-200">
          Run a quick web presence audit to see how your website performs across visibility, trust, lead capture, local relevance, reputation signals, and tracking readiness.
        </p>

        <ul className="mt-8 space-y-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm font-semibold text-slate-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-200">Audit preview</p>
              <p className="mt-1 text-lg font-black">9 readiness categories</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-300/30 text-lg font-black text-emerald-200">
              100
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[82, 66, 91].map((width, index) => (
              <div key={width} className="rounded-lg bg-white/10 p-2">
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${index === 1 ? 'bg-amber-300' : 'bg-emerald-300'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Public HTTP and HTTPS pages only. Private and internal network addresses are blocked.
        </p>
      </div>
    </div>
  );
}

export function WebPresenceAuditForm({
  variant = 'homepage',
  showIntro,
  analyticsLocation,
  anchorId,
  defaultTargetCountry = 'United Kingdom',
  defaultBusinessType = '',
}: WebPresenceAuditFormProps = {}) {
  const resolvedShowIntro = showIntro ?? variant === 'homepage';
  const resolvedAnalyticsLocation = analyticsLocation ?? (variant === 'homepage' ? 'homepage_audit_section' : 'checker_page');
  const fieldIdPrefix = variant === 'landing' ? 'checker-audit' : 'audit';
  const headingId = useId();

  const [form, setForm] = useState(() => createInitialState(defaultTargetCountry, defaultBusinessType));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeLoadingStep, setActiveLoadingStep] = useState(0);
  const [report, setReport] = useState<Partial<WebPresenceAuditReport> | null>(null);

  useEffect(() => {
    captureUtmParams();
    trackEvent('web_presence_audit_view', {
      cta_location: resolvedAnalyticsLocation,
      page_variant: variant,
      ...getUtmAnalyticsPayload(),
    });
  }, [resolvedAnalyticsLocation, variant]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const websiteParam = new URLSearchParams(window.location.search).get('website');
    if (!websiteParam) return;

    const normalizedWebsite = normaliseWebsiteUrl(websiteParam);
    if (!isValidPublicWebsiteUrl(normalizedWebsite)) return;

    setForm((current) => {
      if (current.websiteUrl.trim()) return current;
      return { ...current, websiteUrl: normalizedWebsite };
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setActiveLoadingStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveLoadingStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 850);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors.form) {
      setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation.errors).length > 0 || !validation.normalizedUrl) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setReport(null);

    const safeAnalyticsContext = {
      business_type: form.businessType,
      target_country: form.targetCountry,
      has_location: Boolean(form.location.trim()),
      has_phone: Boolean(form.phone.trim()),
      has_email: Boolean(form.email.trim()),
      cta_location: resolvedAnalyticsLocation,
      page_variant: variant,
      ...getUtmAnalyticsPayload(),
    };

    trackEvent('web_presence_audit_submit', safeAnalyticsContext);

    try {
      const response = await fetch(apiUrl('/api/tools/web-presence-audit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: validation.normalizedUrl,
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          targetCountry: form.targetCountry.trim(),
          location: form.location.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'The audit could not be completed.');
      }

      setForm((current) => ({ ...current, websiteUrl: validation.normalizedUrl! }));
      setReport(data);
      trackEvent('web_presence_audit_result_view', {
        ...safeAnalyticsContext,
        score: Number(data.score) || 0,
        score_label: data.label || 'unknown',
        pages_crawled: data.metadata?.pagesCrawled ?? 0,
        audit_success: true,
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error
          ? error.message
          : 'The audit could not be completed. Please check the website and try again.',
      });
      trackEvent('web_presence_audit_result_view', {
        ...safeAnalyticsContext,
        audit_success: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition ${
      hasError
        ? 'border-red-300 ring-2 ring-red-100'
        : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
    }`;

  const formPanel = (
    <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-9 lg:p-12">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <SearchCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">Check my website</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Enter your details for a personalised, evidence-based report. Nothing is stored.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5">
        <div>
          <label htmlFor={`${fieldIdPrefix}-website-url`} className="mb-2 block text-sm font-bold text-slate-800">Website URL *</label>
          <input
            id={`${fieldIdPrefix}-website-url`}
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourbusiness.co.uk"
            value={form.websiteUrl}
            onChange={(event) => updateField('websiteUrl', event.target.value)}
            className={inputClass(Boolean(errors.websiteUrl))}
            aria-invalid={Boolean(errors.websiteUrl)}
          />
          <p className="mt-2 text-xs text-slate-500">A domain without https:// will be normalised automatically.</p>
          {errors.websiteUrl ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.websiteUrl}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldIdPrefix}-business-name`} className="mb-2 block text-sm font-bold text-slate-800">Business name *</label>
            <input
              id={`${fieldIdPrefix}-business-name`}
              type="text"
              autoComplete="organization"
              value={form.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
              className={inputClass(Boolean(errors.businessName))}
              aria-invalid={Boolean(errors.businessName)}
            />
            {errors.businessName ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.businessName}</p> : null}
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-business-type`} className="mb-2 block text-sm font-bold text-slate-800">Business type *</label>
            <select
              id={`${fieldIdPrefix}-business-type`}
              value={form.businessType}
              onChange={(event) => updateField('businessType', event.target.value)}
              className={inputClass(Boolean(errors.businessType))}
              aria-invalid={Boolean(errors.businessType)}
            >
              <option value="">Select business type</option>
              {businessTypes.map((businessType) => <option key={businessType} value={businessType}>{businessType}</option>)}
            </select>
            {errors.businessType ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.businessType}</p> : null}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldIdPrefix}-country`} className="mb-2 block text-sm font-bold text-slate-800">Target country *</label>
            <input
              id={`${fieldIdPrefix}-country`}
              type="text"
              value={form.targetCountry}
              onChange={(event) => updateField('targetCountry', event.target.value)}
              className={inputClass(Boolean(errors.targetCountry))}
              aria-invalid={Boolean(errors.targetCountry)}
            />
            {errors.targetCountry ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.targetCountry}</p> : null}
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-location`} className="mb-2 block text-sm font-bold text-slate-800">Location (optional)</label>
            <input
              id={`${fieldIdPrefix}-location`}
              type="text"
              autoComplete="address-level2"
              placeholder="London"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
              className={inputClass(false)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldIdPrefix}-phone`} className="mb-2 block text-sm font-bold text-slate-800">Phone (optional)</label>
            <input
              id={`${fieldIdPrefix}-phone`}
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className={inputClass(false)}
            />
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-email`} className="mb-2 block text-sm font-bold text-slate-800">Email (optional)</label>
            <input
              id={`${fieldIdPrefix}-email`}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className={inputClass(Boolean(errors.email))}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.email}</p> : null}
          </div>
        </div>
      </div>

      {errors.form ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-[50px] items-center justify-center whitespace-nowrap rounded-xl bg-[#000A2D] px-7 py-3 text-sm font-bold text-white shadow-md shadow-slate-950/10 transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running your audit…
            </>
          ) : (
            <>
              Check my website
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
        <p className="text-xs leading-5 text-slate-500">Usually ready in under a minute.</p>
      </div>

      {isLoading ? <AuditLoadingPanel activeStep={activeLoadingStep} /> : null}
    </form>
  );

  const honestMessaging = (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 font-semibold text-slate-800">
        <Globe2 className="h-4 w-4 text-blue-700" />
        Honest external-presence reporting
      </p>
      <p>Google and Bing presence are shown as not verified. This tool does not scrape search engines.</p>
    </div>
  );

  const resultPanel = report ? (
    <WebPresenceAuditResult
      report={report}
      mode="interactive"
      showSharePanel
      ctaLocation={resolvedAnalyticsLocation}
    />
  ) : null;

  const cardClass =
    variant === 'homepage'
      ? 'overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5'
      : 'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]';

  const inner = (
    <>
      <div className={cardClass}>
        {resolvedShowIntro ? (
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <AuditIntroPanel headingId={headingId} />
            {formPanel}
          </div>
        ) : (
          formPanel
        )}
      </div>
      {honestMessaging}
      {resultPanel}
    </>
  );

  if (variant === 'landing') {
    return <>{inner}</>;
  }

  return (
    <HomepageAuditSection anchorId={anchorId} headingId={headingId}>
      {inner}
    </HomepageAuditSection>
  );
}

function HomepageAuditSection({ children, anchorId, headingId }: { children: ReactNode; anchorId?: string; headingId: string }) {
  return (
    <section
      id={anchorId || 'free-web-presence-audit'}
      aria-labelledby={headingId}
      className="overflow-hidden border-y border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <span id="web-presence-audit" className="sr-only" aria-hidden="true" />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
