/**
 * Rebuild SEO conversion daily aggregates from chat, forms and review leads.
 * Dry-run by default. Never prints PII.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { rebuildSeoPageConversions } from '../src/lib/seo/conversionAggregationService.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

function readArg(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function safeLog(payload: Record<string, unknown>) {
  console.log(JSON.stringify({ ...payload, at: new Date().toISOString() }));
}

async function main() {
  const dateFrom = readArg('dateFrom');
  const dateTo = readArg('dateTo');
  if (!dateFrom || !dateTo) {
    safeLog({
      ok: false,
      message: 'Usage: --dateFrom=YYYY-MM-DD --dateTo=YYYY-MM-DD [--write] [--pageId=123]',
    });
    process.exitCode = 1;
    return;
  }

  const writeMode = process.argv.includes('--write');
  const pageIdRaw = readArg('pageId');
  const seoPageId = pageIdRaw ? Number.parseInt(pageIdRaw, 10) : null;

  const prisma = new PrismaClient();
  try {
    const report = await rebuildSeoPageConversions(prisma, {
      dateFrom,
      dateTo,
      dryRun: !writeMode,
      seoPageId: Number.isInteger(seoPageId) ? seoPageId : null,
    });
    safeLog({ ok: true, ...report });
    if (!writeMode) {
      safeLog({
        note: 'Dry-run only. Re-run with --write to persist SeoPageConversionDaily rows.',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Conversion rebuild failed';
    safeLog({ ok: false, message });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
