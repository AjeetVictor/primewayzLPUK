/**
 * Visitor chat polling cadence helpers.
 */

export const VISITOR_CHAT_OPEN_POLL_MS = 5000;
export const VISITOR_CHAT_CLOSED_POLL_MS = 45000;

export function resolveVisitorChatPollIntervalMs(params: {
  isOpen: boolean;
  isMinimized: boolean;
  isDocumentVisible: boolean;
  hasKnownSessionHistory: boolean;
}): number | null {
  if (!params.isDocumentVisible) return null;
  if (params.isOpen && !params.isMinimized) return VISITOR_CHAT_OPEN_POLL_MS;
  if (params.hasKnownSessionHistory) return VISITOR_CHAT_CLOSED_POLL_MS;
  return null;
}
