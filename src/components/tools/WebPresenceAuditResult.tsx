import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileSearch,
  Globe2,
  Lightbulb,
  Mail,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  AuditCheck,
  AuditCheckStatus,
  AuditEvidence,
  SharedWebPresenceAuditReport,
  WebPresenceAuditReport,
} from '../../lib/audit/types';
import { getCategoryBand, getScoreBand } from '../../lib/audit/scoreBands';
import { getSharedReportContactCtaUrl } from '../../lib/audit/share/disclaimers';
import { WebPresenceAuditDisclaimer } from './WebPresenceAuditDisclaimer';
import { WebPresenceAuditSharePanel } from './WebPresenceAuditSharePanel';
import { WebPresenceAuditBenchmarkPanel } from './WebPresenceAuditBenchmarkPanel';
import { WebPresenceAuditClassificationPanel } from './WebPresenceAuditClassificationPanel';
import { WebPresenceAuditMobileReadinessPanel } from './WebPresenceAuditMobileReadinessPanel';
import { WebPresenceAuditHeadReadinessPanel } from './WebPresenceAuditHeadReadinessPanel';

type WebPresenceAuditResultProps = {
  report: Partial<WebPresenceAuditReport> | SharedWebPresenceAuditReport;
  mode?: 'interactive' | 'shared';
  showSharePanel?: boolean;
  ctaLocation?: string;
  contactCtaHref?: string;
};


function safeStatus(status?: string): AuditCheckStatus {
  if (status === 'good' || status === 'partial' || status === 'gap' || status === 'not_verified') {
    return status;
  }
  return 'not_verified';
}

