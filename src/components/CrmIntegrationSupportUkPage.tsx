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
import { SelfAuditCta } from './SelfAuditCta';
import { DigitalSystemsReviewCtaGroup } from './conversion/DigitalSystemsReviewCtaGroup';
import { AuthorityProofSection } from './sections/AuthorityProofSection';
import { getSuccessStoryPath } from '../data/successStories';

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
    href: '/maintenance',
  },
  {
    label: 'UK SME examples',
    href: '/success-stories',
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
    anchor: 'Software development as a subscription for UK businesses',
    text: 'For businesses with an ongoing backlog of improvements, integrations and feature work that need structured monthly development capacity.',
  },
  {
    title: 'Website Maintenance Subscription',
    href: '/maintenance',
    anchor: 'Website maintenance subscription for UK SMEs',
    text: 'For UK businesses that need website updates, form fixes, landing page improvements, technical SEO checks, analytics support, and monthly care.',
  },
  {
    title: 'Wholesale order-management platform story',
    href: getSuccessStoryPath('wholesale-order-management-platform'),
    anchor: 'Wholesale order-management and workflow platform example',
    text: 'See how structured CRM and operational workflow support can improve enquiry visibility and follow-up across complex business processes.',
  },
];

export function CrmIntegrationSupportUkPage() {
  return (
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
                CRM Integration & Workflow Automation
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                CRM Integration & Workflow Automation for UK SMEs
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                Connect website enquiries, CRM records, follow-up workflows and reporting so leads
                move through the business consistently and teams have reliable information.
                Primewayz helps UK SMEs reduce missed follow-ups, duplicate records and repetitive
                administration across enquiry journeys.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <DigitalSystemsReviewCtaGroup
                  sourceLocation="service_page"
                  serviceArea="CRM & Workflow Automation"
                  primaryPlacement="crm_hero_primary"
                  secondaryPlacement="crm_hero_secondary"
                  variant="onDark"
                />
                <a
                  href="#crm-services"
                  className="inline-flex min-h-[44px] w-fit items-center text-sm font-medium text-white/75 underline-offset-2 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
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
                  'Website enquiries are not reaching the CRM cleanly.',
                  'Duplicate or incomplete records slow follow-up and reporting.',
                  'Lead assignment and reminders still depend on manual work.',
                  'Forms, source attribution and reporting are disconnected.',
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

      <SelfAuditCta variant="inline" utmContent="crm_page" ctaLocation="crm_page" />

      <section id="crm-services" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
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
            <h3 className="text-lg font-bold text-slate-950">
              Automation requirements often evolve after the first workflow
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              CRM integration works best when your website forms, tracking, support process, and monthly delivery backlog are connected.
              Many UK SMEs combine CRM support with{' '}
              <Link
                to="/maintenance"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                website maintenance
              </Link>
              {' '}and{' '}
              <Link
                to="/software-development-subscription-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                ongoing software development support
              </Link>
              {' '}so lead capture, follow-up, reporting, and system improvements keep moving together. Monthly development capacity can support continuous refinement and integration after the first workflow is delivered.
            </p>
          </div>
        </div>
      </section>

      <section id="crm-platforms" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
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
        <div className="mx-auto max-w-[1200px]">
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
        <div className="mx-auto max-w-[1200px]">
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
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-3">
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

      <AuthorityProofSection
        id="crm-authority-proof"
        eyebrow="Relevant delivery experience"
        heading="Working with connected customer, order and operational workflows"
        introduction="Our experience supporting an established wholesale platform includes understanding and improving the relationships between catalogue, inventory, warehouse, customer and order processes."
        storySlugs={['wholesale-order-management-platform']}
        ctaLabel="Read the delivery story"
      />

      <section id="crm-related-services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
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
        <div className="mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <ShieldCheck className="h-10 w-10 text-emerald-300" />

            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Start with a CRM workflow review
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-200">
              Share where enquiry capture, CRM records, follow-up or reporting is creating friction.
              We will review the submitted context and identify a practical next step—without
              obligation.
            </p>
          </div>

          <DigitalSystemsReviewCtaGroup
            sourceLocation="service_page"
            serviceArea="CRM & Workflow Automation"
            primaryPlacement="crm_final_primary"
            secondaryPlacement="crm_final_secondary"
            variant="onDark"
          />
        </div>
      </section>
    </main>
  );
}
