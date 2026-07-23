import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDigitalSystemsReviewNotificationEmail,
  redactNotificationErrorCode,
} from './reviewEmail.ts';
import {
  findReviewLeadBySubmissionId,
  isPrismaUniqueConstraintError,
  saveDigitalSystemsReviewLead,
  updateReviewNotificationStatus,
} from './saveReviewLead.ts';
import {
  submitDigitalSystemsReviewLead,
  toPublicDigitalSystemsReviewResponse,
} from './submitReviewLead.ts';
import { validateAndNormalizeDigitalSystemsReviewLead } from './validateReviewLead.ts';

const completePayload = {
  submissionId: 'idempotencytest001',
  name: 'Alex Reviewer',
  workEmail: 'alex@example.co.uk',
  company: 'Example Ltd',
  serviceArea: 'Website Visibility & Conversion',
  context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
  preferredNextStep: 'Email me the recommended next step',
  acknowledgement: true,
  sourceLocation: 'digital_systems_review_page',
  firstTouchAttribution: { utm_source: 'google' },
  latestTouchAttribution: { utm_source: 'newsletter' },
  landingPage: '/digital-systems-review',
  referrer: 'https://referrer.example/path',
};

function createPrismaStub(options?: {
  failCreate?: boolean;
  uniqueRaceOnCreate?: boolean;
  failStatusUpdate?: boolean;
}) {
  const rows = new Map<string, Record<string, unknown>>();
  let nextId = 1;

  const prisma = {
    digitalSystemsReviewLead: {
      create: async ({ data, select }: { data: Record<string, unknown>; select?: unknown }) => {
        if (options?.failCreate) {
          throw new Error('database unavailable');
        }
        if (options?.uniqueRaceOnCreate || rows.has(String(data.submissionId))) {
          throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
        }
        const row: Record<string, unknown> = {
          id: nextId++,
          notificationStatus: 'pending',
          notificationErrorCode: null,
          createdAt: new Date('2026-07-22T10:00:00.000Z'),
          updatedAt: new Date('2026-07-22T10:00:00.000Z'),
          ...data,
        };
        rows.set(String(data.submissionId), row);
        if (select) {
          return {
            id: row.id as number,
            submissionId: row.submissionId as string,
            notificationStatus: row.notificationStatus as string,
            createdAt: row.createdAt as Date,
          };
        }
        return row;
      },
      findUnique: async ({ where }: { where: { submissionId: string } }) => {
        const row = rows.get(where.submissionId);
        if (!row) return null;
        return {
          id: row.id,
          submissionId: row.submissionId,
          notificationStatus: row.notificationStatus,
          createdAt: row.createdAt,
          company: row.company,
          context: row.context,
        };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        if (options?.failStatusUpdate) {
          throw new Error('status update failed');
        }
        for (const row of rows.values()) {
          if (row.id === where.id) {
            Object.assign(row, data);
            return row;
          }
        }
        throw new Error('not found');
      },
    },
    chatSession: {
      create: async () => {
        throw new Error('ChatSession.create must not be called');
      },
      upsert: async () => {
        throw new Error('ChatSession.upsert must not be called');
      },
      update: async () => {
        throw new Error('ChatSession.update must not be called');
      },
    },
  };

  return { prisma, rows };
}

test('create success then public response hides notification internals', async () => {
  const stub = createPrismaStub();
  let sends = 0;
  const first = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    { ...completePayload, submissionId: 'pubresp0001' },
  );

  assert.equal(first.resultCategory, 'created');
  assert.equal(first.notificationStatus, 'sent');
  assert.equal(sends, 1);

  const publicBody = toPublicDigitalSystemsReviewResponse(first);
  assert.deepEqual(publicBody, { success: true, resultCategory: 'created' });
  assert.equal('notificationStatus' in publicBody, false);
  assert.equal('notificationErrorCode' in publicBody, false);
  assert.equal('id' in publicBody, false);
  assert.equal('submissionId' in publicBody, false);
});

test('failed notification is not disclosed by the public response shape', async () => {
  const stub = createPrismaStub();
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        throw new Error('SMTP 535 Authentication failed secret-token-xyz');
      },
    },
    { ...completePayload, submissionId: 'emailfail0001' },
  );

  assert.equal(result.resultCategory, 'created');
  assert.equal(result.notificationStatus, 'failed');
  const publicBody = toPublicDigitalSystemsReviewResponse(result);
  assert.deepEqual(publicBody, { success: true, resultCategory: 'created' });
  assert.doesNotMatch(JSON.stringify(publicBody), /failed|SMTP|secret|notification/i);
});

test('duplicate after sent → no resend and no row mutation', async () => {
  const stub = createPrismaStub();
  let sends = 0;
  await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    { ...completePayload, submissionId: 'dupsent0001' },
  );

  const second = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    {
      ...completePayload,
      submissionId: 'dupsent0001',
      company: 'Changed Company',
      context: 'Changed context that should not overwrite the stored lead values at all.',
    },
  );

  assert.equal(second.resultCategory, 'duplicate');
  assert.equal(sends, 1);
  assert.equal(stub.rows.size, 1);
  assert.equal(stub.rows.get('dupsent0001')?.company, 'Example Ltd');
});

test('duplicate while pending → no resend', async () => {
  const stub = createPrismaStub();
  stub.rows.set('duppending01', {
    id: 9,
    submissionId: 'duppending01',
    notificationStatus: 'pending',
    company: 'Example Ltd',
    context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
    createdAt: new Date(),
  });

  let sends = 0;
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    { ...completePayload, submissionId: 'duppending01' },
  );

  assert.equal(result.resultCategory, 'duplicate');
  assert.equal(sends, 0);
});

