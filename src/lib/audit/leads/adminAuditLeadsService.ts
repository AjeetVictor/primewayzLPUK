import type { Prisma, PrismaClient, ToolLead } from '@prisma/client';
import { AUDIT_LEAD_SOURCE } from './auditLeadRecord.ts';

export const AUDIT_LEAD_ADMIN_STATUSES = [
  'new',
  'reviewed',
  'contacted',
  'follow_up',
  'converted',
  'not_fit',
] as const;

export type AuditLeadAdminStatus = (typeof AUDIT_LEAD_ADMIN_STATUSES)[number];

export type AuditLeadAdminNote = {
  id: string;
  note: string;
  createdAt: string;
};

export type AuditLeadAdminMeta = {
  status: AuditLeadAdminStatus;
  lastActionAt: string | null;
  notesCount: number;
  latestNote: string | null;
};

export type SafeAuditLeadListItem = {
  id: number;
  createdAt: string;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string;
  businessName: string | null;
  businessType: string | null;
  score: number | null;
  details: {
    scoreLabel: string | null;
    publicToken: string | null;
    shareUrl: string | null;
    reminderOptIn: boolean | null;
    consentAccepted: boolean | null;
    consentAt: string | null;
    utm: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
    } | null;
    cta_location: string | null;
    admin: AuditLeadAdminMeta;
  };
};

export type SafeAuditLeadDetail = SafeAuditLeadListItem & {
  message: string | null;
  details: SafeAuditLeadListItem['details'] & {
    admin: AuditLeadAdminMeta & {
      notes: AuditLeadAdminNote[];
    };
  };
};

const NOTE_MAX_LENGTH = 500;
const HTML_TAG_REGEX = /<[^>]*>/g;

type RawDetails = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readAdminStatus(value: unknown): AuditLeadAdminStatus {
  if (typeof value === 'string' && AUDIT_LEAD_ADMIN_STATUSES.includes(value as AuditLeadAdminStatus)) {
    return value as AuditLeadAdminStatus;
  }
  return 'new';
}

function sanitizeNoteText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(HTML_TAG_REGEX, '').trim().slice(0, NOTE_MAX_LENGTH);
}

function readAdminNotes(rawAdmin: RawDetails | undefined): AuditLeadAdminNote[] {
  if (!rawAdmin || !Array.isArray(rawAdmin.notes)) return [];

  return rawAdmin.notes
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const note = sanitizeNoteText(entry.note);
      const id = readString(entry.id);
      const createdAt = readString(entry.createdAt);
      if (!note || !id || !createdAt) return null;
      return { id, note, createdAt };
    })
    .filter((entry): entry is AuditLeadAdminNote => Boolean(entry));
}

function readAdminMeta(rawDetails: RawDetails | null | undefined): AuditLeadAdminMeta {
  const rawAdmin = isRecord(rawDetails?.admin) ? (rawDetails.admin as RawDetails) : undefined;
  const notes = readAdminNotes(rawAdmin);
  const status = readAdminStatus(rawAdmin?.status);
  const lastActionAt = readString(rawAdmin?.lastActionAt);
  const latestNote = notes.at(-1)?.note ?? null;

  return {
    status,
    lastActionAt,
    notesCount: notes.length,
    latestNote,
  };
}

function readAdminNotesList(rawDetails: RawDetails | null | undefined): AuditLeadAdminNote[] {
  const rawAdmin = isRecord(rawDetails?.admin) ? (rawDetails.admin as RawDetails) : undefined;
  return readAdminNotes(rawAdmin);
}

function readSafeUtm(rawDetails: RawDetails | null | undefined) {
  const rawUtm = isRecord(rawDetails?.utm) ? (rawDetails.utm as RawDetails) : null;
  if (!rawUtm) return null;

  const utm = {
    ...(readString(rawUtm.source) ? { source: readString(rawUtm.source)! } : {}),
    ...(readString(rawUtm.medium) ? { medium: readString(rawUtm.medium)! } : {}),
    ...(readString(rawUtm.campaign) ? { campaign: readString(rawUtm.campaign)! } : {}),
    ...(readString(rawUtm.content) ? { content: readString(rawUtm.content)! } : {}),
  };

  return Object.keys(utm).length > 0 ? utm : null;
}

