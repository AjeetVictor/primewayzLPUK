import { Link } from 'react-router-dom';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  buildFreeReviewCtaUrl,
  type FreeReviewServiceArea,
} from '../../constants/conversionCta';
import {
  VISITOR_CHAT_OFFLINE_BODY,
  VISITOR_CHAT_OFFLINE_TITLE,
} from '../../lib/chat/visitorChatUi';

type ChatAvailabilityNoticeProps = {
  serviceArea?: FreeReviewServiceArea | null;
  onLeaveMessage: () => void;
  onReviewClick: () => void;
  onBookingClick: () => void;
  onNavigateFromChat?: () => void;
};

export function ChatAvailabilityNotice({
  serviceArea,
  onLeaveMessage,
  onReviewClick,
  onBookingClick,
  onNavigateFromChat,
}: ChatAvailabilityNoticeProps) {
  const reviewHref = buildFreeReviewCtaUrl('chat_widget', serviceArea ?? null);

  return (
    <div
      role="status"
      className="rounded-xl border border-brand-border bg-white p-3 shadow-sm"
    >
      <p className="text-sm font-semibold text-brand-navy">{VISITOR_CHAT_OFFLINE_TITLE}</p>
      <p className="mt-1 text-[12px] leading-5 text-slate-600">{VISITOR_CHAT_OFFLINE_BODY}</p>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onLeaveMessage}
          className="flex min-h-[44px] items-center justify-center rounded-lg border border-brand-border bg-white px-3 py-2 text-[13px] font-semibold text-brand-navy transition hover:border-brand-blue/35 hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          Leave contact details
        </button>
        <Link
          to={reviewHref}
          onClick={() => {
            onReviewClick();
            onNavigateFromChat?.();
          }}
          className="flex min-h-[44px] items-center justify-center rounded-lg bg-brand-navy px-3 py-2 text-center text-[13px] font-semibold text-white transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
        >
          Continue with a Digital Systems Review
        </Link>
        <Link
          to={DISCOVERY_CALL_DESTINATION}
          onClick={() => {
            onBookingClick();
            onNavigateFromChat?.();
          }}
          className="flex min-h-[44px] items-center justify-center rounded-lg px-3 py-2 text-[13px] font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          {DISCOVERY_CALL_CTA_LABEL}
        </Link>
      </div>
    </div>
  );
}
