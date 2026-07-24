import {
  VISITOR_MESSAGE_STATUS_LABELS,
  type VisitorMessageDeliveryStatus,
} from '../../lib/chat/visitorChatUi';

type ChatMessageStatusProps = {
  status?: VisitorMessageDeliveryStatus;
  onRetry?: () => void;
};

export function ChatMessageStatus({ status, onRetry }: ChatMessageStatusProps) {
  if (!status) return null;

  return (
    <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-white/80">
      <span>{VISITOR_MESSAGE_STATUS_LABELS[status]}</span>
      {status === 'failed' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry sending message"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-2 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
