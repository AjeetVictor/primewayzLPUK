import type { PrismaClient } from '@prisma/client';
import {
  OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS,
  type PresenceIdempotencyStore,
} from './operatorPresenceIngestion.ts';

function idempotencyKey(input: { tenantId: string; action: string; clientActionId: string }): string {
  return `${input.tenantId}:${input.action}:${input.clientActionId}`;
}

export function createMemoryPresenceIdempotencyStore(): PresenceIdempotencyStore {
  const keys = new Map<string, Date>();

  return {
    async claim(input) {
      const key = idempotencyKey(input);
      if (keys.has(key)) return 'duplicate';
      keys.set(key, input.at);
      return 'claimed';
    },
    async release(input) {
      keys.delete(idempotencyKey(input));
    },
    async prune(now = new Date()) {
      const cutoff = now.getTime() - OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS;
      let deleted = 0;
      for (const [key, createdAt] of keys) {
        if (createdAt.getTime() < cutoff) {
          keys.delete(key);
          deleted += 1;
        }
      }
      return deleted;
    },
  };
}

export function createPrismaPresenceIdempotencyStore(prisma: PrismaClient): PresenceIdempotencyStore {
  return {
    async claim(input) {
      try {
        await prisma.tenantPresenceIdempotencyKey.create({
          data: {
            tenantId: input.tenantId,
            action: input.action,
            clientActionId: input.clientActionId,
            createdAt: input.at,
          },
        });
        return 'claimed';
      } catch (err) {
        if (
          err
          && typeof err === 'object'
          && 'code' in err
          && (err as { code?: string }).code === 'P2002'
        ) {
          return 'duplicate';
        }
        throw err;
      }
    },
    async release(input) {
      await prisma.tenantPresenceIdempotencyKey.deleteMany({
        where: {
          tenantId: input.tenantId,
          action: input.action,
          clientActionId: input.clientActionId,
        },
      });
    },
    async prune(now = new Date()) {
      const cutoff = new Date(now.getTime() - OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS);
      const result = await prisma.tenantPresenceIdempotencyKey.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      return result.count;
    },
  };
}
