/**
 * In-flight lock for visitor chat message retries.
 * Keeps the lock across reconcile + optional resend.
 */

export type SafeRetryOutcome = 'skipped' | 'reconciled' | 'resent';

export type RunSafeMessageRetryParams = {
  messageId: string;
  inFlight: Set<string>;
  reconcileBeforeRetry: () => Promise<boolean>;
  sendMessage: () => Promise<void>;
};

/**
 * Guarantees at most one concurrent retry for a message id.
 * The in-flight id is cleared only in the final `finally` after all work.
 */
export async function runSafeMessageRetry(
  params: RunSafeMessageRetryParams,
): Promise<SafeRetryOutcome> {
  if (params.inFlight.has(params.messageId)) {
    return 'skipped';
  }

  params.inFlight.add(params.messageId);
  try {
    const reconciled = await params.reconcileBeforeRetry();
    if (reconciled) {
      return 'reconciled';
    }
    await params.sendMessage();
    return 'resent';
  } finally {
    params.inFlight.delete(params.messageId);
  }
}
