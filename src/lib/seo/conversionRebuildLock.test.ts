/**
 * Tests for SEO conversion rebuild advisory lock.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import {
  CONVERSION_REBUILD_LOCK_NAME,
  ConversionRebuildLockError,
  acquireConversionRebuildLock,
  releaseConversionRebuildLock,
  withConversionRebuildLock,
} from './conversionRebuildLock.ts';

function createLockPrisma(lockState: { held: boolean; acquireCount: number; releaseCount: number }) {
  return {
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('');
      if (sql.includes('GET_LOCK')) {
        lockState.acquireCount += 1;
        assert.equal(values[0], CONVERSION_REBUILD_LOCK_NAME);
        if (lockState.held) return [{ result: 0 }];
        lockState.held = true;
        return [{ result: 1 }];
      }
      if (sql.includes('RELEASE_LOCK')) {
        lockState.releaseCount += 1;
        assert.equal(values[0], CONVERSION_REBUILD_LOCK_NAME);
        lockState.held = false;
        return [{ result: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  } as unknown as PrismaClient;
}

test('acquire and release conversion rebuild lock', async () => {
  const lockState = { held: false, acquireCount: 0, releaseCount: 0 };
  const prisma = createLockPrisma(lockState);

  assert.equal(await acquireConversionRebuildLock(prisma), true);
  assert.equal(lockState.held, true);
  await releaseConversionRebuildLock(prisma);
  assert.equal(lockState.held, false);
  assert.equal(lockState.acquireCount, 1);
  assert.equal(lockState.releaseCount, 1);
});

test('concurrent write rebuild lock is rejected', async () => {
  const lockState = { held: true, acquireCount: 0, releaseCount: 0 };
  const prisma = createLockPrisma(lockState);

  assert.equal(await acquireConversionRebuildLock(prisma), false);
  await assert.rejects(
    () =>
      withConversionRebuildLock(prisma, async () => {
        return 'unused';
      }),
    ConversionRebuildLockError,
  );
});

test('lock is released after successful callback', async () => {
  const lockState = { held: false, acquireCount: 0, releaseCount: 0 };
  const prisma = createLockPrisma(lockState);

  const result = await withConversionRebuildLock(prisma, async () => 'ok');
  assert.equal(result, 'ok');
  assert.equal(lockState.held, false);
  assert.equal(lockState.releaseCount, 1);
});

test('lock is released after callback failure', async () => {
  const lockState = { held: false, acquireCount: 0, releaseCount: 0 };
  const prisma = createLockPrisma(lockState);

  await assert.rejects(
    () =>
      withConversionRebuildLock(prisma, async () => {
        throw new Error('transaction failed');
      }),
    /transaction failed/,
  );
  assert.equal(lockState.held, false);
  assert.equal(lockState.releaseCount, 1);
});

test('lock metadata contains no secrets or PII', () => {
  const serialised = JSON.stringify({ lock: CONVERSION_REBUILD_LOCK_NAME });
  assert.equal(serialised.includes('@'), false);
  assert.equal(serialised.includes('PRIVATE'), false);
});
