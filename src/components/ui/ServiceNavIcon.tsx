import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ServiceIconTone = 'blue' | 'magenta' | 'navy' | 'teal' | 'neutral';

const toneClasses: Record<ServiceIconTone, string> = {
  blue: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  magenta: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  navy: 'bg-slate-100 text-[#000A2D] ring-slate-200',
  teal: 'bg-[#EAF7FA] text-[#087E8B] ring-[#D7E7EC]',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-100',
};

const sizeConfig = {
  sm: {
    wrap: 'h-9 w-9 rounded-xl',
    icon: 'h-4 w-4',
    stroke: 2,
    ring: true,
  },
  md: {
    wrap: 'h-10 w-10 rounded-xl',
    icon: 'h-[18px] w-[18px]',
    stroke: 2,
    ring: true,
  },
  lg: {
    wrap: 'h-16 w-16 rounded-2xl',
    icon: 'h-[2.375rem] w-[2.375rem]',
    stroke: 1.8,
    ring: false,
  },
  xl: {
    wrap: 'h-24 w-24 rounded-full',
    icon: 'h-[3.125rem] w-[3.125rem]',
    stroke: 1.65,
    ring: false,
  },
} as const;

type ServiceNavIconProps = {
  icon: LucideIcon;
  tone?: ServiceIconTone;
  size?: keyof typeof sizeConfig;
  className?: string;
};

export function ServiceNavIcon({
  icon: Icon,
  tone = 'blue',
  size = 'md',
  className,
}: ServiceNavIconProps) {
  const config = sizeConfig[size];

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center transition',
        config.wrap,
        config.ring && 'ring-1',
        toneClasses[tone],
        className,
      )}
      aria-hidden
    >
      <Icon className={config.icon} strokeWidth={config.stroke} />
    </span>
  );
}
