import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SelfAuditCta } from './SelfAuditCta';
import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../lib/utm';
import { BOOK_CALL_URL } from '../constants/contactBooking';

const resourceTypes = [
  'Frontend and backend developers for websites, dashboards, and business tools',
  'QA testers for release checks, regression testing, and quality gates',
  'Website support for CMS updates, landing pages, forms, and conversion fixes',
  'Automation specialists for CRM workflows, integrations, and internal tooling',
  'Digital support for analytics checks, tracking, SEO basics, and reporting',
  'Project coordination for priorities, checkpoints, updates, and delivery rhythm',
];

const engagementModels = [
  {
    title: 'Part-time support',
    text: 'Useful when you need a few focused days each week for backlog items, fixes, or controlled feature work.',
  },
  {
    title: 'Monthly capacity',
    text: 'A predictable monthly block for development, QA, support, and coordination aligned to your roadmap.',
  },
  {
    title: 'Dedicated resource',
    text: 'A named remote resource for deeper continuity across sprints, releases, and ongoing delivery.',
  },
];

const benefits = [
  'Start with part-time or monthly support instead of full-time hiring',
  'Add developers, QA, digital support, or coordination as needs change',
  'Reduce recruitment delays and delivery bottlenecks',
  'Keep work structured with updates, checkpoints, and reporting',
];

const processSteps = [
  {
    title: 'Scope',
    text: 'We review your current delivery gaps, priorities, systems, and the type of remote capacity you need.',
  },
  {
    title: 'Align',
    text: 'We agree resource mix, communication rhythm, checkpoints, and how work will be approved and tracked.',
  },
  {
    title: 'Deliver',
    text: 'Remote developers, QA, support, and coordination work through a structured delivery model for UK business needs.',
  },
  {
    title: 'Review',
    text: 'We report progress, surface blockers, and adjust capacity or focus for the next cycle.',
  },
];

const heroLinks = [
  { label: 'All UK SME services', href: '/services' },
  { label: 'Software subscription', href: '/software-product-delivery' },
  { label: 'Website maintenance', href: '/maintenance' },
  { label: 'CRM integration', href: '/crm-automation-support' },
];

const relatedLinks = [
  {
    title: 'Software Development Subscription',
    href: '/software-product-delivery',
    anchor: 'Software development subscription for UK SMEs',
    text: 'For UK SMEs that need ongoing software delivery across websites, dashboards, CRM workflows, automation, and integrations.',
  },
  {
    title: 'Website Maintenance Subscription',
    href: '/maintenance',
    anchor: 'Website maintenance subscription for UK SMEs',
    text: 'For businesses that need reliable website updates, fixes, technical SEO checks, analytics support, and monthly care.',
  },
  {
    title: 'CRM Integration & Support',
    href: '/crm-automation-support',
    anchor: 'CRM integration support for UK SMEs',
    text: 'For teams that need cleaner lead capture, enquiry routing, CRM workflows, notifications, and reporting visibility.',
  },
  {
    title: 'All UK SME Services',
    href: '/services',
    anchor: 'Compare all Primewayz UK SME support services',
    text: 'Review website, CRM, automation, maintenance, remote resources, and monthly delivery options in one place.',
  },
];

const contactHref = buildInternalUtmUrl(
  BOOK_CALL_URL,
  'service_page',
  REMOTE_RESOURCE_CAMPAIGN,
  'service_page_secondary_cta',
);

export const RemoteItResourceAugmentationPage = () => (
  <main className="min-h-screen bg-white text-slate-950">
    <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

      <div className="relative mx-auto max-w-[1200px]">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Primewayz UK
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Flexible IT capacity for UK SMEs
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Remote IT resource augmentation for UK businesses
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Add reliable remote IT capacity without building a full in-house team.
              Access developers, QA testers, website support, automation specialists,
              digital support, and project coordination through a structured remote
              delivery model from Primewayz UK.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={buildInternalUtmUrl(
                  '/remote-it-resources',
                  'service_page',
                  REMOTE_RESOURCE_CAMPAIGN,
                  'service_page_primary_cta',
                )}
                ctaText="Explore remote IT resources"
                ctaLocation="remote_it_hero"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
              >
                Explore remote IT resources
              </TrackedLink>

              <TrackedLink
                href={contactHref}
                ctaText="Discuss resource needs"
                ctaLocation="remote_it_hero"
                eventType="book_call_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Discuss resource needs
              </TrackedLink>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {heroLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/85 transition hover:border-emerald-300/50 hover:bg-white/15 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold">Useful when you need</h2>
            <div className="mt-5 space-y-4">
              {benefits.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <SelfAuditCta variant="inline" utmContent="remote_it_page" ctaLocation="remote_it_page" />

    <section id="remote-it-resources" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            What you can add
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Remote IT capacity across development, QA, support, and coordination
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Useful for SMEs, agencies, startups, and growing teams that need extra
            delivery capacity without long recruitment cycles or full-time overhead.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resourceTypes.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="remote-it-engagement" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Engagement models
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Flexible part-time, monthly, or dedicated support
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Managed delivery from India for UK business needs, with structured
              communication, reporting, and checkpoints so remote capacity feels
              dependable rather than ad hoc.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {engagementModels.map((model) => (
              <div key={model.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-950">{model.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{model.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="remote-it-process" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Delivery rhythm
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Structured remote delivery with clear checkpoints
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="font-bold text-slate-950">{step.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="remote-it-related-services" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Related UK SME support paths
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Combine remote resources with monthly delivery services
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              aria-label={link.anchor}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
            >
              <h3 className="text-xl font-bold text-slate-950">{link.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{link.text}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                {link.anchor}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Discuss your remote IT capacity needs</h2>
          <p className="mt-4 text-base leading-7 text-slate-200">
            Tell us what delivery gaps you are facing and we will suggest a practical
            remote resource mix with clear next steps.
          </p>
        </div>

        <TrackedLink
          href={contactHref}
          ctaText="Book a resource planning call"
          ctaLocation="remote_it_final_cta"
          eventType="book_call_click"
          className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          Book a resource planning call
        </TrackedLink>
      </div>
    </section>
  </main>
);