function BrandImage({ src, businessName }: { src?: string; businessName: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white ring-1 ring-white/15">
        {businessName.trim().charAt(0).toUpperCase() || <Globe2 className="h-7 w-7" />}
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-white/20">
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function EvidenceList({ evidence }: { evidence?: AuditEvidence[] }) {
  if (!Array.isArray(evidence) || evidence.length === 0) return null;

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <FileSearch className="h-4 w-4" />
        Evidence found
      </p>
      <ul className="mt-3 grid gap-3">
        {evidence.map((item, index) => (
          <li key={`${item.label}-${index}`} className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <span className="font-bold text-slate-800">{item.label}</span>
            {item.value ? `: ${item.value}` : ''}
            {item.snippet ? <span className="mt-1 block text-xs text-slate-500">{item.snippet}</span> : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                View source page
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationList({ recommendations }: { recommendations?: string[] }) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return <p className="text-sm text-emerald-700">No immediate recommendation for this category.</p>;
  }

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <Lightbulb className="h-4 w-4" />
        Recommendations
      </p>
      <ul className="mt-3 space-y-3">
        {recommendations.map((recommendation) => (
          <li key={recommendation} className="flex gap-3 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryCard({ check }: { check: Partial<AuditCheck> }) {
  const points = Number.isFinite(check.points) ? Number(check.points) : 0;
  const maxPoints = Number.isFinite(check.maxPoints) ? Number(check.maxPoints) : 0;
  const ratio = maxPoints > 0 ? Math.max(0, Math.min(100, (points / maxPoints) * 100)) : 0;
  const band = getCategoryBand(ratio, check.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-950">{check.name || 'Audit category'}</h3>
            <p className="mt-2 text-sm font-black" style={{ color: band.textColor }}>
              {points} / {maxPoints} points
            </p>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: band.textColor,
              backgroundColor: band.bgColor,
              borderColor: band.borderColor,
            }}
          >
            {band.label}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: band.mainColor }} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {check.explanation || 'This category did not include an explanation.'}
        </p>
      </div>

      <details className="group border-t border-slate-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 sm:px-6">
          View evidence and actions
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-6 border-t border-slate-100 px-5 py-5 sm:px-6 lg:grid-cols-2">
          <EvidenceList evidence={check.evidence} />
          <RecommendationList recommendations={check.recommendations} />
        </div>
      </details>
    </article>
  );
}

function ProfileItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
      <span className="mt-0.5 text-blue-700">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function WebPresenceAuditResult({
  report,
  mode = 'interactive',
  showSharePanel = false,
  ctaLocation = 'audit_result',
  contactCtaHref,
}: WebPresenceAuditResultProps) {
  const isShared = mode === 'shared';
  const sharedContactHref = contactCtaHref ?? getSharedReportContactCtaUrl();
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const scoreBand = getScoreBand(score);
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const metadata = report.metadata;
  const profile = report.profile;
  const generatedAt = metadata?.generatedAt ? new Date(metadata.generatedAt) : null;
  const validGeneratedAt = generatedAt && !Number.isNaN(generatedAt.getTime());
  const businessName = profile?.businessName || 'Your website';
  const brandImage = profile?.logoUrl || profile?.faviconUrl || profile?.openGraphImage;
  const interactiveProfile = !isShared && profile ? profile as WebPresenceAuditReport['profile'] : null;

  const priorities = checks
    .filter((check) => safeStatus(check.status) !== 'not_verified' && Array.isArray(check.recommendations))
    .sort((a, b) => {
      const aRatio = Number(a.maxPoints) ? Number(a.points) / Number(a.maxPoints) : 1;
      const bRatio = Number(b.maxPoints) ? Number(b.points) / Number(b.maxPoints) : 1;
      return aRatio - bRatio;
    })
    .flatMap((check) => (check.recommendations || []).map((recommendation) => ({
      category: check.name,
      recommendation,
    })))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.recommendation === item.recommendation) === index)
    .slice(0, 5);

  const notVerified = Array.isArray(report.notVerified) && report.notVerified.length > 0
    ? report.notVerified
    : [
      'Google Search',
      'Bing Search',
      'Google Business Profile',
      'External review platforms',
      'Hosting geolocation',
    ];

  return (
    <div className="mt-12 space-y-8" aria-live="polite">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#000A2D] p-6 text-white shadow-xl sm:p-9 lg:p-11">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-4">
              <BrandImage src={brandImage} businessName={businessName} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Web presence audit report</p>
                <h2 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">{businessName}</h2>
                {profile?.websiteUrl || metadata?.auditedUrl ? (
                  <a
                    href={profile?.websiteUrl || metadata?.auditedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-blue-200 hover:text-white"
                  >
                    <span className="truncate">{profile?.websiteUrl || metadata?.auditedUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : null}
              </div>
            </div>

            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-200">
              {report.summary || 'The audit completed, but no summary was returned.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Clock3 className="h-3.5 w-3.5" />
                {validGeneratedAt ? generatedAt.toLocaleString('en-GB') : 'Generated just now'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <FileSearch className="h-3.5 w-3.5" />
                {metadata?.pagesCrawled ?? 0} crawled / {metadata?.pagesAttempted ?? 0} attempted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm lg:min-w-64">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/5">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(${scoreBand.mainColor} ${score * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}
              />
              <div className="absolute inset-2 rounded-full bg-[#000A2D]" />
              <span className="relative text-4xl font-black">{score}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-200">Score / 100</p>
              <p className="mt-2 text-lg font-black leading-6" style={{ color: scoreBand.mainColor }}>
                {scoreBand.label}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300">{scoreBand.helper}</p>
            </div>
          </div>
        </div>
      </section>

      <WebPresenceAuditDisclaimer />

      {!isShared && showSharePanel && report.score !== undefined && report.profile && report.metadata && Array.isArray(report.checks) ? (
        <WebPresenceAuditSharePanel report={report as WebPresenceAuditReport} ctaLocation={ctaLocation} />
      ) : null}

      {report.benchmark ? (
        <WebPresenceAuditBenchmarkPanel
          benchmark={report.benchmark}
          businessType={profile?.businessType}
          ctaLocation={ctaLocation}
          score={score}
        />
      ) : null}

      {report.classification ? (
        <WebPresenceAuditClassificationPanel classification={report.classification} />
      ) : null}

      {report.mobileReadiness ? (
        <WebPresenceAuditMobileReadinessPanel mobileReadiness={report.mobileReadiness} />
      ) : null}

      {report.headReadiness ? (
        <WebPresenceAuditHeadReadinessPanel headReadiness={report.headReadiness} />
      ) : null}

      {profile ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Business profile reviewed</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isShared
                  ? 'Business details and signals detected on the audited public pages.'
                  : 'Details supplied by you and signals detected on the audited public pages.'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileItem label="Business name" value={profile.businessName} icon={<Building2 className="h-4 w-4" />} />
            <ProfileItem label="Business type" value={profile.businessType} icon={<Sparkles className="h-4 w-4" />} />
            <ProfileItem label="Target country" value={profile.targetCountry} icon={<Globe2 className="h-4 w-4" />} />
            <ProfileItem label="Location / service area" value={profile.location} icon={<MapPin className="h-4 w-4" />} />
            {!isShared && interactiveProfile ? (
              <>
                <ProfileItem label="Provided phone" value={interactiveProfile.providedPhone} icon={<Phone className="h-4 w-4" />} />
                <ProfileItem label="Provided email" value={interactiveProfile.providedEmail} icon={<Mail className="h-4 w-4" />} />
              </>
            ) : null}
            <ProfileItem label="Detected phone" value={profile.detectedPhone} icon={<Phone className="h-4 w-4" />} />
            <ProfileItem label="Detected email" value={profile.detectedEmail} icon={<Mail className="h-4 w-4" />} />
            <ProfileItem label="Detected address / area signal" value={profile.detectedAddressSnippet} icon={<MapPin className="h-4 w-4" />} />
            <ProfileItem label="Resolved host" value={profile.normalizedHost} icon={<Network className="h-4 w-4" />} />
            {!isShared && interactiveProfile ? (
              <ProfileItem label="Public IP" value={interactiveProfile.resolvedIp} icon={<Network className="h-4 w-4" />} />
            ) : null}
            <ProfileItem label="Hosting / IP location" value="Not verified in this free audit" icon={<ShieldCheck className="h-4 w-4" />} />
          </div>
        </section>
      ) : null}

      {priorities.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Top priorities</h2>
              <p className="mt-1 text-sm text-slate-600">Suggested next steps based on signals not detected in the audited pages.</p>
            </div>
          </div>
          <ol className="mt-6 grid gap-3 lg:grid-cols-2">
            {priorities.map((priority, index) => (
              <li key={priority.recommendation} className="flex gap-4 rounded-xl border border-amber-100 bg-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#000A2D] text-xs font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-700">{priority.category}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{priority.recommendation}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {checks.length > 0 ? (
        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Score breakdown</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">All audit categories</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-600">Open each category to review detected evidence, limitations, and suggested next actions.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {checks.map((check, index) => (
              <CategoryCard key={check.id || `${check.name}-${index}`} check={check} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <CircleHelp className="h-6 w-6 text-slate-500" />
          <div>
            <h2 className="text-lg font-black text-slate-950">Not verified in this free audit</h2>
            <p className="mt-1 text-sm text-slate-600">These items were not checked or could not be confirmed in this free version.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {notVerified.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              <CircleHelp className="h-4 w-4 shrink-0 text-slate-400" />
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          This free audit checks visible website signals only. Google Search, Bing Search, Google Business Profile, external review platforms, and hosting geolocation are not verified in this version.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          This report does not scrape Google or Bing and does not call an IP geolocation provider.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#000A2D] to-blue-950 px-6 py-9 text-white sm:px-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Practical next step</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {isShared ? 'Need a more complete digital visibility assessment?' : 'Need help improving this score?'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {isShared
                ? 'Request an in-depth digital visibility audit from Primewayz UK with verified access, external platform checks, manual review, and business-specific context.'
                : 'Request a free 15-minute Digital Visibility Review from Primewayz UK.'}
            </p>
          </div>
          <a
            href={isShared ? sharedContactHref : '/#contact'}
            className="inline-flex min-h-[50px] shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-emerald-50"
          >
            {isShared ? 'Request an in-depth digital visibility audit' : 'Request my free review'}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {checks.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          No category checks were returned by the audit.
        </p>
      ) : null}
    </div>
  );
}
