import { useEffect, useState } from 'react';
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
  Monitor,
  MonitorSmartphone,
  Network,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  AUDIT_CATEGORY_ACTION_LINKS,
  type AuditActionCategoryId,
} from '../../constants/auditCategoryActionLinks';
import { trackEvent } from '../../lib/analytics';
import type {
  AuditCheck,
  AuditCheckStatus,
  AuditEvidence,
  SharedWebPresenceAuditReport,
  WebPresenceAuditReport,
} from '../../lib/audit/types';
import { getCategoryBand, getScoreBand } from '../../lib/audit/scoreBands';
import { getSharedReportContactCtaUrl } from '../../lib/audit/share/disclaimers';
import type { ShareLinkState } from '../../lib/audit/share/types';
import { WebPresenceAuditReportActions } from './WebPresenceAuditReportActions';
import { WebPresenceAuditBenchmarkPanel } from './WebPresenceAuditBenchmarkPanel';
import { WebPresenceAuditClassificationPanel } from './WebPresenceAuditClassificationPanel';
import { WebPresenceAuditMobileReadinessPanel } from './WebPresenceAuditMobileReadinessPanel';
import { WebPresenceAuditHeadReadinessPanel } from './WebPresenceAuditHeadReadinessPanel';
import { AuditInfoTooltip } from './AuditInfoTooltip';

type WebPresenceAuditResultProps = {
  report: Partial<WebPresenceAuditReport> | SharedWebPresenceAuditReport;
  mode?: 'interactive' | 'shared';
  showSharePanel?: boolean;
  ctaLocation?: string;
  contactCtaHref?: string;
  onRunAnother?: () => void;
};

type CategoryHelp = {
  checked: string;
  whyItMatters: string;
  goodLooksLike: string;
  notVerified: string;
};

type PriorityFix = {
  label: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  recommendedAction: string;
};

type DiagnosticCategory = {
  id: string;
  name: string;
  icon: typeof FileSearch;
  fallbackFinding: string;
  fallbackAction: string;
};

type ActionSeverity = 'Critical' | 'Important' | 'Optional';

const SIGNAL_GREEN = {
  main: '#009688',
  dark: '#00695C',
  light: '#E0F5F2',
  border: '#4DB6AC',
} as const;

const CATEGORY_HELP: Record<string, CategoryHelp> = {
  'website-basics': {
    checked: 'Public homepage reachability, HTTPS, a page title, readable HTML, and obvious fetch errors.',
    whyItMatters: 'These are basic signals that allow visitors and automated systems to access and understand the site.',
    goodLooksLike: 'A reachable HTTPS homepage with a clear title and readable content.',
    notVerified: 'Hosting quality, uptime history, security testing, and authenticated platform settings.',
  },
  'technical-seo': {
    checked: 'Visible title, meta description, canonical, robots, sitemap, heading, image-alt, and social-preview signals.',
    whyItMatters: 'Clear technical signals help search engines interpret public pages consistently.',
    goodLooksLike: 'Indexable pages with deliberate metadata, canonical URLs, crawl guidance, and useful content structure.',
    notVerified: 'Search rankings, Search Console data, backlinks, keyword demand, and index coverage.',
  },
  'trust-signals': {
    checked: 'Visible contact, about, privacy, terms, business identity, and service-area information.',
    whyItMatters: 'Visitors need enough context to understand who operates the site and how to verify or contact the business.',
    goodLooksLike: 'Clear ownership, contact routes, policies, and credible business information.',
    notVerified: 'Legal compliance, company records, accreditations, or the accuracy of business claims.',
  },
  'lead-capture': {
    checked: 'Visible enquiry forms, booking links, telephone/email links, chat options, and clear calls to action.',
    whyItMatters: 'A visible, low-friction next step helps interested visitors become measurable enquiries.',
    goodLooksLike: 'Clear calls to action supported by usable contact or booking routes.',
    notVerified: 'Form deliverability, CRM routing, response times, lead quality, or conversion rates.',
  },
  'local-visibility': {
    checked: 'UK/local wording, visible phone and address or service-area details, and relevant structured data.',
    whyItMatters: 'Local context helps visitors understand where the business operates and whether it serves their area.',
    goodLooksLike: 'Consistent UK and service-area information that is easy to find on public pages.',
    notVerified: 'Google Business Profile status, map-pack visibility, citations, or local search rankings.',
  },
  'external-presence': {
    checked: 'Links from the website to relevant public social, directory, map, or review profiles.',
    whyItMatters: 'Connected public profiles can give visitors additional ways to verify and engage with a business.',
    goodLooksLike: 'Current, relevant external profiles linked clearly from the website.',
    notVerified: 'Google/Bing rankings, profile ownership, follower counts, engagement, or platform performance.',
  },
  'reviews-reputation': {
    checked: 'Visible testimonials, case studies, success stories, portfolio evidence, and review-profile links.',
    whyItMatters: 'Specific, genuine proof helps visitors evaluate experience and expected outcomes.',
    goodLooksLike: 'Evidence-based case studies and genuine review or portfolio references.',
    notVerified: 'Review authenticity, third-party ratings, customer identity, or reputation-platform data.',
  },
  'performance-ux': {
    checked: 'Basic public HTML size and responsive viewport signals.',
    whyItMatters: 'These are useful first indicators of whether a page is prepared for common devices.',
    goodLooksLike: 'Responsive page foundations with manageable markup and clear mobile presentation.',
    notVerified: 'Core Web Vitals, device testing, accessibility compliance, or real-user performance.',
  },
  'analytics-readiness': {
    checked: 'Visible analytics, tag-manager, and selected marketing-tag installation signals.',
    whyItMatters: 'Governed tracking helps teams understand whether important enquiry actions are being measured.',
    goodLooksLike: 'A deliberate analytics setup with relevant conversion events and consent-aware governance.',
    notVerified: 'Account access, data accuracy, consent configuration, event quality, or attribution.',
  },
};

