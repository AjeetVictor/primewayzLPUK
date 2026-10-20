/**
 * Local files created for chat attachments live under public/uploads/chat.
 * Permanent deletion unlinks only paths that stay inside that directory.
 * Remote URLs and any path that escapes the directory are ignored.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_PREFIX = '/uploads/chat/';

export function chatUploadRoot(cwd = process.cwd()): string {
  return path.resolve(cwd, 'public', 'uploads', 'chat');
}

export function localChatUploadPath(url: string, cwd = process.cwd()): string | null {
  if (!url.startsWith(UPLOAD_PREFIX)) return null;
  const relative = url.slice(UPLOAD_PREFIX.length);
  if (!relative || relative.includes('..') || relative.includes('\\') || relative.startsWith('/')) return null;
  const root = chatUploadRoot(cwd);
  const absolute = path.resolve(root, relative);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  return absolute;
}

/** Best-effort unlink after the database transaction has committed. Missing files are success. */
export async function removePurgedChatUploads(urls: readonly string[], cwd = process.cwd()): Promise<number> {
  let removed = 0;
  for (const url of urls) {
    const absolute = localChatUploadPath(url, cwd);
    if (!absolute) continue;
    try {
      await fs.unlink(absolute);
      removed += 1;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
  return removed;
}
