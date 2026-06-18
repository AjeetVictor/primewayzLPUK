import { useEffect, useId } from 'react';

export type AppConfirmVariant = 'danger' | 'warning' | 'default';

type AppConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: AppConfirmVariant;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const confirmButtonClass: Record<AppConfirmVariant, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  default: 'bg-zinc-900 hover:bg-zinc-800 text-white',
};

export function AppConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isProcessing = false,
  onConfirm,
  onCancel,
}: AppConfirmDialogProps) {
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!open || isProcessing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isProcessing, onCancel]);

  if (!open) return null;

  const handleBackdropClick = () => {
    if (!isProcessing) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-bold text-zinc-900">
          {title}
        </h2>
        <p id={bodyId} className="mt-2 text-sm leading-relaxed text-zinc-600">
          {body}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${confirmButtonClass[variant]}`}
          >
            {isProcessing ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