test('duplicate after failed → no automatic resend', async () => {
  const stub = createPrismaStub();
  stub.rows.set('dupfailed001', {
    id: 11,
    submissionId: 'dupfailed001',
    notificationStatus: 'failed',
    company: 'Example Ltd',
    context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
    createdAt: new Date(),
  });

  let sends = 0;
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    { ...completePayload, submissionId: 'dupfailed001', company: 'Other Co' },
  );

  assert.equal(result.resultCategory, 'duplicate');
  assert.equal(sends, 0);
  assert.equal(stub.rows.get('dupfailed001')?.company, 'Example Ltd');
});

test('P2002 race → duplicate success and no email', async () => {
  const raced = createPrismaStub({ uniqueRaceOnCreate: true });
  raced.rows.set('race0001', {
    id: 9,
    submissionId: 'race0001',
    notificationStatus: 'sent',
    company: 'Example Ltd',
    createdAt: new Date(),
  });

  let sends = 0;
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: raced.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        sends += 1;
      },
    },
    { ...completePayload, submissionId: 'race0001' },
  );

  assert.equal(result.resultCategory, 'duplicate');
  assert.equal(sends, 0);
});

test('concurrent-style duplicate path cannot produce two email sends', async () => {
  const stub = createPrismaStub();
  let sends = 0;
  const deps = {
    prisma: stub.prisma as never,
    isEmailReady: () => true,
    getReceiver: () => 'ops@example.com',
    sendNotificationEmail: async () => {
      sends += 1;
    },
  };

  const first = await submitDigitalSystemsReviewLead(deps, {
    ...completePayload,
    submissionId: 'concurrent01',
  });
  const second = await submitDigitalSystemsReviewLead(deps, {
    ...completePayload,
    submissionId: 'concurrent01',
  });

  assert.equal(first.resultCategory, 'created');
  assert.equal(second.resultCategory, 'duplicate');
  assert.equal(sends, 1);
  assert.equal(stub.rows.size, 1);
});

test('send success + status update failure still returns created', async () => {
  const stub = createPrismaStub({ failStatusUpdate: true });
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => undefined,
    },
    { ...completePayload, submissionId: 'statusfail01' },
  );
  assert.equal(result.resultCategory, 'created');
  assert.equal(result.notificationStatus, 'sent');
  assert.equal(stub.rows.has('statusfail01'), true);
});

test('send failure + status update failure still returns created', async () => {
  const stub = createPrismaStub({ failStatusUpdate: true });
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        throw new Error('SMTP boom');
      },
    },
    { ...completePayload, submissionId: 'statusfail02' },
  );
  assert.equal(result.resultCategory, 'created');
  assert.equal(result.notificationStatus, 'failed');
  assert.equal(stub.rows.has('statusfail02'), true);
});

test('email configuration helper throwing still returns created', async () => {
  const stub = createPrismaStub();
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => {
        throw new Error('config probe failed');
      },
      getReceiver: () => 'ops@example.com',
      sendNotificationEmail: async () => {
        throw new Error('should not send');
      },
    },
    { ...completePayload, submissionId: 'configthrow1' },
  );
  assert.equal(result.resultCategory, 'created');
  assert.equal(stub.rows.has('configthrow1'), true);
});

test('receiver helper throwing still returns created', async () => {
  const stub = createPrismaStub();
  const result = await submitDigitalSystemsReviewLead(
    {
      prisma: stub.prisma as never,
      isEmailReady: () => true,
      getReceiver: () => {
        throw new Error('receiver probe failed');
      },
      sendNotificationEmail: async () => {
        throw new Error('should not send');
      },
    },
    { ...completePayload, submissionId: 'receiverthr1' },
  );
  assert.equal(result.resultCategory, 'created');
  assert.equal(stub.rows.has('receiverthr1'), true);
});

test('database failure propagates for temporary failure handling', async () => {
  const stub = createPrismaStub({ failCreate: true });
  await assert.rejects(
    () =>
      submitDigitalSystemsReviewLead(
        {
          prisma: stub.prisma as never,
          isEmailReady: () => false,
          getReceiver: () => null,
        },
        { ...completePayload, submissionId: 'dbfail0001' },
      ),
    /database unavailable/,
  );
});

test('notification email helpers and unique error detection', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    submissionId: 'emailcontent001',
    name: 'Alex <script>',
    chatSessionId: 'opaquechat1',
  });
  const email = buildDigitalSystemsReviewNotificationEmail({
    ...lead,
    id: 12,
    createdAt: new Date('2026-07-22T10:00:00.000Z'),
  });
  assert.match(email.text, /Lead reference: emailcontent001/);
  assert.match(email.text, /Chat journey reference: opaquechat1/);
  assert.match(email.html, /Alex &lt;script&gt;/);
  assert.equal(redactNotificationErrorCode(new Error('SMTP timeout ETIMEDOUT')), 'email_timeout');
  assert.equal(isPrismaUniqueConstraintError({ code: 'P2002' }), true);
});

test('find and update notification helpers work against stub', async () => {
  const stub = createPrismaStub();
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    submissionId: 'notifyupdate001',
  });
  const saved = await saveDigitalSystemsReviewLead({ prisma: stub.prisma as never }, lead);
  await updateReviewNotificationStatus({ prisma: stub.prisma as never }, saved.id, {
    notificationStatus: 'sent',
    notificationErrorCode: null,
  });
  const found = await findReviewLeadBySubmissionId(
    { prisma: stub.prisma as never },
    'notifyupdate001',
  );
  assert.equal(found?.notificationStatus, 'sent');
});
