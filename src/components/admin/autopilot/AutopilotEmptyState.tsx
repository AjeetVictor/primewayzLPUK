import { Inbox } from 'lucide-react';

type AutopilotEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
};

export function AutopilotEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}: AutopilotEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="mt-6 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
