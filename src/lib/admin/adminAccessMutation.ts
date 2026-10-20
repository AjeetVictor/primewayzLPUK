export type SerializableTransactionClient<TTx> = {
  $transaction<TResult>(
    operation: (tx: TTx) => Promise<TResult>,
    options: { isolationLevel: 'Serializable' },
  ): Promise<TResult>;
};

export type AccessSnapshotInput = {
  role: string;
  isPlatformOwner: boolean;
  tenantGrants?: ReadonlyArray<{
    tenantId: string;
    chatRole?: string;
    chatRoleExplicit?: boolean;
  }>;
};

export type AccessSnapshot = {
  role: string;
  isPlatformOwner: boolean;
  tenantIds: string[];
  tenantChatGrants: Array<{
    tenantId: string;
    chatRole: string;
    chatRoleExplicit: boolean;
  }>;
};

/** Whitelist audit fields so credentials and reset tokens can never enter access-audit details. */
export function accessSnapshot(user: AccessSnapshotInput): AccessSnapshot {
  return {
    role: user.role,
    isPlatformOwner: user.isPlatformOwner,
    tenantIds: user.tenantGrants?.map((grant) => grant.tenantId) ?? [],
    tenantChatGrants: user.tenantGrants?.map((grant) => ({
      tenantId: grant.tenantId,
      chatRole: typeof grant.chatRole === 'string' ? grant.chatRole : 'none',
      chatRoleExplicit: grant.chatRoleExplicit === true,
    })) ?? [],
  };
}

export function isSerializableTransactionConflict(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: unknown }).code === 'P2034',
  );
}

/**
 * Last-Host mutations must run at Serializable isolation. MySQL may resolve concurrent
 * write conflicts by aborting one transaction; retrying makes that request re-read the
 * current Host count, so two simultaneous demotions/deletions cannot both succeed.
 */
export async function runSerializableAccessTransaction<TTx, TResult>(
  client: SerializableTransactionClient<TTx>,
  operation: (tx: TTx) => Promise<TResult>,
  maxAttempts = 3,
): Promise<TResult> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await client.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (!isSerializableTransactionConflict(error) || attempt >= maxAttempts) throw error;
    }
  }
  throw new Error('Serializable access transaction exhausted without a result.');
}