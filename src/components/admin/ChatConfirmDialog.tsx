import { AppConfirmDialog } from '../ui/AppConfirmDialog';

type ChatConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
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
      variant="danger"
      isProcessing={isConfirming}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
