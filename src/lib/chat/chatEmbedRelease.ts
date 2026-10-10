/**
 * Serves committed, versioned visitor chat embed releases:
 *   GET /embed/chat/<semver>/pw-chat.js  ->  embed-releases/chat/<semver>/pw-chat.js
 *
 * A release directory is written once and never edited, so hosts can pin the URL with an
 * SRI hash. `Access-Control-Allow-Origin: *` is required for `<script integrity crossorigin>`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';

export const CHAT_EMBED_RELEASE_ROUTE = '/embed/chat/:version/pw-chat.js';

const RELEASE_VERSION_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export function createChatEmbedReleaseHandler(options: { releasesDir: string }) {
  const cache = new Map<string, Buffer>();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const version = req.params.version;
    if (typeof version !== 'string' || !RELEASE_VERSION_PATTERN.test(version)) {
      next();
      return;
    }
    let artifact = cache.get(version);
    if (!artifact) {
      try {
        artifact = await fs.readFile(path.join(options.releasesDir, version, 'pw-chat.js'));
      } catch {
        next();
        return;
      }
      cache.set(version, artifact);
    }
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.status(200).send(artifact);
  };
}
