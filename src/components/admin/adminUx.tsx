import { type ReactNode, type Ref } from 'react';

export const adminControlClass =
  'mt-1 w-full min-h-11 rounded-xl border border-zinc-500 bg-white px-3 py-2 text-sm font-normal text-zinc-900 hover:border-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-500';

export const adminPrimaryButtonClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:opacity-60 disabled:hover:bg-zinc-400';

export const adminSecondaryButtonClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-500 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-800 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:opacity-60 disabled:hover:bg-white';

export const adminDangerButtonClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800 transition-colors hover:border-red-800 hover:bg-red-50 active:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white';

/** Primary admin tab. Inactive tabs expose hover, pressed, and focus. Active tabs stay white with emerald-800 text. */
export function adminTabTriggerClass(forcedActive = false): string {
  const base = 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900';
  if (forcedActive) return `${base} bg-white text-emerald-800 shadow-sm`;
  return `${base} text-zinc-600 hover:bg-white hover:text-zinc-900 active:bg-zinc-100 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm`;
}

const statusToneClass = {
  positive: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-950 ring-amber-200',
  danger: 'bg-red-50 text-red-900 ring-red-200',
  neutral: 'bg-zinc-100 text-zinc-800 ring-zinc-200',
} as const;

export type AdminStatusTone = keyof typeof statusToneClass;

export function AdminPageIntro({
  id,
  title,
  headingRef,
  children,
}: {
  id: string;
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <header>
      <h2
        ref={headingRef}
        id={id}
        tabIndex={-1}
        className="text-xl font-bold text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        {title}
      </h2>
      <div className="mt-2 max-w-3xl space-y-2 text-sm leading-6 text-zinc-700">{children}</div>
    </header>
  );
}

export function AdminLoading({ label }: { label: string }) {
  return (
    <p role="status" className="rounded-2xl border border-zinc-500 bg-white px-4 py-8 text-sm text-zinc-700">
      {label}
    </p>
  );
}

export function AdminEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-500 bg-white px-4 py-10 text-center">
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-700">{description}</p>
    </div>
  );
}

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-800 bg-red-50 px-4 py-3 text-sm text-red-900">
      <p className="font-semibold">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`${adminSecondaryButtonClass} mt-3`}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function AdminStatus({ label, tone }: { label: string; tone: AdminStatusTone }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusToneClass[tone]}`}>
      {label}
    </span>
  );
}

export function AdminField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (field: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="mt-1 text-xs leading-5 text-zinc-700">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-semibold leading-5 text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
