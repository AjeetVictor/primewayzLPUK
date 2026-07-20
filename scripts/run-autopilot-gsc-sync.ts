/**
 * Schedule-ready CLI for Article Autopilot GSC sync.
 * Never logs secrets. Exit non-zero on failure.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { runGscSync } from '../src/lib/autopilot/gscSyncService.ts';
import { getGscPublicConfigStatus } from '../src/lib/autopilot/gscConfig.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

function safeLog(payload: Record<string, unknown>) {
  console.log(JSON.stringify({ ...payload, at: new Date().toISOString() }));
}

async function main() {
  const config = getGscPublicConfigStatus();
  if (!config.configured) {
    safeLog({
      ok: false,
      errorCode: 'GSC_CONFIGURATION_REQUIRED',
      missing: config.missing,
    });
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const result = await runGscSync(prisma, {
      trigger: 'SCHEDULED',
      actorId: null,
    });
    safeLog({
      ok: true,
      connectionId: result.connectionId,
      syncRunId: result.syncRun.id,
      status: result.syncRun.status,
      dateFrom: result.syncRun.dateFrom,
      dateTo: result.syncRun.dateTo,
      requestsMade: result.syncRun.requestsMade,
      daysProcessed: result.syncRun.daysProcessed,
      rowsFetched: result.syncRun.rowsFetched,
      rowsUpserted: result.syncRun.rowsUpserted,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'GSC sync failed';
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'GSC_SYNC_FAILED';
    safeLog({
      ok: false,
      errorCode: code,
      message,
    });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
