import { getReplyPreviewText, type ChatReplyPreview } from '../../lib/chatTypes';
import { getVisitorFacingSenderLabel } from '../../lib/chat/visitorChatIdentity';

interface QuotedMessagePreviewProps {
  replyTo?: ChatReplyPreview | null;
  variant?: 'admin' | 'visitor' | 'internal';
}

/** Admin/internal labels stay operational; visitor presentation uses brand identities. */
const adminSenderLabels: Record<string, string> = {
  user: 'Visitor',
  bot: 'Bot',
  admin: 'Admin',
};

export function QuotedMessagePreview({ replyTo, variant = 'visitor' }: QuotedMessagePreviewProps) {
  if (!replyTo) return null;

  const previewText = getReplyPreviewText(replyTo);
  if (!previewText) return null;

  const senderKey = replyTo.sender?.toLowerCase() || '';
  const senderLabel =
    variant === 'visitor'
      ? getVisitorFacingSenderLabel(senderKey)
      : adminSenderLabels[senderKey] || 'Message';

  const variantClasses = {
    admin: 'border-emerald-200 bg-emerald-500/20 text-emerald-50',
    visitor: 'border-brand-border bg-brand-surface text-slate-500',
    internal: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <div className={`mb-2 rounded-lg border-l-2 px-2 py-1.5 text-[11px] leading-snug ${variantClasses[variant]}`}>
      <span className="font-bold uppercase tracking-wide opacity-80">{senderLabel}</span>
      <p className="mt-0.5 opacity-90">{previewText}</p>
    </div>
  );
}
