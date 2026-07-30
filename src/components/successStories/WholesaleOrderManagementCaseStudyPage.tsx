import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SUCCESS_STORIES_BASE_PATH,
  type SuccessStory,
} from '../../data/successStories';
import { DigitalSystemsReviewCtaGroup } from '../conversion/DigitalSystemsReviewCtaGroup';

const ASSET_BASE = '/images/success-stories/wholesale-order-management';

const operationalDependencies: ReadonlyArray<{
  label: string;
  detail: string;
}> = [
  { label: 'Product catalogue', detail: 'Product structure and business rules' },
  { label: 'SKU and variants', detail: 'Variants, packs and product relationships' },
  { label: 'Customer accounts', detail: 'Customer-specific access and trading context' },
  { label: 'Order processing', detail: 'Order capture, validation and progression' },
  { label: 'Inventory availability', detail: 'Stock position and availability decisions' },
  { label: 'Warehouse operations', detail: 'Operational fulfilment workflows' },
  { label: 'Reporting', detail: 'Shared operational and management visibility' },
  { label: 'Integrations', detail: 'Connected services and data exchange' },
] as const;

const challengeCards: ReadonlyArray<{
  number: string;
  title: string;
  description: string;
  impact: string;
  icon: LucideIcon;
}> = [
  {
    number: '01',
    title: 'Accumulated complexity',
    description:
      'Business rules and workflows had evolved across several connected operational areas.',
    impact:
      'A change that looked local could influence data, behaviour or users elsewhere in the platform.',
    icon: Layers3,
  },
  {
    number: '02',
    title: 'Operational continuity',
    description:
      'The platform needed to keep supporting live business processes while improvements were introduced.',
    impact:
      'Delivery had to protect day-to-day trading activity rather than pause it for a large replacement programme.',
    icon: RefreshCw,
  },
  {
    number: '03',
    title: 'Knowledge concentration',
    description:
      'Delivery transitions created a need for structured documentation, handover and retained application context.',
    impact:
      'Decisions and dependencies needed to become visible to the wider team, not remain with one contributor.',
    icon: BookOpenCheck,
  },
];

const responsibilityItems: ReadonlyArray<{
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    number: '01',
    title: 'Platform continuity',
    description:
      'Ongoing software-development contribution to a long-running business application.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Inherited workflow understanding',
    description:
      'Reviewing existing application behaviour before changing operational rules.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Catalogue and SKU support',
    description:
      'Supporting product, variant and catalogue processes within the established platform.',
    icon: Boxes,
  },
  {
    number: '04',
    title: 'Operational workflow support',
    description:
      'Supporting inventory, warehouse, customer and order workflows as connected areas.',
    icon: Workflow,
  },
  {
    number: '05',
    title: 'Controlled enhancement',
    description:
      'Using technical analysis, prioritisation and focused implementation for safer change.',
    icon: Wrench,
  },
  {
    number: '06',
    title: 'Knowledge continuity',
    description:
      'Retaining decisions, context and handover knowledge across delivery contributors.',
    icon: BookOpenCheck,
  },
];

const deliveryPractices: ReadonlyArray<{
  number: string;
  title: string;
  description: string;
  outcome: string;
  type: 'rules' | 'workflow' | 'backlog' | 'release' | 'knowledge';
}> = [
  {
    number: '01',
    title: 'Business-rule mapping',
    description:
      'Connecting business rules to the workflows and system areas they influence.',
    outcome: 'Connects rules to affected workflows',
    type: 'rules',
  },
  {
    number: '02',
    title: 'Workflow impact analysis',
    description:
      'Checking how a proposed change may affect catalogue, customers, stock, warehouse and orders.',
    outcome: 'Reveals downstream operational impact',
    type: 'workflow',
  },
  {
    number: '03',
    title: 'Backlog clarification',
    description:
      'Turning requests into understood, prioritised and testable delivery items.',
    outcome: 'Creates prioritised, testable delivery items',
    type: 'backlog',
  },
  {
    number: '04',
    title: 'Release readiness',
    description:
      'Reviewing scope, dependencies and validation needs before a controlled release.',
    outcome: 'Supports controlled release confidence',
    type: 'release',
  },
  {
    number: '05',
    title: 'Knowledge continuity',
    description:
      'Recording decisions and reducing reliance on undocumented individual knowledge.',
    outcome: 'Reduces reliance on individual knowledge',
    type: 'knowledge',
  },
];

