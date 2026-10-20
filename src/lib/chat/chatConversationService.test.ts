import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  advanceConversationStatus,
  archiveConversation,
  ChatConversationConflictError,
  ChatLifecycleNotFoundError,
  conversationStatusData,
  createTeamReply,
  CONVERSATION_STATUSES,
  isValidConversationStatus,
  purgeConversation,
  reopenConversation,
  resolveConversation,
  restoreConversation,
} from './chatConversationService.ts';
import {
  createMemoryChatConversationStore,
  type MemoryChatState,
  type MemoryChatStoreHooks,
} from './testing/memoryChatConversationStore.ts';

function createState(status = 'bot_replied'): MemoryChatState {
  return {
    sessions: [{ id: 's1', tenantId: 'pw-infotech', status, closedAt: null, closedById: null }],
    messages: [
      { id: 1, sessionId: 's1', sender: 'user', text: 'hi', answered: false, isInternalNote: false, deletedAt: null, editedAt: null, replyToId: null, timestamp: new Date(1) },
      { id: 2, sessionId: 's1', sender: 'bot', text: 'ack', answered: true, isInternalNote: false, deletedAt: null, editedAt: null, replyToId: 1, timestamp: new Date(2) },
    ],
    operatorActions: [],
  };
}

const conflictCode = (code: string) => (err: unknown) => err instanceof ChatConversationConflictError && err.code === code;

async function inTx<T>(state: MemoryChatState, fn: Parameters<ReturnType<typeof createMemoryChatConversationStore>['transaction']>[0], hooks?: MemoryChatStoreHooks) {
  return createMemoryChatConversationStore(state, hooks).transaction(fn) as Promise<T>;
}

test('status vocabulary and status data are unchanged', () => {
  assert.deepEqual([...CONVERSATION_STATUSES], [
    'new', 'bot_replied', 'admin_needed', 'admin_replied', 'lead_qualified', 'follow_up_due', 'booked_call', 'closed', 'spam',
  ]);
  assert.equal(isValidConversationStatus('archived'), false);
  const now = new Date('2026-10-04T10:00:00Z');
  assert.deepEqual(conversationStatusData('closed', { closedById: 3, now }), { status: 'closed', closedAt: now, closedById: 3 });
  assert.deepEqual(conversationStatusData('spam', { now }), { status: 'spam', closedAt: now, closedById: null });
  assert.deepEqual(conversationStatusData('admin_needed', { closedById: 3 }), { status: 'admin_needed', closedAt: null, closedById: null });
});

test('advanceConversationStatus never overwrites closed / spam and never sets a terminal status', async () => {
  for (const terminal of ['closed', 'spam']) {
    const state = createState(terminal);
    const store = createMemoryChatConversationStore(state);
    assert.equal(await advanceConversationStatus(store, 's1', 'admin_needed'), false);
    assert.equal(state.sessions[0].status, terminal);
  }
  const state = createState('lead_qualified');
  const store = createMemoryChatConversationStore(state);
  assert.equal(await advanceConversationStatus(store, 's1', 'bot_replied'), true);
  assert.equal(state.sessions[0].status, 'bot_replied');
  assert.equal(await advanceConversationStatus(store, 's1', 'closed'), false);
  assert.equal(await advanceConversationStatus(store, 'missing', 'bot_replied'), false);
});

test('createTeamReply: non-internal reply stores sender admin, answers visitors, sets admin_replied', async () => {
  const state = createState();
  const result = await inTx<Awaited<ReturnType<typeof createTeamReply>>>(state, async (tx) =>
    createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'hello', isInternalNote: false, replyToId: null, terminalPolicy: 'reject' }));
  assert.equal(result.message.sender, 'admin');
  assert.deepEqual([result.fromStatus, result.toStatus, result.statusChanged], ['bot_replied', 'admin_replied', true]);
  assert.equal(state.messages.find((m) => m.id === 1)!.answered, true);
  assert.equal(state.sessions[0].status, 'admin_replied');
});

test('createTeamReply: internal notes neither answer visitors nor change status', async () => {
  const state = createState();
  await inTx(state, async (tx) =>
    createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'note', isInternalNote: true, replyToId: null, terminalPolicy: 'append_without_status_change' }));
  assert.equal(state.messages.find((m) => m.id === 1)!.answered, false);
  assert.equal(state.sessions[0].status, 'bot_replied');
  assert.equal(state.messages.at(-1)!.isInternalNote, true);
});

test('createTeamReply: reject policy refuses closed / spam without writing anything', async () => {
  for (const terminal of ['closed', 'spam']) {
    const state = createState(terminal);
    const before = JSON.stringify(state);
    await assert.rejects(
      inTx(state, async (tx) => createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'x', isInternalNote: false, replyToId: null, terminalPolicy: 'reject' })),
      conflictCode('conversation_closed'),
    );
    assert.equal(JSON.stringify(state), before);
  }
});

