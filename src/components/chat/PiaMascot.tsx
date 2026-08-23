import { Sparkles } from 'lucide-react';

export type PiaMascotState = 'idle' | 'thinking' | 'speaking';
export type PiaMascotSize = 'sm' | 'md' | 'lg';

type PiaMascotProps = {
  state?: PiaMascotState;
  size?: PiaMascotSize;
  imageSrc?: string;
  className?: string;
};

const SIZE_CLASSES: Record<PiaMascotSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

const TEXT_CLASSES: Record<PiaMascotSize, string> = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

const DEFAULT_STATE_IMAGES: Record<PiaMascotState, string> = {
  idle: '/images/chat/pia-mascot.webp',
  thinking: '/images/chat/pia-mascot.webp',
  speaking: '/images/chat/pia-mascot.webp',
};

export function PiaMascot({
  state = 'idle',
  size = 'md',
  imageSrc = DEFAULT_STATE_IMAGES[state],
  className = '',
}: PiaMascotProps) {
  return (
    <span
      aria-hidden="true"
      data-pia-mascot="true"
      data-state={state}
      className={`relative inline-flex shrink-0 items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/70 bg-brand-blue text-white shadow-sm">
          <span className={`${TEXT_CLASSES[size]} font-black tracking-tight`}>
            PIA
          </span>
          <Sparkles className="absolute right-0.5 top-0.5 h-3 w-3 text-white/80" />
        </span>
      )}
    </span>
  );
}
