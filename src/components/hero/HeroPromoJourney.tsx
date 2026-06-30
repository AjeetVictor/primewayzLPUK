import { motion } from 'motion/react';
import { useEffect, useMemo, useState, type FocusEvent } from 'react';
import {
  BarChart3,
  ChevronRight,
  Goal,
  LayoutTemplate,
  MessageSquare,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { cn } from '../../utils/cn';

type JourneyStep = {
  id: 'found_online' | 'website_clarity' | 'trust_signals' | 'enquiry_received';
  label: string;
  text: string;
  title: string;
  detail: string;
  checks: string[];
  icon: LucideIcon;
  toneClass: string;
  iconClass: string;
};

const journeySteps: JourneyStep[] = [
  {
    id: 'found_online',
    label: 'Found online',
    text: 'Search and AI discovery paths',
    title: 'Can people discover you?',
    detail:
      'We check whether your important pages can be understood by search engines and AI-assisted discovery tools.',
    checks: ['Search visibility', 'Indexing', 'Page clarity', 'Content structure'],
    icon: Search,
    toneClass: 'bg-sky-50 ring-sky-100',
    iconClass: 'text-brand-blue',
  },
  {
    id: 'website_clarity',
    label: 'Website clarity',
    text: 'Clear pages and messaging',
    title: 'Is your message clear quickly?',
    detail:
      'Visitors should understand what you do, who you help, and what action they should take without confusion.',
    checks: ['Service clarity', 'Page structure', 'Headings', 'Key messages'],
    icon: LayoutTemplate,
    toneClass: 'bg-cyan-50 ring-cyan-100',
    iconClass: 'text-brand-cyan',
  },
  {
    id: 'trust_signals',
    label: 'Trust signals',
    text: 'Proof, privacy and confidence',
    title: 'Can first-time visitors trust you?',
    detail:
      'We look for credibility signals that help users feel safe enough to enquire.',
    checks: ['Company details', 'Privacy', 'Proof', 'Testimonials', 'Founder context'],
    icon: ShieldCheck,
    toneClass: 'bg-emerald-50 ring-emerald-100',
    iconClass: 'text-emerald-600',
  },
  {
    id: 'enquiry_received',
    label: 'Enquiry received',
    text: 'Calls, forms and follow-up',
    title: 'Is the contact path easy?',
    detail:
      'Interested visitors need clear CTAs, simple forms, booking paths, tracking and follow-up.',
    checks: ['CTA visibility', 'Forms', 'Booking flow', 'CRM/follow-up readiness'],
    icon: MessageSquare,
    toneClass: 'bg-indigo-50 ring-indigo-100',
    iconClass: 'text-brand-magenta',
  },
];

function MiniBrowserPreview() {
  return (
    <div className="hidden w-36 shrink-0 rounded-lg border border-brand-border/80 bg-white p-3 shadow-sm sm:block" aria-hidden>
      <div className="mb-2 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan/50" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-border" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-border" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-20 rounded-full bg-brand-cyan/30" />
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
        <div className="h-1.5 w-24 rounded-full bg-slate-100" />
        <div className="mt-2 flex items-center justify-end">
          <span className="h-6 w-10 rounded-md bg-brand-cyan" />
        </div>
      </div>
    </div>
  );
}

const DETAIL_PANEL_ID = 'hero-journey-detail-panel';

export function HeroPromoJourney() {
  const reveal = useRevealMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeStepId, setActiveStepId] = useState<JourneyStep['id'] | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktopQuery = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncMode = () => {
      const desktop = desktopQuery.matches;
      setIsDesktop(desktop);
      setPrefersReducedMotion(motionQuery.matches);

      // Keep mobile clean by default unless user explicitly expands.
      if (!desktop) setActiveStepId(null);
    };

    syncMode();
    desktopQuery.addEventListener('change', syncMode);
    motionQuery.addEventListener('change', syncMode);
    return () => {
      desktopQuery.removeEventListener('change', syncMode);
      motionQuery.removeEventListener('change', syncMode);
    };
  }, []);

  const activeStep = useMemo(
    () => journeySteps.find((step) => step.id === activeStepId) ?? null,
    [activeStepId],
  );

  const trackStepOpen = (stepId: JourneyStep['id']) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('hero_journey_detail_open', {
        detail: { step: stepId },
      }),
    );
  };

  const openStep = (stepId: JourneyStep['id']) => {
    setActiveStepId((prevId) => {
      if (prevId === stepId) return prevId;
      trackStepOpen(stepId);
      return stepId;
    });
  };

  const handleDesktopBlur = (
    event: FocusEvent<HTMLButtonElement>,
    nextStepId: JourneyStep['id'],
  ) => {
    const nextFocused = event.relatedTarget;
    if (nextFocused instanceof Node && event.currentTarget.closest('li')?.contains(nextFocused)) {
      return;
    }

    if (activeStepId === nextStepId) {
      setActiveStepId(null);
    }
  };

  const handleRowClick = (stepId: JourneyStep['id']) => {
    if (isDesktop) {
      openStep(stepId);
      return;
    }

    setActiveStepId((prevId) => {
      const nextId = prevId === stepId ? null : stepId;
      if (nextId) trackStepOpen(nextId);
      return nextId;
    });
  };

  return (
    <motion.div
      initial={reveal.initial({ opacity: 0, y: 16 })}
      animate={reveal.animate({ opacity: 1, y: 0 })}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full lg:max-w-[560px] lg:justify-self-end xl:max-w-[620px]"
      aria-label="Website visibility journey"
    >
      <div className="pointer-events-none absolute -right-8 bottom-[-2.2rem] hidden h-44 w-64 bg-[radial-gradient(#31A1D3_1px,transparent_1px)] [background-size:14px_14px] opacity-35 lg:block" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-brand-border/90 bg-white p-5 shadow-[0_24px_60px_-34px_rgba(0,10,45,0.34)] ring-1 ring-white/70 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand-surface/80 to-transparent" aria-hidden />

        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 ring-1 ring-cyan-100">
            <BarChart3 className="h-6 w-6 text-brand-cyan" strokeWidth={2.15} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-lg font-bold leading-6 text-brand-navy">Website Visibility Journey</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              How visitors move from discovery to enquiry
            </p>
          </div>
        </div>

        <div
          className="mt-6"
          onMouseLeave={() => isDesktop && setActiveStepId(null)}
        >
          <ol className="relative overflow-hidden rounded-xl border border-brand-border/80 bg-white p-1 shadow-sm">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const isExpanded = activeStepId === step.id;

              return (
                <li key={step.label}>
                  <button
                    type="button"
                    className={cn(
                      'group flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left sm:p-3.5',
                      'transition-all ease-out motion-reduce:transition-none',
                      !prefersReducedMotion && 'duration-[220ms]',
                      'hover:border-brand-blue/35 hover:bg-brand-surface/40 hover:shadow-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/30',
                      isExpanded && 'border-brand-blue/40 bg-brand-surface/60 shadow-sm',
                      isExpanded && !prefersReducedMotion && '-translate-y-px',
                    )}
                    aria-expanded={isExpanded}
                    aria-controls={DETAIL_PANEL_ID}
                    onMouseEnter={() => isDesktop && openStep(step.id)}
                    onFocus={() => isDesktop && openStep(step.id)}
                    onBlur={(event) => isDesktop && handleDesktopBlur(event, step.id)}
                    onClick={() => handleRowClick(step.id)}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 transition-all ease-out motion-reduce:transition-none',
                        !prefersReducedMotion && 'duration-[220ms]',
                        step.toneClass,
                        isExpanded && 'ring-2 ring-brand-blue/20',
                      )}
                    >
                      <Icon className={`h-5 w-5 ${step.iconClass}`} strokeWidth={2.2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={cn(
                            'text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ease-out motion-reduce:transition-none',
                            !prefersReducedMotion && 'duration-[220ms]',
                            isExpanded ? 'text-brand-cyan' : 'text-slate-400',
                          )}
                        >
                          Step {index + 1}
                        </span>
                        <h3 className="text-sm font-bold leading-5 text-brand-navy">{step.label}</h3>
                      </div>
                      <p className="mt-0.5 text-sm leading-5 text-slate-600">{step.text}</p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'hidden h-4 w-4 shrink-0 text-slate-400 transition-all ease-out motion-reduce:transition-none sm:block',
                        !prefersReducedMotion && 'duration-[280ms]',
                        isExpanded
                          ? 'rotate-90 text-brand-blue'
                          : 'group-hover:text-brand-cyan group-focus-visible:text-brand-cyan',
                      )}
                      strokeWidth={2.2}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            id={DETAIL_PANEL_ID}
            className={cn(
              'overflow-hidden rounded-xl border bg-white shadow-[0_16px_34px_-24px_rgba(0,10,45,0.45)] ring-1 ring-white/70',
              'transition-all ease-out motion-reduce:transition-none',
              !prefersReducedMotion && 'duration-[260ms]',
              activeStep
                ? cn(
                    'mt-3 max-h-80 translate-y-0 border-brand-border/85 opacity-100',
                    !prefersReducedMotion && 'delay-[60ms]',
                  )
                : 'max-h-0 -translate-y-1.5 border-transparent opacity-0',
            )}
            aria-live="polite"
            aria-hidden={!activeStep}
          >
            {activeStep ? (
              <div
                key={activeStep.id}
                className={cn(
                  'p-4 transition-all ease-out motion-reduce:transition-none',
                  !prefersReducedMotion && 'duration-[260ms]',
                  !prefersReducedMotion && 'opacity-100 translate-y-0',
                )}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-cyan">Quick review</p>
                <h4 className="mt-1.5 text-base font-bold leading-6 text-brand-navy">{activeStep.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeStep.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeStep.checks.map((check) => (
                    <span
                      key={check}
                      className="rounded-full border border-brand-border bg-brand-surface/70 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    >
                      {check}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-cyan shadow-sm ring-1 ring-cyan-100">
            <Goal className="h-5 w-5" strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-5 text-brand-navy">Goal:</p>
            <p className="mt-0.5 text-sm leading-5 text-slate-600">
              Help the right visitors understand what you do and feel confident to contact you.
            </p>
          </div>
          <MiniBrowserPreview />
        </div>
      </div>
    </motion.div>
  );
}
