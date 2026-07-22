import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SelfAuditCta } from './SelfAuditCta';
import { AuthorityProofSection } from './sections/AuthorityProofSection';
import { getSuccessStoryPath } from '../data/successStories';

const visibilitySupportItems = [
  'Technical search visibility, crawlability and indexability checks',
  'Search Console findings, metadata cleanup and page clarity improvements',
  'Trust signals, landing pages and clearer enquiry journeys',
  'Form tracking, conversion tracking and conversion-barrier fixes',
  'Website performance where it affects discovery or enquiry completion',
  'Practical improvement backlog focused on visibility and conversion',
];

const maintenanceSupportItems = [
  'Bug fixing, monitoring and controlled technical housekeeping',
  'Security updates, dependency updates and platform updates',
  'Routine website and application maintenance',
  'Performance stability, release support and operational continuity',
  'Controlled minor improvements within agreed support capacity',
  'Ongoing ownership so live systems stay reliable after launch',
];

const visibilityPainPoints = [
  'Your website is live, but prospective customers struggle to find it.',
  'Pages are unclear, thin or hard for search engines to understand.',
  'Trust signals and enquiry journeys are weak or incomplete.',
  'Forms and conversions are not tracked reliably enough to improve.',
];

const maintenancePainPoints = [
  'Small fixes and updates keep waiting because nobody owns them.',
  'Live websites or applications need reliable monitoring and support.',
  'Security, dependency and platform updates are irregular.',
  'You need continuity without treating every request as a new project.',
];

const processSteps = [
  {
    title: 'Review',
    text: 'We review the current website or application, priorities, risks and the operational issues that matter most.',
  },
  {
    title: 'Prioritise',
    text: 'We create a practical backlog covering urgent fixes, commercially useful improvements and controlled ongoing work.',
  },
  {
    title: 'Maintain',
    text: 'We handle approved updates, fixes, checks and improvements through a controlled delivery rhythm.',
  },
  {
    title: 'Improve',
    text: 'We review what changed, what still blocks progress, and what should be improved in the next cycle.',
  },
];

const heroLinks = [
  {
    label: 'All UK SME services',
    href: '/services',
  },
  {
    label: 'Software & product engineering',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'CRM automation',
    href: '/crm-automation-support',
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
    text: 'Compare website visibility, CRM automation, software engineering, managed support and remote team extension options.',
  },
  {
    title: 'Software & Product Engineering',
    href: '/software-development-subscription-uk',
    anchor: 'Explore ongoing software and product engineering',
    text: 'For UK businesses that need continuous software delivery support rather than repeated fixed-scope projects.',
  },
  {
    title: 'CRM Integration & Workflow Automation',
    href: '/crm-automation-support',
    anchor: 'CRM integration and workflow automation for UK SMEs',
    text: 'For UK businesses that need cleaner lead capture, enquiry routing, CRM workflows, notifications, reporting and operational visibility.',
  },
  {
    title: 'RentReadBuy platform continuity story',
    href: getSuccessStoryPath('rentreadbuy-book-rental-platform'),
    anchor: 'Book rental and commerce platform support example',
    text: 'See how ongoing platform and commerce support can help digital businesses reduce friction and keep improvements moving.',
  },
];

