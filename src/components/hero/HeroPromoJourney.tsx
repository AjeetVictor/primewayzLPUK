import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Gauge,
  LayoutTemplate,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useRevealMotion } from '../../hooks/useRevealMotion';

type AuditCheck = {
  label: string;
  status: string;
  icon: LucideIcon;
};

const auditChecks: AuditCheck[] = [
  { label: 'SEO basics', status: 'Needs review', icon: Search },
  { label: 'Trust signals', status: 'Improving', icon: ShieldCheck },
  { label: 'Enquiry path', status: 'Needs review', icon: LayoutTemplate },
  { label: 'Technical readiness', status: 'Check basics', icon: Wrench },
];

export function HeroPromoJourney() {
  const reveal = useRevealMotion();

  return (
    <motion.div
      initial={reveal.initial({ opacity: 0, y: 16 })}
      animate={reveal.animate({ opacity: 1, y: 0 })}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full lg:max-w-[560px] lg:justify-self-end xl:max-w-[620px]"
      aria-label="Free audit preview"
    >
      <div className="pointer-events-none absolute -right-8 bottom-[-2.2rem] hidden h-44 w-64 bg-[radial-gradient(#31A1D3_1px,transparent_1px)] [background-size:14px_14px] opacity-30 lg:block" aria-hidden />

      <div className="relative overflow-hidden rounded-2xl border border-brand-border/90 bg-white p-5 shadow-[0_24px_60px_-34px_rgba(0,10,45,0.34)] ring-1 ring-white/70 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-surface/90 to-transparent" aria-hidden />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-cyan">
              Free audit preview
            </p>
            <h2 className="mt-2 text-xl font-bold leading-7 text-brand-navy">
              Website Review Snapshot
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              A practical first look at visibility, trust and enquiry readiness.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-brand-cyan ring-1 ring-cyan-100">
            <Gauge className="h-7 w-7" strokeWidth={1.9} aria-hidden />
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Website readiness score
            </p>
            <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-cyan-100 bg-white shadow-sm">
              <div>
                <p className="text-4xl font-black tracking-tight text-brand-navy">0-100</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-cyan">
                  Readiness
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Score, checks and priority fixes in one quick report.
            </p>
          </div>

          <div className="space-y-3">
            {auditChecks.map(({ label, status, icon: Icon }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-xl border border-brand-border/80 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-cyan/40 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand-cyan ring-1 ring-cyan-100">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-5 text-brand-navy">{label}</p>
                  <p className="text-xs font-semibold leading-5 text-slate-500">{status}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-cyan" strokeWidth={2} aria-hidden />
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl border border-cyan-100 bg-brand-surface/70 p-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-cyan ring-1 ring-cyan-100">
              <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold leading-5 text-brand-navy">Highest-impact fix</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Clarify the first screen and contact path before running more traffic campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
