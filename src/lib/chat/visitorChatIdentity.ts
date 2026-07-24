/**
 * Visitor-facing chat identities for Phase 2F-1.
 * Internal API sender values remain `bot` | `admin` | `user`.
 */

export const VISITOR_CHAT_ASSISTANT_NAME = 'Primewayz Assistant' as const;
export const VISITOR_CHAT_ASSISTANT_ROLE = 'Automated guidance' as const;

export const VISITOR_CHAT_TEAM_NAME = 'Primewayz Team' as const;
export const VISITOR_CHAT_TEAM_ROLE = 'Human response' as const;

export const VISITOR_CHAT_NEUTRAL_NAME = 'Primewayz Chat' as const;

export const VISITOR_CHAT_HEADER_SUBTITLE =
  'Automated guidance and team follow-up' as const;

export const VISITOR_CHAT_HUMAN_JOINED_NOTICE =
  'A Primewayz team member has joined the conversation.' as const;

/** Labels that must not appear in the redesigned visitor presentation. */
export const PROHIBITED_VISITOR_IDENTITY_LABELS = [
  'AI assistant',
  'Support agent',
  'Support Agent',
  'Bot',
] as const;

export type VisitorChatSender = 'user' | 'bot' | 'admin' | 'system';

export type VisitorChatIdentity =
  | { kind: 'assistant'; name: typeof VISITOR_CHAT_ASSISTANT_NAME; role: typeof VISITOR_CHAT_ASSISTANT_ROLE }
  | { kind: 'team'; name: typeof VISITOR_CHAT_TEAM_NAME; role: typeof VISITOR_CHAT_TEAM_ROLE }
  | { kind: 'system'; name: null; role: null }
  | { kind: 'visitor'; name: null; role: null };

export function resolveVisitorChatIdentity(sender: VisitorChatSender): VisitorChatIdentity {
  if (sender === 'bot') {
    return {
      kind: 'assistant',
      name: VISITOR_CHAT_ASSISTANT_NAME,
      role: VISITOR_CHAT_ASSISTANT_ROLE,
    };
  }
  if (sender === 'admin') {
    return {
      kind: 'team',
      name: VISITOR_CHAT_TEAM_NAME,
      role: VISITOR_CHAT_TEAM_ROLE,
    };
  }
  if (sender === 'system') {
    return { kind: 'system', name: null, role: null };
  }
  return { kind: 'visitor', name: null, role: null };
}

export function getVisitorFacingSenderLabel(sender: string | null | undefined): string {
  const normalized = (sender || '').toLowerCase();
  if (normalized === 'bot') return VISITOR_CHAT_ASSISTANT_NAME;
  if (normalized === 'admin') return VISITOR_CHAT_TEAM_NAME;
  if (normalized === 'user') return 'You';
  if (normalized === 'system') return 'Notice';
  return 'Message';
}
