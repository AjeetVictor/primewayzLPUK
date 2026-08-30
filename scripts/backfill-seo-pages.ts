/**
 * Backfill canonical SEO pages from existing GSC, CMS, chat and lead URLs.
 * Dry-run by default — pass --write to persist.
 * Never prints PII.
 */

import dotenv from 'dotenv';
import { PrismaClient, type SeoPageAliasSource } from '@prisma/client';
import {
  runSeoPageBackfill,
  type SeoPageBackfillSource,
} from '../src/lib/seo/seoPageBackfillService.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function safeLog(payload: Record<string, unknown>) {
  console.log(JSON.stringify({ ...payload, at: new Date().toISOString() }));
}

async function main() {
  const writeMode = process.argv.includes('--write');
  const verbose = process.argv.includes('--verbose');
  const source = readArg('source') as SeoPageBackfillSource | SeoPageAliasSource | undefined;
  const limit = readArg('limit') ? Number(readArg('limit')) : undefined;
  const offset = readArg('offset') ? Number(readArg('offset')) : undefined;
  const dateFrom = readArg('date-from') ? new Date(readArg('date-from')!) : undefined;
  const dateTo = readArg('date-to') ? new Date(readArg('date-to')!) : undefined;

  const prisma = new PrismaClient();
  try {
    const report = await runSeoPageBackfill(prisma, {
      dryRun: !writeMode,
      source: source as SeoPageBackfillSource | undefined,
      dateFrom,
      dateTo,
      limit,
      offset,
      verbose,
    });
    safeLog({ ok: true, ...report });
    if (!writeMode) {
      safeLog({
        note: 'Dry-run only. Re-run with --write to persist SeoPage and SeoPageAlias rows.',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO page backfill failed';
    safeLog({ ok: false, message });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