function serializeAuditLead(lead: ToolLead, includeNotes = false): SafeAuditLeadListItem | SafeAuditLeadDetail {
  const rawDetails = isRecord(lead.details) ? (lead.details as RawDetails) : null;
  const adminMeta = readAdminMeta(rawDetails);

  const sharedDetails = {
    scoreLabel: readString(rawDetails?.scoreLabel),
    publicToken: readString(rawDetails?.publicToken),
    shareUrl: readString(rawDetails?.shareUrl),
    reminderOptIn: readBoolean(rawDetails?.reminderOptIn),
    consentAccepted: readBoolean(rawDetails?.consentAccepted),
    consentAt: readString(rawDetails?.consentAt),
    utm: readSafeUtm(rawDetails),
    cta_location: readString(rawDetails?.cta_location),
  };

  if (includeNotes) {
    return {
      id: lead.id,
      createdAt: lead.createdAt.toISOString(),
      source: lead.source,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      websiteUrl: lead.websiteUrl,
      businessName: lead.businessName,
      businessType: lead.businessType,
      score: lead.score,
      message: lead.message,
      details: {
        ...sharedDetails,
        admin: {
          ...adminMeta,
          notes: readAdminNotesList(rawDetails),
        },
      },
    };
  }

  return {
    id: lead.id,
    createdAt: lead.createdAt.toISOString(),
    source: lead.source,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    websiteUrl: lead.websiteUrl,
    businessName: lead.businessName,
    businessType: lead.businessType,
    score: lead.score,
    details: {
      ...sharedDetails,
      admin: adminMeta,
    },
  };
}

function scoreBandMatches(score: number | null, scoreBand: string): boolean {
  if (score === null || Number.isNaN(score)) return scoreBand === 'unknown';
  if (scoreBand === 'unknown') return score === null;
  if (scoreBand === 'low') return score >= 0 && score <= 39;
  if (scoreBand === 'moderate') return score >= 40 && score <= 59;
  if (scoreBand === 'good') return score >= 60 && score <= 79;
  if (scoreBand === 'strong') return score >= 80 && score <= 100;
  return true;
}

function matchesSearch(lead: ToolLead, q: string): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;

  const rawDetails = isRecord(lead.details) ? (lead.details as RawDetails) : null;
  const haystack = [
    lead.name,
    lead.email,
    lead.phone,
    lead.websiteUrl,
    lead.businessName,
    lead.businessType,
    readString(rawDetails?.scoreLabel),
    readString(rawDetails?.publicToken),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(term);
}

function matchesReminderOptIn(lead: ToolLead, reminderOptIn: string): boolean {
  const rawDetails = isRecord(lead.details) ? (lead.details as RawDetails) : null;
  const value = rawDetails?.reminderOptIn;
  if (reminderOptIn === 'true') return value === true;
  if (reminderOptIn === 'false') return value === false;
  return true;
}

function matchesStatus(lead: ToolLead, status: string): boolean {
  const rawDetails = isRecord(lead.details) ? (lead.details as RawDetails) : null;
  const admin = isRecord(rawDetails?.admin) ? (rawDetails.admin as RawDetails) : undefined;
  const currentStatus = readAdminStatus(admin?.status);
  return currentStatus === status;
}

export type ListAuditLeadsQuery = {
  status?: string;
  q?: string;
  scoreBand?: string;
  reminderOptIn?: string;
  limit?: number;
  offset?: number;
};

