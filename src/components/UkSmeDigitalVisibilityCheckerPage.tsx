import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  Globe2,
  Laptop,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { WebPresenceAuditForm } from './tools/WebPresenceAuditForm';
import { WebPresenceAuditResult } from './tools/WebPresenceAuditResult';
import type { WebPresenceAuditReport } from '../lib/audit/types';
import {
  clearAuditSession,
  loadAuditReportSession,
  resolveAuditPageEntry,
  saveAuditReportSession,
} from '../lib/audit/sessionReportCache';
import { scrollToAuditSection } from '../lib/audit/auditPageScroll';

const badges = ['Free', 'No login required', 'UK SME focused'] as const;

const checks = [
  ['SEO basics', 'Search structure and content clarity.', SearchCheck],
  ['Trust signals', 'Proof, policies and contact confidence.', ShieldCheck],
  ['Enquiry path', 'CTAs, forms and booking routes.', MousePointerClick],
  ['Mobile readiness', 'Small-screen clarity and usability.', Laptop],
  ['Technical foundations', 'Indexing, metadata and page basics.', Wrench],
  ['Tracking readiness', 'Analytics and conversion visibility.', BarChart3],
] as const;

const sampleFixes = [
  'Clarify first-screen message',
  'Strengthen trust proof',
  'Improve CTA tracking',
] as const;

const sampleChips = ['SEO basics', 'Trust signals', 'Enquiry path', 'Mobile', 'Technical', 'Tracking'] as const;

const resultActions = [
  'Fix quick wins yourself',
  'Book a discovery call to discuss priorities',
  'Use the report to choose a support route',
] as const;

export const UkSmeDigitalVisibilityCheckerPage = () => {
  const [report, setReport] = useState<Partial<WebPresenceAuditReport> | null>(null);
  const [reportRestored, setReportRestored] = useState(false);

  useEffect(() => {
    const entryMode = resolveAuditPageEntry();
    if (entryMode !== 'restore-report') return;

    const cachedReport = loadAuditReportSession();
    if (!cachedReport) return;

    setReport(cachedReport);
    setReportRestored(true);
  }, []);

  const handleReportChange = (nextReport: Partial<WebPresenceAuditReport> | null) => {
    setReport(nextReport);
    setReportRestored(false);

    if (nextReport) {
      saveAuditReportSession(nextReport, nextReport.metadata?.auditedUrl || nextReport.profile?.websiteUrl);
      window.setTimeout(() => scrollToAuditSection('audit-report', 'smooth'), 120);
      return;
    }

    clearAuditSession();
  };

  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#000A2D]">
      <section id="audit-form" className="border-b border-[#D7E7EC] bg-white px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="lg:pt-5">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#007C89]">
            <Sparkles className="h-4 w-4" />
            FREE UK WEBSITE VISIBILITY AUDIT
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Check if your website is easy to find, trust and enquire from.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Enter your website URL and get a practical visibility, trust and enquiry-flow report in under a minute.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-[#BFDDE5] bg-[#F3FBFD] px-4 py-2 text-xs font-bold text-[#005C68]">
                {badge}
              </span>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-4 text-sm font-semibold leading-6 text-slate-700">
            Checks SEO basics, trust signals, enquiry path, mobile readiness, technical foundations and tracking.
          </p>
        </div>

          <WebPresenceAuditForm
            variant="landing"
            showIntro={false}
            showHonestMessaging={false}
            renderResultInline={false}
            analyticsLocation="checker_page"
            onReportChange={handleReportChange}
          />
        </div>
        <div className="mx-auto mt-6 max-w-[1200px]">
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <Globe2 className="h-4 w-4 text-blue-700" />
              Honest external-presence reporting
            </p>
            <p>Google and Bing presence are shown as not verified. This tool does not scrape search engines.</p>
          </div>
        </div>
      </section>

      {report ? (
        <section id="audit-report" className="scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            {reportRestored ? (
              <p className="mb-4 rounded-xl border border-[#BFDDE5] bg-[#F3FBFD] px-4 py-3 text-sm font-semibold text-[#005C68]">
                Your latest audit report was restored for this browser session.
              </p>
            ) : null}
            <WebPresenceAuditResult
              report={report}
              mode="interactive"
              showSharePanel
              ctaLocation="checker_page"
              onRunAnother={() => {
                handleReportChange(null);
                window.setTimeout(() => scrollToAuditSection('audit-form', 'smooth'), 0);
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">What we check</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Six public-signal checks</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map(([title, description, Icon]) => (
            <article key={title} className="flex items-start gap-3 rounded-2xl border border-[#D7E7EC] bg-white p-4 shadow-sm shadow-slate-950/5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7FA] text-[#007C89]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-black">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      </section>

      <section id="sample-report" className="scroll-mt-28 border-y border-[#D7E7EC] bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Sample report preview</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Compact, practical and action-first.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The real report uses your website data. This sample shows the shape: score, top fixes and category signals.
          </p>
        </div>
        <div className="rounded-[22px] border border-[#D7E7EC] bg-[#F8FCFD] p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Gauge className="h-10 w-10 text-[#007C89]" />
              <div>
                <p className="text-sm font-bold text-slate-500">Sample score</p>
                <p className="text-4xl font-black">68<span className="text-xl text-slate-400">/100</span></p>
              </div>
            </div>
            <ol className="grid gap-2 text-sm font-bold text-slate-800">
              {sampleFixes.map((fix, index) => (
                <li key={fix} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#000A2D] text-xs text-white">{index + 1}</span>
                  {fix}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {sampleChips.map((chip) => (
              <span key={chip} className="rounded-full border border-[#BFDDE5] bg-white px-3 py-1 text-xs font-bold text-[#005C68]">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
      </section>

      <section className="bg-[#000A2D] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7FD5E0]">How to use the result</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">See score, fix priorities, choose the next route.</h2>
        </div>
        <div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {resultActions.map((action) => (
              <li key={action} className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-4 text-sm font-bold leading-6 text-slate-100">
                <CheckCircle2 className="mb-2 h-4 w-4 text-[#7FD5E0]" />
                {action}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/contact-us#book-call" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-[#E8F7FA]">
              Book a discovery call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/#pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              View pricing routes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      </section>
    </main>
  );
};
