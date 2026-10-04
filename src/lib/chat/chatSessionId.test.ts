import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHAT_SESSION_ID_INVALID_CODE,
  generateChatSessionId,
  isStrongChatSessionId,
  shouldReplaceRejectedChatSessionId,
} from './chatSessionId.ts';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('generateChatSessionId uses crypto.randomUUID when available', () => {
  const id = generateChatSessionId({ randomUUID: () => '3F2504E0-4F89-41D3-9A0C-0305E82C3301' });
  assert.equal(id, '3f2504e0-4f89-41d3-9a0c-0305e82c3301');
});

test('generateChatSessionId falls back to crypto.getRandomValues with UUID v4 bits', () => {
  const id = generateChatSessionId({
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      (array as unknown as Uint8Array).fill(0xff);
      return array;
    },
  });
  assert.equal(id, 'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.match(id, UUID_V4);
});

test('generateChatSessionId with the platform crypto never uses Math.random', () => {
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('Math.random must not be used for chat session ids');
  };
  try {
    const ids = new Set(Array.from({ length: 50 }, () => generateChatSessionId()));
    assert.equal(ids.size, 50);
    for (const id of ids) assert.match(id, UUID_V4);
  } finally {
    Math.random = originalRandom;
  }
});

test('generateChatSessionId refuses to generate without a secure random source', () => {
  assert.throws(() => generateChatSessionId({}), /Secure random generation is unavailable/);
});

test('isStrongChatSessionId accepts UUID v4 only', () => {
  assert.equal(isStrongChatSessionId('3f2504e0-4f89-41d3-9a0c-0305e82c3301'), true);
  assert.equal(isStrongChatSessionId('3F2504E0-4F89-41D3-9A0C-0305E82C3301'), true);
  assert.equal(isStrongChatSessionId('k3j9x2'), false);
  assert.equal(isStrongChatSessionId('6ba7b810-9dad-11d1-80b4-00c04fd430c8'), false, 'UUID v1 is time-based');
  assert.equal(isStrongChatSessionId(''), false);
  assert.equal(isStrongChatSessionId(undefined), false);
});

test('only an unknown weak id rejected with session_id_invalid is replaced', () => {
  const invalid = { error: 'Invalid chat session identifier.', code: CHAT_SESSION_ID_INVALID_CODE };
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 400, invalid), true);
  assert.equal(
    shouldReplaceRejectedChatSessionId('3f2504e0-4f89-41d3-9a0c-0305e82c3301', 400, invalid),
    false,
    'strong ids are never rotated (prevents retry loops)',
  );
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 429, { code: 'rate_limited' }), false);
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 500, invalid), false);
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 503, { unavailable: true }), false);
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 403, { error: 'different platform entity' }), false);
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 400, { code: 'invalid_input' }), false);
  assert.equal(shouldReplaceRejectedChatSessionId('k3j9x2', 400, null), false);
});
