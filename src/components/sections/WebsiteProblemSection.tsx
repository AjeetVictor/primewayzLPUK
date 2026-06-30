import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  MousePointerClick,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { buildSelfAuditCtaUrl } from '../SelfAuditCta';
import { trackConversionEvent } from '../../lib/analytics';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { SITE_CONTAINER_CLASS, SITE_SECTION_PANEL_CLASS, TRUST_STRIP_SURFACE } from '../../constants/siteLayout';
import { cn } from '../../utils/cn';

type ProblemCard = {
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

const problemCards: ProblemCard[] = [
  {
    title: '1. Live but not visible',
    description:
      'Your services exist, but search engines and AI discovery may not understand your pages clearly.',
    bullets: [
      'Weak SEO foundations',
      'Missing or unclear content structure',
      'Not indexed or not ranking',
      'Low visibility in search & AI results',
    ],
    icon: Eye,
    iconClassName: 'bg-cyan-50 text-brand-cyan ring-cyan-100',
    accentClassName: 'bg-brand-cyan',
  },
  {
    title: '2. Visited but not trusted',
    description:
      'Visitors arrive, but your website may not give them enough confidence to take the next step.',
    bullets: [
      'Unclear credibility signals',
      'Missing proof & social validation',
      'Weak privacy or compliance signals',
      'Unclear positioning or messaging',
    ],
    icon: ShieldCheck,
    iconClassName: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    accentClassName: 'bg-indigo-500',
  },
  {
    title: '3. Interested but not converting',
    description:
      'The offer may be good, but unclear CTAs, forms or contact paths reduce enquiries and opportunities.',
    bullets: [
      'Unclear or missing CTAs',
      'Complicated or long forms',
      'No connected CRM or follow-up flow',
      'No tracking of enquiries & conversions',
    ],
    icon: MousePointerClick,
    iconClassName: 'bg-orange-50 text-orange-500 ring-orange-100',
    accentClassName: 'bg-orange-400',
  },
];

const auditHref = buildSelfAuditCtaUrl('homepage_problem_section');

export const WebsiteProblemSection = () => {
  const reveal = useRevealMotion();

  return (
  <section className="pb-10 pt-6" style={{ backgroundColor: TRUST_STRIP_SURFACE }} aria-labelledby="website-problem-heading">
    <div className={SITE_CONTAINER_CLASS}>
      <div className={`${SITE_SECTION_PANEL_CLASS} px-5 py-10 sm:px-8 lg:px-12`}>
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="text-[11px] font-bold uppercase leading-5 tracking-[0.18em] text-brand-cyan">
          What may be holding your website back
        </p>
        <h2 id="website-problem-heading" className="mt-3 text-[1.75rem] font-bold tracking-tight text-brand-navy sm:text-[2rem] sm:leading-[1.18]">
          Your website may be live,
          <br className="hidden sm:block" />
          but is it helping people find, trust and contact you?
        </h2>
        <p className="mx-auto mt-4 max-w-[640px] text-sm leading-6 text-slate-600">
          Many UK businesses don't need a full redesign first.{' '}
          <br className="hidden sm:block" />
          They need to identify the digital gaps that quietly reduce visibility, confidence and enquiries.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {problemCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.title}
              initial={reveal.initial({ opacity: 0, y: 24 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full min-h-[21.75rem] flex-col rounded-xl border border-brand-border bg-white p-5 shadow-[0_16px_34px_-32px_rgba(0,10,45,0.22)]"
            >
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-full ring-1', card.iconClassName)}>
                <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
              </div>

              <h3 className="mt-5 text-[17px] font-bold leading-6 text-brand-navy">{card.title}</h3>
              <span className={cn('mt-3 h-0.5 w-9 rounded-full', card.accentClassName)} aria-hidden />
              <p className="mt-4 text-sm leading-6 text-slate-600">{card.description}</p>

              <div className="mt-4 h-px bg-brand-border/80" aria-hidden />

              <ul className="mt-4 space-y-2.5">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                    <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', card.iconClassName.includes('orange') ? 'text-orange-500' : card.iconClassName.includes('indigo') ? 'text-indigo-500' : 'text-brand-cyan')} strokeWidth={2.2} aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <motion.a
          href={auditHref}
          onClick={() => {
            trackConversionEvent('audit_cta_click_problem_section', {
              cta_text: 'Start with a free visibility audit',
              cta_location: 'homepage_problem_section',
              destination: auditHref,
              lead_type: 'audit_cta',
            });
          }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue transition hover:text-brand-navy"
        >
          Start with a free visibility audit
          <ArrowRight className="h-4 w-4" strokeWidth={2.15} aria-hidden />
        </motion.a>
      </div>
      </div>
    </div>
  </section>
  );
};
