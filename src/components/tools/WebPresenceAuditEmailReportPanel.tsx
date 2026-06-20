import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import type { ShareLinkState } from '../../lib/audit/share/shareReportService';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { trackEvent } from '../../lib/analytics';
import { getUtmAnalyticsPayload } from '../../lib/utm';
import { apiUrl } from '../../utils/apiUrl';

export type EmailReportPhase = 'form' | 'submitting' | 'success' | 'skipped' | 'error';

type WebPresenceAuditEmailReportPanelProps = {
  report: WebPresenceAuditReport;
  ctaLocation: string;
  shareLink: ShareLinkState | null;
  onShareLinkChange: (link: ShareLinkState) => void;
  mode?: 'inline' | 'modal';
  contactCtaHref?: string;
  onPhaseChange?: (phase: EmailReportPhase) => void;
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

function getEmailDialogTitle(phase: EmailReportPhase): string {
  switch (phase) {
    case 'submitting':
      return 'Sending report…';
    case 'success':
      return 'Report emailed successfully';
    case 'skipped':
      return 'Lead saved, email not sent';
    case 'error':
      return "We couldn't email the report";
    default:
      return 'Email this report';
  }
}

export { getEmailDialogTitle };

export function WebPresenceAuditEmailReportPanel({
  report,
  ctaLocation,
  shareLink,
  onShareLinkChange,
  mode = 'inline',
  contactCtaHref = '/#contact',
  onPhaseChange,
}: WebPresenceAuditEmailReportPanelProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [phase, setPhase] = useState<EmailReportPhase>('form');
  const [successShareUrl, setSuccessShareUrl] = useState<string | null>(shareLink?.shareUrl ?? null);
  const [copied, setCopied] = useState(false);

  const scoreBand = getScoreBand(report.score);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof FormErrors] || errors.form) {
      setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    }
    if (phase === 'error') {
      setPhase('form');
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
    trackEvent('web_presence_audit_share_link_created', {
      score_band: `${scoreBand.min}-${scoreBand.max}`,
      score_label: scoreBand.label,
      cta_location: ctaLocation,
    });
    return link;
  };

  const copyShareLink = async () => {
    if (!successShareUrl) return;

    try {
      await navigator.clipboard.writeText(successShareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setPhase('submitting');
    setErrors({});

    try {
      const link = await ensureShareLink();
      setSuccessShareUrl(link.shareUrl);

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
        emailDeliveryStatus?: 'sent' | 'partial' | 'skipped' | 'failed';
        emailDeliveryMessage?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not email this report.');
      }

      trackEvent('web_presence_audit_email_report_sent', {
        score_band: `${scoreBand.min}-${scoreBand.max}`,
        score_label: scoreBand.label,
        cta_location: ctaLocation,
      });

      if (payload.emailDeliveryStatus === 'skipped') {
        setPhase('skipped');
        return;
      }

      if (payload.emailDeliveryStatus === 'failed') {
        setPhase('error');
        setErrors({
          form: payload.emailDeliveryMessage || 'Lead saved, but the report email could not be sent. Please try again.',
        });
        return;
      }

      setPhase('success');
    } catch (submitError) {
      setPhase('error');
      setErrors({
        form: submitError instanceof Error ? submitError.message : 'Could not email this report.',
      });
    }
  };

  const actionButtonClass =
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50';
  const primaryButtonClass =
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950';

  if (mode === 'modal' && phase === 'submitting') {
    return (
      <section className="bg-white px-2 py-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
        <p className="mt-4 text-lg font-bold text-slate-950">Sending report…</p>
      </section>
    );
  }

  if (phase === 'success' || phase === 'skipped') {
    const isSkipped = phase === 'skipped';

    return (
      <section className={mode === 'modal' ? 'bg-white px-2 py-2 text-center' : 'rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 text-center shadow-sm sm:p-6'}>
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            isSkipped ? 'bg-amber-50' : 'bg-emerald-50'
          }`}
        >
          {isSkipped ? (
            <AlertTriangle className="h-7 w-7 text-amber-600" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          )}
        </div>

        <h2 className={`mt-4 font-black tracking-tight text-slate-950 ${mode === 'modal' ? 'text-2xl' : 'text-lg'}`}>
          {isSkipped ? 'Lead saved, email not sent' : 'Report emailed successfully'}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {isSkipped
            ? 'We saved your request, but email delivery is not configured on this server.'
            : "We've sent the audit summary and shared report link to your inbox. If it does not arrive within a few minutes, please check your spam folder."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {successShareUrl ? (
            <>
              <a
                href={successShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={actionButtonClass}
              >
                Open shared report
                <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" onClick={copyShareLink} className={actionButtonClass}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy report link
                  </>
                )}
              </button>
            </>
          ) : null}

          {mode === 'modal' ? (
            <Dialog.Close className={primaryButtonClass}>
              Close
            </Dialog.Close>
          ) : null}
        </div>

        <p className="mx-auto mt-5 max-w-md text-xs leading-5 text-slate-500">
          Need a verified assessment?{' '}
          <a
            href={contactCtaHref}
            className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline-offset-2 hover:underline"
          >
            Request verified audit
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      </section>
    );
  }

  const showErrorHeading = phase === 'error' && mode === 'modal';
  const heading = showErrorHeading ? "We couldn't email the report" : 'Email this report';
  const description = showErrorHeading
    ? errors.form
    : 'Send a copy of your audit summary and shared report link to your inbox. Optionally request a 30-day re-check reminder.';

  return (
    <section className={mode === 'modal' ? 'bg-white' : 'rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm sm:p-6'}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={mode === 'modal' ? 'text-2xl font-black tracking-tight text-slate-950' : 'text-lg font-black tracking-tight text-slate-950'}>
            {heading}
          </h2>
          {description ? (
            <p
              className={`mt-1 max-w-2xl text-sm leading-6 ${
                showErrorHeading ? 'font-semibold text-red-700' : 'text-slate-600'
              }`}
              role={showErrorHeading ? 'alert' : undefined}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

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
              disabled={phase === 'submitting'}
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
              disabled={phase === 'submitting'}
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
            disabled={phase === 'submitting'}
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
            disabled={phase === 'submitting'}
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(event) => updateField('consent', event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            disabled={phase === 'submitting'}
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
            disabled={phase === 'submitting'}
          />
          <span className="text-sm leading-6 text-slate-700">
            Remind me to re-check this website in 30 days.
          </span>
        </label>

        {errors.form && !showErrorHeading ? (
          <p className="text-sm font-semibold text-red-700" role="alert">{errors.form}</p>
        ) : null}

        <button
          type="submit"
          disabled={phase === 'submitting'}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {phase === 'submitting' ? (
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
    </section>
  );
}
