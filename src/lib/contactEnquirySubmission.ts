import type { Prisma, PrismaClient } from '@prisma/client';

type PersistedContactSubmission = {
  id: number;
  name: string;
  email: string;
  message: string;
  phone: string | null;
};

export type ContactSubmissionResult =
  | { resultCategory: 'created' | 'duplicate'; id: number }
  | { resultCategory: 'conflict' };

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002',
  );
}

function matchesSubmission(
  existing: PersistedContactSubmission,
  incoming: Pick<PersistedContactSubmission, 'name' | 'email' | 'message' | 'phone'>,
): boolean {
  return existing.name === incoming.name
    && existing.email === incoming.email
    && existing.message === incoming.message
    && existing.phone === incoming.phone;
}

export async function persistContactSubmission(
  prisma: PrismaClient,
  data: Prisma.FormResponseUncheckedCreateInput,
): Promise<ContactSubmissionResult> {
  const submissionId = data.submissionId;
  const incoming = {
    name: data.name,
    email: data.email,
    message: data.message,
    phone: data.phone ?? null,
  };

  if (typeof submissionId !== 'string') {
    const created = await prisma.formResponse.create({
      data,
      select: { id: true },
    });
    return { resultCategory: 'created', id: created.id };
  }

  const findExisting = () => prisma.formResponse.findUnique({
    where: { submissionId },
    select: { id: true, name: true, email: true, message: true, phone: true },
  });
  const existing = await findExisting();
  if (existing) {
    return matchesSubmission(existing, incoming)
      ? { resultCategory: 'duplicate', id: existing.id }
      : { resultCategory: 'conflict' };
  }

  try {
    const created = await prisma.formResponse.create({
      data,
      select: { id: true },
    });
    return { resultCategory: 'created', id: created.id };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const raced = await findExisting();
    if (!raced) throw error;
    return matchesSubmission(raced, incoming)
      ? { resultCategory: 'duplicate', id: raced.id }
      : { resultCategory: 'conflict' };
  }
}
