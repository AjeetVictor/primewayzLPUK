import {
  VISITOR_CHAT_ASSISTANT_NAME,
  VISITOR_CHAT_ASSISTANT_ROLE,
  VISITOR_CHAT_TEAM_NAME,
  VISITOR_CHAT_TEAM_ROLE,
  type VisitorChatIdentity,
} from '../../lib/chat/visitorChatIdentity';

type ChatIdentityBadgeProps = {
  identity: VisitorChatIdentity;
  className?: string;
};

export function ChatIdentityBadge({ identity, className = '' }: ChatIdentityBadgeProps) {
  if (identity.kind === 'assistant') {
    return (
      <div className={`mb-1 ${className}`.trim()}>
        <p className="text-[11px] font-semibold text-brand-navy">{VISITOR_CHAT_ASSISTANT_NAME}</p>
        <p className="text-[10px] text-slate-500">{VISITOR_CHAT_ASSISTANT_ROLE}</p>
      </div>
    );
  }

  if (identity.kind === 'team') {
    return (
      <div className={`mb-1 ${className}`.trim()}>
        <p className="text-[11px] font-semibold text-brand-navy">{VISITOR_CHAT_TEAM_NAME}</p>
        <p className="text-[10px] text-slate-500">{VISITOR_CHAT_TEAM_ROLE}</p>
      </div>
    );
  }

  return null;
}
