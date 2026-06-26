import { motion } from 'motion/react';
import {
  ArrowRight,
  Inbox,
  LayoutTemplate,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import type { ServiceIconTone } from '../../constants/designSystem';

type JourneyStep = {
  label: string;
  caption: string;
  icon: LucideIcon;
  tone: ServiceIconTone;
};

const journeySteps: JourneyStep[] = [
  {
    label: 'Found online',
    caption: 'Search and discovery paths',
    icon: Search,
    tone: 'blue',
  },
  {
    label: 'Website clarity',
    caption: 'Clear pages and messaging',
    icon: LayoutTemplate,
    tone: 'teal',
  },
  {
    label: 'Trust signals',
    caption: 'Credibility visitors expect',
    icon: ShieldCheck,
    tone: 'navy',
  },
  {
    label: 'Enquiry received',
    caption: 'Calls, forms and follow-up',
    icon: Inbox,
    tone: 'magenta',
  },
];

export function HeroPromoJourney() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
      aria-hidden={false}
    >
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-brand-surface via-white to-white p-5 shadow-[0_24px_48px_-32px_rgba(0,10,45,0.2)] sm:p-6 lg:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
          Visitor journey
        </p>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Found online → Website clarity → Trust signals → Enquiry received
        </p>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, index) => (
            <li key={step.label} className="relative">
              <div className="flex h-full flex-col rounded-xl border border-brand-border/80 bg-white p-4">
                <ServiceNavIcon icon={step.icon} tone={step.tone} size="md" />
                <p className="mt-4 text-sm font-semibold text-brand-navy">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{step.caption}</p>
              </div>
              {index < journeySteps.length - 1 ? (
                <ArrowRight
                  className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-brand-blue/50 lg:block"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-5 hidden items-center justify-between rounded-xl bg-brand-navy/5 px-4 py-3 lg:flex">
          {journeySteps.map((step, index) => (
            <div key={`${step.label}-rail`} className="flex flex-1 items-center">
              <span className="text-xs font-semibold text-brand-navy">{step.label}</span>
              {index < journeySteps.length - 1 ? (
                <span className="mx-3 h-px flex-1 bg-brand-blue/25" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
