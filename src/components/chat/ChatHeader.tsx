import { Minus, X } from 'lucide-react';
import {
  getVisitorChatHeaderSubtitle,
  getVisitorChatHeaderTitle,
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
  const subtitle = getVisitorChatHeaderSubtitle();
  const statusLabel = VISITOR_HEADER_STATUS_LABELS[headerStatus];
  const statusDot =
    headerStatus === 'team_available' || headerStatus === 'human_response_received'
      ? 'bg-emerald-500'
      : 'bg-amber-500';

  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-border bg-brand-navy px-4 py-3 text-white">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-white/70">{subtitle}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} aria-hidden="true" />
          <span>{statusLabel}</span>
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
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
