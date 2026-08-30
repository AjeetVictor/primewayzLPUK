/**
 * Tests for SEO conversion rebuild advisory lock.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  CONVERSION_REBUILD_LOCK_NAME,
  ConversionRebuildLockError,
  ConversionRebuildLockReleaseError,
  acquireConversionRebuildLock,
  releaseConversionRebuildLock,
  withConversionRebuildLock,
} from './conversionRebuildLock.ts';

type LockQueryClient = {
  $queryRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<Array<{ result: unknown }>>;
};

type LockTestHarness = {
  outer: PrismaClient;
  tx: LockQueryClient;
  lockState: {
    acquireCount: number;
    releaseCount: number;
    releaseResult: unknown;
    lockHeld: boolean;
  };
  transactionCount: number;
};

function createLockHarness(options?: {
  lockHeld?: boolean;
  releaseResult?: unknown;
}): LockTestHarness {
  let transactionCount = 0;
  const lockState = {
    acquireCount: 0,
    releaseCount: 0,
    releaseResult:
      options && 'releaseResult' in options ? options.releaseResult : 1,
    lockHeld: options?.lockHeld ?? false,
  };

  const tx: LockQueryClient = {
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('');
      if (sql.includes('GET_LOCK')) {
        lockState.acquireCount += 1;
        assert.equal(values[0], CONVERSION_REBUILD_LOCK_NAME);
        if (lockState.lockHeld) return [{ result: 0 }];
        lockState.lockHeld = true;
        return [{ result: 1 }];
      }
      if (sql.includes('RELEASE_LOCK')) {
        lockState.releaseCount += 1;
        assert.equal(values[0], CONVERSION_REBUILD_LOCK_NAME);
        lockState.lockHeld = false;
        return [{ result: lockState.releaseResult }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const outer = {
    $transaction: async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => {
      transactionCount += 1;
      return callback(tx as unknown as Prisma.TransactionClient);
    },
  } as unknown as PrismaClient;

  return {
    outer,
    tx,
    lockState,
    get transactionCount() {
      return transactionCount;
    },
    set transactionCount(_value) {
      // read-only counter
    },
  };
}

test('acquire and release use the same transaction client', async () => {
  const harness = createLockHarness();
  const txClient = harness.tx as unknown as Prisma.TransactionClient;

  assert.equal(await acquireConversionRebuildLock(txClient), true);
  await releaseConversionRebuildLock(txClient);
  assert.equal(harness.lockState.acquireCount, 1);
  assert.equal(harness.lockState.releaseCount, 1);
});

test('withConversionRebuildLock opens one outer transaction only', async () => {
  const harness = createLockHarness();
  let callbackTx: Prisma.TransactionClient | undefined;

  await withConversionRebuildLock(harness.outer, async (tx) => {
    callbackTx = tx;
    return 'ok';
  });

  assert.equal(harness.transactionCount, 1);
  assert.equal(callbackTx, harness.tx);
  assert.equal(harness.lockState.acquireCount, 1);
  assert.equal(harness.lockState.releaseCount, 1);
});

test('concurrent write rebuild lock is rejected without callback work', async () => {
  const harness = createLockHarness({ lockHeld: true });
  let callbackInvoked = false;

  await assert.rejects(
    () =>
      withConversionRebuildLock(harness.outer, async () => {
        callbackInvoked = true;
        return 'unused';
      }),
    ConversionRebuildLockError,
  );

  assert.equal(callbackInvoked, false);
  assert.equal(harness.lockState.acquireCount, 1);
  assert.equal(harness.lockState.releaseCount, 0);
});

test('lock is released after successful callback', async () => {
  const harness = createLockHarness();

  const result = await withConversionRebuildLock(harness.outer, async () => 'ok');
  assert.equal(result, 'ok');
  assert.equal(harness.lockState.releaseCount, 1);
});

test('lock is released after callback failure', async () => {
  const harness = createLockHarness();

  await assert.rejects(
    () =>
      withConversionRebuildLock(harness.outer, async () => {
        throw new Error('transaction failed');
      }),
    /transaction failed/,
  );
  assert.equal(harness.lockState.releaseCount, 1);
});

test('release result 1 succeeds', async () => {
  const harness = createLockHarness({ releaseResult: 1 });
  await releaseConversionRebuildLock(harness.tx as unknown as Prisma.TransactionClient);
  assert.equal(harness.lockState.releaseCount, 1);
});

test('release result 0 is detected', async () => {
  const harness = createLockHarness({ releaseResult: 0 });
  await assert.rejects(
    () => releaseConversionRebuildLock(harness.tx as unknown as Prisma.TransactionClient),
    ConversionRebuildLockReleaseError,
  );
  await assert.rejects(
    () => releaseConversionRebuildLock(harness.tx as unknown as Prisma.TransactionClient),
    /RELEASE_LOCK returned 0/,
  );
});

test('release result NULL is detected', async () => {
  const harness = createLockHarness({ releaseResult: null });
  await assert.rejects(
    () => releaseConversionRebuildLock(harness.tx as unknown as Prisma.TransactionClient),
    ConversionRebuildLockReleaseError,
  );
  await assert.rejects(
    () => releaseConversionRebuildLock(harness.tx as unknown as Prisma.TransactionClient),
    /RELEASE_LOCK returned NULL/,
  );
});

test('business error is preserved when release also fails', async () => {
  const harness = createLockHarness({ releaseResult: 0 });

  await assert.rejects(
    () =>
      withConversionRebuildLock(harness.outer, async () => {
        throw new Error('insert failed');
      }),
    /insert failed/,
  );
  assert.equal(harness.lockState.releaseCount, 1);
});

test('lock metadata contains no secrets or PII', () => {
  const serialised = JSON.stringify({ lock: CONVERSION_REBUILD_LOCK_NAME });
  assert.equal(serialised.includes('@'), false);
  assert.equal(serialised.includes('PRIVATE'), false);
});
