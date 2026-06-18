import { getReplyPreviewText, type ChatReplyPreview } from '../../lib/chatTypes';

interface QuotedMessagePreviewProps {
  replyTo?: ChatReplyPreview | null;
  variant?: 'admin' | 'visitor' | 'internal';
}

const senderLabels: Record<string, string> = {
  user: 'Visitor',
  bot: 'Bot',
  admin: 'Admin',
};

export function QuotedMessagePreview({ replyTo, variant = 'visitor' }: QuotedMessagePreviewProps) {
  if (!replyTo) return null;

  const previewText = getReplyPreviewText(replyTo);
  if (!previewText) return null;

  const senderLabel = senderLabels[replyTo.sender?.toLowerCase()] || 'Message';

  const variantClasses = {
    admin: 'border-emerald-200 bg-emerald-500/20 text-emerald-50',
    visitor: 'border-zinc-200 bg-black/5 text-zinc-500',
    internal: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <div className={`mb-2 rounded-lg border-l-2 px-2 py-1.5 text-[11px] leading-snug ${variantClasses[variant]}`}>
      <span className="font-bold uppercase tracking-wide opacity-80">{senderLabel}</span>
      <p className="mt-0.5 opacity-90">{previewText}</p>
    </div>
  );
}
