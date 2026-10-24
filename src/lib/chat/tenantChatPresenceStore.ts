/**
 * Tenant-scoped team presence persistence.
 *
 * Every read and write is keyed by a concrete tenantId supplied by an already-authorised caller
 * (server-derived public source, Admin tenant selector, or a credential-bound integration).
 * There is no global or cross-tenant fallback: a tenant with no rows reads as null/null.
 */

import { ADMIN_PRESENCE_ACTIVE_WINDOW_MS, isAdminPresenceExpired } from './chatPresence.ts';

export type TenantChatPresencePrisma = {
  chatPresenceSetting: {
    findFirst: (args: {
      where: { tenantId: string };
      orderBy: { updatedAt: 'desc' };
      select: { mode: true; message: true };
    }) => Promise<{ mode: string; message: string | null } | null>;
    create: (args: {
      data: { tenantId: string; mode: string; message: string | null; updatedById: number | null };
    }) => Promise<unknown>;
  };
  adminPresence: {
    findFirst: (args: {
      where: { tenantId: string } | { tenantId: string; userId: number };
      orderBy?: { lastSeenAt: 'desc' };
      select: { lastSeenAt: true; userId?: true };
    }) => Promise<{ lastSeenAt: Date; userId?: number } | null>;
    findMany: (args: {
      where: { tenantId?: string; userId?: number; lastSeenAt?: { gte: Date } };
      select: { userId?: true; lastSeenAt?: true; tenantId?: true };
      orderBy?: { lastSeenAt: 'desc' };
    }) => Promise<Array<{ userId?: number; lastSeenAt?: Date; tenantId?: string }>>;
    upsert: (args: {
      where: { tenantId_userId: { tenantId: string; userId: number } };
      update: { lastSeenAt: Date };
      create: { tenantId: string; userId: number; lastSeenAt: Date };
    }) => Promise<unknown>;
    deleteMany: (args: {
      where: { userId: number } | { tenantId: string; userId: number };
    }) => Promise<{ count: number }>;
  };
};

export type TenantChatPresenceReadPrisma = {
  chatPresenceSetting: Pick<TenantChatPresencePrisma['chatPresenceSetting'], 'findFirst'>;
  adminPresence: Pick<TenantChatPresencePrisma['adminPresence'], 'findFirst' | 'findMany'>;
};

export type TenantChatPresenceState = {
  setting: { mode: string; message: string | null } | null;
  latestAdminSeenAt: Date | null;
};

export async function readTenantChatPresence(
  prisma: TenantChatPresenceReadPrisma,
  tenantId: string,
): Promise<TenantChatPresenceState> {
  const [setting, latestPresence] = await Promise.all([
    prisma.chatPresenceSetting.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { mode: true, message: true },
    }),
    prisma.adminPresence.findFirst({
      where: { tenantId },
      orderBy: { lastSeenAt: 'desc' },
      select: { lastSeenAt: true },
    }),
  ]);
  return { setting: setting ?? null, latestAdminSeenAt: latestPresence?.lastSeenAt ?? null };
}

const EMPTY_PRESENCE_STATE: TenantChatPresenceState = { setting: null, latestAdminSeenAt: null };

/** Without a concrete tenant there is no presence lookup at all (never a global read). */
export async function readOptionalTenantChatPresence(
  prisma: TenantChatPresenceReadPrisma,
  tenantId: string | null | undefined,
): Promise<TenantChatPresenceState> {
  if (!tenantId) return { ...EMPTY_PRESENCE_STATE };
  return readTenantChatPresence(prisma, tenantId);
}

export async function recordTenantChatPresenceSetting(
  prisma: Pick<TenantChatPresencePrisma, 'chatPresenceSetting'>,
  input: { tenantId: string; mode: string; message: string | null; updatedById: number | null },
): Promise<void> {
  await prisma.chatPresenceSetting.create({
    data: {
      tenantId: input.tenantId,
      mode: input.mode,
      message: input.message,
      updatedById: input.updatedById,
    },
  });
}