test('concurrency: a close committed between the session read and the status write is never overwritten', async () => {
  const concurrentClose: MemoryChatStoreHooks = {
    before(method, _args, external) {
      if (method === 'updateSessionStatus') external((s) => { s.sessions[0].status = 'closed'; });
    },
  };

  const rejected = createState();
  await assert.rejects(
    inTx(rejected, async (tx) => createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'x', isInternalNote: false, replyToId: null, terminalPolicy: 'reject' }), concurrentClose),
    conflictCode('conversation_closed'),
  );
  assert.equal(rejected.sessions[0].status, 'closed', 'the concurrent close survives');
  assert.equal(rejected.messages.length, 2, 'no message written');
  assert.equal(rejected.messages[0].answered, false, 'visitor messages untouched');

  const appended = createState();
  const result = await inTx<Awaited<ReturnType<typeof createTeamReply>>>(
    appended,
    async (tx) => createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'x', isInternalNote: false, replyToId: null, terminalPolicy: 'append_without_status_change' }),
    concurrentClose,
  );
  assert.equal(result.statusChanged, false);
  assert.equal(appended.sessions[0].status, 'closed', 'UK Admin reply keeps the concurrent close');
});

test('rollback: a failure after the message insert leaves no message, answer flag or status change', async () => {
  const state = createState();
  const before = JSON.stringify(state);
  await assert.rejects(
    inTx(
      state,
      async (tx) => createTeamReply(tx, { session: (await tx.findSession('s1'))!, text: 'x', isInternalNote: false, replyToId: null, terminalPolicy: 'reject' }),
      { before(method) { if (method === 'markVisitorMessagesAnswered') throw new Error('connection reset'); } },
    ),
    /connection reset/,
  );
  assert.equal(JSON.stringify(state), before);
});

test('resolve: non-terminal -> closed, closed is a no-op, spam is rejected', async () => {
  const open = createState('admin_replied');
  const now = new Date('2026-10-04T10:00:00Z');
  const changed = await inTx<Awaited<ReturnType<typeof resolveConversation>>>(open, async (tx) => resolveConversation(tx, { session: (await tx.findSession('s1'))!, now }));
  assert.deepEqual(changed, { changed: true, fromStatus: 'admin_replied', toStatus: 'closed' });
  assert.deepEqual([open.sessions[0].status, open.sessions[0].closedAt, open.sessions[0].closedById], ['closed', now, null]);

  const closed = createState('closed');
  const noop = await inTx<Awaited<ReturnType<typeof resolveConversation>>>(closed, async (tx) => resolveConversation(tx, { session: (await tx.findSession('s1'))! }));
  assert.equal(noop.changed, false);

  const spam = createState('spam');
  await assert.rejects(inTx(spam, async (tx) => resolveConversation(tx, { session: (await tx.findSession('s1'))! })), conflictCode('invalid_transition'));
  assert.equal(spam.sessions[0].status, 'spam');
});

test('resolve: a concurrent spam marking is not converted to closed', async () => {
  const state = createState('bot_replied');
  await assert.rejects(
    inTx(state, async (tx) => resolveConversation(tx, { session: (await tx.findSession('s1'))! }), {
      before(method, _args, external) {
        if (method === 'updateSessionStatus') external((s) => { s.sessions[0].status = 'spam'; });
      },
    }),
    conflictCode('invalid_transition'),
  );
  assert.equal(state.sessions[0].status, 'spam');
});

test('reopen: closed -> admin_needed, repeat is a no-op, spam and open states are rejected', async () => {
  const closed = createState('closed');
  closed.sessions[0].closedAt = new Date(5);
  closed.sessions[0].closedById = 9;
  const first = await inTx<Awaited<ReturnType<typeof reopenConversation>>>(closed, async (tx) => reopenConversation(tx, { session: (await tx.findSession('s1'))! }));
  assert.deepEqual(first, { changed: true, fromStatus: 'closed', toStatus: 'admin_needed' });
  assert.deepEqual([closed.sessions[0].status, closed.sessions[0].closedAt, closed.sessions[0].closedById], ['admin_needed', null, null]);
  const repeat = await inTx<Awaited<ReturnType<typeof reopenConversation>>>(closed, async (tx) => reopenConversation(tx, { session: (await tx.findSession('s1'))! }));
  assert.equal(repeat.changed, false);

  for (const status of ['spam', 'bot_replied', 'admin_replied', 'new']) {
    const state = createState(status);
    await assert.rejects(inTx(state, async (tx) => reopenConversation(tx, { session: (await tx.findSession('s1'))! })), conflictCode('invalid_transition'), status);
    assert.equal(state.sessions[0].status, status);
  }
});

