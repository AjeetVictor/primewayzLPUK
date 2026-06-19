import { createPublicToken } from './publicToken.ts';
import { loadSharedReport, saveSharedReport } from './reportStore.ts';
import { sanitizeSharedReport } from './sanitizeSharedReport.ts';

export type CreateSharedReportResult = {
  publicToken: string;
  shareUrl: string;
  createdAt: string;
};

export async function createSharedReport(
  rawReport: unknown,
  siteUrl: string,
): Promise<CreateSharedReportResult> {
  const report = sanitizeSharedReport(rawReport);
  const publicToken = createPublicToken();
  const createdAt = new Date().toISOString();
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');

  await saveSharedReport({
    publicToken,
    createdAt,
    report,
  });

  return {
    publicToken,
    shareUrl: `${normalizedSiteUrl}/web-presence-audit/report/${publicToken}`,
    createdAt,
  };
}

export async function getSharedReport(publicToken: string) {
  const record = await loadSharedReport(publicToken);
  if (!record) return null;
  return record;
}
