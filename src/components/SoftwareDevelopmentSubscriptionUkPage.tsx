import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Layers3, ShieldCheck, Workflow, Wrench } from 'lucide-react';
import { SEO } from './SEO';
import { TrackedLink } from './common/TrackedLink';

const SERVICE_URL = 'https://uk.primewayz.com/software-development-subscription-uk';

const includedItems = [
  'Website and landing page improvements',
  'CRM setup, workflow support, and integration planning',
  'Business automation and reporting improvements',
  'SEO foundation support and technical cleanup',
  'Maintenance, bug fixes, and controlled feature updates',
  'Delivery planning, prioritisation, testing, and release support',
];

const fitItems = [
  'You need regular technical progress without hiring a full in-house team.',
  'Your website, CRM, automation, or internal systems need ongoing improvement.',
  'You prefer clear monthly capacity over scattered one-off projects.',
  'You want delivery to stay practical, measurable, and commercially focused.',
];

const steps = [
  {
    title: 'Understand',
    text: 'We review your current website, systems, business goals, bottlenecks, and delivery priorities.',
  },
  {
    title: 'Prioritise',
    text: 'We agree what should be handled first, what can wait, and what needs third-party coordination.',
  },
  {
    title: 'Deliver',
    text: 'We work through a clear monthly delivery rhythm with updates, testing, and controlled releases.',
  },
  {
    title: 'Improve',
    text: 'We review outcomes and keep improving the website, CRM, automation, SEO foundations, and systems over time.',
  },
];

export const SoftwareDevelopmentSubscriptionUkPage = () => {
  return (
    <>
      <SEO
        title="Software Development Subscription for UK SMEs"
        description="Primewayz UK provides subscription-based software development for UK SMEs, covering websites, CRM integrations, automation, SEO foundations, maintenance, and ongoing monthly delivery support."
        canonical={SERVICE_URL}
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
                  UK SME Software Delivery
                </p>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Software development subscription for UK SMEs
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                  Build, maintain, and improve your digital systems through a practical monthly delivery model.
                  Primewayz UK supports websites, CRM integrations, automation, SEO foundations, dashboards,
                  maintenance, and ongoing software improvements without forcing every need into a large one-off project.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="/#contact"
                    ctaText="Book a 30-minute discovery call"
                    ctaLocation="service_page_hero"
                    eventType="book_call_click"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
                  >
                    Book a 30-minute discovery call
                  </TrackedLink>
                  <TrackedLink
                    href="/#pricing"
                    ctaText="View monthly plans"
                    ctaLocation="service_page_hero"
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
                  {fitItems.map((item) => (
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

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                What the subscription covers
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Monthly software delivery capacity for the work UK SMEs actually need
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Instead of treating every improvement as a separate project, we help you maintain a steady delivery
                rhythm across your website, CRM, automation, integrations, reporting, and system improvements.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {includedItems.map((item) => (
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
                  A clearer alternative to scattered one-off development
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  The subscription model works best when your business needs continuous improvement, not a single
                  isolated build. We keep priorities visible and move through work in a controlled sequence.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {steps.map((step, index) => (
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
              <Layers3 className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-5 text-xl font-bold">Websites and systems</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Improve websites, landing pages, CMS areas, dashboards, admin panels, and business-facing applications.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6">
              <Workflow className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-5 text-xl font-bold">CRM and automation</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Support lead capture, enquiry routing, workflow automation, integrations, reporting, and operational visibility.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6">
              <Wrench className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-5 text-xl font-bold">Maintenance and support</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Keep the system stable with bug fixes, updates, technical cleanup, monitoring support, and controlled improvements.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-emerald-300" />
              <h2 className="mt-5 text-3xl font-bold tracking-tight">
                Start with clarity, then move into monthly delivery
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-200">
                If the scope is unclear, start with a Foundation Sprint. If priorities are already clear,
                move straight into a monthly plan and begin improving the workstream.
              </p>
            </div>
            <TrackedLink
              href="/#contact"
              ctaText="Discuss software subscription"
              ctaLocation="service_page_final_cta"
              eventType="book_call_click"
              className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              Discuss your delivery needs
            </TrackedLink>
          </div>
        </section>
      </main>
    </>
  );
};
