import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CodeXml,
  LifeBuoy,
  Network,
  PhoneCall,
  SearchCheck,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SelfAuditCta } from './SelfAuditCta';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../lib/utm';
import { getSuccessStoryPath } from '../data/successStories';

const serviceCards = [
  {
    title: 'Website Visibility & Conversion',
    href: '/website-visibility-support',
    icon: SearchCheck,
    anchor: 'Website visibility and conversion support for UK SMEs',
    description:
      'Improve how your website is discovered, understood and used by prospective customers. We address technical search issues, page clarity, trust signals, enquiry journeys, tracking and conversion barriers.',
    bestFor: [
      'Technical search and indexability issues',
      'Clearer pages and enquiry journeys',
      'Trust signals and conversion tracking',
    ],
    proofLabel: 'RentReadBuy platform story',
    proofHref: getSuccessStoryPath('rentreadbuy-book-rental-platform'),
  },
  {
    title: 'CRM & Workflow Automation',
    href: '/crm-automation-support',
    icon: Network,
    anchor: 'CRM integration and workflow automation for UK SMEs',
    description:
      'Connect website enquiries, CRM records, follow-up workflows and reporting so leads are handled consistently and teams spend less time on repetitive administration.',
    bestFor: [
      'Website-to-CRM integration',
      'Lead tracking and follow-up workflows',
      'Reporting and operational visibility',
    ],
    proofLabel: 'Wholesale platform continuity story',
    proofHref: getSuccessStoryPath('wholesale-order-management-platform'),
  },
  {
    title: 'Software & Product Engineering',
    href: '/software-development-subscription-uk',
    icon: CodeXml,
    anchor: 'Ongoing software and product engineering for UK businesses',
    description:
      'Build, improve, integrate or modernise business applications, web platforms and digital products through structured, accountable software delivery.',
    bestFor: [
      'Application and product feature development',
      'Integrations, backlog delivery and modernisation',
      'Structured monthly engineering capacity',
    ],
    proofLabel: 'Restaurant self-ordering story',
    proofHref: getSuccessStoryPath('restaurant-self-ordering-platform'),
  },
  {
    title: 'Managed Application & Website Support',
    href: '/maintenance',
    icon: LifeBuoy,
    anchor: 'Managed application and website support for UK SMEs',
    description:
      'Maintain the reliability, security and performance of existing websites and applications through monitoring, fixes, updates and controlled ongoing improvements.',
    bestFor: [
      'Monitoring, fixes and security updates',
      'Platform and dependency maintenance',
      'Controlled minor improvements',
    ],
    proofLabel: 'Wholesale managed-support story',
    proofHref: getSuccessStoryPath('wholesale-order-management-platform'),
  },
  {
    title: 'Remote IT Team Extension',
    href: buildInternalUtmUrl(
      '/remote-it-resources',
      'services_hub',
      REMOTE_RESOURCE_CAMPAIGN,
      'services_hub_card',
    ),
    icon: Users,
    anchor: 'Remote IT team extension for UK businesses',
    description:
      'Add experienced developers, QA professionals, analysts, project coordinators and technical specialists when your internal team needs dependable additional capacity.',
    bestFor: [
      'Developers and QA capacity',
      'Business analysis and project coordination',
      'Delivery continuity with clear ownership',
    ],
    proofLabel: 'Long-term delivery continuity story',
    proofHref: getSuccessStoryPath('wholesale-order-management-platform'),
    isNew: true,
  },
];

const supportAreas = [
  'Website visibility and conversion improvements',
  'CRM workflow and lead-handling cleanup',
  'Software and product engineering',
  'Managed website and application support',
  'API and third-party integrations',
  'Remote developers, QA and technical specialists',
  'Analytics and conversion tracking checks',
  'Search Console and technical search foundations',
  'Release support and technical housekeeping',
  'Structured monthly delivery and priorities',
];

const industryPaths = [
  {
    title: 'Local trades and service businesses',
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
    icon: PhoneCall,
    anchor: 'Website visibility and enquiry support for local service businesses',
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
    href: getSuccessStoryPath('rentreadbuy-book-rental-platform'),
    icon: ShoppingCart,
    anchor: 'Book rental and commerce platform support example',
    text:
      'For small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses that need stable product pages, checkout journeys, tracking, and offer updates.',
  },
];

const hubLinks = [
  {
    label: 'Website visibility',
    href: '/website-visibility-support',
  },
  {
    label: 'Software & product engineering',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'Managed support',
    href: '/maintenance',
  },
  {
    label: 'CRM automation',
    href: '/crm-automation-support',
  },
  {
    label: 'UK SME examples',
    href: '#uk-sme-use-cases',
  },
];

const reasons = [
  'You need clearer ownership across websites, CRM workflows, software and live applications.',
  'Your systems are live, but disconnected, outdated or poorly supported.',
  'You want practical delivery without building a large in-house technical team.',
  'You need assessment, fixed-scope work, structured monthly delivery or managed support—organised around business priorities.',
];

export const ServicesPage = () => (
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

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              UK SME Digital Systems & Delivery
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Practical technical support across your digital operations
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Primewayz supports UK SMEs at different stages of their digital journey—from improving
              website visibility and connecting lead workflows to developing software, taking over
              existing applications and adding experienced delivery capacity.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Each engagement starts with the business problem rather than a predetermined technology
              or package. Work can be delivered through an assessment, fixed project, structured
              monthly plan, managed support arrangement or dedicated technical team.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/contact-us#book-call"
                ctaText="Discuss Your Digital Priorities"
                ctaLocation="services_hero"
                eventType="book_call_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
              >
                Discuss Your Digital Priorities
              </TrackedLink>

              <TrackedLink
                href="/pricing"
                ctaText="View engagement options"
                ctaLocation="services_hero"
                eventType="pricing_plan_click"
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                View engagement options
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

    <SelfAuditCta variant="inline" utmContent="services_page" ctaLocation="services_page" />

    <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Free tool</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">Check if your website is enquiry-ready</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Run a free digital visibility check covering SEO, trust signals, lead capture, and local relevance.
          </p>
        </div>
        <Link
          to="/uk-sme-digital-visibility-checker"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Check My Website
        </Link>
      </div>
    </section>

    <section id="core-service-paths" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Core service paths
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Choose the support route that fits your next operational priority
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Start with the area causing the most friction today—website visibility, CRM workflows,
            software delivery, managed support or additional technical capacity—then organise the
            right engagement model around it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {serviceCards.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.href}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
              >
                <Link to={service.href} aria-label={service.anchor} className="flex flex-1 flex-col">
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000A2D] text-white transition group-hover:bg-emerald-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    {'isNew' in service && service.isNew ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        New
                      </span>
                    ) : null}
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

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Related delivery story
                  </p>
                  <Link
                    to={service.proofHref}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-emerald-700"
                  >
                    {service.proofLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">
            Need continuous delivery rather than a one-off project?
          </h3>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
            These services can work separately or together. Many UK SMEs start with{' '}
            <Link
              to="/maintenance"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              website maintenance
            </Link>
            , then add{' '}
            <Link
              to="/crm-automation-support"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              CRM integration support
            </Link>{' '}
            or{' '}
            <Link
              to="/software-development-subscription-uk"
              className="font-black text-emerald-700 hover:text-emerald-800"
            >
              software development as a subscription
            </Link>{' '}
            when the monthly improvement backlog becomes clearer.
          </p>
        </div>
      </div>
    </section>

    <section id="support-areas" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
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
      <div className="mx-auto max-w-[1200px]">
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
      <div className="mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
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
          href="/contact-us#book-call"
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