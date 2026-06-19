import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrackedLink } from './common/TrackedLink';
import { COMPANY_TRUST_LINKS, COMPANY_SOCIAL_LINKS } from '../constants/companyTrustLinks';

const projectAreas = [
  'Website visibility and conversion improvements',
  'SEO-readiness and technical foundations',
  'GA4/GTM and analytics setup support',
  'CRM and workflow support',
  'Monthly technical maintenance',
  'Custom software and automation support',
] as const;

const trustNavLinks = [
  { label: 'About Primewayz UK', href: COMPANY_TRUST_LINKS.about },
  { label: 'Contact', href: COMPANY_TRUST_LINKS.contact },
  { label: 'Success stories', href: COMPANY_TRUST_LINKS.successStories },
  { label: 'Blog', href: COMPANY_TRUST_LINKS.blog },
  { label: 'Privacy policy', href: COMPANY_TRUST_LINKS.privacyPolicy },
  { label: 'Terms of service', href: COMPANY_TRUST_LINKS.termsOfService },
] as const;

export const ClientConfidenceSignals = () => (
  <section
    id="client-confidence-signals"
    className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20"
    aria-labelledby="client-confidence-heading"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Trust signals
              </p>
            </div>

            <h2 id="client-confidence-heading" className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Client confidence signals
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Primewayz UK helps small and growing UK businesses improve website visibility,
              enquiry flow, technical reliability, analytics readiness, and ongoing digital operations.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Supporting UK SMEs across London, Manchester, Birmingham, and wider UK regions with
              practical monthly delivery rather than one-off project handoffs.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Explore evidence-based{' '}
              <Link to={COMPANY_TRUST_LINKS.successStories} className="font-semibold text-blue-700 hover:text-blue-900">
                case studies
              </Link>{' '}
              and client portfolio examples that show how teams improve lead capture, CRM workflows,
              website stability, and analytics readiness.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href={COMPANY_TRUST_LINKS.successStories}
                ctaText="View success stories"
                ctaLocation="client_confidence_signals"
                eventType="cta_click"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950"
              >
                View success stories
                <ArrowUpRight className="h-4 w-4" />
              </TrackedLink>
              <TrackedLink
                href={COMPANY_TRUST_LINKS.contact}
                ctaText="Request a free digital visibility review"
                ctaLocation="client_confidence_signals"
                eventType="cta_click"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Request a free digital visibility review
              </TrackedLink>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
                Recent project areas
              </h3>
              <ul className="mt-4 space-y-3">
                {projectAreas.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
                Company &amp; trust links
              </h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {trustNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {COMPANY_SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Google Business Profile and third-party review profiles are not listed here unless a
                verified public link is available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
