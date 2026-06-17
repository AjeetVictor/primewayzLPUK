import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DatabaseZap,
  Network,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';

const services = [
  {
    title: 'Website form to CRM integration',
    description:
      'Connect website enquiries, landing page forms, quote requests, and campaign leads directly into your CRM with clean field mapping and source tracking.',
  },
  {
    title: 'Lead routing and notifications',
    description:
      'Route enquiries to the right person or team, trigger email alerts, and reduce the risk of missed follow-ups or delayed responses.',
  },
  {
    title: 'CRM workflow cleanup',
    description:
      'Improve fields, stages, tags, statuses, lead ownership, duplicate handling, and follow-up workflows so the CRM becomes easier to use.',
  },
  {
    title: 'Automation and task creation',
    description:
      'Automate reminders, follow-up tasks, status changes, internal notifications, and repeated admin steps around your sales or service process.',
  },
  {
    title: 'CRM reporting and visibility',
    description:
      'Create clearer views for enquiries, pipeline stages, response times, conversion points, and operational reporting.',
  },
  {
    title: 'Third-party integrations',
    description:
      'Connect CRM data with email tools, spreadsheets, booking systems, e-commerce platforms, project tools, dashboards, and other business systems.',
  },
];

const platforms = ['HubSpot', 'Zoho CRM', 'Salesforce', 'Pipedrive', 'Monday.com', 'Freshworks'];

const benefits = [
  {
    title: 'Reduce missed enquiries',
    description:
      'Website leads, form submissions, and campaign enquiries can move into the CRM with clearer ownership, routing, and alerts.',
  },
  {
    title: 'Remove duplicate manual entry',
    description:
      'Reduce repeated copying between forms, spreadsheets, email inboxes, and CRM records through cleaner integration and automation.',
  },
  {
    title: 'Improve follow-up consistency',
    description:
      'Tasks, reminders, notifications, and workflow rules help your team respond more reliably and keep opportunities moving.',
  },
  {
    title: 'Clean up messy CRM data',
    description:
      'Better field structure, duplicate handling, stage cleanup, and source tracking make CRM data more useful for daily operations.',
  },
  {
    title: 'Make reporting easier',
    description:
      'Create clearer operational visibility across leads, enquiries, pipeline stages, campaigns, and monthly performance checks.',
  },
  {
    title: 'Support monthly improvement',
    description:
      'Keep CRM workflows improving over time instead of treating integration as a one-off setup that slowly becomes outdated.',
  },
];

const processSteps = [
  {
    title: 'Review',
    description:
      'We review your current CRM, website forms, enquiry sources, lead stages, follow-up process, reports, and operational pain points.',
  },
  {
    title: 'Map',
    description:
      'We map fields, workflows, routing rules, automations, notifications, and reporting needs before implementation begins.',
  },
  {
    title: 'Integrate',
    description:
      'We connect approved systems, configure workflows, test data flow, validate notifications, and check CRM behaviour end to end.',
  },
  {
    title: 'Improve',
    description:
      'We monitor what works, review gaps, clean up friction, and keep improving the CRM workflow as your business process evolves.',
  },
];

const heroLinks = [
  {
    label: 'Professional services CRM support',
    href: '/professional-services-crm-support-uk',
  },
  {
    label: 'All UK SME services',
    href: '/services',
  },
  {
    label: 'Software subscription',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'Website maintenance',
    href: '/website-maintenance-subscription-uk',
  },
  {
    label: 'UK SME examples',
    href: '/#success-stories',
  },
];

const relatedLinks = [
  {
    title: 'All UK SME Support Services',
    href: '/services',
    anchor: 'Compare all Primewayz UK SME support services',
    text: 'Compare CRM integration, software delivery, website maintenance, automation, analytics checks, and monthly digital support options.',
  },
  {
    title: 'Software Development Subscription',
    href: '/software-development-subscription-uk',
    anchor: 'Software development subscription for UK SMEs',
    text: 'For UK SMEs that need ongoing software delivery across websites, dashboards, CRM workflows, automation, integrations, and maintenance.',
  },
  {
    title: 'Website Maintenance Subscription',
    href: '/website-maintenance-subscription-uk',
    anchor: 'Website maintenance subscription for UK SMEs',
    text: 'For UK businesses that need website updates, form fixes, landing page improvements, technical SEO checks, analytics support, and monthly care.',
  },
  {
    title: 'Professional Services CRM Cleanup Story',
    href: '/success-stories/professional-services-crm-cleanup',
    anchor: 'Professional services CRM and lead-flow cleanup example',
    text: 'See how CRM cleanup and lead-flow improvements can help professional services firms improve enquiry visibility and follow-up.',
  },
];

export function CrmIntegrationSupportUkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl">
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
                UK SME CRM Integration Support
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                CRM integration support for UK SMEs
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                Connect website forms, enquiry sources, CRM workflows, notifications, reporting,
                and business tools into one clearer lead-flow process. Primewayz UK helps small
                and growing UK businesses clean up CRM operations, reduce manual work, and improve
                follow-up visibility through practical monthly support.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/#contact"
                  ctaText="Book a CRM integration review"
                  ctaLocation="crm_integration_hero"
                  eventType="book_call_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
                >
                  Book a CRM integration review
                </TrackedLink>

                <a
                  href="#crm-services"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  View CRM support areas
                </a>
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
              <h2 className="text-xl font-bold">Best suited for</h2>

              <div className="mt-5 space-y-4">
                {[
                  'Website enquiries are not flowing cleanly into your CRM.',
                  'Leads are duplicated, missed, delayed, or poorly assigned.',
                  'Your team still relies on spreadsheets, inboxes, and manual updates.',
                  'You need better visibility across enquiries, follow-ups, and pipeline activity.',
                ].map((item) => (
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

      <section id="crm-services" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              What is included
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              CRM integration services built around real enquiry and follow-up problems
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              We help UK SMEs connect the practical parts of lead management: website forms,
              CRM fields, enquiry routing, notifications, reporting, workflow automation,
              third-party tools, and ongoing operational improvements.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <DatabaseZap className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold leading-7 text-slate-700">
              CRM integration works best when your website forms, tracking, support process, and monthly delivery backlog are connected.
              Many UK SMEs combine{' '}
              <Link
                to="/crm-integration-support-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                CRM integration support
              </Link>
              {' '}with{' '}
              <Link
                to="/website-maintenance-subscription-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                website maintenance
              </Link>
              {' '}and a{' '}
              <Link
                to="/software-development-subscription-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                software development subscription
              </Link>
              {' '}to keep lead capture, follow-up, reporting, and system improvements moving together.
            </p>
          </div>
        </div>
      </section>

      <section id="crm-platforms" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                CRM platforms
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Support for common CRM platforms used by UK SMEs
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                We can support CRM workflow cleanup, integrations, and automation planning
                across widely used CRM tools. The exact implementation depends on available APIs,
                permissions, account setup, and your current process.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {platforms.map((platform) => (
                <div key={platform} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <p className="font-bold text-slate-950">{platform}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="crm-benefits" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Operational benefits
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Cleaner CRM workflows make lead handling easier to manage
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              A CRM should help your team respond faster, track opportunities more clearly,
              and understand what is happening across enquiries, sales activity, and follow-up.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-950">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crm-delivery-rhythm" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Delivery rhythm
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                A practical CRM integration process
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                We keep CRM support controlled and measurable by reviewing the process,
                mapping the workflow, implementing carefully, testing data flow, and improving
                the setup through monthly delivery.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {processSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-slate-950">{step.title}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="crm-support-areas" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-6">
            <Network className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">Lead-flow integration</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connect enquiry sources, website forms, campaign pages, CRM fields,
              notifications, and lead routing into a clearer operating flow.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <Workflow className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">Workflow automation</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Improve tasks, reminders, assignments, status changes, follow-up rules,
              and repeated CRM administration.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">Reporting visibility</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Improve how enquiries, pipeline status, lead sources, response times,
              and follow-up activity are monitored.
            </p>
          </div>
        </div>
      </section>

      <section id="crm-related-services" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Related UK SME support paths
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Connect CRM support with the services around it
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              CRM integration becomes more valuable when website forms, software workflows,
              automation, analytics checks, and monthly delivery planning are connected through
              one practical roadmap.
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

      <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <ShieldCheck className="h-10 w-10 text-emerald-300" />

            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Start with a CRM workflow review
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-200">
              We will review your enquiry flow, CRM setup, integrations, follow-up process,
              reporting gaps, and automation opportunities before suggesting the next practical step.
            </p>
          </div>

          <TrackedLink
            href="/#contact"
            ctaText="Book CRM integration consultation"
            ctaLocation="crm_integration_final_cta"
            eventType="book_call_click"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            Book CRM integration consultation
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
