import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { ContactForm } from './ContactForm';
import { ContactBookingStrip } from './ContactBookingStrip';
import { buildSelfAuditCtaUrl } from './SelfAuditCta';
import { trackEvent } from '../lib/analytics';
import { BOOK_CALL_HASH } from '../constants/contactBooking';

const CONTACT_PHONE_DISPLAY = '+44 7588 741740';
const CONTACT_PHONE_HREF = 'tel:+447588741740';
const CONTACT_EMAIL = 'info@primewayz.com';

const contactCards = [
  {
    title: 'Call us',
    detail: CONTACT_PHONE_DISPLAY,
    href: CONTACT_PHONE_HREF,
    icon: Phone,
    tone: 'navy' as const,
  },
  {
    title: 'Email us',
    detail: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    icon: Mail,
    tone: 'white' as const,
  },
  {
    title: 'Book a discovery call',
    detail: '30-minute focused conversation',
    href: `#${BOOK_CALL_HASH}`,
    icon: CalendarDays,
    tone: 'navy' as const,
  },
  {
    title: 'Response time',
    detail: 'Usually within one UK business day',
    href: undefined,
    icon: Clock,
    tone: 'white' as const,
  },
] as const;

const helpLabels = [
  'Website visibility',
  'CRM integration',
  'Automation',
  'Software delivery',
  'Monthly support',
] as const;

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'UK-focused support',
    text: 'Built for UK SMEs and UK-facing teams.',
  },
  {
    icon: CalendarDays,
    title: 'No-obligation discovery call',
    text: 'A focused conversation to clarify the right next step.',
  },
  {
    icon: Clock,
    title: 'Response within one business day',
    text: 'Most enquiries are reviewed the same UK working day.',
  },
] as const;

export const ContactUsPage = () => {
  const auditHref = buildSelfAuditCtaUrl('contact_page');

  const handleAuditClick = () => {
    trackEvent('self_audit_cta_clicked', {
      cta_location: 'contact_page_lower',
      page_path: '/contact-us',
      variant: 'contact_lower_panel',
      destination: auditHref.split('?')[0],
    });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Visual contact hero */}
      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        <img
          src="/images/hero/software-delivery-hero.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/92 to-brand-navy/80"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[300px] max-w-[1200px] flex-col justify-center px-4 py-14 sm:min-h-[320px] sm:px-6 lg:min-h-[340px] lg:px-8 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-cyan">Contact</p>

          <nav aria-label="Breadcrumb" className="mt-4 text-sm text-white/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/40">
                →
              </li>
              <li className="font-medium text-white">Contact</li>
            </ol>
          </nav>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Contact Primewayz UK
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            Tell us what your UK business needs help with — website visibility, CRM, automation,
            software delivery, or ongoing digital support.
          </p>

          <p className="mt-3 text-sm font-medium text-brand-cyan sm:text-base">
            We&apos;ll help you identify the right next step.
          </p>
        </div>
      </section>

      {/* 2. Get in touch intro */}
      <section className="px-4 pb-8 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-cyan">Get in touch</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
            Choose the easiest way to reach us
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Speak with us about website improvements, CRM integration, automation, technical SEO,
            software delivery, or monthly digital support.
          </p>
        </div>
      </section>

      {/* 3. Contact option cards */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8" aria-label="Contact options">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((card) => {
            const Icon = card.icon;
            const isNavy = card.tone === 'navy';
            const className = `flex h-full min-h-[132px] flex-col rounded-xl border p-5 transition ${
              isNavy
                ? 'border-brand-navy bg-brand-navy text-white hover:bg-brand-navy/95'
                : 'border-slate-200 bg-white text-brand-navy hover:border-brand-cyan/40'
            }`;

            const content = (
              <>
                <Icon
                  className={`h-5 w-5 ${isNavy ? 'text-brand-cyan' : 'text-brand-cyan'}`}
                  strokeWidth={1.8}
                  aria-hidden
                />
                <p className={`mt-4 text-xs font-bold uppercase tracking-[0.16em] ${isNavy ? 'text-white/70' : 'text-slate-500'}`}>
                  {card.title}
                </p>
                <p className={`mt-2 text-sm font-semibold leading-6 ${isNavy ? 'text-white' : 'text-brand-navy'}`}>
                  {card.detail}
                </p>
              </>
            );

            if (!card.href) {
              return (
                <div key={card.title} className={className}>
                  {content}
                </div>
              );
            }

            if (card.href.startsWith('/') || card.href.includes('#')) {
              return (
                <a key={card.title} href={card.href} className={className}>
                  {content}
                </a>
              );
            }

            return (
              <a key={card.title} href={card.href} className={className}>
                {content}
              </a>
            );
          })}
        </div>
      </section>

      {/* 4–5. Visual panel + enquiry form */}
      <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="enquiry-heading">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <aside className="relative overflow-hidden rounded-2xl border border-slate-200 bg-brand-navy text-white">
            <img
              src="/images/hero/business-planning.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/70 via-brand-navy/85 to-brand-navy" aria-hidden />

            <div className="relative flex h-full min-h-[360px] flex-col p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cyan">How we can help</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                Practical digital support for UK SMEs
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
                From enquiry capture and CRM follow-up to website visibility and monthly delivery,
                we help you choose a clear next step.
              </p>

              <ul className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {helpLabels.map((label) => (
                  <li
                    key={label}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/90"
                  >
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-sm font-medium leading-6 text-white">
                    Primewayz UK supports UK-based SMEs and UK-facing teams.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* 6. Booking strip */}
      <ContactBookingStrip />

      {/* 7. Website visibility CTA */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 rounded-xl border border-slate-200 bg-brand-surface/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-6">
          <div className="max-w-2xl min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Run the free website visibility check for a practical score and recommended next actions.
            </p>
          </div>
          <a
            href={auditHref}
            onClick={handleAuditClick}
            className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-navy/90 sm:w-auto"
          >
            Check your website visibility
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      {/* 8. Trust strip */}
      <section className="border-t border-slate-100 px-4 py-10 sm:px-6 lg:px-8" aria-label="Contact expectations">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 sm:grid-cols-3">
          {trustPoints.map((item) => (
            <div key={item.title} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-cyan">
                <item.icon className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