test('archive and restore: keep messages, audit without bodies, restore clears archive', async () => {
  const state = createState('admin_replied');
  state.sessions[0].name = 'Lead';
  state.sessions[0].email = 'lead@example.com';
  const now = new Date('2026-10-19T12:00:00Z');
  const archived = await inTx<Awaited<ReturnType<typeof archiveConversation>>>(state, async (tx) =>
    archiveConversation(tx, { session: (await tx.findSession('s1'))!, actorKind: 'admin', actorId: '7', archivedById: 7, now }));
  assert.equal(archived.changed, true);
  assert.deepEqual([state.sessions[0].archivedAt, state.sessions[0].archivedById], [now, 7]);
  assert.equal(state.messages.length, 2);
  assert.equal(state.lifecycleAudits?.at(-1)?.action, 'archive');
  assert.equal(state.lifecycleAudits?.at(-1)?.messageCount, null);

  const repeat = await inTx<Awaited<ReturnType<typeof archiveConversation>>>(state, async (tx) =>
    archiveConversation(tx, { session: (await tx.findSession('s1'))!, actorKind: 'admin', actorId: '7' }));
  assert.equal(repeat.changed, false);

  const restored = await inTx<Awaited<ReturnType<typeof restoreConversation>>>(state, async (tx) =>
    restoreConversation(tx, { session: (await tx.findSession('s1'))!, actorKind: 'wordpress_integration', actorId: 'wp:1' }));
  assert.equal(restored.changed, true);
  assert.deepEqual([state.sessions[0].archivedAt, state.sessions[0].archivedById], [null, null]);
  assert.equal(state.lifecycleAudits?.at(-1)?.action, 'restore');
});

test('purge: removes message content, retains lead identity, rejects cross-tenant and already-purged', async () => {
  const state = createState('closed');
  state.sessions[0].name = 'Lead';
  state.sessions[0].email = 'lead@example.com';
  state.sessions[0].phone = '+440000';
  state.attachments = [{ id: 1, sessionId: 's1', url: '/uploads/chat/a.png' }];
  state.appointments = [{ id: 1, sessionId: 's1', message: 'please call', name: 'Lead', email: 'lead@example.com' }];
  const now = new Date('2026-10-19T13:00:00Z');
  const purged = await inTx<Awaited<ReturnType<typeof purgeConversation>>>(state, async (tx) =>
    purgeConversation(tx, { session: (await tx.findSession('s1'))!, actorKind: 'admin', actorId: '1', now }));
  assert.equal(purged.changed, true);
  assert.equal(purged.toStatus, 'purged');
  assert.deepEqual(purged.snapshot, {
    messageCount: 2,
    attachmentCount: 1,
    appointmentCount: 1,
    leadRetained: true,
    attachmentUrls: ['/uploads/chat/a.png'],
  });
  assert.equal(state.messages.length, 0);
  assert.equal(state.attachments?.length, 0);
  assert.equal(state.appointments?.[0].message, null);
  assert.deepEqual([state.sessions[0].name, state.sessions[0].email, state.sessions[0].phone, state.sessions[0].purgedAt], ['Lead', 'lead@example.com', '+440000', now]);
  assert.equal(state.lifecycleAudits?.at(-1)?.action, 'delete');
  assert.equal(state.lifecycleAudits?.at(-1)?.messageCount, 2);

  await assert.rejects(
    inTx(state, async (tx) => purgeConversation(tx, { session: (await tx.findSession('s1'))!, actorKind: 'admin', actorId: '1' })),
    (err: unknown) => err instanceof ChatLifecycleNotFoundError,
  );

  const foreign = createState('admin_replied');
  foreign.sessions[0].tenantId = 'pw-uk';
  await assert.rejects(
    inTx(foreign, async (tx) => purgeConversation(tx, {
      session: { ...(await tx.findSession('s1'))!, tenantId: 'pw-infotech' },
      actorKind: 'admin',
      actorId: '1',
    })),
    (err: unknown) => err instanceof ChatLifecycleNotFoundError,
  );
  assert.equal(foreign.messages.length, 2);
});

// --- server.ts wiring ---

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('server uses the shared conditional transition for automatic status updates and has no read-then-write path', () => {
  const server = read('server.ts');
  assert.match(server, /async function autoUpdateConversationStatus\(sessionId: string, status: ConversationStatus\) \{\s*await advanceConversationStatus\(chatConversationStore, sessionId, status\);\s*\}/);
  assert.doesNotMatch(server, /TERMINAL_CONVERSATION_STATUSES\.has/);
  assert.doesNotMatch(server, /async function updateConversationStatus\(/);
  assert.match(server, /const chatConversationStore = createPrismaChatConversationStore\(prisma, \{ messageInclude: chatMessageInclude \}\)/);
});

test('Prisma conversation store: locking session read in transactions, conditional status writes, no attribution writes', () => {
  const store = read('src/lib/chat/chatConversationPrismaStore.ts');
  assert.match(store, /FOR UPDATE/);
  assert.match(store, /chatSession\.updateMany\(/);
  assert.doesNotMatch(store, /chatSession\.(update|upsert|create)\(/);
  assert.doesNotMatch(store, /sourceSite|sourceOrigin|sourceChannel|market/);
  assert.match(store, /transaction: \(fn\) => prisma\.\$transaction\(\(tx\) => fn\(methods\(tx, true\)\)\)/);
});
