import { PrismaClient } from '@prisma/client';
import { runSerializableAccessTransaction } from '../src/lib/admin/adminAccessMutation.ts';

const APPROVAL_PHRASE = 'I_APPROVE_FIRST_HOST_BOOTSTRAP';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = argument('--email')?.trim().toLowerCase();
const approval = argument('--approval');
const execute = process.argv.includes('--execute');

if (!email || !email.includes('@')) {
  throw new Error('Provide the exact reviewed existing account with --email <address>.');
}
if (!execute) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    targetEmail: email,
    requiredApproval: APPROVAL_PHRASE,
    nextStep: 'Re-run with --execute and the exact --approval phrase after peer review.',
  }, null, 2));
  process.exit(0);
}
if (approval !== APPROVAL_PHRASE) {
  throw new Error('Explicit operator approval is required; the approval phrase did not match.');
}

const prisma = new PrismaClient();

try {
  const result = await runSerializableAccessTransaction(prisma, async (tx) => {
    const existingOwnerCount = await tx.user.count({ where: { isPlatformOwner: true } });
    if (existingOwnerCount > 0) return { status: 'owner_exists' as const, existingOwnerCount };

    const target = await tx.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, isPlatformOwner: true },
    });
    if (!target) return { status: 'target_missing' as const };
    if (target.isPlatformOwner) return { status: 'already_owner' as const, targetUserId: target.id };

    await tx.user.update({
      where: { id: target.id },
      data: { isPlatformOwner: true },
    });
    await tx.adminAccessAuditLog.create({
      data: {
        actorUserId: target.id,
        targetUserId: target.id,
        action: 'first_host_bootstrapped',
        details: {
          method: 'reviewed_cli_bootstrap',
          previousIsPlatformOwner: false,
          isPlatformOwner: true,
        },
      },
    });
    return { status: 'bootstrapped' as const, targetUserId: target.id, targetEmail: target.email };
  });

  if (result.status === 'owner_exists') {
    throw new Error('Bootstrap refused: a Host/Owner already exists. Use the audited Host UI for changes.');
  }
  if (result.status === 'target_missing') {
    throw new Error('Bootstrap refused: the exact reviewed account does not exist.');
  }
  if (result.status === 'already_owner') {
    throw new Error('Bootstrap refused: the reviewed account is already a Host/Owner.');
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}