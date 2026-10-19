/**
 * Operator copy for a failed admin reply.
 * Only entitlement denial and chat-service unavailability are surfaced.
 * Other failures keep the previous silent handling.
 */

export type AdminReplyFailureBody = {
  error?: unknown;
  code?: unknown;
  unavailable?: unknown;
};

const ENTITLEMENT_DENIED = 'Chat is not enabled for this tenant.';
const SERVICE_UNAVAILABLE = 'Chat is temporarily unavailable.';

function messageFrom(body: AdminReplyFailureBody | null | undefined, fallback: string): string {
  return typeof body?.error === 'string' && body.error.trim() ? body.error : fallback;
}

export function describeAdminReplyEntitlementFailure(
  status: number,
  body: AdminReplyFailureBody | null | undefined,
): string | null {
  if (status === 403 && body?.code === 'chat_not_entitled') {
    return messageFrom(body, ENTITLEMENT_DENIED);
  }
  if (status === 503) return messageFrom(body, SERVICE_UNAVAILABLE);
  return null;
}

export async function readAdminReplyEntitlementFailure(response: {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}): Promise<string | null> {
  if (response.ok || (response.status !== 403 && response.status !== 503)) return null;
  let body: AdminReplyFailureBody | null = null;
  try {
    const parsed = await response.json();
    body = parsed && typeof parsed === 'object' ? parsed as AdminReplyFailureBody : null;
  } catch {
    body = null;
  }
  return describeAdminReplyEntitlementFailure(response.status, body);
}