export async function recordTenantAdminHeartbeat(
  prisma: Pick<TenantChatPresencePrisma, 'adminPresence'>,
  input: { tenantId: string; userId: number; now?: Date },
): Promise<{ previousLastSeenAt: Date | null; becameActive: boolean }> {
  const lastSeenAt = input.now ?? new Date();
  const previous = await prisma.adminPresence.findFirst({
    where: { tenantId: input.tenantId, userId: input.userId },
    select: { lastSeenAt: true },
  });
  const previousLastSeenAt = previous?.lastSeenAt ?? null;
  const wasActive = !isAdminPresenceExpired(previousLastSeenAt, lastSeenAt.getTime());
  await prisma.adminPresence.upsert({
    where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
    update: { lastSeenAt },
    create: { tenantId: input.tenantId, userId: input.userId, lastSeenAt },
  });
  return { previousLastSeenAt, becameActive: !wasActive };
}

type AdminPresenceReader = Pick<TenantChatPresencePrisma['adminPresence'], 'findMany'>;

/** Count operators with a fresh heartbeat for one concrete tenant (no cross-tenant fallback). */
export async function countActiveTenantOperators(
  adminPresence: AdminPresenceReader,
  tenantId: string,
  now: Date = new Date(),
  windowMs: number = ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
): Promise<number> {
  const cutoff = new Date(now.getTime() - windowMs);
  const rows = await adminPresence.findMany({
    where: { tenantId, lastSeenAt: { gte: cutoff } },
    select: { userId: true, lastSeenAt: true },
  });
  return rows.filter((row) => typeof row.userId === 'number').length;
}

export async function listActiveTenantOperators(
  adminPresence: AdminPresenceReader,
  tenantId: string,
  now: Date = new Date(),
  windowMs: number = ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
): Promise<Array<{ userId: number; lastSeenAt: Date; expiresAt: Date }>> {
  const cutoff = new Date(now.getTime() - windowMs);
  const rows = await adminPresence.findMany({
    where: { tenantId, lastSeenAt: { gte: cutoff } },
    select: { userId: true, lastSeenAt: true },
    orderBy: { lastSeenAt: 'desc' },
  });
  return rows
    .filter((row): row is { userId: number; lastSeenAt: Date } =>
      typeof row.userId === 'number' && row.lastSeenAt instanceof Date)
    .map((row) => ({
      userId: row.userId,
      lastSeenAt: row.lastSeenAt,
      expiresAt: new Date(row.lastSeenAt.getTime() + windowMs),
    }));
}

/**
 * Drop heartbeat rows for one administrator (all tenants, or one concrete tenant).
 * Used on explicit logout so auto-mode team availability does not linger until TTL.
 * Does not change ChatPresenceSetting — forced available/away/offline modes stay as set.
 */
export async function clearAdminPresenceForUser(
  prisma: Pick<TenantChatPresencePrisma, 'adminPresence'>,
  input: { userId: number; tenantId?: string },
): Promise<number> {
  const where =
    typeof input.tenantId === 'string' && input.tenantId.length > 0
      ? { tenantId: input.tenantId, userId: input.userId }
      : { userId: input.userId };
  const result = await prisma.adminPresence.deleteMany({ where });
  return result.count;
}

/**
 * Tenant ids that currently have a heartbeat row for this operator.
 * Used on logout so operational events stay tenant-scoped (no cross-tenant fallback).
 */
export async function listAdminPresenceTenantIdsForUser(
  prisma: Pick<TenantChatPresencePrisma, 'adminPresence'>,
  userId: number,
): Promise<string[]> {
  const rows = await prisma.adminPresence.findMany({
    where: { userId },
    select: { tenantId: true },
  });
  return rows
    .map((row) => row.tenantId)
    .filter((tenantId): tenantId is string => typeof tenantId === 'string' && tenantId.length > 0);
}
