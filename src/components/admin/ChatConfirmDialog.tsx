import { AppConfirmDialog, type AppConfirmVariant } from '../ui/AppConfirmDialog';

type ChatConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
  variant?: AppConfirmVariant;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
};

export function ChatConfirmDialog({
  open,
  title,
  body,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  variant = 'danger',
  onCancel,
  onConfirm,
  isConfirming = false,
}: ChatConfirmDialogProps) {
  return (
    <AppConfirmDialog
      open={open}
      title={title}
      body={body}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      variant={variant}
      isProcessing={isConfirming}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
