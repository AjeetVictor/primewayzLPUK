import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  Laptop,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { WebPresenceAuditForm } from './tools/WebPresenceAuditForm';

const heroBadges = ['Free', 'No login required', 'Built for UK SMEs'] as const;

const heroBenefits = [
  'Visibility and SEO basics',
  'Trust, clarity and conversion flow',
  'Mobile, performance and technical readiness',
] as const;

const reportIncludes = [
  'Overall visibility readiness score',
  'Priority fixes to review first',
  'Category-by-category findings',
  'Practical next actions',
  'Suggested support route if help is needed',
] as const;

const diagnosticCards = [
  {
    title: 'SEO basics',
    description: 'Can search engines and AI-assisted discovery understand the page structure and content?',
    icon: SearchCheck,
  },
  {
    title: 'Trust signals',
    description: 'Does the site give first-time visitors enough confidence to enquire?',
    icon: ShieldCheck,
  },
  {
    title: 'Enquiry path',
    description: 'Are CTAs, forms, booking paths and follow-up journeys clear?',
    icon: MousePointerClick,
  },
  {
    title: 'Mobile readiness',
    description: 'Does the page feel usable and clear on smaller screens?',
    icon: Laptop,
  },
  {
    title: 'Technical foundations',
    description: 'Are speed, indexing, metadata and basic technical signals in place?',
    icon: Wrench,
  },
  {
    title: 'Tracking readiness',
    description: 'Can enquiries, CTA clicks and sources be measured properly?',
    icon: BarChart3,
  },
] as const;

const priorityFixes = [
  'Clarify above-the-fold message',
  'Strengthen trust proof and contact confidence',
  'Improve CTA consistency and tracking',
] as const;

const sampleCategories = [
  ['SEO basics', 'Good base'],
  ['Trust signals', 'Needs attention'],
  ['Enquiry path', 'Needs review'],
  ['Mobile readiness', 'Improving'],
  ['Technical foundations', 'Check basics'],
  ['Tracking readiness', 'Partial'],
] as const;

const resultActions = [
  'Fix quick wins yourself',
  'Book a discovery call to discuss priorities',
  'Use report to choose support route',
] as const;

export const UkSmeDigitalVisibilityCheckerPage = () => (
  <main className="min-h-screen bg-[#F7FAFC] text-[#000A2D]">
    <section className="relative overflow-hidden border-b border-[#D7E7EC] bg-white px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-28 bg-[#EAF8FB]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#007C89]">
            <Sparkles className="h-4 w-4" />
            FREE UK WEBSITE VISIBILITY AUDIT
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#000A2D] sm:text-5xl">
            See whether your website is easy to find, trust and enquire from.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Review SEO basics, trust signals, enquiry flow, mobile readiness, tracking and technical foundations, then turn the result into clear next actions.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {heroBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-[#BFDDE5] bg-[#F3FBFD] px-4 py-2 text-xs font-bold text-[#005C68]">
                {badge}
              </span>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 rounded-2xl border border-[#D7E7EC] bg-white px-4 py-4 text-sm font-bold leading-6 shadow-sm shadow-slate-950/5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#008C9A]" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[22px] border border-[#CFE4EA] bg-white p-5 shadow-[0_22px_60px_rgba(0,10,45,0.10)] sm:p-7" aria-label="Audit report preview">
          <div className="flex items-start justify-between gap-4 border-b border-[#D7E7EC] pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">Audit report preview</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Website readiness score</h2>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7FA] text-2xl font-black text-[#000A2D]">
              0-100
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {[
              ['Priority fixes', 'The first changes to review before deeper work.'],
              ['Category breakdown', 'Visibility, trust, enquiry flow, mobile, technical and tracking signals.'],
              ['Recommended next step', 'A practical route based on the gaps found.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-4">
                <p className="text-sm font-black">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>

    <section id="audit-form" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <WebPresenceAuditForm variant="landing" showIntro={false} analyticsLocation="checker_page" />

        <aside className="rounded-[22px] border border-[#D7E7EC] bg-white p-6 shadow-sm shadow-slate-950/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">What your report includes</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">A practical read on where to focus first.</h2>
          <ul className="mt-6 space-y-4">
            {reportIncludes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#008C9A]" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>

    <section className="border-y border-[#D7E7EC] bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">What we check</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Six diagnostic views of your website readiness.</h2>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {diagnosticCards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-5 shadow-sm shadow-slate-950/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F7FA] text-[#007C89]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="sample-report" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007C89]">SAMPLE REPORT PREVIEW</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            A report that shows what to fix first - not just a vague score.
          </h2>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[22px] border border-[#D7E7EC] bg-white p-6 shadow-sm shadow-slate-950/5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Overall readiness</p>
                <p className="mt-2 text-5xl font-black tracking-tight">68<span className="text-2xl text-slate-400">/100</span></p>
              </div>
              <Gauge className="h-14 w-14 text-[#007C89]" />
            </div>
            <div className="mt-8 grid gap-3">
              <p className="rounded-xl border border-[#D7E7EC] bg-[#F8FCFD] px-4 py-3 text-sm font-bold">Status: Needs attention</p>
              <p className="rounded-xl border border-[#D7E7EC] bg-[#F8FCFD] px-4 py-3 text-sm font-bold">
                Best opportunity: Improve trust signals and enquiry flow.
              </p>
            </div>
          </article>

          <article className="rounded-[22px] border border-[#D7E7EC] bg-white p-6 shadow-sm shadow-slate-950/5 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#007C89]">Priority fixes</p>
            <ol className="mt-5 space-y-4">
              {priorityFixes.map((fix, index) => (
                <li key={fix} className="flex items-start gap-4 rounded-2xl border border-[#D7E7EC] bg-[#F8FCFD] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#000A2D] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold leading-6">{fix}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sampleCategories.map(([category, status]) => (
            <div key={category} className="rounded-2xl border border-[#D7E7EC] bg-white p-4">
              <p className="text-sm font-black">{category}</p>
              <p className="mt-1 text-sm font-semibold text-[#007C89]">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[#000A2D] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7FD5E0]">How to use the result</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">After the audit, you can choose the right next move.</h2>
        </div>
        <div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {resultActions.map((action) => (
              <li key={action} className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-4 text-sm font-bold leading-6 text-slate-100">
                {action}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact-us#book-call"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-[#E8F7FA]"
            >
              Book a discovery call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/#pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View pricing routes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>
);
