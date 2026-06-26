import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ServiceIconTone = 'blue' | 'magenta' | 'navy' | 'teal' | 'neutral';

const toneClasses: Record<ServiceIconTone, string> = {
  blue: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  magenta: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  navy: 'bg-slate-100 text-[#000A2D] ring-slate-200',
  teal: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-100',
};

type ServiceNavIconProps = {
  icon: LucideIcon;
  tone?: ServiceIconTone;
  size?: 'sm' | 'md';
  className?: string;
};

export function ServiceNavIcon({
  icon: Icon,
  tone = 'blue',
  size = 'md',
  className,
}: ServiceNavIconProps) {
  const dimension = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl ring-1 transition',
        dimension,
        toneClasses[tone],
        className,
      )}
      aria-hidden
    >
      <Icon className={iconSize} strokeWidth={2} />
    </span>
  );
}
