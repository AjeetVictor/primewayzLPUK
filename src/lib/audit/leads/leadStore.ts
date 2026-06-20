import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { AuditLeadDetails } from './auditLeadRecord.ts';

/**
 * Emergency backup store for audit email-report leads when ToolLead DB writes fail.
 * Not public-facing. Never store raw report JSON, crawler data, evidence, or debug fields.
 */
export type StoredAuditLeadFile = {
  id: string;
  createdAt: string;
  source: 'Web Presence Audit';
  name: string;
  email: string;
  phone?: string;
  message?: string;
  websiteUrl: string;
  businessName: string;
  businessType: string;
  score: number | null;
  details: AuditLeadDetails;
};

function leadsDirectory(): string {
  return process.env.AUDIT_LEADS_DIR
    || path.join(process.cwd(), 'data', 'web-presence-audit-leads');
}

function leadFilePath(id: string): string {
  return path.join(leadsDirectory(), `${id}.json`);
}

export async function ensureLeadStoreReady(): Promise<void> {
  await fs.mkdir(leadsDirectory(), { recursive: true });
}

export async function saveAuditLeadFile(
  lead: Omit<StoredAuditLeadFile, 'id' | 'createdAt'>,
): Promise<StoredAuditLeadFile> {
  await ensureLeadStoreReady();

  const record: StoredAuditLeadFile = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...lead,
  };

  await fs.writeFile(leadFilePath(record.id), JSON.stringify(record), 'utf8');
  return record;
}
