import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SEO } from './SEO';

const supportItems = [
  'Website content updates, CMS edits, and landing page improvements',
  'Bug fixes, broken layout fixes, form fixes, and CTA improvements',
  'Technical SEO checks, metadata cleanup, redirects, and indexability support',
  'Speed, performance, mobile UX, and basic accessibility improvements',
  'Analytics, GA4 event checks, Search Console review, and conversion tracking support',
  'Monthly improvement backlog, priority planning, testing, and release support',
];

const painPoints = [
  'Small website changes keep waiting for weeks.',
  'Your website is live, but nobody clearly owns ongoing improvement.',
  'Forms, CTAs, analytics, or SEO basics are not regularly checked.',
  'You need reliable monthly progress without hiring a full-time developer.',
];

const processSteps = [
  {
    title: 'Review',
    text: 'We review your current website, CMS, analytics, Search Console, forms, speed, SEO basics, and priority issues.',
  },
  {
    title: 'Prioritise',
    text: 'We create a practical monthly backlog covering urgent fixes, quick improvements, and commercially useful updates.',
  },
  {
    title: 'Maintain',
    text: 'We handle approved website updates, fixes, checks, and improvements through a controlled delivery rhythm.',
  },
  {
    title: 'Improve',
    text: 'We review what changed, what still blocks conversion, and what should be improved in the next cycle.',
  },
];

const relatedLinks = [
  {
    title: 'All UK SME support services',
    href: '/services',
    text: 'Compare website maintenance, software development, CRM support, automation, analytics checks, and monthly digital delivery options.',
  },
  {
    title: 'Software development subscription',
    href: '/software-development-subscription-uk',
    text: 'For UK SMEs that need ongoing software delivery across websites, dashboards, CRM workflows, automation, integrations, and maintenance.',
  },
  {
    title: 'CRM integration support',
    href: '/crm-integration-support-uk',
    text: 'For UK businesses that need cleaner lead capture, enquiry routing, CRM workflows, notifications, reporting, and operational visibility.',
  },
  {
    title: 'E-commerce stability success story',
    href: '/success-stories/ecommerce-store-stability-support',
    text: 'See how ongoing website and store stability support can help e-commerce businesses reduce friction and keep improvements moving.',
  },
];

export const WebsiteMaintenanceSubscriptionUkPage = () => (
  <>
    <SEO
      title="Website Maintenance Subscription for UK SMEs"
      description="Website maintenance subscription for UK SMEs covering website updates, bug fixes, landing page improvements, technical SEO checks, GA4 and Search Console reviews, form fixes, speed checks, testing, and monthly website support."
      canonical="https://uk.primewayz.com/website-maintenance-subscription-uk"
    />

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
                UK SME Website Support
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Website maintenance subscription for UK SMEs
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                Keep your website stable, updated, measurable, and improving every month.
                Primewayz UK supports website updates, bug fixes, technical SEO checks,
                landing page improvements, analytics, and ongoing conversion-focused maintenance
                without forcing every small change into a separate project.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/#contact"
                  ctaText="Book a UK website maintenance review"
                  ctaLocation="website_maintenance_hero"
                  eventType="book_call_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
                >
                  Book a UK website maintenance review
                </TrackedLink>

                <TrackedLink
                  href="/#pricing"
                  ctaText="View monthly plans"
                  ctaLocation="website_maintenance_hero"
                  eventType="pricing_plan_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  View monthly plans
                </TrackedLink>
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              What is included
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Monthly website maintenance that protects performance and supports conversion
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              The aim is not only to keep the site running. The aim is to keep the website useful,
              updated, technically healthy, measurable, and aligned with your lead-generation priorities.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Delivery rhythm
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                A practical alternative to delayed website fixes
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Instead of waiting for one-off website tasks to become urgent, we help you maintain
                a clear monthly improvement rhythm with priorities, delivery, testing, and review.
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">For existing websites</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Best for UK SMEs that already have a live website and need consistent updates, checks,
              fixes, technical SEO basics, and conversion-focused improvements.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">For lead generation</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Improve landing pages, contact forms, CTAs, tracking, technical SEO basics,
              Search Console visibility, and conversion journeys.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold">For controlled support</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use a predictable monthly support model instead of scattered fixes, unclear ownership,
              delayed changes, or disconnected website tasks.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Related UK SME support paths
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Connect website maintenance with the services around it
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Website maintenance becomes more valuable when updates, CRM workflows, technical SEO,
              analytics checks, automation, and monthly delivery planning are connected through one practical roadmap.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              >
                <h3 className="text-xl font-bold text-slate-950">{link.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">{link.text}</p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  View related page
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
            <h2 className="text-3xl font-bold tracking-tight">Start with a maintenance review</h2>

            <p className="mt-4 text-base leading-7 text-slate-200">
              We will review what is stable, what needs fixing, what affects visibility, and what should be improved first.
            </p>
          </div>

          <TrackedLink
            href="/#contact"
            ctaText="Book website maintenance review"
            ctaLocation="website_maintenance_final_cta"
            eventType="book_call_click"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            Book a website maintenance review
          </TrackedLink>
        </div>
      </section>
    </main>
  </>
);