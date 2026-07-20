/**
 * AES-256-GCM encryption for Google Search Console refresh tokens.
 * Never log plaintext tokens or key material.
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

export const GSC_TOKEN_AAD = Buffer.from('primewayz-autopilot-gsc-refresh-token:v1', 'utf8');
export const GSC_TOKEN_KEY_VERSION = 1;
export const GSC_TOKEN_IV_BYTES = 12;
export const GSC_TOKEN_KEY_BYTES = 32;

export type EncryptedGscRefreshToken = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

export class GscCryptoError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GscCryptoError';
    this.code = code;
  }
}

function decodeEncryptionKey(raw: string | undefined | null): Buffer {
  if (raw == null || typeof raw !== 'string' || !raw.trim()) {
    throw new GscCryptoError(
      'GSC_ENCRYPTION_KEY_INVALID',
      'AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY is missing or empty.',
    );
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw.trim(), 'base64');
  } catch {
    throw new GscCryptoError(
      'GSC_ENCRYPTION_KEY_INVALID',
      'AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY is not valid base64.',
    );
  }

  if (key.length !== GSC_TOKEN_KEY_BYTES) {
    throw new GscCryptoError(
      'GSC_ENCRYPTION_KEY_INVALID',
      'AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.',
    );
  }

  return key;
}

export function resolveGscEncryptionKeyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): Buffer {
  return decodeEncryptionKey(env.AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY);
}

export function encryptGscRefreshToken(
  token: string,
  key: Buffer = resolveGscEncryptionKeyFromEnv(),
): EncryptedGscRefreshToken {
  if (typeof token !== 'string' || token.length === 0) {
    throw new GscCryptoError('GSC_TOKEN_EMPTY', 'Refresh token must be a non-empty string.');
  }
  if (key.length !== GSC_TOKEN_KEY_BYTES) {
    throw new GscCryptoError(
      'GSC_ENCRYPTION_KEY_INVALID',
      'Encryption key must be exactly 32 bytes.',
    );
  }

  const iv = randomBytes(GSC_TOKEN_IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(GSC_TOKEN_AAD);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion: GSC_TOKEN_KEY_VERSION,
  };
}

export function decryptGscRefreshToken(
  payload: {
    ciphertext: string;
    iv: string;
    authTag: string;
    keyVersion?: number;
  },
  key: Buffer = resolveGscEncryptionKeyFromEnv(),
): string {
  if (key.length !== GSC_TOKEN_KEY_BYTES) {
    throw new GscCryptoError(
      'GSC_ENCRYPTION_KEY_INVALID',
      'Encryption key must be exactly 32 bytes.',
    );
  }

  const ciphertextB64 = payload?.ciphertext;
  const ivB64 = payload?.iv;
  const tagB64 = payload?.authTag;

  if (
    typeof ciphertextB64 !== 'string' ||
    !ciphertextB64 ||
    typeof ivB64 !== 'string' ||
    !ivB64 ||
    typeof tagB64 !== 'string' ||
    !tagB64
  ) {
    throw new GscCryptoError('GSC_TOKEN_PAYLOAD_INVALID', 'Encrypted token payload is incomplete.');
  }

  let ciphertext: Buffer;
  let iv: Buffer;
  let authTag: Buffer;
  try {
    ciphertext = Buffer.from(ciphertextB64, 'base64');
    iv = Buffer.from(ivB64, 'base64');
    authTag = Buffer.from(tagB64, 'base64');
  } catch {
    throw new GscCryptoError('GSC_TOKEN_PAYLOAD_INVALID', 'Encrypted token payload is malformed.');
  }

  if (iv.length !== GSC_TOKEN_IV_BYTES || authTag.length === 0 || ciphertext.length === 0) {
    throw new GscCryptoError('GSC_TOKEN_PAYLOAD_INVALID', 'Encrypted token payload is malformed.');
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(GSC_TOKEN_AAD);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new GscCryptoError(
      'GSC_TOKEN_DECRYPT_FAILED',
      'Unable to decrypt refresh token (integrity check failed).',
    );
  }
}

/** Constant-time compare for tests / helpers — does not expose contents. */
export function buffersEqualSafe(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
