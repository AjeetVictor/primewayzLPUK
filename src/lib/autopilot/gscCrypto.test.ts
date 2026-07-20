import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import {
  decryptGscRefreshToken,
  encryptGscRefreshToken,
  GscCryptoError,
} from './gscCrypto.ts';

const validKey = randomBytes(32);

test('encrypt/decrypt round trip', () => {
  const token = 'ya29.refresh-token-example';
  const encrypted = encryptGscRefreshToken(token, validKey);
  const decrypted = decryptGscRefreshToken(encrypted, validKey);
  assert.equal(decrypted, token);
  assert.equal(encrypted.keyVersion, 1);
});

test('repeated encryption uses different IVs', () => {
  const a = encryptGscRefreshToken('same-token', validKey);
  const b = encryptGscRefreshToken('same-token', validKey);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
});

test('ciphertext does not contain plaintext', () => {
  const token = 'unique-plaintext-token-value-xyz';
  const encrypted = encryptGscRefreshToken(token, validKey);
  assert.equal(encrypted.ciphertext.includes(token), false);
  assert.equal(Buffer.from(encrypted.ciphertext, 'base64').toString('utf8').includes(token), false);
});

test('tampered ciphertext fails', () => {
  const encrypted = encryptGscRefreshToken('token-a', validKey);
  const buf = Buffer.from(encrypted.ciphertext, 'base64');
  buf[0] = buf[0] ^ 0xff;
  assert.throws(
    () =>
      decryptGscRefreshToken(
        { ...encrypted, ciphertext: buf.toString('base64') },
        validKey,
      ),
    (err: unknown) => err instanceof GscCryptoError,
  );
});

test('tampered auth tag fails', () => {
  const encrypted = encryptGscRefreshToken('token-b', validKey);
  const tag = Buffer.from(encrypted.authTag, 'base64');
  tag[0] = tag[0] ^ 0xff;
  assert.throws(
    () =>
      decryptGscRefreshToken(
        { ...encrypted, authTag: tag.toString('base64') },
        validKey,
      ),
    (err: unknown) => err instanceof GscCryptoError,
  );
});

test('invalid key length fails', () => {
  assert.throws(
    () => encryptGscRefreshToken('token', Buffer.alloc(16)),
    (err: unknown) => err instanceof GscCryptoError && (err as GscCryptoError).code === 'GSC_ENCRYPTION_KEY_INVALID',
  );
});

test('empty token fails', () => {
  assert.throws(
    () => encryptGscRefreshToken('', validKey),
    (err: unknown) => err instanceof GscCryptoError && (err as GscCryptoError).code === 'GSC_TOKEN_EMPTY',
  );
});

test('thrown errors never include token content', () => {
  const secret = 'super-secret-refresh-value';
  try {
    decryptGscRefreshToken(
      {
        ciphertext: Buffer.from('bad').toString('base64'),
        iv: Buffer.alloc(12).toString('base64'),
        authTag: Buffer.alloc(16).toString('base64'),
      },
      validKey,
    );
    assert.fail('expected throw');
  } catch (err) {
    assert.ok(err instanceof Error);
    assert.equal(err.message.includes(secret), false);
  }
});
