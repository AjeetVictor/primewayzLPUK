import type { LucideIcon } from 'lucide-react';
import {
  CircleDollarSign,
  Layers3,
  MonitorSmartphone,
  Search,
  ServerCog,
  SlidersHorizontal,
  ShieldCheck,
  Workflow,
  Wrench,
  Gauge,
} from 'lucide-react';

export type CapabilityCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const subscriptionValueChips = [
  {
    id: 'flexible-monthly-capacity',
    label: 'Flexible monthly capacity',
    icon: SlidersHorizontal,
  },
  {
    id: 'technical-seo-foundation-included',
    label: 'Technical SEO foundation included',
    icon: Search,
  },
  {
    id: 'transparent-add-ons',
    label: 'Transparent add-ons',
    icon: CircleDollarSign,
  },
  {
    id: 'move-to-maintenance-anytime',
    label: 'Move to maintenance anytime',
    icon: Wrench,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: LucideIcon;
}>;

export const subscriptionCapabilitiesData: CapabilityCard[] = [
  {
    id: 'product-engineering-subscription',
    title: 'Product Engineering on Subscription',
    description:
      'Move forward with a structured delivery model where priorities, requirements, and output are aligned to your business goals month by month.',
    icon: Layers3,
  },
  {
    id: 'frontend-ux-delivery',
    title: 'Frontend and UX Delivery',
    description:
      'Build polished, high-converting interfaces with clean user journeys, modern frontend implementation, and practical design thinking.',
    icon: MonitorSmartphone,
  },
  {
    id: 'backend-integrations',
    title: 'Backend and Integrations',
    description:
      'Strengthen your product with scalable backend development, APIs, workflows, and integrations that support real business operations.',
    icon: ServerCog,
  },
  {
    id: 'qa-refinement-stabilization',
    title: 'QA, Refinement, and Stabilization',
    description:
      'Reduce friction with ongoing testing, issue resolution, validation, and improvement cycles that keep delivery reliable over time.',
    icon: ShieldCheck,
  },
  {
    id: 'automation-operational-efficiency',
    title: 'Automation and Operational Efficiency',
    description:
      'Identify repetitive work, streamline processes, and introduce practical automation that improves speed, consistency, and control.',
    icon: Workflow,
  },
  {
    id: 'flexible-output-growth',
    title: 'Flexible Output for Long-Term Growth',
    description:
      'Adjust the delivery rhythm and monthly subscription based on the pace of output your business needs, without forcing a rigid engagement model.',
    icon: Gauge,
  },
];