const deliveryDecisions = [
  {
    number: '01',
    title: 'Prioritise continuity over large rewrites',
    reason:
      'The platform was already supporting connected business processes.',
    benefit:
      'Improvements could be introduced without unnecessarily destabilising established operations.',
  },
  {
    number: '02',
    title: 'Clarify rules before changing behaviour',
    reason:
      'Inherited workflows may contain business rules that are not obvious from the interface or ticket alone.',
    benefit:
      'Implementation decisions could be aligned to intended business outcomes.',
  },
  {
    number: '03',
    title: 'Deliver through controlled releases',
    reason:
      'Changes in one operational area could influence data, workflow or behaviour elsewhere.',
    benefit:
      'Smaller, reviewable releases reduced the breadth of uncontrolled change.',
  },
  {
    number: '04',
    title: 'Document and transfer knowledge',
    reason:
      'Long-running applications become vulnerable when critical context exists only with individual contributors.',
    benefit:
      'Delivery transitions could retain more application and business knowledge.',
  },
] as const;

const outcomeCards: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Continued platform support',
    description:
      'A business-critical application remained actively supported through ongoing technical contribution.',
    icon: ShieldCheck,
  },
  {
    title: 'Greater delivery continuity',
    description:
      'Complex inherited workflows could be handled through a clearer delivery structure and retained context.',
    icon: Network,
  },
  {
    title: 'Controlled enhancement path',
    description:
      'Improvement could continue without treating complete replacement as the automatic first step.',
    icon: CheckCircle2,
  },
  {
    title: 'Reduced knowledge dependency',
    description:
      'Transition and documentation created a stronger basis for ongoing support and future delivery.',
    icon: BookOpenCheck,
  },
];

const scopeLayers: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Experience layer',
    description: 'Web application interface, operational screens and user access.',
    icon: Users,
  },
  {
    title: 'Business workflow layer',
    description: 'Catalogue, SKU, customer, order, inventory and warehouse workflows.',
    icon: Boxes,
  },
  {
    title: 'Application layer',
    description: 'Inherited platform logic, workflow rules and release-sensitive components.',
    icon: Code2,
  },
  {
    title: 'Data and integration layer',
    description: 'Platform data, internal integrations, third-party services and reporting exchange.',
    icon: Database,
  },
  {
    title: 'Delivery layer',
    description: 'Analysis, controlled release, regression support, documentation and continuity.',
    icon: Wrench,
  },
];

