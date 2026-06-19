import fs from 'node:fs/promises';
import path from 'node:path';
import type { SharedWebPresenceAuditReport } from '../types.ts';
import { isValidPublicToken } from './publicToken.ts';

export type StoredSharedReport = {
  publicToken: string;
  createdAt: string;
  report: SharedWebPresenceAuditReport;
};

function reportsDirectory(): string {
  return process.env.AUDIT_SHARED_REPORTS_DIR
    || path.join(process.cwd(), 'data', 'web-presence-audit-reports');
}

function reportFilePath(publicToken: string): string {
  return path.join(reportsDirectory(), `${publicToken}.json`);
}

export async function ensureReportStoreReady(): Promise<void> {
  await fs.mkdir(reportsDirectory(), { recursive: true });
}

export async function saveSharedReport(record: StoredSharedReport): Promise<void> {
  await ensureReportStoreReady();
  await fs.writeFile(reportFilePath(record.publicToken), JSON.stringify(record), 'utf8');
}

export async function loadSharedReport(publicToken: string): Promise<StoredSharedReport | null> {
  if (!isValidPublicToken(publicToken)) return null;

  try {
    const raw = await fs.readFile(reportFilePath(publicToken), 'utf8');
    const parsed = JSON.parse(raw) as StoredSharedReport;
    if (!parsed?.publicToken || !parsed?.report) return null;
    return parsed;
  } catch {
    return null;
  }
}
