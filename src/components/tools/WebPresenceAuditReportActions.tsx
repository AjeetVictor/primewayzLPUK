import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Mail,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import type { ShareLinkState } from '../../lib/audit/share/types';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { trackEvent } from '../../lib/analytics';
import { WebPresenceAuditSharePanel } from './WebPresenceAuditSharePanel';
import {
  getEmailDialogTitle,
  WebPresenceAuditEmailReportPanel,
  type EmailReportPhase,
} from './WebPresenceAuditEmailReportPanel';

type WebPresenceAuditReportActionsProps = {
  report: WebPresenceAuditReport;
  ctaLocation: string;
  shareLink: ShareLinkState | null;
  onShareLinkChange: (link: ShareLinkState) => void;
  contactCtaHref?: string;
};

type ActiveDialog = 'share' | 'email' | null;

export function WebPresenceAuditReportActions({
  report,
  ctaLocation,
  shareLink,
  onShareLinkChange,
  contactCtaHref = '/contact-us#book-call',
}: WebPresenceAuditReportActionsProps) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [emailModalPhase, setEmailModalPhase] = useState<EmailReportPhase>('form');
  const [copied, setCopied] = useState(false);
  const scoreBand = getScoreBand(report.score);
  const analyticsPayload = {
    score_band: `${scoreBand.min}-${scoreBand.max}`,
    score_label: scoreBand.label,
    cta_location: ctaLocation,
  };

  const openDialog = (dialog: Exclude<ActiveDialog, null>) => {
    setActiveDialog(dialog);
    trackEvent(
      dialog === 'share'
        ? 'web_presence_audit_share_modal_opened'
        : 'web_presence_audit_email_modal_opened',
      analyticsPayload,
    );
  };

  const isCompactEmailModal =
    activeDialog === 'email' && (emailModalPhase === 'success' || emailModalPhase === 'skipped');
  const dialogWidthClass = isCompactEmailModal
    ? 'sm:w-[min(92vw,36rem)]'
    : 'sm:w-[min(92vw,42rem)]';

  const copyShareLink = async () => {
    if (!shareLink?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareLink.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      openDialog('share');
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Report actions</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Share this report with your team, email yourself a copy, or request a verified audit.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
            {shareLink?.shareUrl ? (
              <>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <a
                  href={shareLink.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open report
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openDialog('share')}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950"
              >
                <Share2 className="h-4 w-4" />
                Share report
              </button>
            )}

            <button
              type="button"
              onClick={() => openDialog('email')}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" />
              Email report
            </button>

            <a
              href={contactCtaHref}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 sm:col-span-2 lg:col-span-1"
            >
              <ShieldCheck className="h-4 w-4" />
              Request verified audit
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <Dialog.Root
        open={activeDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDialog(null);
            setEmailModalPhase('form');
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px]" />
          <Dialog.Content className={`fixed inset-x-0 bottom-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-2xl transition-[width] focus:outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-6 ${dialogWidthClass}`}>
            <Dialog.Title className="sr-only">
              {activeDialog === 'email' ? getEmailDialogTitle(emailModalPhase) : 'Share report'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {activeDialog === 'email'
                ? emailModalPhase === 'success'
                  ? 'Your audit report has been emailed successfully.'
                  : emailModalPhase === 'skipped'
                    ? 'Your request was saved, but email delivery is not configured.'
                    : emailModalPhase === 'error'
                      ? 'There was a problem emailing this report.'
                      : emailModalPhase === 'submitting'
                        ? 'Sending your audit report by email.'
                        : 'Complete the form to email a copy of this report.'
                : 'Create or manage a read-only share link for this report.'}
            </Dialog.Description>
            <Dialog.Close
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            <div className="pr-12">
              {activeDialog === 'share' ? (
                <WebPresenceAuditSharePanel
                  report={report}
                  ctaLocation={ctaLocation}
                  shareLink={shareLink}
                  onShareLinkChange={onShareLinkChange}
                  mode="modal"
                />
              ) : null}
              {activeDialog === 'email' ? (
                <WebPresenceAuditEmailReportPanel
                  report={report}
                  ctaLocation={ctaLocation}
                  shareLink={shareLink}
                  onShareLinkChange={onShareLinkChange}
                  mode="modal"
                  contactCtaHref={contactCtaHref}
                  onPhaseChange={setEmailModalPhase}
                />
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
