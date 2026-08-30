/**
 * MySQL advisory lock for SEO conversion rebuild writes.
 * Dry-run rebuilds do not acquire this lock.
 */

import type { PrismaClient } from '@prisma/client';

export const CONVERSION_REBUILD_LOCK_NAME = 'pw_seo_conversion_rebuild';

export class ConversionRebuildLockError extends Error {
  constructor() {
    super('SEO conversion rebuild already running');
    this.name = 'ConversionRebuildLockError';
  }
}

function toLockResult(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export async function acquireConversionRebuildLock(prisma: PrismaClient): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ result: unknown }>>`
    SELECT GET_LOCK(${CONVERSION_REBUILD_LOCK_NAME}, 0) AS result
  `;
  return toLockResult(rows[0]?.result) === 1;
}

export async function releaseConversionRebuildLock(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRaw`
    SELECT RELEASE_LOCK(${CONVERSION_REBUILD_LOCK_NAME})
  `;
}

export async function withConversionRebuildLock<T>(
  prisma: PrismaClient,
  fn: () => Promise<T>,
): Promise<T> {
  const acquired = await acquireConversionRebuildLock(prisma);
  if (!acquired) {
    throw new ConversionRebuildLockError();
  }

  try {
    return await fn();
  } finally {
    await releaseConversionRebuildLock(prisma);
  }
}
