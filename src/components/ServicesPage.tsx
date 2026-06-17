import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CodeXml,
  LifeBuoy,
  Network,
  PhoneCall,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';

const serviceCards = [
  {
    title: 'Software Development Subscription',
    href: '/software-development-subscription-uk',
    icon: CodeXml,
    anchor: 'Software development subscription for UK SMEs',
    description:
      'Monthly software delivery support for UK SMEs that need steady progress across websites, dashboards, admin panels, CRM workflows, automation, integrations, SEO foundations, maintenance, and controlled feature updates.',
    bestFor: [
      'Ongoing software improvements',
      'Business systems and dashboards',
      'CRM, automation, and integration work',
    ],
  },
  {
    title: 'Website Maintenance Subscription',
    href: '/website-maintenance-subscription-uk',
    icon: LifeBuoy,
    anchor: 'Website maintenance subscription for UK SMEs',
    description:
      'Reliable website maintenance for UK small businesses, covering content updates, bug fixes, forms, CTAs, technical SEO checks, analytics support, landing page improvements, speed checks, and monthly website care.',
    bestFor: [
      'Website updates and CMS edits',
      'Technical SEO and indexability checks',
      'Conversion and tracking improvements',
    ],
  },
  {
    title: 'CRM Integration & Support',
    href: '/crm-integration-support-uk',
    icon: Network,
    anchor: 'CRM integration support for UK SMEs',
    description:
      'CRM integration and lead-flow support for UK SMEs that need cleaner enquiry routing, website form connections, CRM field mapping, duplicate handling, notifications, reporting, and workflow automation.',
    bestFor: [
      'Website-to-CRM integration',
      'Lead tracking and follow-up workflows',
      'CRM cleanup and operational visibility',
    ],
  },
];

const supportAreas = [
  'Website updates and landing pages',
  'CMS improvements and bug fixes',
  'CRM workflow cleanup',
  'Website form and lead routing',
  'Business automation',
  'API and third-party integrations',
  'Analytics and GA4 checks',
  'Search Console and technical SEO basics',
  'Dashboards and reporting workflows',
  'Maintenance mode and monthly care',
];

const industryPaths = [
  {
    title: 'Local trades and service businesses',
    href: '/success-stories/local-trades-lead-capture',
    icon: PhoneCall,
    anchor: 'Local trades website and lead capture example',
    text:
      'For plumbers, electricians, roofers, builders, cleaners, landscapers, and local service firms that need clearer quote requests, call tracking, WhatsApp leads, and faster follow-ups.',
  },
  {
    title: 'Professional services firms',
    href: '/professional-services-crm-support-uk',
    icon: Users,
    anchor: 'Professional services CRM support for UK firms',
    text:
      'For consultants, accountants, recruiters, advisors, and B2B service teams that need cleaner CRM workflows, website enquiry tracking, follow-up automation, and reporting visibility.',
  },
  {
    title: 'E-commerce and online stores',
    href: '/success-stories/ecommerce-store-stability-support',
    icon: ShoppingCart,
    anchor: 'E-commerce store stability and support example',
    text:
      'For small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses that need stable product pages, checkout journeys, tracking, and offer updates.',
  },
];

const hubLinks = [
  {
    label: 'Software subscription',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'Website maintenance',
    href: '/website-maintenance-subscription-uk',
  },
  {
    label: 'CRM integration',
    href: '/crm-integration-support-uk',
  },
  {
    label: 'UK SME examples',
    href: '#uk-sme-use-cases',
  },
];

const reasons = [
  'You need regular digital improvements but do not want to hire a full in-house developer.',
  'Your website, CRM, automations, forms, analytics, or integrations need a clear monthly owner.',
  'You want practical execution across small but important tasks without restarting a new project every time.',
  'You need a transparent monthly delivery model with clear scope, add-ons, and maintenance options.',
];

export const ServicesPage = () => (
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

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              UK SME Digital Support Services
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Software, Website & CRM Support Services for UK SMEs
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Primewayz UK helps small and growing UK businesses keep digital work moving every month.
              Choose support for software delivery, website maintenance, CRM integration, automation,
              technical SEO foundations, analytics checks, and ongoing digital improvement.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/#contact"
                ctaText="Book a UK discovery call"
                ctaLocation="services_hero"
                eventType="book_call_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
              >
                Book a UK discovery call
              </TrackedLink>

              <TrackedLink
                href="/#pricing"
                ctaText="View monthly plans"
                ctaLocation="services_hero"
                eventType="pricing_plan_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                View monthly plans
              </TrackedLink>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {hubLinks.map((item) => (
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
              {reasons.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="core-service-paths" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Core service paths
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Choose the support route that fits your next operational priority
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Start with the area causing the most friction today — software delivery, website maintenance,
            or CRM integration — then build a practical monthly improvement rhythm around it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {serviceCards.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.href}
                to={service.href}
                aria-label={service.anchor}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000A2D] text-white transition group-hover:bg-emerald-600">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black text-[#000A2D]">{service.title}</h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>

                <ul className="mt-5 space-y-2">
                  {service.bestFor.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  {service.anchor}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold leading-7 text-slate-700">
            These services can work separately or together. Many UK SMEs start with{' '}
            <Link
              to="/website-maintenance-subscription-uk"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              website maintenance
            </Link>
            , then add{' '}
            <Link
              to="/crm-integration-support-uk"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              CRM integration support
            </Link>{' '}
            or a{' '}
            <Link
              to="/software-development-subscription-uk"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              software development subscription
            </Link>{' '}
            when the monthly improvement backlog becomes clearer.
          </p>
        </div>
      </div>
    </section>

    <section id="support-areas" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              What we support monthly
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Practical support across the systems that run your business
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              The goal is to reduce operational friction. We help keep your website, CRM, forms,
              automation, integrations, analytics, reporting, and technical SEO foundations moving through a clear delivery rhythm.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {supportAreas.map((area) => (
              <div key={area} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-800">{area}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="uk-sme-use-cases" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            UK SME use cases
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Support routes for common UK business operations
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Different businesses feel digital friction in different places. These examples show how
            our monthly delivery model can support specific operational needs.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {industryPaths.map((path) => {
            const Icon = path.icon;

            return (
              <Link
                key={path.href}
                to={path.href}
                aria-label={path.anchor}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black text-[#000A2D]">{path.title}</h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">{path.text}</p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  {path.anchor}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>

    <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Start with clarity
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Not sure which service path fits?
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-200">
            Book a discovery call and we will help identify whether your business should start with
            software delivery, website maintenance, CRM integration, a Foundation Sprint, or maintenance mode.
          </p>
        </div>

        <TrackedLink
          href="/#contact"
          ctaText="Discuss services"
          ctaLocation="services_final_cta"
          eventType="book_call_click"
          className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          Discuss your support needs
        </TrackedLink>
      </div>
    </section>
  </main>
);