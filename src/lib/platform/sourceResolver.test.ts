import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSourceOwnership, resolveSourceContext, SourceResolutionError } from './sourceResolver.ts';

test('resolves exact UK and Infotech origins', () => {
  assert.equal(resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat' }).tenantId, 'pw-uk');
  assert.equal(resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' }).tenantId, 'pw-infotech');
  assert.equal(resolveSourceContext({ origin: 'https://www.primewayz.com', sourceChannel: 'chat' }).tenantId, 'pw-infotech');
  assert.equal(resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat' }).market, 'UK');
  assert.equal(resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' }).market, 'IN');
});

test('rejects unknown origins and browser source spoofing', () => {
  assert.throws(() => resolveSourceContext({ origin: 'https://evil.example', sourceChannel: 'chat' }), SourceResolutionError);
  for (const key of ['tenantId', 'market', 'sourceSite', 'sourceOrigin', 'sourceChannel'] as const) {
    assert.throws(
      () => resolveSourceContext({
        origin: 'https://primewayz.com',
        sourceChannel: 'chat',
        body: { [key]: 'pw-uk' },
      }),
      /controlled by the server/,
    );
  }
});

test('campaignId remains attribution and does not change tenant identity', () => {
  const resolved = resolveSourceContext({
    origin: 'https://primewayz.com',
    sourceChannel: 'contact-form',
    campaignId: 'spring-launch',
    body: { campaignId: 'spring-launch', name: 'Ada' },
  });
  assert.equal(resolved.tenantId, 'pw-infotech');
  assert.equal(resolved.campaignId, 'spring-launch');
});

test('uses validated Host only when Origin is absent and ignores forwardedHost', () => {
  assert.equal(resolveSourceContext({ host: 'uk.primewayz.com:443', sourceChannel: 'contact-form' }).tenantId, 'pw-uk');
  assert.equal(
    resolveSourceContext({
      host: 'primewayz.com',
      forwardedHost: 'uk.primewayz.com',
      sourceChannel: 'contact-form',
    }).tenantId,
    'pw-infotech',
  );
  assert.throws(() => resolveSourceContext({ host: 'unknown.example', sourceChannel: 'contact-form' }), SourceResolutionError);
  assert.throws(
    () => resolveSourceContext({ forwardedHost: 'uk.primewayz.com', sourceChannel: 'contact-form' }),
    SourceResolutionError,
  );
});

test('inactive future markets cannot activate through browser input', () => {
  assert.throws(() => resolveSourceContext({ origin: 'https://us.primewayz.com', sourceChannel: 'chat' }), SourceResolutionError);
  assert.throws(() => resolveSourceContext({ host: 'us.primewayz.com', sourceChannel: 'chat' }), SourceResolutionError);
  assert.throws(
    () => resolveSourceContext({
      origin: 'https://uk.primewayz.com',
      sourceChannel: 'chat',
      body: { tenantId: 'pw-us', market: 'US' },
    }),
    /controlled by the server/,
  );
});

test('prevents tenant switching on an existing parent record', () => {
  const infotech = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' });
  assert.throws(() => assertSourceOwnership('pw-uk', infotech), /different Primewayz entity/);
  assert.doesNotThrow(() => assertSourceOwnership('pw-infotech', infotech));
  assert.doesNotThrow(() => assertSourceOwnership(null, infotech));
});
