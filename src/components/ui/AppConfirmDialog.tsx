import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  danger: 'bg-red-700 hover:bg-red-800 text-white focus-visible:outline-white',
  warning: 'bg-amber-800 hover:bg-amber-900 text-white focus-visible:outline-white',
  default: 'bg-zinc-900 hover:bg-zinc-800 text-white focus-visible:outline-white',
};

const buttonFocus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

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
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (!open) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !isProcessing) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-zinc-900/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-500 bg-white p-6 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (isProcessing) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isProcessing) event.preventDefault();
          }}
        >
          <Dialog.Title className="text-lg font-bold text-zinc-900">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-700">
            {body}
          </Dialog.Description>
          {isProcessing ? <p role="status" className="sr-only">Please wait.</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => {
                if (!isProcessing) onCancel();
              }}
              aria-disabled={isProcessing || undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-500 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 ${buttonFocus} focus-visible:outline-zinc-900`}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isProcessing) onConfirm();
              }}
              aria-disabled={isProcessing || undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${buttonFocus} ${confirmButtonClass[variant]} ${isProcessing ? 'opacity-70' : ''}`}
            >
              {isProcessing ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
