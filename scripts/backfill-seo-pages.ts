/**
 * Backfill canonical SEO pages from existing GSC, CMS, chat and lead URLs.
 * Dry-run by default — pass --write to persist.
 * Never prints PII.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { runSeoPageBackfill } from '../src/lib/seo/seoPageBackfillService.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

function safeLog(payload: Record<string, unknown>) {
  console.log(JSON.stringify({ ...payload, at: new Date().toISOString() }));
}

async function main() {
  const writeMode = process.argv.includes('--write');
  const prisma = new PrismaClient();
  try {
    const report = await runSeoPageBackfill(prisma, { dryRun: !writeMode });
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
