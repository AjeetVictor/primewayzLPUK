import { Minus, X } from 'lucide-react';
import {
  getVisitorChatHeaderTitle,
  VISITOR_HEADER_STATUS_DOT_CLASS,
  VISITOR_HEADER_STATUS_LABELS,
  type VisitorHeaderStatus,
} from '../../lib/chat/visitorChatUi';

type ChatHeaderProps = {
  headerStatus: VisitorHeaderStatus;
  latestResponder: 'bot' | 'admin' | null;
  onMinimize: () => void;
  onClose: () => void;
};

export function ChatHeader({
  headerStatus,
  latestResponder,
  onMinimize,
  onClose,
}: ChatHeaderProps) {
  const title = getVisitorChatHeaderTitle(latestResponder);
  const statusLabel = VISITOR_HEADER_STATUS_LABELS[headerStatus];
  const statusDot = VISITOR_HEADER_STATUS_DOT_CLASS[headerStatus];

  return (
    <div
      data-testid="chat-header"
      className="flex shrink-0 items-start justify-between gap-2 border-b border-brand-border bg-brand-navy px-4 py-3 text-white max-[479px]:gap-2 max-[479px]:px-4 max-[479px]:py-2.5 sm:gap-3"
    >
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-semibold leading-tight tracking-tight max-[479px]:text-[17px] sm:text-sm">
          {title}
        </h2>
        <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[12px] font-medium text-white/85 max-[479px]:mt-1 max-[479px]:text-[12px] sm:mt-2 sm:text-[11px]">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} aria-hidden="true" />
          <span className="min-w-0 truncate">{statusLabel}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimise chat"
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          data-testid="chat-close"
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