const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  {
    id: 'technical-seo',
    name: 'SEO basics',
    icon: FileSearch,
    fallbackFinding: 'Core page structure and metadata need a focused review.',
    fallbackAction: 'Clarify titles, descriptions, headings, indexability and content structure.',
  },
  {
    id: 'trust-signals',
    name: 'Trust signals',
    icon: ShieldCheck,
    fallbackFinding: 'Visitors may need stronger proof before they enquire.',
    fallbackAction: 'Add visible proof, company details, policies, testimonials and contact confidence markers.',
  },
  {
    id: 'lead-capture',
    name: 'Enquiry path',
    icon: ArrowUpRight,
    fallbackFinding: 'The next step for interested visitors may not be clear enough.',
    fallbackAction: 'Review CTA hierarchy, form placement, booking paths and follow-up flow.',
  },
  {
    id: 'performance-ux',
    name: 'Mobile readiness',
    icon: Phone,
    fallbackFinding: 'Mobile presentation and usability should be checked carefully.',
    fallbackAction: 'Review responsive layout, mobile CTAs, key images and page clarity on small screens.',
  },
  {
    id: 'website-basics',
    name: 'Technical foundations',
    icon: Network,
    fallbackFinding: 'Basic accessibility, HTTPS and public-page signals need to stay reliable.',
    fallbackAction: 'Check crawlability, security basics, readable HTML, robots, sitemap and page availability.',
  },
  {
    id: 'analytics-readiness',
    name: 'Tracking readiness',
    icon: Sparkles,
    fallbackFinding: 'Enquiry and source measurement may not be complete enough for decisions.',
    fallbackAction: 'Review analytics, tag manager, conversion events, consent and CRM handoff tracking.',
  },
];

const FALLBACK_PRIORITY_FIXES: PriorityFix[] = [
  {
    label: 'Priority 1',
    title: 'Clarify the first-screen message',
    explanation: 'The first screen should make the offer, audience and next step immediately clear.',
    whyItMatters: 'Visitors should quickly understand what you do, who you help and what action to take.',
    recommendedAction: 'Strengthen hero copy, service clarity and primary CTA hierarchy.',
  },
  {
    label: 'Priority 2',
    title: 'Strengthen trust signals',
    explanation: 'The report should show enough proof and reassurance for a new visitor to continue.',
    whyItMatters: 'First-time visitors need proof and reassurance before enquiring.',
    recommendedAction: 'Add visible proof, company details, testimonials, security/privacy reassurance and contact confidence markers.',
  },
  {
    label: 'Priority 3',
    title: 'Improve enquiry flow and tracking',
    explanation: 'The path from interest to enquiry should be easy to follow and measurable.',
    whyItMatters: 'Even good traffic can be wasted if forms, booking paths and source tracking are unclear.',
    recommendedAction: 'Review CTAs, form placement, booking paths, CRM flow and analytics events.',
  },
];

function getAuditStatus(score: number) {
  if (score >= 80) return 'Strong base';
  if (score >= 60) return 'Needs focused improvement';
  if (score >= 40) return 'Priority fixes needed';
  return 'High-risk visibility gap';
}

function getAuditStatusCopy(score: number) {
  if (score >= 80) {
    return 'Your website has a strong visible foundation. The next step is to protect that base while tightening the few areas that may limit conversion or measurement.';
  }
  if (score >= 60) {
    return 'Your website has a working foundation, but there are several visibility, trust and enquiry-flow improvements that should be prioritised before increasing traffic campaigns.';
  }
  if (score >= 40) {
    return 'Your website shows useful signals, but important gaps may be limiting visibility, visitor confidence and the ability to turn attention into enquiries.';
  }
  return 'Your website may have a high-risk visibility gap. Core public signals should be reviewed before relying on search, paid traffic or referral campaigns.';
}

function getRecommendedRoute(score: number) {
  if (score >= 80) return 'Maintenance Mode or light monthly support';
  if (score >= 60) return 'Foundation Sprint or Essential monthly support';
  if (score >= 40) return 'Foundation Sprint followed by Growth support';
  return 'Discovery call + Foundation Sprint recommended';
}