export const WebsiteMaintenanceSubscriptionUkPage = () => {
  const { pathname } = useLocation();
  const normalisedPathname =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const isVisibilityPage = normalisedPathname === '/website-visibility-support';
  const isMaintenancePage =
    normalisedPathname === '/maintenance' ||
    normalisedPathname === '/website-maintenance-subscription-uk';

  const eyebrow = isVisibilityPage
    ? 'Website Visibility & Conversion Support'
    : 'Managed Application & Website Support';
  const h1 = isVisibilityPage
    ? 'Make your website easier to find, trust and enquire from'
    : 'Managed application and website support for UK SMEs';
  const intro = isVisibilityPage
    ? 'Primewayz helps UK SMEs identify and resolve the technical, content and conversion barriers that prevent websites from generating qualified enquiries.'
    : 'Maintain the reliability, security and performance of existing websites and applications through monitoring, fixes, updates and controlled ongoing improvements.';
  const supportItems = isVisibilityPage ? visibilitySupportItems : maintenanceSupportItems;
  const painPoints = isVisibilityPage ? visibilityPainPoints : maintenancePainPoints;
  const primaryCtaText = isVisibilityPage
    ? 'Discuss website visibility priorities'
    : 'Discuss managed support needs';
  const supportHeading = isVisibilityPage
    ? 'Website visibility and conversion support that improves discovery and enquiry readiness'
    : 'Managed support that protects reliability and enables controlled improvement';
  const supportLead = isVisibilityPage
    ? 'Visibility and conversion work focuses on discovery, clarity, trust and enquiry completion. Related website maintenance can sit alongside this service when ongoing ownership is also required.'
    : 'Maintenance keeps systems stable, secure and operational. Improvement delivers controlled enhancements and prioritised fixes. Substantial new features or integrations are handled as development work, not as unlimited monthly requests.';
  const relatedHeading = isVisibilityPage
    ? 'Connect visibility work with the services around it'
    : 'Connect managed support with the services around it';
  const relatedLead = isVisibilityPage
    ? 'Website visibility becomes more valuable when enquiry journeys, CRM follow-up, software delivery and managed support are connected through one practical roadmap.'
    : 'Managed support becomes more valuable when maintenance, CRM workflows, software delivery and visibility improvements are connected through one practical roadmap.';
  const finalHeading = isVisibilityPage
    ? 'Start with a website visibility review'
    : 'Start with a managed support review';
  const finalLead = isVisibilityPage
    ? 'We will review what affects discovery, trust and enquiry completion, and what should be improved first.'
    : 'We will review what is stable, what needs fixing, what affects continuity, and what should be improved first.';
  const finalCtaText = isVisibilityPage
    ? 'Book a website visibility review'
    : 'Book a managed support review';
  const ctaLocation = isVisibilityPage ? 'website_visibility_hero' : 'website_maintenance_hero';
  const finalCtaLocation = isVisibilityPage
    ? 'website_visibility_final_cta'
    : 'website_maintenance_final_cta';

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
                {eyebrow}
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {h1}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{intro}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/contact-us#book-call"
                  ctaText={primaryCtaText}
                  ctaLocation={ctaLocation}
                  eventType="book_call_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
                >
                  {primaryCtaText}
                </TrackedLink>

                <TrackedLink
                  href="/pricing"
                  ctaText="View engagement options"
                  ctaLocation={ctaLocation}
                  eventType="pricing_plan_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  View engagement options
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
              <h2 className="text-xl font-bold">Best suited for</h2>

              <div className="mt-5 space-y-4">
                {painPoints.map((item) => (
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

      {isVisibilityPage ? (
        <SelfAuditCta
          variant="inline"
          utmContent="website_visibility_page"
          ctaLocation="website_visibility_page"
        />
      ) : null}

      <section id="website-maintenance-included" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              What is included
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {supportHeading}
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">{supportLead}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              Need continuous delivery rather than a one-off project?
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              After stabilisation, ongoing improvement can continue through a structured{' '}
              <Link
                to="/software-development-subscription-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                monthly development capacity
              </Link>{' '}
              model. Managed support also pairs well with{' '}
              <Link
                to="/crm-automation-support"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                CRM integration support
              </Link>{' '}
              when forms, tracking and follow-up need joined-up ownership.
            </p>
          </div>
        </div>
      </section>

      <section id="website-maintenance-rhythm" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Delivery rhythm
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                A practical alternative to delayed fixes and unclear ownership
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Instead of waiting for one-off tasks to become urgent, we help you maintain a clear
                improvement rhythm with priorities, delivery, testing and review.
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

                  <p className="mt-4 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="website-maintenance-use-cases" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">
              {isVisibilityPage ? 'For underperforming websites' : 'For existing websites and apps'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isVisibilityPage
                ? 'Best for UK SMEs that already have a live website and need clearer discovery, stronger trust signals and better enquiry journeys.'
                : 'Best for UK SMEs that already have live websites or applications and need consistent updates, fixes, monitoring and operational continuity.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">
              {isVisibilityPage ? 'For enquiry generation' : 'For service continuity'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isVisibilityPage
                ? 'Improve landing pages, contact forms, CTAs, tracking, technical search foundations, Search Console findings and conversion journeys.'
                : 'Protect reliability through monitoring, security updates, dependency updates, release support and controlled technical housekeeping.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">For controlled ownership</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use a predictable support model instead of scattered fixes, unclear ownership, delayed
              changes or disconnected digital tasks. Plans cover agreed capacity—not unlimited work.
            </p>
          </div>
        </div>
      </section>

      {isVisibilityPage ? (
        <AuthorityProofSection
          id="website-visibility-authority-proof"
          eyebrow="Relevant delivery experience"
          heading="Improving discovery and customer journeys through ongoing product work"
          introduction="RentReadBuy demonstrates how catalogue structure, content, technical SEO, campaign pages and commerce journeys need to evolve together rather than being treated as isolated website tasks."
          storySlugs={['rentreadbuy-book-rental-platform', 'restaurant-self-ordering-platform']}
          ctaLabel="Read the delivery story"
        />
      ) : null}

      {isMaintenancePage ? (
        <AuthorityProofSection
          id="website-maintenance-authority-proof"
          eyebrow="Managed support experience"
          heading="Supporting systems that must keep working while they improve"
          introduction="Long-running applications require more than reactive fixes. They need inherited-system understanding, controlled enhancement, delivery continuity and clear technical ownership."
          storySlugs={['wholesale-order-management-platform', 'rentreadbuy-book-rental-platform']}
          ctaLabel="Read the delivery story"
        />
      ) : null}

      <section id="website-maintenance-related-services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Related UK SME support paths
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {relatedHeading}
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">{relatedLead}</p>
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
            <h2 className="text-3xl font-bold tracking-tight">{finalHeading}</h2>

            <p className="mt-4 text-base leading-7 text-slate-200">{finalLead}</p>
          </div>

          <TrackedLink
            href="/contact-us#book-call"
            ctaText={finalCtaText}
            ctaLocation={finalCtaLocation}
            eventType="book_call_click"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            {finalCtaText}
          </TrackedLink>
        </div>
      </section>
    </main>
  );
};
