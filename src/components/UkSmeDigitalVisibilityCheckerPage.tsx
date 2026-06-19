import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  FileSearch,
  Gauge,
  Globe2,
  MapPin,
  MousePointerClick,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import type { AuditCategoryId } from '../lib/audit/types';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '../lib/audit/scoring/scoringConfig';
import { SCORE_BANDS_HIGH_TO_LOW, formatScoreBandRange } from '../lib/audit/scoreBands';
import { WebPresenceAuditForm } from './tools/WebPresenceAuditForm';

const categoryDescriptions: Record<AuditCategoryId, string> = {
  'website-basics': 'Checks homepage reachability, HTTPS, title, and readable HTML content.',
  'technical-seo': 'Reviews title tags, meta descriptions, canonicals, robots, sitemap, and OpenGraph basics.',
  'trust-signals': 'Looks for contact, about, privacy, and credibility signals that help visitors feel confident.',
  'lead-capture': 'Reviews whether the site has clear CTAs such as contact, enquiry, quote, booking, or call actions.',
  'local-visibility': 'Checks UK/local wording, phone, address or service-area signals, and structured data.',
  'external-presence': 'Flags Google and Bing presence as not verified without scraping search engines.',
  'reviews-reputation': 'Looks for testimonials, case studies, success stories, and portfolio or client evidence.',
  'performance-ux': 'Reviews homepage HTML size and responsive viewport basics.',
  'analytics-readiness': 'Checks for analytics or tag-manager readiness signals on the public site.',
};

const categoryIcons: Record<AuditCategoryId, typeof FileSearch> = {
  'website-basics': Globe2,
  'technical-seo': FileSearch,
  'trust-signals': Shield,
  'lead-capture': MousePointerClick,
  'local-visibility': MapPin,
  'external-presence': Globe2,
  'reviews-reputation': Star,
  'performance-ux': Zap,
  'analytics-readiness': BarChart3,
};

export const UkSmeDigitalVisibilityCheckerPage = () => (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Primewayz UK
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Free UK SME Tool
              </p>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Free UK SME Web Presence Audit
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Check whether your website is clear, discoverable, trustworthy, and ready to generate enquiries.
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Enter your website details and get a practical 100-point audit across nine readiness categories. The report reviews public pages only and does not scrape Google or Bing.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                  <Gauge className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-emerald-200">Web presence score</p>
                <p className="mt-2 text-3xl font-black text-white">0–100</p>
                <p className="mt-3 max-w-xs text-xs leading-6 text-slate-300">
                  Nine categories covering website basics, SEO, trust, lead capture, local visibility, reputation, performance, and analytics readiness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="audit-form" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <WebPresenceAuditForm variant="landing" showIntro={false} analyticsLocation="checker_page" />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Nine readiness categories</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              What the audit reviews
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The score brings together public-site signals that influence search visibility, customer confidence, and the ease of making an enquiry.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_ORDER.map((categoryId) => {
              const config = CATEGORY_CONFIG[categoryId];
              const Icon = categoryIcons[categoryId];
              return (
                <article
                  key={categoryId}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {config.maxPoints} pts
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-black text-slate-950">{config.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{categoryDescriptions[categoryId]}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#000A2D] text-white">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">How to read your score</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Use the score as a practical starting point. The category breakdown shows where focused improvements can create the clearest benefit.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCORE_BANDS_HIGH_TO_LOW.map((band) => (
              <article
                key={band.min}
                className="rounded-xl border p-5"
                style={{
                  borderColor: band.borderColor,
                  backgroundColor: band.bgColor,
                  color: band.textColor,
                }}
              >
                <p className="text-2xl font-black">{formatScoreBandRange(band)}</p>
                <p className="mt-2 text-sm font-bold">{band.label}</p>
                <p className="mt-2 text-sm leading-6 opacity-90">{band.helper}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000A2D] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Built for practical decisions</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Why this matters for UK SMEs</h2>
          </div>
          <p className="text-base leading-8 text-slate-200 sm:text-lg">
            A website should do more than exist online. It should explain what you offer, build trust, support search visibility, and make it easy for customers to enquire. This audit gives you a quick starting point before investing in SEO, redesign, CRM, automation, or ongoing website support.
          </p>
        </div>
      </section>
    </main>
);
