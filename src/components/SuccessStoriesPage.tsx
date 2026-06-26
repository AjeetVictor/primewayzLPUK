import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, PhoneCall, Users, Zap } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { SelfAuditCta } from './SelfAuditCta';

const stories = [
  {
    title: 'Local Trades Website & Lead Capture Setup',
    category: 'UK Local Trades',
    summary:
      'For plumbers, electricians, roofing firms, builders, cleaners, landscapers, and local service businesses that need clearer quote requests, call tracking, WhatsApp leads, and faster follow-ups.',
    keyOutcome: '84 new enquiries captured monthly with structured quote requests and tracked call-to-action journeys.',
    image: '/images/localTradesWbsite.webp',
    icon: PhoneCall,
    href: '/success-stories/local-trades-lead-capture',
  },
  {
    title: 'Professional Services: CRM & Lead Flow Cleanup',
    category: 'UK Professional Services',
    summary:
      'A practical CRM and form-flow improvement sprint for consultants, accountants, recruitment firms, advisors, and service teams that need cleaner lead tracking and follow-up visibility.',
    keyOutcome: 'Cleaner enquiry capture and follow-up visibility within the first release cycle.',
    image: '/images/professional-services-crm-cleanup.webp',
    icon: Zap,
    href: '/success-stories/professional-services-crm-cleanup',
  },
  {
    title: 'E-commerce Store Stability & Support',
    category: 'UK E-commerce SMEs',
    summary:
      'Support for small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses that need reliable product pages, smoother checkout journeys, and clean campaign tracking.',
    keyOutcome: 'More reliable product pages, smoother checkout checks, and monthly stability support for store confidence.',
    image: '/images/ecommerce-store-stability-support.webp',
    icon: Users,
    href: '/success-stories/ecommerce-store-stability-support',
  },
] as const;

export const SuccessStoriesPage = () => (
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

        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
          UK SME Examples
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Success Stories for UK SMEs
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          See how Primewayz UK helps businesses improve lead capture, CRM workflows, website stability,
          and ongoing digital delivery.
        </p>
      </div>
    </section>

    <SelfAuditCta variant="inline" utmContent="success_stories_page" ctaLocation="success_stories_page" />

    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {stories.map((story) => {
            const Icon = story.icon;
            return (
              <article
                key={story.href}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={story.image}
                    alt={story.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 backdrop-blur-md">
                    {story.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h2 className="text-xl font-black tracking-tight text-slate-950">{story.title}</h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">{story.summary}</p>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                      Key outcome
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">{story.keyOutcome}</p>
                  </div>

                  <Link
                    to={story.href}
                    className="mt-6 inline-flex min-h-[44px] items-center text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
                  >
                    Read success story
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-16 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-slate-950">Planning a similar improvement?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Talk through your website, CRM, lead capture, or maintenance priorities with the Primewayz UK team.
          </p>
          <TrackedLink
            href="/contact-us#book-call"
            ctaText="Book a UK discovery call"
            ctaLocation="success_stories_listing"
            eventType="book_call_click"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Book a UK discovery call
          </TrackedLink>
        </div>
      </div>
    </section>
  </main>
);