function getDiagnosticStatus(points: number, maxPoints: number, status?: string) {
  if (status === 'not_verified') return 'Needs review';
  const ratio = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  if (ratio >= 80) return 'Good base';
  if (ratio >= 60) return 'Improving';
  if (ratio >= 40) return 'Needs review';
  return 'Priority fix';
}

function diagnosticStatusClass(status: string) {
  if (status === 'Good base') return 'border-[#4DB6AC] bg-[#E0F5F2] text-[#00695C]';
  if (status === 'Improving') return 'border-amber-300 bg-amber-100 text-amber-900';
  if (status === 'Priority fix') return 'border-rose-300 bg-rose-100 text-rose-900';
  if (status === 'Needs review') return 'border-sky-300 bg-sky-100 text-sky-900';
  return 'border-slate-300 bg-slate-100 text-slate-800';
}

function categoryScoreBarColor(ratio: number) {
  if (ratio >= 80) return SIGNAL_GREEN.main;
  if (ratio >= 60) return '#D97706';
  if (ratio >= 40) return '#0284C7';
  return '#E11D48';
}

function categoryFindingPanelClass(status: string) {
  if (status === 'Good base') return 'border-[#4DB6AC] bg-[#E0F5F2]/90';
  if (status === 'Improving') return 'border-amber-200 bg-amber-50/80';
  if (status === 'Priority fix') return 'border-rose-200 bg-rose-50/80';
  if (status === 'Needs review') return 'border-sky-200 bg-sky-50/80';
  return 'border-slate-200 bg-slate-50';
}

function categoryCardAccentClass(status: string) {
  if (status === 'Good base') return 'border-l-4 border-l-[#009688]';
  if (status === 'Improving') return 'border-l-4 border-l-amber-500';
  if (status === 'Priority fix') return 'border-l-4 border-l-rose-500';
  if (status === 'Needs review') return 'border-l-4 border-l-sky-500';
  return 'border-l-4 border-l-slate-400';
}

