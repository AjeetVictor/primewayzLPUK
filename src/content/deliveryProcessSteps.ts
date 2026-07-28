import type { ComponentType } from 'react';
import {
  ImproveAuditIcon,
  PrioritiseAuditIcon,
  ReviewAuditIcon,
  TrackAuditIcon,
} from '../components/icons/AuditLedProcessIcons';

export type DeliveryProcessStep = {
  id: 'review' | 'prioritise' | 'improve' | 'track';
  number: number;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const deliveryProcessSteps: DeliveryProcessStep[] = [
  {
    id: 'review',
    number: 1,
    title: 'Review',
    description: 'Understand current systems, constraints and priorities.',
    icon: ReviewAuditIcon,
  },
  {
    id: 'prioritise',
    number: 2,
    title: 'Prioritise',
    description: 'Identify the highest-value and lowest-risk next actions.',
    icon: PrioritiseAuditIcon,
  },
  {
    id: 'improve',
    number: 3,
    title: 'Improve',
    description: 'Deliver agreed changes through the appropriate engagement model.',
    icon: ImproveAuditIcon,
  },
  {
    id: 'track',
    number: 4,
    title: 'Track',
    description: 'Measure progress, risks and next-stage opportunities.',
    icon: TrackAuditIcon,
  },
];

export const DELIVERY_PROCESS_INTRO =
  'One clear process for website, CRM, software and support work—so priorities stay practical and progress stays visible.';
