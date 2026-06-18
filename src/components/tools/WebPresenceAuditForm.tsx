import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Loader2,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import { trackEvent } from '../../lib/analytics';
import { apiUrl } from '../../utils/apiUrl';
import { WebPresenceAuditResult } from './WebPresenceAuditResult';

const businessTypes = [
  'Local service business',
  'Professional services',
  'Ecommerce business',
  'Software / IT services',
  'Healthcare / clinic',
  'Education / training',
  'Restaurant / hospitality',
  'Other',
] as const;

const benefits = [
  'Website SEO and trust signal checks',
  'Lead capture and enquiry path review',
  'UK/local visibility indicators',
  'Social and reputation readiness signals',
  'Clear improvement recommendations',
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

const initialState: FormState = {
  websiteUrl: '',
  businessName: '',
  businessType: '',
  targetCountry: 'United Kingdom',
  location: '',
  phone: '',
  email: '',
};

function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function validateForm(form: FormState): { errors: FormErrors; normalizedUrl?: string } {
  const errors: FormErrors = {};
  const normalizedUrl = normalizeWebsiteUrl(form.websiteUrl);

  if (!form.websiteUrl.trim()) errors.websiteUrl = 'Website URL is required.';
  else if (!normalizedUrl) errors.websiteUrl = 'Enter a valid public website URL or domain.';
  if (!form.businessName.trim()) errors.businessName = 'Business name is required.';
  if (!form.businessType) errors.businessType = 'Select a business type.';
  if (!form.targetCountry.trim()) errors.targetCountry = 'Target country is required.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address or leave it blank.';
  }

  return { errors, normalizedUrl: normalizedUrl || undefined };
}

export function WebPresenceAuditForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<Partial<WebPresenceAuditReport> | null>(null);

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

    trackEvent('web_presence_audit_submit', {
      business_type: form.businessType,
      target_country: form.targetCountry,
      has_location: Boolean(form.location.trim()),
      has_phone: Boolean(form.phone.trim()),
      has_email: Boolean(form.email.trim()),
    });

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
        score: Number(data.score) || 0,
        score_label: data.label || 'unknown',
        pages_crawled: data.metadata?.pagesCrawled ?? 0,
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error
          ? error.message
          : 'The audit could not be completed. Please check the website and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition ${
      hasError
        ? 'border-red-300 ring-2 ring-red-100'
        : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
    }`;

  return (
    <section id="free-web-presence-audit" className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Free UK SME tool</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Free Web Presence Audit for UK SMEs
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Check how well your website supports search visibility, trust, lead capture, and local presence.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label htmlFor="audit-website-url" className="mb-2 block text-sm font-bold text-slate-800">
                  Website URL *
                </label>
                <input
                  id="audit-website-url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="yourbusiness.co.uk"
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
                  <label htmlFor="audit-business-name" className="mb-2 block text-sm font-bold text-slate-800">
                    Business name *
                  </label>
                  <input
                    id="audit-business-name"
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
                  <label htmlFor="audit-business-type" className="mb-2 block text-sm font-bold text-slate-800">
                    Business type *
                  </label>
                  <select
                    id="audit-business-type"
                    value={form.businessType}
                    onChange={(event) => updateField('businessType', event.target.value)}
                    className={inputClass(Boolean(errors.businessType))}
                    aria-invalid={Boolean(errors.businessType)}
                  >
                    <option value="">Select business type</option>
                    {businessTypes.map((businessType) => (
                      <option key={businessType} value={businessType}>{businessType}</option>
                    ))}
                  </select>
                  {errors.businessType ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.businessType}</p> : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="audit-country" className="mb-2 block text-sm font-bold text-slate-800">
                    Target country *
                  </label>
                  <input
                    id="audit-country"
                    type="text"
                    value={form.targetCountry}
                    onChange={(event) => updateField('targetCountry', event.target.value)}
                    className={inputClass(Boolean(errors.targetCountry))}
                    aria-invalid={Boolean(errors.targetCountry)}
                  />
                  {errors.targetCountry ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.targetCountry}</p> : null}
                </div>

                <div>
                  <label htmlFor="audit-location" className="mb-2 block text-sm font-bold text-slate-800">
                    Location (optional)
                  </label>
                  <input
                    id="audit-location"
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
                  <label htmlFor="audit-phone" className="mb-2 block text-sm font-bold text-slate-800">
                    Phone (optional)
                  </label>
                  <input
                    id="audit-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label htmlFor="audit-email" className="mb-2 block text-sm font-bold text-slate-800">
                    Email (optional)
                  </label>
                  <input
                    id="audit-email"
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
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                {errors.form}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running audit...
                </>
              ) : (
                <>
                  Run free audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="lg:pt-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <SearchCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
              A practical snapshot of how customers and search engines may understand your website.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The audit reviews a small set of public website pages and returns evidence-based checks. It does not store the report or create a new lead.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-8 border-l-2 border-blue-200 pl-5">
              <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Globe2 className="h-4 w-4 text-blue-700" />
                Honest external-presence reporting
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Google Search Presence and Bing Search Presence are shown as not verified in this free version. The audit does not scrape search engines.
              </p>
            </div>

            <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              Only public HTTP and HTTPS pages are checked. Private and internal network addresses are blocked.
            </p>
          </div>
        </div>

        {report ? <WebPresenceAuditResult report={report} /> : null}
      </div>
    </section>
  );
}
