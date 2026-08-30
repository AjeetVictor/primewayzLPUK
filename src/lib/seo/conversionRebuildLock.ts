/**
 * MySQL advisory lock for SEO conversion rebuild writes.
 * Lock acquire, DML, and release must share one pinned interactive-transaction connection.
 * Dry-run rebuilds do not acquire this lock.
 */

import type { Prisma, PrismaClient } from '@prisma/client';

export const CONVERSION_REBUILD_LOCK_NAME = 'pw_seo_conversion_rebuild';

export class ConversionRebuildLockError extends Error {
  constructor() {
    super('SEO conversion rebuild already running');
    this.name = 'ConversionRebuildLockError';
  }
}

export class ConversionRebuildLockReleaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversionRebuildLockReleaseError';
  }
}

function toLockResult(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export async function acquireConversionRebuildLock(
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ result: unknown }>>`
    SELECT GET_LOCK(${CONVERSION_REBUILD_LOCK_NAME}, 0) AS result
  `;
  return toLockResult(rows[0]?.result) === 1;
}

export async function releaseConversionRebuildLock(
  tx: Prisma.TransactionClient,
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ result: unknown }>>`
    SELECT RELEASE_LOCK(${CONVERSION_REBUILD_LOCK_NAME}) AS result
  `;
  const result = toLockResult(rows[0]?.result);
  if (result === 1) return;
  if (result === 0) {
    throw new ConversionRebuildLockReleaseError(
      'RELEASE_LOCK returned 0 (lock was not held by this connection)',
    );
  }
  throw new ConversionRebuildLockReleaseError('RELEASE_LOCK returned NULL');
}

export async function withConversionRebuildLock<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const acquired = await acquireConversionRebuildLock(tx);
    if (!acquired) {
      throw new ConversionRebuildLockError();
    }

    let businessError: unknown;
    let result: T | undefined;
    try {
      result = await fn(tx);
    } catch (error) {
      businessError = error;
    } finally {
      try {
        await releaseConversionRebuildLock(tx);
      } catch (releaseError) {
        if (businessError) throw businessError;
        throw releaseError;
      }
    }

    if (businessError) throw businessError;
    return result as T;
  });
}
