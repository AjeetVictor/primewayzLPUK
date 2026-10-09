import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma, PrismaClient } from '@prisma/client';
import { persistContactSubmission } from './contactEnquirySubmission';

function mockStore() {
  const records: Array<{
    id: number;
    submissionId?: string | null;
    name: string;
    email: string;
    message: string;
    phone: string | null;
  }> = [];
  let createCount = 0;
  const prisma = {
    formResponse: {
      findUnique: async ({ where }: { where: { submissionId: string } }) =>
        records.find(record => record.submissionId === where.submissionId) ?? null,
      create: async ({ data }: { data: Prisma.FormResponseUncheckedCreateInput }) => {
        createCount += 1;
        if (
          data.submissionId
          && records.some(record => record.submissionId === data.submissionId)
        ) {
          throw Object.assign(new Error('duplicate unique key'), { code: 'P2002' });
        }
        const record = {
          id: createCount,
          submissionId: data.submissionId,
          name: data.name,
          email: data.email,
          message: data.message,
          phone: data.phone ?? null,
        };
        records.push(record);
        return { id: record.id };
      },
    },
  } as unknown as PrismaClient;
  return {
    prisma,
    get createCount() { return createCount; },
    get persistedCount() { return records.length; },
  };
}

const submission = (changes: Partial<Prisma.FormResponseUncheckedCreateInput> = {}) => ({
  submissionId: 'a'.repeat(32),
  name: 'Ava Smith',
  email: 'ava@example.co.uk',
  message: 'Please help with our systems.',
  phone: null,
  ...changes,
}) as Prisma.FormResponseUncheckedCreateInput;

test('contact submission creates once and returns duplicate for an identical retry', async () => {
  const store = mockStore();
  const data = submission();
  assert.deepEqual(await persistContactSubmission(store.prisma, data), {
    resultCategory: 'created',
    id: 1,
  });
  assert.deepEqual(await persistContactSubmission(store.prisma, data), {
    resultCategory: 'duplicate',
    id: 1,
  });
  assert.equal(store.createCount, 1);
});

test('same contact submission identifier with different content returns a safe conflict', async () => {
  const store = mockStore();
  await persistContactSubmission(store.prisma, submission());
  assert.deepEqual(
    await persistContactSubmission(
      store.prisma,
      submission({ message: 'Different enquiry content.' }),
    ),
    { resultCategory: 'conflict' },
  );
  assert.equal(store.createCount, 1);
});

test('racing identical contact requests are resolved by the unique constraint', async () => {
  const store = mockStore();
  const data = submission();
  const results = await Promise.all([
    persistContactSubmission(store.prisma, data),
    persistContactSubmission(store.prisma, data),
  ]);
  assert.deepEqual(results.map(result => result.resultCategory).sort(), ['created', 'duplicate']);
  assert.equal(store.createCount, 2);
  assert.equal(store.persistedCount, 1);
});

test('legacy requests without an identifier retain create behavior', async () => {
  const store = mockStore();
  const data = submission({ submissionId: null });
  assert.equal((await persistContactSubmission(store.prisma, data)).resultCategory, 'created');
  assert.equal((await persistContactSubmission(store.prisma, data)).resultCategory, 'created');
  assert.equal(store.createCount, 2);
});
