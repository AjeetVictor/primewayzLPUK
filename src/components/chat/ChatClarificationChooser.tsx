import { ChatIdentityBadge } from './ChatIdentityBadge';
import { resolveVisitorChatIdentity } from '../../lib/chat/visitorChatIdentity';
import type { VisitorChatIntentDefinition } from '../../lib/chat/visitorChatIntents';

type ChatClarificationChooserProps = {
  intent: VisitorChatIntentDefinition;
  selectedKey?: string | null;
  onSelect: (clarificationKey: string) => void;
};

export function ChatClarificationChooser({
  intent,
  selectedKey,
  onSelect,
}: ChatClarificationChooserProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm max-[479px]:p-2.5 max-[479px]:shadow-none">
      <ChatIdentityBadge identity={resolveVisitorChatIdentity('bot')} />
      <p className="text-sm font-medium text-brand-ink max-[479px]:text-[15px]">
        {intent.clarificationPrompt}
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 max-[479px]:mt-1.5 max-[479px]:gap-1.5">
        {intent.clarifications.map((option) => {
          const selected = selectedKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(option.key)}
              className={`box-border rounded-lg border px-3.5 py-3 text-left text-[15px] font-medium leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 min-h-[48px] sm:min-h-[44px] sm:px-3 sm:py-2.5 sm:text-[13px] ${
                selected
                  ? 'border-brand-blue bg-brand-surface text-brand-navy'
                  : 'border-brand-border bg-white text-brand-ink hover:border-brand-blue/35 hover:bg-brand-surface'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500 max-[479px]:mt-1.5">
        You can still type freely after choosing.
      </p>
    </div>
  );
}
