import { useState } from 'react';
import { Check, Copy, Link2, Loader2, Share2 } from 'lucide-react';
import type { WebPresenceAuditReport } from '../../lib/audit/types';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { AUDIT_SHARE_SHORT_DISCLAIMER } from '../../lib/audit/share/disclaimers';
import { trackEvent } from '../../lib/analytics';
import { apiUrl } from '../../utils/apiUrl';

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
    <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <Share2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Create share link</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Generate a read-only online report you can share with colleagues or stakeholders.
          </p>
          <p className="mt-3 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700">
            {AUDIT_SHARE_SHORT_DISCLAIMER}
          </p>

          {error ? (
            <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          {!shareUrl ? (
            <button
              type="button"
              onClick={createShareLink}
              disabled={isCreating}
              className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating share link…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Create share link
                </>
              )}
            </button>
          ) : (
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Shareable report link
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                  aria-label="Shareable report link"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Shared reports omit submitted contact details and internal crawl data. Links are public to anyone with the URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
