import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  accessSnapshot,
  isSerializableTransactionConflict,
  runSerializableAccessTransaction,
} from './adminAccessMutation.ts';

test('access audit snapshots whitelist permission fields and exclude credentials', () => {
  const snapshot = accessSnapshot({
    role: 'editor',
    isPlatformOwner: false,
    tenantGrants: [{ tenantId: 'pw-uk' }, { tenantId: 'rrb' }],
    password: 'must-not-leak',
    resetPasswordTokenHash: 'must-not-leak',
  } as {
    role: string;
    isPlatformOwner: boolean;
    tenantGrants: Array<{ tenantId: string }>;
    password: string;
    resetPasswordTokenHash: string;
  });
  assert.deepEqual(snapshot, {
    role: 'editor',
    isPlatformOwner: false,
    tenantIds: ['pw-uk', 'rrb'],
    tenantChatGrants: [
      { tenantId: 'pw-uk', chatRole: 'none', chatRoleExplicit: false },
      { tenantId: 'rrb', chatRole: 'none', chatRoleExplicit: false },
    ],
  });
  assert.doesNotMatch(JSON.stringify(snapshot), /password|token|must-not-leak/i);
});

test('serializable access transactions retry Prisma write conflicts and re-run the guard', async () => {
  let transactionAttempts = 0;
  let guardReads = 0;
  const client = {
    async $transaction<T>(operation: (tx: { ownerCount(): number }) => Promise<T>, options: { isolationLevel: 'Serializable' }) {
      assert.equal(options.isolationLevel, 'Serializable');
      transactionAttempts += 1;
      if (transactionAttempts === 1) throw Object.assign(new Error('write conflict'), { code: 'P2034' });
      return operation({ ownerCount: () => { guardReads += 1; return 1; } });
    },
  };

  const result = await runSerializableAccessTransaction(client, async (tx) =>
    tx.ownerCount() <= 1 ? 'last_owner' : 'updated',
  );

  assert.equal(result, 'last_owner');
  assert.equal(transactionAttempts, 2);
  assert.equal(guardReads, 1);
});

test('non-conflict failures are not retried', async () => {
  let attempts = 0;
  const client = {
    async $transaction() {
      attempts += 1;
      throw new Error('audit insert failed');
    },
  };
  await assert.rejects(
    runSerializableAccessTransaction(client as never, async () => 'unused'),
    /audit insert failed/,
  );
  assert.equal(attempts, 1);
  assert.equal(isSerializableTransactionConflict({ code: 'P2034' }), true);
  assert.equal(isSerializableTransactionConflict({ code: 'P2002' }), false);
});
test('user access routes keep audit writes inside transactions and protect Host-only endpoints', () => {
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.ok(server.includes("app.get('/api/admin/users', requireAdmin, requirePlatformOwner"));
  assert.ok(server.includes("app.get('/api/admin/access-audit', requireAdmin, requirePlatformOwner"));
  assert.ok(server.includes('update = await runSerializableAccessTransaction(prisma'));
  assert.ok(server.includes('const result = await runSerializableAccessTransaction(prisma'));
  assert.ok(server.indexOf("action: 'user_created'") < server.indexOf('details: accessSnapshot(created)'));
  assert.ok(server.includes('before: accessSnapshot(previous)'));
  assert.ok(server.includes('after: accessSnapshot(updated)'));
  assert.ok(server.indexOf("action: 'user_deleted'") < server.indexOf('details: accessSnapshot(target)'));
  assert.ok(server.indexOf('details: accessSnapshot(target)') < server.indexOf('await tx.user.delete'));
  assert.equal(server.includes('details: req.body'), false);
});

test('the additive migration indexes Host checks and retains access audit after user deletion', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'prisma/migrations/20261009190000_admin_tenant_access/migration.sql'),
    'utf8',
  );
  assert.ok(migration.includes('User_isPlatformOwner_idx'));
  assert.ok(migration.includes('UserTenantGrant_userId_fkey'));
  assert.ok(migration.includes('ON DELETE CASCADE'));
  const auditTable = migration.slice(migration.indexOf('AdminAccessAuditLog'));
  assert.equal(auditTable.includes('FOREIGN KEY'), false, 'historical audit rows do not cascade with deleted users');
});