const serviceCards: ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  bestFor: string;
  icon: LucideIcon;
  tone: 'blue' | 'pink' | 'amber';
}> = [
  {
    href: '/software-development-subscription-uk',
    title: 'Software development subscription',
    description:
      'Ongoing engineering capacity for a prioritised backlog, evolving workflows and regular controlled delivery.',
    bestFor:
      'Best when the application needs continued improvement rather than a one-off project.',
    icon: Code2,
    tone: 'blue',
  },
  {
    href: '/maintenance',
    title: 'Managed application and website support',
    description:
      'Structured support for reliability, fixes, updates and carefully controlled improvements.',
    bestFor:
      'Best when continuity, responsiveness and ownership are the immediate priorities.',
    icon: ShieldCheck,
    tone: 'pink',
  },
  {
    href: '/remote-it-resources',
    title: 'Remote IT team extension',
    description:
      'Additional developers, QA, analysis or technical capability integrated with the existing delivery team.',
    bestFor:
      'Best when internal capacity is constrained but the organisation wants to retain delivery direction.',
    icon: Users,
    tone: 'amber',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          light ? 'text-sky-300' : 'text-[#E4005A]'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.15rem] ${
          light ? 'text-white' : 'text-[#000A2D]'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 max-w-2xl text-base leading-7 ${
          light ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function VisualFigure({
  src,
  alt,
  caption,
  eager = false,
}: {
  src: string;
  alt: string;
  caption: string;
  eager?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-[#061633] shadow-[0_20px_55px_rgba(7,23,54,0.14)]">
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        className="h-auto w-full object-contain"
      />
      <figcaption className="flex flex-col gap-2 border-t border-white/10 bg-[#071736] px-5 py-3 text-xs leading-5 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>{caption}</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-sky-300 transition hover:text-white"
        >
          Open full-size visual
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </figcaption>
    </figure>
  );
}

function PracticeGraphic({
  type,
}: {
  type: 'rules' | 'workflow' | 'backlog' | 'release' | 'knowledge';
}) {
  if (type === 'rules') {
    return (
      <svg viewBox="0 0 240 120" className="h-full w-full" role="img" aria-label="Business rule map illustration">
        <rect x="84" y="38" width="72" height="44" rx="10" fill="#071736" />
        <circle cx="42" cy="28" r="12" fill="#ffffff" stroke="#2F80ED" strokeWidth="3" />
        <circle cx="42" cy="92" r="12" fill="#ffffff" stroke="#E4005A" strokeWidth="3" />
        <circle cx="198" cy="28" r="12" fill="#ffffff" stroke="#F59E0B" strokeWidth="3" />
        <circle cx="198" cy="92" r="12" fill="#ffffff" stroke="#10B981" strokeWidth="3" />
        <path d="M54 31 L84 48 M54 88 L84 72 M156 48 L186 31 M156 72 L186 88" stroke="#8AA4C8" strokeWidth="3" strokeLinecap="round" />
        <path d="M105 55h30M105 65h22" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'workflow') {
    return (
      <svg viewBox="0 0 240 120" className="h-full w-full" role="img" aria-label="Workflow impact illustration">
        <rect x="18" y="42" width="48" height="36" rx="9" fill="#ffffff" stroke="#2F80ED" strokeWidth="3" />
        <rect x="96" y="20" width="48" height="36" rx="9" fill="#ffffff" stroke="#E4005A" strokeWidth="3" />
        <rect x="96" y="72" width="48" height="36" rx="9" fill="#ffffff" stroke="#10B981" strokeWidth="3" />
        <rect x="174" y="42" width="48" height="36" rx="9" fill="#071736" />
        <path d="M66 60 H88 M144 38 H166 M144 90 H166" stroke="#8AA4C8" strokeWidth="3" strokeLinecap="round" />
        <path d="M84 54l8 6-8 6M162 32l8 6-8 6M162 84l8 6-8 6" fill="none" stroke="#8AA4C8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 56 V68" stroke="#8AA4C8" strokeWidth="3" strokeDasharray="5 5" />
      </svg>
    );
  }

  if (type === 'backlog') {
    return (
      <svg viewBox="0 0 240 120" className="h-full w-full" role="img" aria-label="Prioritised backlog illustration">
        <rect x="26" y="18" width="188" height="84" rx="14" fill="#ffffff" stroke="#B8C8DE" strokeWidth="3" />
        <rect x="44" y="36" width="44" height="48" rx="8" fill="#EAF3FF" />
        <rect x="98" y="36" width="44" height="48" rx="8" fill="#FFF0F6" />
        <rect x="152" y="36" width="44" height="48" rx="8" fill="#ECFDF5" />
        <path d="M54 50h24M54 61h18M108 50h24M108 61h18M162 50h24M162 61h18" stroke="#071736" strokeWidth="3" strokeLinecap="round" />
        <circle cx="66" cy="78" r="4" fill="#2F80ED" />
        <circle cx="120" cy="78" r="4" fill="#E4005A" />
        <circle cx="174" cy="78" r="4" fill="#10B981" />
      </svg>
    );
  }

  if (type === 'release') {
    return (
      <svg viewBox="0 0 240 120" className="h-full w-full" role="img" aria-label="Controlled release illustration">
        <path d="M24 70 H62 M88 70 H126 M152 70 H190" stroke="#8AA4C8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="24" cy="70" r="12" fill="#ffffff" stroke="#2F80ED" strokeWidth="3" />
        <circle cx="75" cy="70" r="14" fill="#ffffff" stroke="#E4005A" strokeWidth="3" />
        <circle cx="139" cy="70" r="14" fill="#ffffff" stroke="#F59E0B" strokeWidth="3" />
        <circle cx="202" cy="70" r="18" fill="#071736" />
        <path d="M195 70l5 5 10-12" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M69 70l5 5 8-10M133 70l5 5 8-10" fill="none" stroke="#071736" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 28v18M75 22v24M139 22v24M202 16v30" stroke="#C8D4E5" strokeWidth="3" strokeDasharray="4 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 120" className="h-full w-full" role="img" aria-label="Knowledge continuity illustration">
      <path d="M38 28h58c13 0 24 11 24 24v45c-7-7-17-11-28-11H38z" fill="#ffffff" stroke="#2F80ED" strokeWidth="3" strokeLinejoin="round" />
      <path d="M202 28h-58c-13 0-24 11-24 24v45c7-7 17-11 28-11h54z" fill="#ffffff" stroke="#E4005A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M56 46h42M56 58h34M142 46h42M142 58h34" stroke="#8AA4C8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="34" r="10" fill="#071736" />
      <path d="M116 34l3 3 6-7" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceTone({ tone }: { tone: 'blue' | 'pink' | 'amber' }) {
  const className =
    tone === 'blue'
      ? 'bg-sky-50 text-[#0057C8] ring-sky-100'
      : tone === 'pink'
        ? 'bg-pink-50 text-[#E4005A] ring-pink-100'
        : 'bg-amber-50 text-amber-700 ring-amber-100';

  return <span className={`absolute inset-x-0 top-0 h-1 ${className.split(' ')[0]}`} aria-hidden />;
}

export function WholesaleOrderManagementCaseStudyPage({
  story,
}: {
  story: SuccessStory;
}) {
  return (
    <main className="bg-white font-sans text-[#000A2D]">
      <section className="relative isolate overflow-hidden bg-[#030c24] px-6 pb-20 pt-24 text-white sm:pb-24 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_84%_15%,rgba(44,131,237,0.24),transparent_32%),radial-gradient(circle_at_12%_90%,rgba(228,20,98,0.13),transparent_26%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 -z-10 w-1/2 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_left,black,transparent)]"
        />

        <div className="mx-auto max-w-[1280px]">
          <Link
            to={SUCCESS_STORIES_BASE_PATH}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to success stories
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center xl:gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300 xl:whitespace-nowrap">
                Wholesale &amp; B2B commerce, {story.relationshipType}
              </p>
              <h1 className="mt-5 max-w-[680px] text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3rem] xl:text-[3.2rem]">
                Supporting a business-critical wholesale platform without a disruptive rewrite
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {story.summary}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-sky-300" aria-hidden />
                  Continuity first
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
                  Controlled enhancement
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-200">
                  <BookOpenCheck className="h-4 w-4 text-amber-300" aria-hidden />
                  Knowledge transfer
                </span>
              </div>

              <div className="mt-7 flex flex-col gap-4">
                <DigitalSystemsReviewCtaGroup
                  sourceLocation="success_story"
                  serviceArea={story.reviewServiceArea}
                  primaryPlacement="success_story_hero_primary"
                  secondaryPlacement="success_story_hero_secondary"
                  variant="caseStudyDark"
                />
                <div className="flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                  <p>
                    Client identity, proprietary business rules and sensitive operational logic are withheld in line with client confidentiality directives. The full disclosure basis is explained later in this case study.
                  </p>
                </div>
              </div>
            </div>

            <figure className="overflow-hidden rounded-3xl border border-white/20 bg-[#061633] shadow-[0_24px_65px_rgba(0,0,0,0.28)]">
              <img
                src={`${ASSET_BASE}/wholesale-platform-hero.webp`}
                alt="Illustrative wholesale platform dependency dashboard showing connected catalogue, SKU, customer, order, inventory, warehouse, reporting and integration workflows"
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full object-contain"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="The operating context"
            title="One platform, multiple connected operational dependencies"
            description="The work sat across a connected wholesale operation rather than one isolated feature. Catalogue, customer, stock, warehouse, order and integration workflows all influenced how change needed to be understood and released."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="relative overflow-hidden rounded-3xl bg-[#071736] p-6 text-white shadow-[0_22px_55px_rgba(7,23,54,0.16)] sm:p-8">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px]"
              />

              <div className="relative">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-white/10">
                      <Network className="h-6 w-6" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                        Connected operating model
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-white">
                        Established wholesale platform
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                        A live application supporting daily operational processes through shared data, inherited rules and connected workflows.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200">
                    <GitBranch className="h-4 w-4 text-sky-300" aria-hidden />
                    Changes travel across the system
                  </span>
                </div>

                <div className="relative mt-6">
                  <div
                    aria-hidden="true"
                    className="absolute bottom-4 left-1/2 top-4 hidden w-px -translate-x-1/2 bg-gradient-to-b from-sky-300/40 via-white/10 to-transparent sm:block"
                  />

                  <div className="relative z-10 mx-auto max-w-md rounded-2xl border border-sky-300/25 bg-[#0b2148] p-5 text-center shadow-lg shadow-black/10">
                    <Layers3 className="mx-auto h-7 w-7 text-sky-300" aria-hidden />
                    <p className="mt-3 text-sm font-bold text-white">Core wholesale platform</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Business rules, shared data and release-sensitive workflows
                    </p>
                  </div>

                  <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
                    {operationalDependencies.map((item, index) => (
                      <article
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition hover:border-sky-300/30 hover:bg-white/[0.09]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-300/10 text-xs font-bold text-sky-200 ring-1 ring-sky-300/20">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-white">{item.label}</h3>
                            <p className="mt-1 text-xs leading-5 text-slate-300">{item.detail}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Shared data</p>
                      <p className="mt-1 text-sm leading-5 text-slate-200">One change can alter downstream behaviour.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Workflow className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Shared workflows</p>
                      <p className="mt-1 text-sm leading-5 text-slate-200">Operational areas cannot be assessed in isolation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Release sensitivity</p>
                      <p className="mt-1 text-sm leading-5 text-slate-200">Continuity depends on controlled impact review.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-slate-200 bg-sky-50/70 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057C8]">
                  Why this mattered
                </p>
                <p className="mt-3 text-base font-semibold leading-7 text-[#000A2D]">
                  A request that appeared small at interface level could influence business rules, data and operational behaviour elsewhere.
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                    Catalogue changes could influence SKUs, pricing, stock or ordering behaviour.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                    Operational improvements had to preserve customer, warehouse and order workflows.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                    Safe delivery required technical understanding and business context together.
                  </li>
                </ul>
              </div>

              <div className="mt-5 space-y-4">
                {challengeCards.map(({ number, title, description, impact, icon: Icon }) => (
                  <article
                    key={title}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#0057C8] ring-1 ring-slate-200">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tracking-[0.14em] text-slate-400">{number}</span>
                          <h3 className="text-base font-bold text-[#000A2D]">{title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E4005A]">
                            Delivery implication
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{impact}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Primewayz responsibility"
                title="Technical delivery, operational understanding and continuity planning"
                description="Supporting an inherited business application required more than feature implementation. The responsibility included understanding how the platform worked, how the business used it and how change could be introduced safely."
              />

              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0057C8]">
                  Delivery boundary
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Primewayz contributed to ongoing development and continuity. The page does not claim ownership of the client organisation, its complete technology estate or confidential business results.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {responsibilityItems.map(({ number, title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex rounded-2xl bg-[#071736] p-3 text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-xs font-bold tracking-[0.15em] text-slate-400">{number}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#000A2D]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-3xl bg-[#071736] p-5 text-white sm:grid-cols-3 sm:p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-300" aria-hidden />
              <span className="text-sm font-semibold">Protect live operations</span>
            </div>
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-emerald-300" aria-hidden />
              <span className="text-sm font-semibold">Understand connected workflows</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpenCheck className="h-5 w-5 text-amber-300" aria-hidden />
              <span className="text-sm font-semibold">Retain delivery knowledge</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="Delivery approach"
            title="Controlled modernisation instead of destabilising replacement"
            description="The practical objective was not to rewrite for its own sake. It was to understand the inherited system, protect continuity and introduce focused improvements safely."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-rose-200 bg-rose-50/70 p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-white p-3 text-rose-600 shadow-sm">
                  <AlertTriangle className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-xl font-bold tracking-tight text-rose-950">
                  Higher-risk approach: large rewrite
                </h3>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-rose-950/80">
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />Replace working behaviour before every dependency is understood.</li>
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />Broaden the release surface and increase operational change at one time.</li>
                <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />Risk losing undocumented business rules embedded in inherited workflows.</li>
              </ul>
            </article>

            <article className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-xl font-bold tracking-tight text-emerald-950">
                  Primewayz approach: incremental improvement
                </h3>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-emerald-950/80">
                {story.solution.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-10">
            <VisualFigure
              src={`${ASSET_BASE}/review-to-controlled-release.webp`}
              alt="Six-stage delivery pathway from review and clarification through prioritisation, delivery, validation and controlled release"
              caption="The delivery pathway used to move from inherited-system review to a controlled release."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <SectionHeading
              eyebrow="Evidence-led delivery"
              title="Five delivery practices that turned uncertainty into controlled change"
              description="These practices helped the team understand dependencies, clarify requests, assess impact, prepare releases and retain application knowledge. The visuals are purpose-built illustrations, not client screenshots."
            />

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0057C8]">
                What this evidence demonstrates
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <Search className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-[#000A2D]">Clarify before build</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Understand the request and inherited behaviour first.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GitBranch className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-[#000A2D]">Trace impact</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Review connected workflows before release.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0057C8]" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-[#000A2D]">Retain context</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Record decisions so knowledge survives transition.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
            {deliveryPractices.map(({ number, title, description, outcome, type }, index) => (
              <article
                key={title}
                className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg ${
                  index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
                }`}
              >
                <div className="relative h-52 overflow-hidden border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-100 p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(0,87,200,0.14)_1px,transparent_1px)] [background-size:18px_18px]"
                  />
                  <div className="relative mx-auto h-full max-w-[360px]">
                    <PracticeGraphic type={type} />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0057C8]">
                      Delivery practice
                    </p>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#071736] text-xs font-bold text-white">
                      {number}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold tracking-tight text-[#000A2D]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {description}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      {outcome}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="Important delivery decisions"
            title="Practical choices that protected continuity"
            description="The delivery model was shaped by operational risk, inherited knowledge and the need to improve a live business application without unnecessary disruption."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {deliveryDecisions.map((decision) => (
              <article
                key={decision.number}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#000A2D] text-sm font-bold text-white">
                    {decision.number}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-[#000A2D] sm:text-xl">
                    {decision.title}
                  </h3>
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-600">
                  <strong className="text-slate-900">Why:</strong> {decision.reason}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  <strong className="text-slate-900">Operational benefit:</strong>{' '}
                  {decision.benefit}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#030c24] px-6 py-20 text-white lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_left,black,transparent_60%)]"
        />
        <div className="relative mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="Qualitative outcomes"
            title="A stronger foundation for continued platform delivery"
            description="These outcomes are deliberately qualitative. Primewayz is not publishing invented performance percentages, financial claims or confidential client measures."
            light
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {outcomeCards.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur"
              >
                <span className="inline-flex rounded-2xl bg-sky-400/10 p-3 text-sky-300">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="Technical and operational scope"
            title="Understand the layers before changing the system"
            description="The platform was not only a user interface. Business workflows, application logic, data dependencies, integrations and delivery practices all influenced safe change."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {scopeLayers.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <Icon className="h-6 w-6 text-[#0057C8]" aria-hidden />
                <h3 className="mt-4 text-base font-bold text-[#000A2D]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <VisualFigure
              src={`${ASSET_BASE}/layered-technical-operational-scope.webp`}
              alt="Layered view of experience, business workflow, application, data and integration, and delivery scope for an inherited wholesale platform"
              caption="Illustrative scope model showing how application and operational layers depend on each other."
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow="Trust and confidentiality"
            title="Transparent about what can and cannot be published"
            description="Trustworthy case studies should separate verified delivery facts from information that cannot responsibly be disclosed."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-6 w-6 text-[#E4005A]" aria-hidden />
                <h3 className="text-xl font-bold tracking-tight text-[#000A2D]">
                  Why the client and business logic are not disclosed
                </h3>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                The client directed that its identity, internal project references, proprietary business rules, sensitive operational logic, confidential screenshots and commercial measures must not be published. This caution is increasingly justified as AI-assisted software development can make imitation and replication easier. The case study therefore preserves the accuracy of the delivery approach while withholding information that could expose the client's competitive or pre-launch position.
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <Search className="h-6 w-6 text-[#0057C8]" aria-hidden />
                <h3 className="text-xl font-bold tracking-tight text-[#000A2D]">
                  What Primewayz can responsibly claim
                </h3>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Primewayz contributed to ongoing development, inherited-workflow understanding, controlled enhancement, release support and knowledge continuity across the operational scope described on this page.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <SectionHeading
              eyebrow="Relevant services"
              title="Choose the next step based on the problem you have"
              description="The correct starting point depends on whether the immediate need is structured assessment, ongoing engineering capacity or continuity support."
            />

            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
              <p className="text-sm font-bold text-[#000A2D]">Not sure which service fits?</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Start with a Digital Systems Review. Primewayz will review the inherited application, current delivery risk and immediate operational priorities before recommending the next step.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {serviceCards.map(({ href, title, description, bestFor, icon: Icon, tone }) => {
              const iconClass =
                tone === 'blue'
                  ? 'bg-sky-50 text-[#0057C8] ring-sky-100'
                  : tone === 'pink'
                    ? 'bg-pink-50 text-[#E4005A] ring-pink-100'
                    : 'bg-amber-50 text-amber-700 ring-amber-100';

              return (
                <Link
                  key={href}
                  to={href}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
                >
                  <ServiceTone tone={tone} />
                  <div className={`inline-flex rounded-2xl p-3 ring-1 ${iconClass}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-[#000A2D]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Best when</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{bestFor}</p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0057C8]">
                    Explore this service
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-[#071736] p-8 text-white shadow-[0_24px_65px_rgba(7,23,54,0.2)] sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              Practical next step
            </p>
            <h2 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
              Managing an inherited platform with unclear dependencies?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Share the application, workflow or continuity issue creating friction. Primewayz will review the context and identify the most useful starting point without assuming a rewrite is the answer.
            </p>
          </div>

          <div className="mt-8 lg:mt-0">
            <DigitalSystemsReviewCtaGroup
              sourceLocation="success_story"
              serviceArea={story.reviewServiceArea}
              primaryPlacement="success_story_final_primary"
              secondaryPlacement="success_story_final_secondary"
              variant="closing"
              className="items-stretch lg:min-w-72"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default WholesaleOrderManagementCaseStudyPage;
