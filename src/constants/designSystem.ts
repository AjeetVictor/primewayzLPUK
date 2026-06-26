/**
 * Locked Primewayz UK design system (Phase B).
 * Use these tokens for new UI work; legacy `emerald`/`indigo` Tailwind aliases map to brand blue/magenta in index.css.
 */
export type ServiceIconTone = 'blue' | 'magenta' | 'navy' | 'teal' | 'neutral';

export const brandColors = {
  navy: '#000A2D',
  blue: '#1B59A7',
  cyan: '#31A1D3',
  magenta: '#E61E50',
  ink: '#0F172A',
  slate: '#64748B',
  border: '#E2E8F0',
  surface: '#F4F8FC',
  surfaceMuted: '#F8FAFC',
  white: '#FFFFFF',
} as const;

export const brandRadii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  pill: '9999px',
} as const;

export const brandShadows = {
  header: '0 1px 0 0 rgba(15, 23, 42, 0.06)',
  dropdown: '0 24px 48px -24px rgba(0, 10, 45, 0.18)',
  cta: '0 12px 28px -16px rgba(0, 10, 45, 0.35)',
} as const;

export const brandTypography = {
  fontSans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  navLink: 'text-[13px] font-medium leading-none xl:text-sm',
  navLinkMobile: 'text-[15px] font-medium leading-snug',
  eyebrow: 'text-[11px] font-bold uppercase tracking-[0.2em]',
  sectionTitle: 'text-xs font-bold uppercase tracking-[0.18em]',
} as const;

/** Shared layout utilities for shell components */
export const shellClasses = {
  header:
    'fixed left-0 right-0 top-0 z-50 border-b border-brand-border/80 bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(15,23,42,0.05)]',
  navLink:
    'rounded-lg px-2 py-2 text-brand-ink/70 transition-colors hover:bg-brand-surface hover:text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40',
  navLinkActive: 'text-brand-navy font-semibold',
  btnPrimary:
    'inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy xl:px-5 xl:text-sm',
  btnOutlineAudit:
    'inline-flex min-h-[40px] items-center justify-center rounded-lg border border-brand-blue/35 bg-white px-3 py-2 text-[13px] font-semibold text-brand-blue transition hover:border-brand-blue hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 xl:px-4 xl:text-sm',
  megaMenuPanel:
    'rounded-2xl border border-brand-border bg-white p-5 shadow-[0_24px_48px_-24px_rgba(0,10,45,0.18)]',
} as const;

export const LOGO_LIGHT_SRC = '/primewayz-infotech-logo.svg';
export const LOGO_DARK_SRC = '/primewayz-uk-dark-logo.png';
