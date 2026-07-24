import { FileText, Image as ImageIcon, X } from 'lucide-react';
import {
  VISITOR_ATTACHMENT_STATUS_LABELS,
  type VisitorAttachmentUploadStatus,
} from '../../lib/chat/visitorChatUi';

type ChatAttachmentStatusProps = {
  displayName: string;
  kind: 'image' | 'document';
  status: VisitorAttachmentUploadStatus;
  onRemove?: () => void;
  onRetry?: () => void;
};

function truncateName(name: string, max = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function ChatAttachmentStatus({
  displayName,
  kind,
  status,
  onRemove,
  onRetry,
}: ChatAttachmentStatusProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-2 py-1.5 text-[11px] text-brand-ink">
      {kind === 'image' ? (
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
      )}
      <span className="min-w-0 truncate font-medium" title={displayName}>
        {truncateName(displayName)}
      </span>
      <span className="shrink-0 text-slate-500">
        {VISITOR_ATTACHMENT_STATUS_LABELS[status]}
      </span>
      {status === 'failed' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry attachment upload"
          className="inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-md px-2 font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          Retry
        </button>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove attachment before send"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
