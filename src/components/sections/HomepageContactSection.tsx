import { motion } from 'motion/react';
import {
  CalendarDays,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DigitalSystemsReviewCtaGroup } from '../conversion/DigitalSystemsReviewCtaGroup';
import { COMPANY_TRUST_LINKS } from '../../constants/companyTrustLinks';
import { GENERAL_CONTACT_DESTINATION } from '../../constants/conversionCta';
import { useRevealMotion } from '../../hooks/useRevealMotion';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#F4F8FC';
const BODY = '#334155';

const trustPoints = [
  {
    icon: Sparkles,
    title: 'No obligation',
    text: 'Request a review without committing to a project or retainer.',
  },
  {
    icon: ShieldCheck,
    title: 'Confidential context',
    text: 'Share where systems create friction — treated confidentially within Primewayz.',
  },
  {
    icon: CalendarDays,
    title: 'Clear next-step recommendation',
    text: 'We identify the most useful next step from the context you provide.',
  },
  {
    icon: Clock,
    title: 'Response within one business day',
    text: 'We typically reply within one UK business day.',
  },
] as const;

function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute right-8 top-12 hidden grid-cols-3 gap-2 opacity-30 md:grid"
      aria-hidden
    >
      {Array.from({ length: 15 }).map((_, index) => (
        <span key={index} className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      ))}
    </div>
  );
}

export const HomepageContactSection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ backgroundColor: SECTION_BG }}
      aria-labelledby="homepage-contact-heading"
    >
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, #D9F3F7 0%, transparent 70%)' }}
        aria-hidden
      />
      <DotPattern />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-14">
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              A practical first step
            </p>

            <h2
              id="homepage-contact-heading"
              className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl"
            >
              Not sure which digital system needs attention first?
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 sm:text-lg" style={{ color: BODY }}>
              Share where your website, CRM, software or support model is creating friction.
              We will review the context and identify the most useful next step.
            </p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {trustPoints.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brand-navy">{title}</h3>
                    <p className="mt-1 text-sm leading-6" style={{ color: BODY }}>
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reveal.initial({ opacity: 0, y: 24 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-[22px] border bg-white p-6 shadow-[0_20px_50px_-36px_rgba(0,10,45,0.28)] sm:p-8"
            style={{ borderColor: BORDER }}
          >
            <h3 className="text-2xl font-bold text-brand-navy">Start with a free review</h3>
            <p className="mt-2 text-sm leading-6" style={{ color: BODY }}>
              A focused request — not a long enquiry form. Tell us the friction point and we will
              recommend the most useful next step.
            </p>

            <DigitalSystemsReviewCtaGroup
              className="mt-8"
              sourceLocation="homepage"
              primaryPlacement="homepage_closing_primary"
              secondaryPlacement="homepage_closing_secondary"
              variant="closing"
            />

            <p className="mt-8 text-sm leading-6" style={{ color: BODY }}>
              Need to send a general message?{' '}
              <Link
                to={GENERAL_CONTACT_DESTINATION}
                className="font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                style={{ color: TEAL }}
              >
                Contact Primewayz UK
              </Link>
              .
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-10 rounded-[22px] border bg-white/90 p-6 sm:mt-12 sm:p-8"
          style={{ borderColor: BORDER }}
        >
          <div className="flex gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
            >
              <Lock className="h-6 w-6" strokeWidth={1.7} aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Your context stays protected.</h3>
              <p className="mt-1 text-sm leading-6 sm:text-base" style={{ color: BODY }}>
                We handle the information you submit in line with our{' '}
                <Link
                  to={COMPANY_TRUST_LINKS.privacyPolicy}
                  className="font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  style={{ color: TEAL }}
                >
                  Privacy Policy
                </Link>{' '}
                and use it to review and respond to your request.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
