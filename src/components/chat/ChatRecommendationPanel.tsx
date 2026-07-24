import { Link } from 'react-router-dom';
import {
  buildVisitorChatRecommendationActions,
  type VisitorChatIntentDefinition,
} from '../../lib/chat/visitorChatIntents';

type ChatRecommendationPanelProps = {
  intent: VisitorChatIntentDefinition;
  onReviewClick: () => void;
  onServiceClick: () => void;
  onBookingClick: () => void;
  onNavigateFromChat?: () => void;
};

export function ChatRecommendationPanel({
  intent,
  onReviewClick,
  onServiceClick,
  onBookingClick,
  onNavigateFromChat,
}: ChatRecommendationPanelProps) {
  const actions = buildVisitorChatRecommendationActions(intent);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface/80 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-blue">
        Recommended next step
      </p>
      <h3 className="mt-1 text-sm font-semibold text-brand-navy">
        {intent.recommendationTitle}
      </h3>
      <p className="mt-1 text-[12px] leading-5 text-slate-600">
        {intent.recommendationExplanation}
      </p>

      <div className="mt-3 space-y-2">
        <Link
          to={actions.reviewHref}
          onClick={() => {
            onReviewClick();
            onNavigateFromChat?.();
          }}
          className="flex min-h-[44px] items-center justify-center rounded-lg bg-brand-navy px-3 py-2 text-center text-[13px] font-semibold text-white transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
        >
          {actions.reviewLabel}
        </Link>
        <Link
          to={actions.serviceHref}
          onClick={() => {
            onServiceClick();
            onNavigateFromChat?.();
          }}
          className="flex min-h-[44px] items-center justify-center rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-[13px] font-semibold text-brand-navy transition hover:border-brand-blue/35 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          {actions.serviceLabel}
        </Link>
        <Link
          to={actions.bookingHref}
          onClick={() => {
            onBookingClick();
            onNavigateFromChat?.();
          }}
          className="flex min-h-[44px] items-center justify-center rounded-lg px-3 py-2 text-center text-[13px] font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          {actions.bookingLabel}
        </Link>
      </div>
    </div>
  );
}
