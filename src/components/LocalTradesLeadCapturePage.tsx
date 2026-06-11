import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Target,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const challengeItems = [
  'Enquiries arrive through phone, website forms, email, WhatsApp, Google Business Profile, and referrals.',
  'Follow-ups depend on memory, spreadsheets, or scattered inboxes.',
  'Quote requests are not always captured with the right service and location details.',
  'The business has limited visibility into which channels generate real enquiries.',
  'Website updates, tracking, and small technical fixes are delayed.',
];

const deliverables = [
  {
    title: 'Service pages that convert',
    description:
      'Clear pages for key trade services, service areas, trust signals, quote CTAs, and mobile-friendly enquiry journeys.',
    icon: Globe2,
  },
  {
    title: 'Quote request workflow',
    description:
      'Structured forms that capture service type, postcode, urgency, contact details, and customer notes.',
    icon: ClipboardList,
  },
  {
    title: 'Call, email and WhatsApp capture',
    description:
      'Prominent CTAs and tracking-ready interaction points for customers who prefer quick contact.',
    icon: Smartphone,
  },
  {
    title: 'CRM or email lead routing',
    description:
      'Route enquiries into a simple CRM pipeline, shared inbox, or follow-up workflow so no lead gets lost.',
    icon: Mail,
  },
  {
    title: 'GA4 conversion tracking',
    description:
      'Track form submissions, call clicks, WhatsApp clicks, quote requests, and key service page actions.',
    icon: BarChart3,
  },
  {
    title: 'Maintenance and improvement rhythm',
    description:
      'Monthly support for updates, fixes, performance checks, basic SEO, backups, and reporting.',
    icon: Wrench,
  },
];

const kpis = [
  { label: 'New enquiries', value: '84', detail: 'monthly dashboard example' },
  { label: 'Quote requests', value: '31', detail: 'captured with service details' },
  { label: 'Call clicks', value: '126', detail: 'tracked from service pages' },
  { label: 'Conversion rate', value: '18.6%', detail: 'from enquiry actions' },
];

const technicalScope = [
  'Responsive React / website frontend updates',
  'Quote request and contact form flow',
  'CRM, email, or spreadsheet-based enquiry capture',
  'GA4 event tracking for forms, calls, WhatsApp, and CTA clicks',
  'Local service area structure and SEO metadata',
  'Basic technical SEO checks: titles, descriptions, canonical URLs, sitemap visibility',
  'Monthly maintenance checklist for updates, backups, page speed, and issue review',
];

export const LocalTradesLeadCapturePage = () => {
  return (
    <main className="bg-white text-[#000A2D]">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-12 pb-20">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#2FA8DF]/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-[#E4005A]/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            to="/#success-stories"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0057C8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to UK SME project examples
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]"
              >
                UK Local Trades
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-5 text-4xl font-black tracking-tight text-[#000A2D] sm:text-5xl lg:text-6xl"
              >
                Local Trades Website & Lead Capture Setup
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-600"
              >
                A practical website and enquiry-flow setup for plumbers, electricians, roofing firms,
                builders, cleaners, landscapers, and local service businesses that need clearer quote
                requests, faster follow-ups, and better visibility into lead sources.
              </motion.p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#000A2D] px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-[#0057C8]"
                >
                  Discuss your UK requirements
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/website-maintenance-subscription-uk"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-[#000A2D] transition hover:border-[#2FA8DF]/40 hover:text-[#0057C8]"
                >
                  View maintenance support
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 }}
              className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"
            >
              <img
                src="/images/localTradesWbsite.webp"
                alt="Local Trades Website and Lead Capture dashboard mockup"
                className="h-full w-full rounded-[1.5rem] object-cover"
                loading="eager"
              />
            </motion.div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-black text-[#0057C8]">{item.value}</div>
                <div className="mt-2 text-sm font-black text-[#000A2D]">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]">Business challenge</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl">
                Missed enquiries usually happen after the first customer action.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                For many local trades, the website may be visible, but the follow-up process is not connected.
                Calls, forms, WhatsApp messages, and email enquiries need to become one cleaner lead flow.
              </p>
            </div>

            <div className="space-y-4">
              {challengeItems.map((item) => (
                <div key={item} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#0057C8]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]">What we deliver</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl">
              A practical setup for clearer local customer acquisition.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The goal is not just a nicer website. The goal is a digital flow that captures enquiries,
              supports follow-up, and gives the business better visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0057C8]/10 text-[#0057C8]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-[#000A2D]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-[#E4005A]" />
              <h2 className="text-2xl font-black text-[#000A2D]">Typical outcomes</h2>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
              <li>Better enquiry visibility across calls, forms, WhatsApp, email, and referrals.</li>
              <li>Faster follow-up process with clearer lead ownership.</li>
              <li>Improved local service page structure and quote request flow.</li>
              <li>More useful reporting through GA4 conversion events and source tracking.</li>
              <li>Stable monthly support for updates, technical fixes, and SEO foundation upkeep.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[#000A2D] p-8 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#2FA8DF]" />
              <h2 className="text-2xl font-black">Technical and delivery scope</h2>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-200">
              {technicalScope.map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#2FA8DF]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
          <MapPin className="mx-auto h-8 w-8 text-[#E4005A]" />
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl">
            Built for UK local service businesses that need practical digital support.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Start with a focused Foundation Sprint, then continue with Essential or Maintenance Mode
            depending on how much monthly support your business needs.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4005A] px-7 py-3 text-sm font-black text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:bg-[#c90050]"
            >
              Book a UK discovery call
              <Phone className="h-4 w-4" />
            </Link>
            <Link
              to="/software-development-subscription-uk"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-black text-[#000A2D] transition hover:border-[#2FA8DF]/40 hover:text-[#0057C8]"
            >
              View subscription model
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
