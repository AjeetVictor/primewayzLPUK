import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  leftIcon?: ReactNode;
  toggleLabel?: string;
};

export function PasswordInput({
  id,
  className = '',
  leftIcon,
  toggleLabel = 'password',
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      {leftIcon}
      <input
        id={inputId}
        type={isVisible ? 'text' : 'password'}
        className={className}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label={isVisible ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
        aria-controls={inputId}
        aria-pressed={isVisible}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
