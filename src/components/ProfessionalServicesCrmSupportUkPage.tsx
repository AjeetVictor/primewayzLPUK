import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  LineChart,
  MailCheck,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SEO } from './SEO';

const painPoints = [
  'Website enquiries arrive by email but do not reach the CRM properly.',
  'Leads are stored across inboxes, spreadsheets, forms, and CRM records.',
  'Follow-ups depend on memory instead of clear tasks and reminders.',
  'Source tracking is unclear, so it is difficult to know which channel is working.',
  'CRM stages, ownership, and reports do not reflect the real sales process.',
  'Management cannot easily see enquiry volume, response time, or pipeline movement.',
];

const supportAreas = [
  {
    title: 'CRM cleanup',
    description:
      'Improve fields, stages, ownership, duplicate handling, tags, statuses, and practical CRM structure so the system becomes easier to use.',
    icon: DatabaseZap,
  },
  {
    title: 'Website enquiry tracking',
    description:
      'Connect website forms, landing page enquiries, quote requests, and campaign leads into a clearer CRM or lead-flow process.',
    icon: MailCheck,
  },
  {
    title: 'Follow-up workflows',
    description:
      'Create tasks, reminders, notifications, lead routing, and status updates so teams respond faster and fewer enquiries are missed.',
    icon: Workflow,
  },
  {
    title: 'Reporting visibility',
    description:
      'Build clearer views for enquiry sources, pipeline stages, response activity, monthly performance, and operational follow-up.',
    icon: LineChart,
  },
];

const whoFor = [
  'Consultants and advisory firms',
  'Recruitment and staffing agencies',
  'Accountants and finance service providers',
  'Marketing, design, and digital agencies',
  'Property, legal, and B2B service teams',
  'Owner-led UK SME professional services firms',
];

const benefits = [
  {
    title: 'Fewer missed enquiries',
    description:
      'Lead capture and CRM routing reduce the chance of website enquiries being lost in inboxes or spreadsheets.',
  },
  {
    title: 'Faster follow-up',
    description:
      'Tasks, reminders, and notifications help teams respond more consistently after an enquiry is received.',
  },
  {
    title: 'Clearer source tracking',
    description:
      'Campaigns, website forms, referrals, and service enquiries can be tracked more clearly inside the CRM.',
  },
  {
    title: 'Better management visibility',
    description:
      'Simple reporting helps owners and managers understand what is coming in, what is pending, and what needs action.',
  },
];

const relatedLinks = [
  {
    title: 'CRM Integration Support UK',
    href: '/crm-automation-support',
    text: 'For CRM integrations, workflow setup, lead routing, automation, and reporting improvements.',
    anchor: 'Explore CRM integration support',
  },
  {
    title: 'Website Maintenance Subscription UK',
    href: '/maintenance',
    text: 'For website updates, landing page fixes, tracking improvements, SEO foundations, and monthly support.',
    anchor: 'View website maintenance support',
  },
  {
    title: 'Software Development Subscription UK',
    href: '/software-product-delivery',
    text: 'For ongoing software delivery, integrations, backlog support, automation, and technical improvements.',
    anchor: 'View software subscription',
  },
  {
    title: 'Professional Services CRM Cleanup',
    href: '/success-stories/professional-services-crm-cleanup',
    text: 'See how a professional services lead-flow and CRM cleanup can be structured for better visibility.',
    anchor: 'Read the related success story',
  },
];

export const ProfessionalServicesCrmSupportUkPage = () => (
  <main className="min-h-screen bg-white text-slate-950">
    <SEO
      title="Professional Services CRM Support UK | Primewayz UK"
      description="CRM integration, lead-flow cleanup, website enquiry tracking, follow-up workflows, and reporting support for UK professional services firms."
      canonical="https://uk.primewayz.com/professional-services-crm-support-uk"
    />

    <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.22),transparent_34%)]" />

      <div className="relative mx-auto max-w-[1200px]">
        <Link
          to="/services"
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to UK services
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Professional Services CRM Support UK
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Professional services CRM support for UK firms
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Primewayz UK helps consultants, recruiters, accountants, agencies, and B2B service teams connect website enquiries, CRM workflows, follow-up tasks, and reporting into one clearer lead-flow process.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/contact-us#book-call"
                ctaText="Book a UK discovery call"
                ctaLocation="professional_services_crm_hero"
                eventType="book_call_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
              >
                Book a UK discovery call
              </TrackedLink>

              <Link
                to="/success-stories/professional-services-crm-cleanup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                View CRM cleanup example
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-6 text-slate-950">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Lead-flow problem
                  </p>
                  <h2 className="text-xl font-black text-[#000A2D]">
                    Enquiry to follow-up is not always connected
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {['Website form', 'CRM record', 'Owner assigned', 'Follow-up task', 'Reporting view'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                The goal is simple: make every enquiry easier to capture, assign, follow up, and measure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Common CRM and lead-flow issues
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Good enquiries can still be lost when the process is unclear
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Many professional services firms do not need a bigger system first. They need cleaner enquiry capture, clearer CRM ownership, better follow-up, and reporting that shows what is really happening.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {painPoints.map((point) => (
            <div key={point} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-7 text-slate-700">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Service solution
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Connect website forms, CRM workflows, follow-up, and reporting
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            We help UK professional services firms improve the practical journey from first enquiry to follow-up action, CRM visibility, and monthly management reporting.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {supportAreas.map((area) => {
            const Icon = area.icon;

            return (
              <div key={area.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[#000A2D]">{area.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{area.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Who this is for
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Built for UK professional services teams
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            This page is for service businesses where enquiries, relationships, follow-ups, and reporting matter more than simple online transactions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {whoFor.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Users className="mb-4 h-6 w-6 text-emerald-700" />
              <p className="text-sm font-bold leading-6 text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            What improves
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Better visibility from enquiry to follow-up
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-200">
            The aim is not to make CRM complicated. The aim is to make your lead-flow easier to trust, easier to manage, and easier to improve each month.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-3xl border border-white/10 bg-white/10 p-6">
              <BarChart3 className="mb-5 h-7 w-7 text-emerald-300" />
              <h3 className="text-lg font-black">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Related support
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Connect this page with the wider Primewayz UK support model
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Professional services CRM support often works best alongside website maintenance, software subscription support, and a clear success-story reference.
          </p>
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

    <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1fr_0.7fr] lg:items-center">
        <div>
          <ShieldCheck className="h-10 w-10 text-emerald-700" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Start with a focused CRM and lead-flow review
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We can review your current website enquiry process, CRM setup, follow-up workflow, and reporting gaps before suggesting a practical monthly support path.
          </p>
        </div>

        <TrackedLink
          href="/contact-us#book-call"
          ctaText="Book a UK discovery call"
          ctaLocation="professional_services_crm_final_cta"
          eventType="book_call_click"
          className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          Book a UK discovery call
        </TrackedLink>
      </div>
    </section>
  </main>
);
