import type { LucideIcon } from 'lucide-react';
import {
  Code2,
  Gauge,
  Globe,
  Network,
  Plug,
  ScanSearch,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { ServiceIconTone } from './designSystem';
import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../lib/utm';
import { AUDIT_CHECKER_PATH } from './navigation';

export type ServiceNavItem = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconTone?: ServiceIconTone;
  isNew?: boolean;
};

export type ServiceNavGroup = {
  label: string;
  items: ServiceNavItem[];
};

export const SERVICES_MENU_TITLE = 'Primewayz UK Services';

export const serviceNavGroups: ServiceNavGroup[] = [
  {
    label: 'Website & Visibility',
    items: [
      {
        name: 'Website Refinement',
        description: 'Landing pages, copy, CMS speed tuning, enquiry path improvements',
        href: '/website-maintenance-subscription-uk',
        icon: Globe,
        iconTone: 'blue',
      },
      {
        name: 'Free Website Audit',
        description: 'Quick visibility, trust, lead capture and tracking readiness check',
        href: AUDIT_CHECKER_PATH,
        icon: ScanSearch,
        iconTone: 'teal',
      },
      {
        name: 'Performance Audits',
        description: 'Speed, SEO, analytics and conversion readiness review',
        href: AUDIT_CHECKER_PATH,
        icon: Gauge,
        iconTone: 'navy',
      },
    ],
  },
  {
    label: 'Systems & Automation',
    items: [
      {
        name: 'CRM Strategy & Synthesis',
        description: 'CRM cleanup, attribution, lead-flow and reporting support',
        href: '/crm-integration-support-uk',
        icon: Network,
        iconTone: 'magenta',
      },
      {
        name: 'Workflow Automation',
        description: 'Connect tools with Zapier, Make, APIs and internal workflows',
        href: '/crm-integration-support-uk',
        icon: Workflow,
        iconTone: 'blue',
      },
      {
        name: 'Custom API Integrations',
        description: 'Connect databases, business platforms and payment/CRM systems',
        href: '/software-development-subscription-uk',
        icon: Plug,
        iconTone: 'navy',
      },
    ],
  },
  {
    label: 'Support & Delivery',
    items: [
      {
        name: 'Security & Maintenance',
        description: 'Encrypted backups, updates, monitoring and continuity support',
        href: '/website-maintenance-subscription-uk',
        icon: ShieldCheck,
        iconTone: 'blue',
      },
      {
        name: 'Remote IT Resources',
        description: 'Developers, QA, website support, digital support and project coordination',
        href: buildInternalUtmUrl(
          '/remote-it-resource-augmentation',
          'internal_nav',
          REMOTE_RESOURCE_CAMPAIGN,
          'services_dropdown',
        ),
        icon: Users,
        iconTone: 'magenta',
        isNew: true,
      },
      {
        name: 'Monthly Technical Support',
        description: 'Ongoing improvements, fixes, reporting and technical delivery rhythm',
        href: '/software-development-subscription-uk',
        icon: Code2,
        iconTone: 'navy',
      },
    ],
  },
];

export const remoteItFooterHref = buildInternalUtmUrl(
  '/remote-it-resource-augmentation',
  'footer_nav',
  REMOTE_RESOURCE_CAMPAIGN,
  'footer_service_link',
);
