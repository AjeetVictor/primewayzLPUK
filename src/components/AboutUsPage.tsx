import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Globe2, MapPin, ShieldCheck } from 'lucide-react';
import { COMPANY_TRUST_LINKS, COMPANY_SOCIAL_LINKS } from '../constants/companyTrustLinks';
import { TrackedLink } from './common/TrackedLink';
import { SelfAuditCta } from './SelfAuditCta';

export const AboutUsPage = () => (
  <main className="min-h-screen bg-white text-slate-950">
    <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%)]" />
      <div className="relative mx-auto max-w-[1200px]">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Primewayz UK
        </Link>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">About us</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">About Primewayz UK</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
          Primewayz is a digital systems and delivery partner for UK SMEs. We help businesses
          improve website visibility, connect CRM and workflows, build and modernise software,
          support live applications and strengthen technical delivery capacity.
        </p>
      </div>
    </section>

    <SelfAuditCta variant="inline" utmContent="about_page" ctaLocation="about_page" />

    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl font-black">Who we support</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            We work with UK SMEs that need practical ownership across websites, CRM workflows,
            software applications and live systems—from assessment and improvement through delivery
            and ongoing support.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Supporting UK SMEs across London, Manchester, Birmingham and wider UK regions with
            structured delivery, clear communication and continuity beyond launch.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl font-black">How we work</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Primewayz helps teams improve website visibility, connect CRM and workflows, build and
            modernise software, support live applications and strengthen technical delivery through
            clear priorities and accountable support.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            UK-facing communication is paired with India-based technical delivery, documentation and
            development and QA discipline so work stays reviewable after launch.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:col-span-2">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl font-black">Service area</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Primewayz UK is built for businesses operating in the United Kingdom. Teams can work with
            us remotely across London, Manchester, Birmingham and other UK locations where reliable
            digital-systems support is needed.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-black">Trust &amp; company links</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={COMPANY_TRUST_LINKS.contact} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50">
              Contact
            </Link>
            <Link to={COMPANY_TRUST_LINKS.successStories} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50">
              Success stories &amp; case studies
            </Link>
            <Link to={COMPANY_TRUST_LINKS.blog} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50">
              Blog
            </Link>
            <Link to={COMPANY_TRUST_LINKS.privacyPolicy} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50">
              Privacy policy
            </Link>
            <Link to={COMPANY_TRUST_LINKS.termsOfService} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50">
              Terms of service
            </Link>
            {COMPANY_SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50"
              >
                {social.label}
              </a>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={COMPANY_TRUST_LINKS.contact}
              ctaText="Request a free digital visibility review"
              ctaLocation="about_us_page"
              eventType="cta_click"
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950"
            >
              Request a free digital visibility review
            </TrackedLink>
            <TrackedLink
              href={COMPANY_TRUST_LINKS.digitalVisibilityChecker}
              ctaText="Run the free web presence audit"
              ctaLocation="about_us_page"
              eventType="cta_click"
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Run the free web presence audit
            </TrackedLink>
          </div>
        </article>
      </div>
    </section>
  </main>
);
