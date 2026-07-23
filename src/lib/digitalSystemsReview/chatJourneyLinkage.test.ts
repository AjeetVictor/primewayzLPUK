import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import { resolveFreeReviewServiceArea } from '../../constants/conversionCta.ts';
import {
  normalizeOptionalChatSessionId,
  readOptionalChatSessionIdFromStorage,
} from './chatSessionId.ts';
import { buildDigitalSystemsReviewNotificationEmail } from './reviewEmail.ts';
import { saveDigitalSystemsReviewLead } from './saveReviewLead.ts';
import {
  DigitalSystemsReviewValidationError,
  validateAndNormalizeDigitalSystemsReviewLead,
} from './validateReviewLead.ts';
import { DEFAULT_REVIEW_SOURCE_LOCATION } from '../../constants/digitalSystemsReview.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const completePayload = {
  submissionId: 'chatlinkagetest01',
  name: 'Alex Reviewer',
  workEmail: 'alex@example.co.uk',
  company: 'Example Ltd',
  website: 'https://example.co.uk',
  serviceArea: 'Website Visibility & Conversion',
  context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
  preferredNextStep: 'Email me the recommended next step',
  acknowledgement: true,
  sourceLocation: 'digital_systems_review_page',
};

test('source locations allow chat_widget without making it the page default', () => {
  assert.equal(DEFAULT_REVIEW_SOURCE_LOCATION, 'digital_systems_review_page');
  assert.notEqual(DEFAULT_REVIEW_SOURCE_LOCATION, 'chat_widget');
});

test('valid optional chatSessionId is normalized and persisted through validation', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    chatSessionId: '  abc12xy  ',
  });
  assert.equal(lead.chatSessionId, 'abc12xy');
});

test('missing chatSessionId does not affect a valid submission', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({ ...completePayload });
  assert.equal(lead.chatSessionId, null);
  assert.equal(lead.workEmail, 'alex@example.co.uk');
  assert.equal(lead.sourceLocation, 'digital_systems_review_page');
});

test('malformed chatSessionId is safely omitted without rejecting the lead', () => {
  const cases = [
    'a',
    'not an id',
    'user@example.com',
    '../etc/passwd',
    'https://evil.example',
    12345,
    { id: 'x' },
    'x'.repeat(100),
  ];

  for (const chatSessionId of cases) {
    const lead = validateAndNormalizeDigitalSystemsReviewLead({
      ...completePayload,
      chatSessionId,
    });
    assert.equal(lead.chatSessionId, null, `expected omit for ${String(chatSessionId)}`);
    assert.equal(lead.company, 'Example Ltd');
  }

  assert.equal(normalizeOptionalChatSessionId('bad id'), undefined);
});

test('chatSessionId is not included in analytics payloads', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    chatSessionId: 'sessionopaque1',
  });
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: lead.sourceLocation,
    serviceArea: resolveFreeReviewServiceArea(lead.serviceArea) ?? undefined,
    preferredNextStep: lead.preferredNextStep,
  });
  assert.equal('chatSessionId' in payload, false);
  assert.equal('chat_session_id' in payload, false);
  assertNoProhibitedAnalyticsProps(payload as Record<string, unknown>);
});

test('review form source does not read or copy chat name/email fields', () => {
  const formPath = path.resolve(
    __dirname,
    '../../components/forms/DigitalSystemsReviewForm.tsx',
  );
  const source = fs.readFileSync(formPath, 'utf8');
  assert.equal(source.includes('chat_user_name'), false);
  assert.equal(source.includes('chat_user_email'), false);
  assert.ok(source.includes('readOptionalChatSessionIdFromStorage'));
  assert.doesNotMatch(source, /chat_user_name|chat_user_email/);
});

test('readOptionalChatSessionIdFromStorage never creates a session and tolerates missing storage', () => {
  assert.equal(readOptionalChatSessionIdFromStorage(null), undefined);
  assert.equal(readOptionalChatSessionIdFromStorage(undefined), undefined);

  const store = new Map<string, string>();
  const fakeStorage = {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
  };
  assert.equal(readOptionalChatSessionIdFromStorage(fakeStorage), undefined);
  assert.equal(store.size, 0);

  store.set('chat_session_id', 'opaque99');
  assert.equal(readOptionalChatSessionIdFromStorage(fakeStorage), 'opaque99');
  assert.equal(store.has('chat_user_name'), false);
});

test('saveDigitalSystemsReviewLead persists chatSessionId and never touches ChatSession', async () => {
  const calls: Array<{ model: string; data: Record<string, unknown> }> = [];
  const prismaStub = {
    digitalSystemsReviewLead: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: 'digitalSystemsReviewLead', data });
        return {
          id: 42,
          submissionId: data.submissionId,
          notificationStatus: 'pending',
          createdAt: new Date(),
          ...data,
        };
      },
      findUnique: async () => null,
      update: async () => {
        throw new Error('unexpected update');
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

  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    chatSessionId: 'linkabc123',
  });

  const saved = await saveDigitalSystemsReviewLead(
    { prisma: prismaStub as never },
    lead,
  );

  assert.equal(saved.id, 42);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'digitalSystemsReviewLead');
  assert.equal(calls[0].data.chatSessionId, 'linkabc123');
  assert.equal('chatSession' in calls[0].data, false);
});

test('complete approved review payload is required', () => {
  assert.throws(
    () => validateAndNormalizeDigitalSystemsReviewLead({}),
    (error: unknown) => error instanceof DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        name: 'Alex',
        workEmail: 'alex@example.co.uk',
      }),
    (error: unknown) => error instanceof DigitalSystemsReviewValidationError,
  );
});

test('two-field chat identity payload cannot create a DigitalSystemsReviewLead', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        name: 'Chat Visitor',
        email: 'visitor@example.com',
      }),
    (error: unknown) =>
      error instanceof DigitalSystemsReviewValidationError
      && /complete digital systems review request/i.test(error.message),
  );
});

test('operational email includes chat journey reference only when present', () => {
  const withChat = buildDigitalSystemsReviewNotificationEmail(
    validateAndNormalizeDigitalSystemsReviewLead({
      ...completePayload,
      chatSessionId: 'opaquechat1',
    }),
  );
  assert.match(withChat.text, /Chat journey reference: opaquechat1/);
  assert.match(withChat.html, /Chat journey reference/);
  assert.match(withChat.text, /Lead reference:/);
  assert.doesNotMatch(withChat.text, /chat_user_name|appointment|message history/i);

  const withoutChat = buildDigitalSystemsReviewNotificationEmail(
    validateAndNormalizeDigitalSystemsReviewLead(completePayload),
  );
  assert.doesNotMatch(withoutChat.text, /Chat journey reference/);
});
