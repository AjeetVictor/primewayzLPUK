import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import type { ShareLinkState } from '../../lib/audit/share/shareReportService';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { trackEvent } from '../../lib/analytics';
import { getUtmAnalyticsPayload } from '../../lib/utm';
import { apiUrl } from '../../utils/apiUrl';

type WebPresenceAuditEmailReportPanelProps = {
  report: WebPresenceAuditReport;
  ctaLocation: string;
  shareLink: ShareLinkState | null;
  onShareLinkChange: (link: ShareLinkState) => void;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  reminderOptIn: boolean;
};

type FormErrors = {
  name?: string;
  email?: string;
  consent?: string;
  form?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSENT_TEXT =
  'By submitting, you agree that Primewayz UK may email this report and contact you about relevant digital visibility support. This report is a quick public-signal overview, not an authenticated audit.';

const initialFormState: FormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
  consent: false,
  reminderOptIn: false,
};

export function WebPresenceAuditEmailReportPanel({
  report,
  ctaLocation,
  shareLink,
  onShareLinkChange,
}: WebPresenceAuditEmailReportPanelProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const scoreBand = getScoreBand(report.score);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof FormErrors] || errors.form) {
      setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    }
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.consent) {
      nextErrors.consent = 'Consent is required to email this report.';
    }

    return nextErrors;
  };

  const ensureShareLink = async (): Promise<ShareLinkState> => {
    if (shareLink) return shareLink;

    const response = await fetch(apiUrl('/api/tools/web-presence-audit/share'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report }),
    });

    const payload = await response.json().catch(() => ({})) as ShareLinkState & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || 'Could not create a share link.');
    }

    const link: ShareLinkState = {
      shareUrl: payload.shareUrl,
      publicToken: payload.publicToken,
      createdAt: payload.createdAt,
    };

    onShareLinkChange(link);
    return link;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    trackEvent('web_presence_audit_email_report_requested', {
      score_band: `${scoreBand.min}-${scoreBand.max}`,
      score_label: scoreBand.label,
      cta_location: ctaLocation,
      reminder_opt_in: form.reminderOptIn,
    });

    try {
      const link = await ensureShareLink();

      const response = await fetch(apiUrl('/api/tools/web-presence-audit/email-report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken: link.publicToken,
          shareUrl: link.shareUrl,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim() || undefined,
          consent: true,
          reminderOptIn: form.reminderOptIn,
          cta_location: ctaLocation,
          ...getUtmAnalyticsPayload(),
        }),
      });

      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        emailDeliveryMessage?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not email this report.');
      }

      trackEvent('web_presence_audit_email_report_sent', {
        score_band: `${scoreBand.min}-${scoreBand.max}`,
        score_label: scoreBand.label,
        cta_location: ctaLocation,
        reminder_opt_in: form.reminderOptIn,
      });

      setIsSent(true);
    } catch (submitError) {
      setErrors({
        form: submitError instanceof Error ? submitError.message : 'Could not email this report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-tight text-slate-950">Email this report</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Send a copy of your audit summary and shared report link to your inbox. Optionally request a 30-day re-check reminder.
          </p>
        </div>
      </div>

      {isSent ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Report emailed</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Check your inbox for your audit summary and shared report link. If it does not arrive within a few minutes, check your spam folder.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="audit-email-name" className="mb-1.5 block text-sm font-semibold text-slate-800">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                id="audit-email-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
              {errors.name ? (
                <p className="mt-1 text-xs font-semibold text-red-700" role="alert">{errors.name}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="audit-email-address" className="mb-1.5 block text-sm font-semibold text-slate-800">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                id="audit-email-address"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                disabled={isSubmitting}
              />
              {errors.email ? (
                <p className="mt-1 text-xs font-semibold text-red-700" role="alert">{errors.email}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="audit-email-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Phone <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="audit-email-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="audit-email-message" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Message <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="audit-email-message"
              rows={3}
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              disabled={isSubmitting}
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => updateField('consent', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isSubmitting}
            />
            <span className="text-sm leading-6 text-slate-700">
              {CONSENT_TEXT}
            </span>
          </label>
          {errors.consent ? (
            <p className="-mt-2 text-xs font-semibold text-red-700" role="alert">{errors.consent}</p>
          ) : null}

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={form.reminderOptIn}
              onChange={(event) => updateField('reminderOptIn', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isSubmitting}
            />
            <span className="text-sm leading-6 text-slate-700">
              Remind me to re-check this website in 30 days.
            </span>
          </label>

          {errors.form ? (
            <p className="text-sm font-semibold text-red-700" role="alert">{errors.form}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending report…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Email this report
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
}
