import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Check, Copy, Loader2 } from 'lucide-react';
import type { SharedWebPresenceAuditReport } from '../../lib/audit/types';
import { getSharedReportContactCtaUrl } from '../../lib/audit/share/disclaimers';
import { apiUrl } from '../../utils/apiUrl';
import { WebPresenceAuditResult } from './WebPresenceAuditResult';

const LOGO = '/primewayz-infotech-logo.svg';

type SharedReportResponse = {
  publicToken: string;
  createdAt: string;
  report: SharedWebPresenceAuditReport;
};

function SharedReportTopBar() {
  const [copied, setCopied] = useState(false);
  const contactHref = getSharedReportContactCtaUrl();

  const copyReportLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can copy from the address bar.
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Public shareable report
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyReportLink}
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
                Copy report link
              </>
            )}
          </button>
          <a
            href={contactHref}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950"
          >
            Request an in-depth digital visibility audit
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function WebPresenceAuditSharedReportPage() {
  const { publicToken } = useParams<{ publicToken: string }>();
  const [report, setReport] = useState<SharedWebPresenceAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    robotsMeta.content = 'noindex, nofollow';
    document.head.appendChild(robotsMeta);

    return () => {
      document.head.removeChild(robotsMeta);
    };
  }, []);

  useEffect(() => {
    if (!publicToken) {
      setError('This shared report link is invalid.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl(`/api/tools/web-presence-audit/report/${encodeURIComponent(publicToken)}`));
        const payload = await response.json().catch(() => ({})) as SharedReportResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || 'This shared report could not be found.');
        }

        if (!cancelled) {
          setReport(payload.report);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'This shared report could not be loaded.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [publicToken]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={LOGO} alt="Primewayz UK" className="h-9 w-auto" />
            <span className="text-sm font-bold text-slate-900">Primewayz UK</span>
          </Link>
          <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
            Shared web presence audit
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            <p className="text-sm font-semibold">Loading shared report…</p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-red-600" />
            <p className="mt-3 text-sm font-semibold text-red-800">{error}</p>
            <Link
              to="/uk-sme-digital-visibility-checker"
              className="mt-5 inline-flex rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950"
            >
              Run your own free audit
            </Link>
          </div>
        ) : null}

        {!isLoading && report ? (
          <>
            <SharedReportTopBar />
            <WebPresenceAuditResult report={report} mode="shared" />
          </>
        ) : null}
      </main>
    </div>
  );
}
