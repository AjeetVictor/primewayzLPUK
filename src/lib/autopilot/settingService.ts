import type { Prisma, PrismaClient } from '@prisma/client';
import { AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED } from '../../data/autopilot/types.ts';
import { appendActivityLog, redactSensitive } from './activityLogService.ts';
import { AutopilotError, conflict, notFound, validationError } from './apiErrors.ts';
import type { AdminActor } from './topicHelpers.ts';
import { actorDisplayName } from './topicHelpers.ts';

/** Foundation phase: no unlocked mutable settings yet. */
export const AUTOPILOT_UNLOCKED_SETTING_KEYS = [] as const;

export type AutopilotSettingUpdateInput = {
  key: string;
  value: unknown;
  description?: string | null;
};

export async function listAutopilotSettings(prisma: PrismaClient) {
  const items = await prisma.autopilotSetting.findMany({ orderBy: { key: 'asc' } });
  return items.map((item) => ({
    id: item.id,
    key: item.key,
    value: redactSensitive(item.value),
    description: item.description,
    isLocked: item.isLocked,
    updatedById: item.updatedById,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

function assertSafeSettingValue(value: unknown): void {
  if (value === undefined) {
    throw validationError('Setting value is required.', { field: 'value' });
  }
  const json = JSON.stringify(value).toLowerCase();
  if (
    json.includes('"password"') ||
    json.includes('"apikey"') ||
    json.includes('"api_key"') ||
    json.includes('"secret"') ||
    json.includes('"accesstoken"') ||
    json.includes('"refreshtoken"')
  ) {
    throw validationError('Secret-like setting values are not allowed.', { field: 'value' });
  }
}

export async function updateAutopilotSetting(
  prisma: PrismaClient,
  actor: AdminActor,
  input: AutopilotSettingUpdateInput,
  correlationId: string,
) {
  const key = typeof input.key === 'string' ? input.key.trim() : '';
  if (!key) throw validationError('Setting key is required.', { field: 'key' });

  if (key === AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED) {
    throw conflict(
      'Automatic publishing is locked and cannot be enabled during the foundation phases.',
      { key },
      'AUTOPILOT_AUTO_PUBLISH_LOCKED',
    );
  }

  assertSafeSettingValue(input.value);

  const existing = await prisma.autopilotSetting.findUnique({ where: { key } });
  if (!existing) throw notFound('Autopilot setting not found.', { key });

  if (existing.isLocked) {
    throw conflict('This Autopilot setting is locked and cannot be changed.', { key });
  }

  if (!(AUTOPILOT_UNLOCKED_SETTING_KEYS as readonly string[]).includes(key)) {
    throw conflict('This Autopilot setting cannot be updated in the foundation phase.', {
      key,
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.autopilotSetting.update({
      where: { key },
      data: {
        value: input.value as Prisma.InputJsonValue,
        description: input.description === undefined ? undefined : input.description,
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'setting',
      entityId: String(updated.id),
      eventType: 'setting_changed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { key, value: existing.value, isLocked: existing.isLocked },
      newValue: { key, value: updated.value, isLocked: updated.isLocked },
      metadata: { summary: `Setting changed: ${key}`, key },
      correlationId,
    });

    return {
      id: updated.id,
      key: updated.key,
      value: redactSensitive(updated.value),
      description: updated.description,
      isLocked: updated.isLocked,
      updatedById: updated.updatedById,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export function assertAutoPublishCannotEnable(value: unknown): void {
  if (value === true || value === 'true' || value === 1) {
    throw new AutopilotError(
      'AUTOPILOT_AUTO_PUBLISH_LOCKED',
      'Automatic publishing is locked and cannot be enabled during the foundation phases.',
      409,
      { key: AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED },
    );
  }
}
