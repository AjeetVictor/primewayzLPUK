import { useEffect, useId, useRef, useState } from 'react';

type AppPromptDialogProps = {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function AppPromptDialog({
  open,
  title,
  label = 'Value',
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isProcessing = false,
  onConfirm,
  onCancel,
}: AppPromptDialogProps) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open || isProcessing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isProcessing, onCancel]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onConfirm(trimmed);
  };

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
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-bold text-zinc-900">
          {title}
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-zinc-700">
              {label}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="url"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              disabled={isProcessing}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isProcessing || !value.trim()}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isProcessing ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
