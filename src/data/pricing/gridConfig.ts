import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Layers,
  Rocket,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { PricingPlanDefinition, PricingPlanSlug } from './types';
import { getActivePricingPlans, getPricingPlanBySlug } from './registry';

export type PricingGridBadgeTone = 'blue' | 'teal' | 'purple' | 'green';

export interface PricingGridPlanConfig {
  slug: PricingPlanSlug;
  badge: string;
  badgeTone: PricingGridBadgeTone;
  icon: LucideIcon;
  cardBullets: string[];
  capacityDetail?: string;
  ctaLabel: string;
  ctaVariant: 'outline' | 'primary' | 'featured' | 'purple-outline' | 'teal-outline';
  featured?: boolean;
  primaryGrid: boolean;
}

const BADGE_TONE_CLASSES: Record<PricingGridBadgeTone, string> = {
  blue: 'border-sky-200 bg-sky-50 text-sky-800',
  teal: 'border-teal-200 bg-teal-50 text-teal-800',
  purple: 'border-violet-200 bg-violet-50 text-violet-800',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export function getPricingGridBadgeClass(tone: PricingGridBadgeTone): string {
  return BADGE_TONE_CLASSES[tone];
}

/** Display metadata for the pricing grid — card copy aligned to approved design. */
export const PRICING_GRID_PLAN_CONFIG: Record<PricingPlanSlug, PricingGridPlanConfig> = {
  'foundation-sprint': {
    slug: 'foundation-sprint',
    badge: 'Start here',
    badgeTone: 'blue',
    icon: Rocket,
    cardBullets: [
      'New website or platform starts',
      'CMS setup',
      'Technical SEO baseline',
      'Launch preparation',
    ],
    ctaLabel: 'Start here',
    ctaVariant: 'outline',
    primaryGrid: true,
  },
  essential: {
    slug: 'essential',
    badge: 'Active delivery',
    badgeTone: 'blue',
    icon: BarChart3,
    cardBullets: [
      'Core website and CMS work',
      'Light integrations & updates',
      'Technical SEO & performance',
      'Continuous improvements',
    ],
    capacityDetail: '1 active workstream',
    ctaLabel: 'View Essential',
    ctaVariant: 'primary',
    primaryGrid: true,
  },
  growth: {
    slug: 'growth',
    badge: 'Recommended',
    badgeTone: 'teal',
    icon: TrendingUp,
    cardBullets: [
      'Growing websites & platforms',
      'Enhancements & optimisations',
      'Landing pages & conversions',
      'CRM & light API integrations',
    ],
    capacityDetail: 'Multiple workstreams',
    ctaLabel: 'View Growth',
    ctaVariant: 'featured',
    featured: true,
    primaryGrid: true,
  },
  scale: {
    slug: 'scale',
    badge: 'More capacity',
    badgeTone: 'blue',
    icon: Layers,
    cardBullets: [
      'Structured delivery across workstreams',
      'Portals, dashboards and automation',
      'Product management, UX, development and QA',
    ],
    capacityDetail: 'Broader monthly delivery',
    ctaLabel: 'View Scale',
    ctaVariant: 'outline',
    primaryGrid: false,
  },
  'maintenance-mode': {
    slug: 'maintenance-mode',
    badge: 'Continuity',
    badgeTone: 'purple',
    icon: ShieldCheck,
    cardBullets: [
      'Stable websites & platforms',
      'Routine updates & fixes',
      'Security & performance',
      'Support without active delivery',
    ],
    capacityDetail: 'Focused continuity support',
    ctaLabel: 'Move to maintenance',
    ctaVariant: 'purple-outline',
    primaryGrid: true,
  },
  enterprise: {
    slug: 'enterprise',
    badge: 'Advanced',
    badgeTone: 'green',
    icon: Building2,
    cardBullets: [
      'Complex integrations',
      'Multi-team programmes',
      'Governance & compliance',
      'Large-scale roadmaps',
    ],
    ctaLabel: 'Talk to us',
    ctaVariant: 'teal-outline',
    primaryGrid: true,
  },
};

export const PRICING_COMMERCIAL_CLARITY_ITEMS = [
  {
    id: 'vat',
    label: 'Prices shown ex VAT',
    icon: 'receipt' as const,
  },
  {
    id: 'third-party',
    label: 'Third-party costs separated',
    icon: 'coins' as const,
  },
  {
    id: 'capacity',
    label: 'Flexible monthly capacity',
    icon: 'calendar' as const,
  },
  {
    id: 'maintenance',
    label: 'Move to maintenance anytime',
    icon: 'refresh' as const,
  },
] as const;

export function getPrimaryPricingGridPlans(): PricingPlanDefinition[] {
  return getActivePricingPlans().filter(
    (plan) => PRICING_GRID_PLAN_CONFIG[plan.slug]?.primaryGrid,
  );
}

export function getSecondaryPricingGridPlan(): PricingPlanDefinition | undefined {
  return getPricingPlanBySlug('scale');
}

export function getPricingGridConfig(slug: PricingPlanSlug): PricingGridPlanConfig {
  return PRICING_GRID_PLAN_CONFIG[slug];
}