export async function listAdminAuditLeads(
  prisma: PrismaClient,
  query: ListAuditLeadsQuery,
): Promise<{ total: number; items: SafeAuditLeadListItem[] }> {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const leads = await prisma.toolLead.findMany({
    where: { source: AUDIT_LEAD_SOURCE },
    orderBy: { createdAt: 'desc' },
  });

  const filtered = leads.filter((lead) => {
    if (query.status && !matchesStatus(lead, query.status)) return false;
    if (query.q && !matchesSearch(lead, query.q)) return false;
    if (query.scoreBand && !scoreBandMatches(lead.score, query.scoreBand)) return false;
    if (query.reminderOptIn && !matchesReminderOptIn(lead, query.reminderOptIn)) return false;
    return true;
  });

  const items = filtered
    .slice(offset, offset + limit)
    .map((lead) => serializeAuditLead(lead, false) as SafeAuditLeadListItem);

  return { total: filtered.length, items };
}

export async function getAdminAuditLeadById(
  prisma: PrismaClient,
  id: number,
): Promise<SafeAuditLeadDetail | null> {
  const lead = await prisma.toolLead.findFirst({
    where: { id, source: AUDIT_LEAD_SOURCE },
  });

  if (!lead) return null;
  return serializeAuditLead(lead, true) as SafeAuditLeadDetail;
}

function mergeDetailsWithAdminUpdate(
  existingDetails: Prisma.JsonValue | null | undefined,
  updater: (rawDetails: RawDetails, rawAdmin: RawDetails) => RawDetails,
): Prisma.InputJsonValue {
  const rawDetails = isRecord(existingDetails) ? { ...(existingDetails as RawDetails) } : {};
  const rawAdmin = isRecord(rawDetails.admin) ? { ...(rawDetails.admin as RawDetails) } : {};
  const nextAdmin = updater(rawDetails, rawAdmin);
  return {
    ...rawDetails,
    admin: nextAdmin,
  } as Prisma.InputJsonValue;
}

export async function updateAdminAuditLeadStatus(
  prisma: PrismaClient,
  id: number,
  status: AuditLeadAdminStatus,
): Promise<SafeAuditLeadDetail | null> {
  const lead = await prisma.toolLead.findFirst({
    where: { id, source: AUDIT_LEAD_SOURCE },
  });
  if (!lead) return null;

  const now = new Date().toISOString();
  const details = mergeDetailsWithAdminUpdate(lead.details, (_rawDetails, rawAdmin) => ({
    ...rawAdmin,
    status,
    lastActionAt: now,
  }));

  const updated = await prisma.toolLead.update({
    where: { id },
    data: { details },
  });

  return serializeAuditLead(updated, true) as SafeAuditLeadDetail;
}

export function validateAuditLeadAdminStatus(status: unknown): AuditLeadAdminStatus | null {
  if (typeof status !== 'string') return null;
  return AUDIT_LEAD_ADMIN_STATUSES.includes(status as AuditLeadAdminStatus)
    ? (status as AuditLeadAdminStatus)
    : null;
}

export async function addAdminAuditLeadNote(
  prisma: PrismaClient,
  id: number,
  noteInput: unknown,
): Promise<SafeAuditLeadDetail | null> {
  const note = sanitizeNoteText(noteInput);
  if (!note) return null;

  const lead = await prisma.toolLead.findFirst({
    where: { id, source: AUDIT_LEAD_SOURCE },
  });
  if (!lead) return null;

  const now = new Date().toISOString();
  const noteEntry: AuditLeadAdminNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    note,
    createdAt: now,
  };

  const details = mergeDetailsWithAdminUpdate(lead.details, (_rawDetails, rawAdmin) => {
    const existingNotes = readAdminNotes(rawAdmin);
    return {
      ...rawAdmin,
      status: readAdminStatus(rawAdmin.status),
      lastActionAt: now,
      notes: [...existingNotes, noteEntry],
    };
  });

  const updated = await prisma.toolLead.update({
    where: { id },
    data: { details },
  });

  return serializeAuditLead(updated, true) as SafeAuditLeadDetail;
}
