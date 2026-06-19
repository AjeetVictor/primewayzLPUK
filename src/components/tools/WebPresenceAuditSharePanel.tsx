import { useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Loader2, Share2 } from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { trackEvent } from '../../lib/analytics';
import { apiUrl } from '../../utils/apiUrl';
import { WebPresenceAuditDisclaimer } from './WebPresenceAuditDisclaimer';

type WebPresenceAuditSharePanelProps = {
  report: WebPresenceAuditReport;
  ctaLocation: string;
};

type ShareResponse = {
  shareUrl: string;
  publicToken: string;
  createdAt: string;
};

export function WebPresenceAuditSharePanel({ report, ctaLocation }: WebPresenceAuditSharePanelProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const createShareLink = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/tools/web-presence-audit/share'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });

      const payload = await response.json().catch(() => ({})) as ShareResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not create a share link.');
      }

      setShareUrl(payload.shareUrl);

      const scoreBand = getScoreBand(report.score);
      trackEvent('web_presence_audit_share_created', {
        score_band: `${scoreBand.min}-${scoreBand.max}`,
        score_label: scoreBand.label,
        pages_crawled: report.metadata.pagesCrawled,
        cta_location: ctaLocation,
      });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Could not create a share link.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link. Please copy it manually.');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Share report</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Create a read-only online report link for colleagues or stakeholders.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {!shareUrl ? (
            <button
              type="button"
              onClick={createShareLink}
              disabled={isCreating}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Create share link
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy share link
                  </>
                )}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Open shared report
                <ExternalLink className="h-4 w-4" />
              </a>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {shareUrl ? (
        <p className="mt-4 truncate text-xs text-slate-500" title={shareUrl}>
          {shareUrl}
        </p>
      ) : null}

      <div className="mt-5">
        <WebPresenceAuditDisclaimer compact />
      </div>
    </section>
  );
}
