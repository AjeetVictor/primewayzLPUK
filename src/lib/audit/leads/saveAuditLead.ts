import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  AUDIT_LEAD_SOURCE,
  buildAuditLeadDetails,
  logAuditLeadSaveFailed,
  logAuditLeadSaved,
  normalizeAuditLeadEmail,
  type AuditLeadDetails,
  type NormalizedAuditLeadSubmission,
  type SanitizedAuditLeadContext,
} from './auditLeadRecord.ts';
import { saveAuditLeadFile, type StoredAuditLeadFile } from './leadStore.ts';

export type SaveAuditLeadInput = {
  submission: NormalizedAuditLeadSubmission;
  context: SanitizedAuditLeadContext;
};

export type SaveAuditLeadResult = {
  storage: 'database' | 'file';
  id: string;
  details: AuditLeadDetails;
};

/**
 * Primary lead persistence for Web Presence Audit email-report submissions.
 * ToolLead (database) is the source of truth. File storage under
 * data/web-presence-audit-leads/ is an emergency backup only when DB writes fail.
 */
export async function saveAuditLead(
  prisma: PrismaClient,
  input: SaveAuditLeadInput,
): Promise<SaveAuditLeadResult> {
  const details = buildAuditLeadDetails(input);
  const { submission, context } = input;
  const normalizedEmail = normalizeAuditLeadEmail(submission.email) || submission.email;

  const filePayload: Omit<StoredAuditLeadFile, 'id' | 'createdAt'> = {
    source: AUDIT_LEAD_SOURCE,
    name: submission.name,
    email: normalizedEmail,
    phone: submission.phone,
    message: submission.message,
    websiteUrl: context.websiteUrl,
    businessName: context.businessName,
    businessType: context.businessType,
    score: context.score,
    details,
  };

  try {
    const lead = await prisma.toolLead.create({
      data: {
        source: AUDIT_LEAD_SOURCE,
        websiteUrl: context.websiteUrl,
        businessName: context.businessName,
        score: context.score,
        businessType: context.businessType || null,
        name: submission.name,
        email: normalizedEmail,
        phone: submission.phone || null,
        message: submission.message || null,
        details: details as unknown as Prisma.InputJsonValue,
      },
    });

    logAuditLeadSaved('database', String(lead.id), context.publicToken);

    return {
      storage: 'database',
      id: String(lead.id),
      details,
    };
  } catch (error) {
    logAuditLeadSaveFailed(context.publicToken);
    console.error('[audit-lead] database write failed; using emergency file fallback');

    try {
      const fileLead = await saveAuditLeadFile(filePayload);
      logAuditLeadSaved('file', fileLead.id, context.publicToken);

      return {
        storage: 'file',
        id: fileLead.id,
        details,
      };
    } catch (fileError) {
      console.error('[audit-lead] emergency file fallback failed');
      throw fileError;
    }
  }
}