function buildPriorityFixes(checks: Partial<AuditCheck>[]): PriorityFix[] {
  const mapped = checks
    .filter((check) => safeStatus(check.status) !== 'good' && safeStatus(check.status) !== 'not_verified')
    .sort((a, b) => {
      const aRatio = Number(a.maxPoints) ? Number(a.points) / Number(a.maxPoints) : 1;
      const bRatio = Number(b.maxPoints) ? Number(b.points) / Number(b.maxPoints) : 1;
      return aRatio - bRatio;
    })
    .flatMap((check) => (check.recommendations || []).map((recommendation): PriorityFix => ({
      label: '',
      title: check.name || 'Priority website improvement',
      explanation: check.explanation || 'This area showed a gap or partial signal in the public audit.',
      whyItMatters: CATEGORY_HELP[String(check.id)]?.whyItMatters || 'Weak public signals can make it harder for visitors and search systems to understand the site.',
      recommendedAction: recommendation,
    })))
    .filter((item, index, items) => {
      const itemKey = `${item.title}::${item.recommendedAction}`.toLowerCase();
      return items.findIndex((candidate) => `${candidate.title}::${candidate.recommendedAction}`.toLowerCase() === itemKey) === index;
    })
    .slice(0, 3)
    .map((item, index) => ({ ...item, label: `Priority ${index + 1}` }));

  if (mapped.length >= 3) return mapped;

  const filled = [...mapped];
  for (const fallback of FALLBACK_PRIORITY_FIXES) {
    if (filled.length >= 3) break;
    if (!filled.some((item) => item.title.toLowerCase() === fallback.title.toLowerCase())) {
      filled.push({ ...fallback, label: `Priority ${filled.length + 1}` });
    }
  }
  return filled.slice(0, 3);
}


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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F7FA] text-xl font-black text-[#000A2D] ring-1 ring-[#BFDDE5]">
        {businessName.trim().charAt(0).toUpperCase() || <Globe2 className="h-7 w-7" />}
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-[#BFDDE5]">
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
  const visibleEvidence = evidence.slice(0, 5);
  const hiddenEvidenceCount = Math.max(0, evidence.length - visibleEvidence.length);

  return (
    <div className="rounded-2xl border border-[#CFE4EA] bg-[#F8FCFD] p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#007C89]">
        <FileSearch className="h-4 w-4" />
        Evidence found
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-600">
        Verified public signals detected during crawl.
      </p>
      <ul className="mt-4 grid gap-3">
        {visibleEvidence.map((item, index) => (
          <li key={`${item.label}-${index}`} className="rounded-xl border border-[#D7E7EC] bg-white px-4 py-3 text-sm leading-6 text-slate-700">
            <p className="font-black text-[#000A2D]">{item.label}</p>
            {item.value ? <p className="mt-1 text-sm font-semibold text-slate-800">{item.value}</p> : null}
            {item.snippet ? <span className="mt-1 block text-xs text-slate-500">{item.snippet}</span> : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#007C89] hover:text-[#000A2D]"
              >
                View source page
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      {hiddenEvidenceCount > 0 ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          + {hiddenEvidenceCount} more evidence item{hiddenEvidenceCount === 1 ? '' : 's'} found in this category.
        </p>
      ) : null}
    </div>
  );
}

function RecommendationList({ recommendations }: { recommendations?: string[] }) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-[#D7E7EC] bg-white p-4 sm:p-5">
        <p className="text-sm font-semibold text-[#007C89]">No immediate priority action for this category.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#CFE4EA] bg-[#F3FBFD] p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#005C68]">
        <Lightbulb className="h-4 w-4" />
        Priority actions
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-600">
        Apply these steps to improve visibility, trust, and enquiry readiness.
      </p>
      <ul className="mt-4 space-y-3">
        {recommendations.map((recommendation, index) => (
          <li key={recommendation} className="flex gap-3 rounded-xl border border-[#D7E7EC] bg-white px-4 py-3 text-sm leading-6 text-slate-700">
            <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#000A2D] px-1 text-[10px] font-black text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <span
                className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                  severityClass(getActionSeverity(recommendation, index))
                }`}
              >
                {getActionSeverity(recommendation, index)}
              </span>
              <p className="font-semibold">{recommendation}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getActionSeverity(action: string, index: number): ActionSeverity {
  const text = action.toLowerCase();
  if (
    text.includes('missing') ||
    text.includes('not detected') ||
    text.includes('not found') ||
    text.includes('broken') ||
    text.includes('error')
  ) {
    return 'Critical';
  }
  if (index === 0 || text.includes('add ') || text.includes('publish') || text.includes('fix') || text.includes('improve')) {
    return 'Important';
  }
  return 'Optional';
}

function severityClass(severity: ActionSeverity) {
  if (severity === 'Critical') return 'bg-rose-100 text-rose-800';
  if (severity === 'Important') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function PerformanceReadinessSection({
  performanceCheck,
  mobileReadiness,
  auditedUrl,
}: {
  performanceCheck?: Partial<AuditCheck>;
  mobileReadiness?: WebPresenceAuditReport['mobileReadiness'];
  auditedUrl?: string;
}) {
  const [copiedChecklist, setCopiedChecklist] = useState<'mobile' | 'desktop' | null>(null);
  const performancePoints = Number(performanceCheck?.points) || 0;
  const performanceMaxPoints = Number(performanceCheck?.maxPoints) || 0;
  const performanceRatio = performanceMaxPoints > 0 ? Math.round((performancePoints / performanceMaxPoints) * 100) : 0;
  const desktopSignals = (performanceCheck?.evidence || []).slice(0, 4);
  const mobileActions = (mobileReadiness?.recommendations || performanceCheck?.recommendations || []).slice(0, 4);
  const desktopActions = [
    'Run a Lighthouse Desktop test for Core Web Vitals and interaction bottlenecks.',
    'Compress hero/media assets and keep above-the-fold payload lightweight.',
    'Defer non-critical JavaScript and third-party tags until after first render.',
    'Validate layout stability on common desktop breakpoints (1366px and 1920px).',
  ];
  const mobileConcerns = (mobileReadiness?.concerns?.length
    ? mobileReadiness.concerns
    : ['Run real-device checks for forms, CTA flow, and scroll readability.']).slice(0, 3);
  const mobileScoreFromStatus = (() => {
    if (mobileReadiness?.status === 'strong') return 85;
    if (mobileReadiness?.status === 'workable') return 65;
    if (mobileReadiness?.status === 'needs_review') return 40;
    return 25;
  })();
  const desktopScore = Math.max(15, performanceRatio || 0);
  const pagespeedMobileUrl = auditedUrl
    ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(auditedUrl)}&form_factor=mobile`
    : 'https://pagespeed.web.dev/';
  const pagespeedDesktopUrl = auditedUrl
    ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(auditedUrl)}&form_factor=desktop`
    : 'https://pagespeed.web.dev/';
  const metricLabel = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Workable';
    if (score >= 40) return 'Needs improvement';
    return 'Critical';
  };

  const copyChecklist = async (kind: 'mobile' | 'desktop') => {
    const lines =
      kind === 'mobile'
        ? [
            'Mobile Performance Checklist',
            '',
            'Detected concerns:',
            ...mobileConcerns.map((item) => `- ${item}`),
            '',
            'Priority actions:',
            ...mobileActions.map((item, index) => `- [${getActionSeverity(item, index)}] ${item}`),
          ]
        : [
            'Desktop Performance Checklist',
            '',
            'Detected signals:',
            ...(desktopSignals.length > 0
              ? desktopSignals.map((item) => `- ${item.label}${item.value ? `: ${item.value}` : ''}`)
              : ['- No desktop-specific field data returned in this report.']),
            '',
            'Priority actions:',
            ...desktopActions.map((item, index) => `- [${getActionSeverity(item, index)}] ${item}`),
          ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedChecklist(kind);
      window.setTimeout(() => setCopiedChecklist(null), 2200);
    } catch {
      setCopiedChecklist(null);
    }
  };

  return (
    <section className="rounded-[24px] border border-[#D7E7EC] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Performance focus</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D]">Mobile and desktop performance guidance</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        This section converts performance-related signals into practical actions. Mobile reflects detected readiness signals; desktop highlights mandatory verification steps before scaling traffic.
      </p>

      <div className="mt-6 rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007C89]">Visual readiness plot (estimated)</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#D7E7EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#000A2D]">Mobile readiness</p>
              <span className="text-sm font-black text-[#005C68]">{mobileScoreFromStatus}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#009688]" style={{ width: `${mobileScoreFromStatus}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">{metricLabel(mobileScoreFromStatus)} - from audit signals</p>
          </div>
          <div className="rounded-xl border border-[#D7E7EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#000A2D]">Desktop baseline</p>
              <span className="text-sm font-black text-[#005C68]">{desktopScore}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${desktopScore}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">{metricLabel(desktopScore)} - verify with Lighthouse desktop</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#CFE4EA] bg-[#F8FCFD] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#000A2D]">
              <MonitorSmartphone className="h-4 w-4 text-[#007C89]" />
              Mobile readiness
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#005C68]">
              {mobileReadiness?.status ? mobileReadiness.status.replace('_', ' ') : `${performanceRatio}% baseline`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyChecklist('mobile')}
            className="mt-3 inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#BFDDE5] bg-white px-3 py-2 text-xs font-black text-[#005C68] transition hover:bg-[#E8F7FA]"
          >
            {copiedChecklist === 'mobile' ? 'Copied mobile checklist' : 'Copy mobile checklist'}
          </button>
          <a
            href={pagespeedMobileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 mt-3 inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#BFDDE5] bg-white px-3 py-2 text-xs font-black text-[#005C68] transition hover:bg-[#E8F7FA]"
          >
            Run mobile validation
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>

          <ul className="mt-4 space-y-3">
            {mobileConcerns.map((item) => (
                <li key={item} className="rounded-xl border border-[#D7E7EC] bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  {item}
                </li>
              ))}
          </ul>

          <div className="mt-4 space-y-2">
            {mobileActions.map((action, index) => (
              <div key={action} className="rounded-xl border border-[#D7E7EC] bg-white px-4 py-3 text-sm text-slate-700">
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${severityClass(getActionSeverity(action, index))}`}>
                  {getActionSeverity(action, index)}
                </span>
                <span className="font-semibold">{action}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#D7E7EC] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#000A2D]">
              <Monitor className="h-4 w-4 text-[#007C89]" />
              Desktop performance
            </p>
            <span className="rounded-full bg-[#F8FCFD] px-3 py-1 text-xs font-black text-slate-700">Verification required</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The free audit checks HTML/CSS performance signals only. Use Lighthouse Desktop to confirm real render, script execution, and interaction quality.
          </p>
          <button
            type="button"
            onClick={() => copyChecklist('desktop')}
            className="mt-3 inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#BFDDE5] bg-white px-3 py-2 text-xs font-black text-[#005C68] transition hover:bg-[#E8F7FA]"
          >
            {copiedChecklist === 'desktop' ? 'Copied desktop checklist' : 'Copy desktop checklist'}
          </button>
          <a
            href={pagespeedDesktopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 mt-3 inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#BFDDE5] bg-white px-3 py-2 text-xs font-black text-[#005C68] transition hover:bg-[#E8F7FA]"
          >
            Run desktop validation
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
          <ul className="mt-4 space-y-3">
            {(desktopSignals.length > 0
              ? desktopSignals.map((item) => `${item.label}${item.value ? `: ${item.value}` : ''}`)
              : ['No desktop-specific field data returned in this report.'])
              .map((signal) => (
                <li key={signal} className="rounded-xl border border-[#D7E7EC] bg-[#F8FCFD] px-4 py-3 text-sm font-semibold text-slate-700">
                  {signal}
                </li>
              ))}
          </ul>
          <div className="mt-4 space-y-2">
            {desktopActions.map((action, index) => (
              <div key={action} className="rounded-xl border border-[#D7E7EC] bg-white px-4 py-3 text-sm text-slate-700">
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${severityClass(getActionSeverity(action, index))}`}>
                  {getActionSeverity(action, index)}
                </span>
                <span className="font-semibold">{action}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function CategoryCard({
  check,
  scoreBand,
  scoreLabel,
  ctaLocation,
}: {
  check: Partial<AuditCheck>;
  scoreBand: string;
  scoreLabel: string;
  ctaLocation: string;
}) {
  const points = Number.isFinite(check.points) ? Number(check.points) : 0;
  const maxPoints = Number.isFinite(check.maxPoints) ? Number(check.maxPoints) : 0;
  const ratio = maxPoints > 0 ? Math.max(0, Math.min(100, (points / maxPoints) * 100)) : 0;
  const band = getCategoryBand(ratio, check.status);
  const categoryId = typeof check.id === 'string' ? check.id : 'unknown';
  const help = CATEGORY_HELP[categoryId] || {
    checked: 'Visible public-page signals associated with this audit category.',
    whyItMatters: 'Clear public signals help visitors and automated systems understand the website.',
    goodLooksLike: 'Relevant information is visible, consistent, and easy to use.',
    notVerified: 'Authenticated platforms, private systems, rankings, and off-site performance.',
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-lg font-black tracking-tight text-slate-950">{check.name || 'Audit category'}</h3>
              <AuditInfoTooltip
                categoryId={categoryId}
                title={check.name || 'Audit category'}
                checked={help.checked}
                whyItMatters={help.whyItMatters}
                goodLooksLike={help.goodLooksLike}
                notVerified={help.notVerified}
                scoreBand={scoreBand}
                scoreLabel={scoreLabel}
                ctaLocation={ctaLocation}
              />
            </div>
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
          Evidence and priority actions
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

function DetailedCheckAccordion({
  title,
  check,
}: {
  title: string;
  check?: Partial<AuditCheck>;
}) {
  return (
    <details className="group rounded-2xl border border-[#D7E7EC] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-black text-[#000A2D] transition hover:bg-[#F8FCFD]">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-[#007C89] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#D7E7EC] px-5 py-5">
        {check ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#D7E7EC] bg-white p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007C89]">Problem observed</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                {check.explanation || 'This category did not include an explanation.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[#BFDDE5] bg-[#F3FBFD] px-3 py-1 text-xs font-black text-[#005C68]">
                  Score: {Number(check.points) || 0} / {Number(check.maxPoints) || 0}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  Status: {safeStatus(check.status).replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <EvidenceList evidence={check.evidence} />
              <RecommendationList recommendations={check.recommendations} />
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-600">No detailed signals were returned for this section.</p>
        )}
      </div>
    </details>
  );
}

function RecommendedActions({
  categoryIds,
  scoreBand,
  scoreLabel,
  ctaLocation,
}: {
  categoryIds: AuditActionCategoryId[];
  scoreBand: string;
  scoreLabel: string;
  ctaLocation: string;
}) {
  const actions = categoryIds
    .map((categoryId) => AUDIT_CATEGORY_ACTION_LINKS[categoryId])
    .filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Recommended next actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Turn visible gaps into a focused plan</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        These links are selected from categories that need attention. They do not imply that an off-site platform or ranking has been verified.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <a
            key={action.categoryId}
            href={action.href}
            onClick={() => trackEvent('audit_action_card_clicked', {
              category_id: action.categoryId,
              score_band: scoreBand,
              score_label: scoreLabel,
              cta_location: ctaLocation,
            })}
            className="group flex min-h-40 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm"
          >
            <div>
              <h3 className="text-base font-black leading-6 text-slate-950">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
              {action.ctaLabel}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>
        ))}
      </div>
    </section>
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
  onRunAnother,
}: WebPresenceAuditResultProps) {
  const isShared = mode === 'shared';
  const [shareLink, setShareLink] = useState<ShareLinkState | null>(null);
  const sharedContactHref = contactCtaHref ?? getSharedReportContactCtaUrl();
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const scoreBand = getScoreBand(score);
  const scoreBandValue = `${scoreBand.min}-${scoreBand.max}`;
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const metadata = report.metadata;
  const profile = report.profile;
  const generatedAt = metadata?.generatedAt ? new Date(metadata.generatedAt) : null;
  const validGeneratedAt = generatedAt && !Number.isNaN(generatedAt.getTime());
  const businessName = profile?.businessName || 'Your website';
  const brandImage = profile?.logoUrl || profile?.faviconUrl || profile?.openGraphImage;

  useEffect(() => {
    trackEvent('result_meaning_viewed', {
      category_id: 'overall-result',
      score_band: scoreBandValue,
      score_label: scoreBand.label,
      cta_location: ctaLocation,
    });
  }, [ctaLocation, scoreBand.label, scoreBandValue]);

  useEffect(() => {
    setShareLink(null);
  }, [metadata?.generatedAt, metadata?.auditedUrl]);

  const notVerified = Array.isArray(report.notVerified) && report.notVerified.length > 0
    ? report.notVerified
    : [
      'Google Search',
      'Bing Search',
      'Google Business Profile',
      'External review platforms',
      'Hosting geolocation',
    ];
  const auditStatus = getAuditStatus(score);
  const statusCopy = report.summary || getAuditStatusCopy(score);
  const priorityFixes = buildPriorityFixes(checks);
  const primaryOpportunity = priorityFixes[0]?.title || getRecommendedRoute(score);
  const performanceCheck = checks.find((item) => item.id === 'performance-ux');
  const diagnosticCategoryResults = DIAGNOSTIC_CATEGORIES.map((category) => {
    const check = checks.find((item) => item.id === category.id);
    const points = Number(check?.points) || 0;
    const maxPoints = Number(check?.maxPoints) || 0;
    const status = getDiagnosticStatus(points, maxPoints, check?.status);
    return {
      ...category,
      check,
      points,
      maxPoints,
      status,
      finding: check?.explanation || category.fallbackFinding,
      action: check?.recommendations?.[0] || category.fallbackAction,
    };
  });

  return (
    <div className="mt-12 space-y-7" aria-live="polite">
      <section className="overflow-hidden rounded-[28px] border border-[#CFE4EA] bg-white shadow-[0_24px_70px_rgba(0,10,45,0.10)]">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-4">
              <BrandImage src={brandImage} businessName={businessName} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Website visibility audit report</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D] sm:text-3xl">{businessName}</h2>
                {profile?.websiteUrl || metadata?.auditedUrl ? (
                  <a
                    href={profile?.websiteUrl || metadata?.auditedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-[#007C89] hover:text-[#000A2D]"
                  >
                    <span className="truncate">{profile?.websiteUrl || metadata?.auditedUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : null}
              </div>
            </div>

            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-700">{statusCopy}</p>
            <div className="mt-5 rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#007C89]">Primary opportunity</p>
              <p className="mt-2 text-base font-black text-[#000A2D]">{primaryOpportunity}</p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E7EC] bg-[#F8FCFD] px-3 py-2">
                <Clock3 className="h-3.5 w-3.5 text-[#007C89]" />
                {validGeneratedAt ? generatedAt.toLocaleString('en-GB') : 'Generated just now'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E7EC] bg-[#F8FCFD] px-3 py-2">
                <FileSearch className="h-3.5 w-3.5 text-[#007C89]" />
                {metadata?.pagesCrawled ?? 0} crawled / {metadata?.pagesAttempted ?? 0} attempted
              </span>
            </div>

            <a
              href={isShared ? sharedContactHref : '/contact-us#book-call'}
              className="mt-8 inline-flex min-h-[50px] items-center justify-center rounded-xl bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-950"
            >
              Book a discovery call
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </div>

          <div className="border-t border-[#D7E7EC] bg-[#F3FBFD] p-6 sm:p-8 lg:w-[420px] lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-[24px] border border-[#BFDDE5] bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#007C89]">Overall readiness score</p>
              <div className="mt-6 flex items-center gap-6">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-[#E8F7FA]">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(#008C9A ${score * 3.6}deg, #E3EEF2 0deg)` }}
                  />
                  <div className="absolute inset-3 rounded-full bg-white" />
                  <span className="relative text-4xl font-black text-[#000A2D]">{score}</span>
                </div>
                <div>
                  <p className="rounded-full border border-[#BFDDE5] bg-[#E8F7FA] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#005C68]">
                    {auditStatus}
                  </p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{scoreBand.helper}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D7E7EC] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Recommended focus</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D]">Recommended focus</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          These are the highest-impact items to review before investing more into traffic or campaigns.
        </p>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {priorityFixes.map((priority) => (
            <article key={`${priority.label}-${priority.title}`} className="rounded-2xl border border-[#D7E7EC] bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007C89]">{priority.label}</p>
              <h3 className="mt-3 text-lg font-black leading-6 text-[#000A2D]">{priority.title}</h3>

              <div className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-100 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-rose-900">
                  <span className="h-2 w-2 rounded-full bg-rose-600" aria-hidden />
                  Problem identified
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-rose-950">{priority.explanation}</p>
              </div>

              <div className="mt-3 rounded-xl border-2 border-sky-300 bg-sky-100 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-sky-900">
                  <span className="h-2 w-2 rounded-full bg-sky-600" aria-hidden />
                  Why it matters
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">{priority.whyItMatters}</p>
              </div>

              <div
                className="mt-3 rounded-xl border-2 p-4 shadow-sm"
                style={{ borderColor: SIGNAL_GREEN.main, backgroundColor: SIGNAL_GREEN.light }}
              >
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: SIGNAL_GREEN.dark }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SIGNAL_GREEN.main }} aria-hidden />
                  Recommended fix
                </p>
                <p className="mt-2 text-sm font-bold leading-6" style={{ color: SIGNAL_GREEN.dark }}>{priority.recommendedAction}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Category breakdown</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D]">Category breakdown</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em]">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#4DB6AC] bg-[#E0F5F2] px-2.5 py-1 text-[#00695C]">
              <span className="h-2 w-2 rounded-full bg-[#009688]" aria-hidden />
              Good base
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-100 px-2.5 py-1 text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden />
              Improving
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-300 bg-sky-100 px-2.5 py-1 text-sky-900">
              <span className="h-2 w-2 rounded-full bg-sky-600" aria-hidden />
              Needs review
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-300 bg-rose-100 px-2.5 py-1 text-rose-900">
              <span className="h-2 w-2 rounded-full bg-rose-600" aria-hidden />
              Priority fix
            </span>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {diagnosticCategoryResults.map(({ id, name, icon: Icon, points, maxPoints, status, finding, action }) => {
            const scoreRatio = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
            return (
            <article
              key={id}
              className={`rounded-2xl border border-[#D7E7EC] bg-white p-5 shadow-sm ${categoryCardAccentClass(status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F7FA] text-[#007C89]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${diagnosticStatusClass(status)}`}>
                  {status}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-black text-[#000A2D]">{name}</h3>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-600">{maxPoints > 0 ? `${points} / ${maxPoints} points` : 'Signal review'}</span>
                  {maxPoints > 0 ? <span style={{ color: categoryScoreBarColor(scoreRatio) }}>{scoreRatio}%</span> : null}
                </div>
                {maxPoints > 0 ? (
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${scoreRatio}%`, backgroundColor: categoryScoreBarColor(scoreRatio) }}
                    />
                  </div>
                ) : null}
              </div>
              <div className={`mt-4 rounded-xl border p-4 ${categoryFindingPanelClass(status)}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-700">What we found</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{finding}</p>
              </div>
              <div
                className="mt-4 rounded-xl border-2 p-4 shadow-sm"
                style={{ borderColor: SIGNAL_GREEN.main, backgroundColor: SIGNAL_GREEN.light }}
              >
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]" style={{ color: SIGNAL_GREEN.dark }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SIGNAL_GREEN.main }} aria-hidden />
                  Fix this by
                </p>
                <p className="mt-2 text-sm font-bold leading-6" style={{ color: SIGNAL_GREEN.dark }}>{action}</p>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D7E7EC] bg-[#F8FCFD] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">What this means commercially</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D]">What this means commercially</h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {[
            ['Visibility risk', 'Search and AI-assisted discovery may not fully understand or surface the right pages.'],
            ['Trust risk', 'First-time visitors may not feel enough confidence to enquire.'],
            ['Enquiry risk', 'Interested visitors may drop off if CTAs, forms, booking and follow-up paths are unclear.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-[#D7E7EC] bg-white p-5">
              <h3 className="text-lg font-black text-[#000A2D]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <PerformanceReadinessSection
        performanceCheck={performanceCheck}
        mobileReadiness={report.mobileReadiness}
        auditedUrl={metadata?.auditedUrl}
      />

      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Detailed checks</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#000A2D]">Detailed checks</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Expand each section to review the supporting evidence and recommendations behind the dashboard.
          </p>
        </div>
        <div className="grid gap-3">
          {diagnosticCategoryResults.map(({ id, name, check }) => (
            <DetailedCheckAccordion key={id} title={name} check={check} />
          ))}
        </div>
      </section>

      {!isShared && showSharePanel ? (
        <WebPresenceAuditReportActions
          report={report as WebPresenceAuditReport}
          ctaLocation={ctaLocation}
          shareLink={shareLink}
          onShareLinkChange={setShareLink}
        />
      ) : null}

      <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-black text-[#000A2D] transition hover:bg-slate-50">
          Additional audit context
          <ChevronDown className="h-4 w-4 shrink-0 text-[#007C89] transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-5">
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
            <WebPresenceAuditMobileReadinessPanel
              mobileReadiness={report.mobileReadiness}
              scoreBand={scoreBandValue}
              scoreLabel={scoreBand.label}
              ctaLocation={ctaLocation}
            />
          ) : null}

          {report.headReadiness ? (
            <WebPresenceAuditHeadReadinessPanel
              headReadiness={report.headReadiness}
              scoreBand={scoreBandValue}
              scoreLabel={scoreBand.label}
              ctaLocation={ctaLocation}
            />
          ) : null}
        </div>
      </details>

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
            <ProfileItem label="Detected phone" value={profile.detectedPhone} icon={<Phone className="h-4 w-4" />} />
            <ProfileItem label="Detected email" value={profile.detectedEmail} icon={<Mail className="h-4 w-4" />} />
            <ProfileItem label="Detected address / area signal" value={profile.detectedAddressSnippet} icon={<MapPin className="h-4 w-4" />} />
            <ProfileItem label="Resolved host" value={profile.normalizedHost} icon={<Network className="h-4 w-4" />} />
            <ProfileItem label="Hosting / IP location" value="Not verified in this free audit" icon={<ShieldCheck className="h-4 w-4" />} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <CircleHelp className="h-6 w-6 text-slate-500" />
          <div>
            <h2 className="text-lg font-black text-slate-950">Report limitations</h2>
            <p className="mt-1 text-sm text-slate-600">This free report is based on publicly visible website signals.</p>
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

      <section className="rounded-[24px] border border-[#D7E7EC] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Report action bar</p>
            <h2 className="mt-2 text-xl font-black text-[#000A2D]">Choose the next action</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={isShared ? sharedContactHref : '/contact-us#book-call'} className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950">
              Book a discovery call
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
            <a href="/pricing" className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-[#BFDDE5] bg-[#F8FCFD] px-5 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-[#E8F7FA]">
              View pricing routes
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
            {!isShared && onRunAnother ? (
              <button type="button" onClick={onRunAnother} className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-[#BFDDE5] bg-white px-5 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-[#F8FCFD]">
                Run another audit
                <RefreshCw className="ml-2 h-4 w-4" />
              </button>
            ) : null}
          </div>
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
