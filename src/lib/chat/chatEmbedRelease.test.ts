import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { CHAT_EMBED_RELEASE_ROUTE, createChatEmbedReleaseHandler } from './chatEmbedRelease.ts';

const ARTIFACT = '(()=>{"use strict";window.__pwChatTest=1;})();\n';
let server: Server;
let base: string;
let releasesDir: string;

before(async () => {
  releasesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chat-releases-'));
  fs.mkdirSync(path.join(releasesDir, '1.1.0'));
  fs.writeFileSync(path.join(releasesDir, '1.1.0', 'pw-chat.js'), ARTIFACT);
  const app = express();
  app.get(CHAT_EMBED_RELEASE_ROUTE, createChatEmbedReleaseHandler({ releasesDir }));
  app.use((_req, res) => res.status(404).send('fallthrough'));
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  fs.rmSync(releasesDir, { recursive: true, force: true });
});

test('release route serves the exact committed bytes with SRI-compatible headers', async () => {
  const res = await fetch(`${base}/embed/chat/1.1.0/pw-chat.js`, { headers: { Origin: 'https://silver-preview.example.test' } });
  assert.equal(res.status, 200);
  const body = Buffer.from(await res.arrayBuffer());
  assert.equal(body.toString('utf8'), ARTIFACT);
  const expected = `sha384-${createHash('sha384').update(ARTIFACT).digest('base64')}`;
  assert.equal(`sha384-${createHash('sha384').update(body).digest('base64')}`, expected);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('content-type') ?? '', /^application\/javascript/);
  assert.equal(res.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(res.headers.get('set-cookie'), null);
});

test('release route falls through for unknown or malformed versions and path traversal', async () => {
  for (const pathname of [
    '/embed/chat/9.9.9/pw-chat.js',
    '/embed/chat/latest/pw-chat.js',
    '/embed/chat/1.1/pw-chat.js',
    '/embed/chat/..%2F..%2Fpackage.json/pw-chat.js',
    '/embed/chat/1.1.0/other.js',
  ]) {
    const res = await fetch(`${base}${pathname}`);
    assert.equal(res.status, 404, pathname);
    assert.equal(await res.text(), 'fallthrough', pathname);
  }
});
