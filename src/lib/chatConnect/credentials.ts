import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_ID_PATTERN = /^cck_[a-f0-9]{32}$/;
const SECRET_PATTERN = /^ccs_[A-Za-z0-9_-]{43}$/;
const PRESENTED_PATTERN = /^(cck_[a-f0-9]{32})\.(ccs_[A-Za-z0-9_-]{43})$/;
const BEARER_PATTERN = /^Bearer[ \t]+([A-Za-z0-9._~+/=_-]{16,256})[ \t]*$/i;

const DUMMY_HASH = createHash('sha256').update('chat-connect-unbound-credential', 'utf8').digest();

export type IssuedInstallationCredential = {
  keyId: string;
  secret: string;
  hash: string;
};

export function issueInstallationCredential(installationId: string): IssuedInstallationCredential {
  const keyId = `cck_${randomBytes(16).toString('hex')}`;
  const secret = `ccs_${randomBytes(32).toString('base64url')}`;
  return { keyId, secret, hash: hashInstallationSecret(installationId, secret) };
}

export function hashInstallationSecret(installationId: string, secret: string): string {
  return createHash('sha256').update(`${installationId}\0${secret}`, 'utf8').digest('hex');
}

/** Constant-time check that the secret belongs to this installation. */
export function verifyInstallationSecret(installationId: string, secret: string, hash: string | null): boolean {
  const computed = createHash('sha256').update(`${installationId}\0${secret}`, 'utf8').digest();
  const stored = hash && /^[a-f0-9]{64}$/.test(hash) ? Buffer.from(hash, 'hex') : null;
  const comparable = stored && stored.length === computed.length;
  const matches = timingSafeEqual(comparable ? stored! : DUMMY_HASH, comparable ? computed : DUMMY_HASH);
  return Boolean(comparable && matches);
}

export function parseInstallationBearer(header: string | undefined | null): { keyId: string; secret: string } | null {
  if (typeof header !== 'string' || header.length > 512) return null;
  const match = BEARER_PATTERN.exec(header);
  const token = match?.[1];
  if (!token) return null;
  const parts = PRESENTED_PATTERN.exec(token);
  if (!parts) return null;
  const keyId = parts[1];
  const secret = parts[2];
  if (!keyId || !secret || !KEY_ID_PATTERN.test(keyId) || !SECRET_PATTERN.test(secret)) return null;
  return { keyId, secret };
}
