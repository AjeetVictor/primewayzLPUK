import {
  VISITOR_CHAT_ENTRY_HEADING,
  VISITOR_CHAT_INTENTS,
  type VisitorChatIntentKey,
} from '../../lib/chat/visitorChatIntents';

type ChatIntentChooserProps = {
  selectedIntentKey?: VisitorChatIntentKey | null;
  onSelect: (key: VisitorChatIntentKey) => void;
  onShowAll?: () => void;
  heading?: string;
};

export function ChatIntentChooser({
  selectedIntentKey,
  onSelect,
  onShowAll,
  heading = VISITOR_CHAT_ENTRY_HEADING,
}: ChatIntentChooserProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm max-[479px]:p-2.5 max-[479px]:shadow-none">
      <div className="mb-2 flex items-start justify-between gap-2 max-[479px]:mb-1.5">
        <p className="text-sm font-semibold text-brand-navy max-[479px]:text-[15px]">{heading}</p>
        {selectedIntentKey && onShowAll ? (
          <button
            type="button"
            onClick={onShowAll}
            className="shrink-0 text-[11px] font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
          >
            Show all choices
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 max-[479px]:gap-1.5 sm:grid-cols-2">
        {VISITOR_CHAT_INTENTS.map((intent) => {
          const selected = selectedIntentKey === intent.key;
          return (
            <button
              key={intent.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(intent.key)}
              className={`box-border rounded-lg border px-3.5 py-3 text-left text-[15px] font-medium leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 min-h-[48px] max-[479px]:min-h-[48px] sm:min-h-[44px] sm:px-3 sm:py-2.5 sm:text-[13px] ${
                selected
                  ? 'border-brand-blue bg-brand-surface text-brand-navy'
                  : 'border-brand-border bg-white text-brand-ink hover:border-brand-blue/35 hover:bg-brand-surface'
              }`}
            >
              {intent.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500 max-[479px]:mt-1.5">
        Choose an option above, or type your question below.
      </p>
    </div>
  );
}
