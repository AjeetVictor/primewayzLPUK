import { normalizeAndValidateUrl } from './normalizeUrl.ts';
import type { FetchedPage } from '../types.ts';

const FETCH_TIMEOUT_MS = 5_000;
const MAX_RESPONSE_BYTES = Math.floor(1.5 * 1024 * 1024);
const MAX_REDIRECTS = 3;
const USER_AGENT = 'PrimewayzUK-WebPresenceAudit/1.0 (+https://uk.primewayz.com)';

type SafeFetchOptions = {
  redirectCount?: number;
  allowNonHtml?: boolean;
};

async function readLimitedBody(response: Response): Promise<{ text: string; bytesRead: number }> {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new Error('Response exceeded the audit size limit.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    const bytes = Buffer.byteLength(text);
    if (bytes > MAX_RESPONSE_BYTES) throw new Error('Response exceeded the audit size limit.');
    return { text, bytesRead: bytes };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('Response exceeded the audit size limit.');
    }
    chunks.push(value);
  }

  const body = chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
  return {
    text: new TextDecoder('utf-8', { fatal: false }).decode(body),
    bytesRead: total,
  };
}

export async function safeFetchPage(rawUrl: string | URL, options: SafeFetchOptions = {}): Promise<FetchedPage> {
  const requestedUrl = rawUrl instanceof URL ? rawUrl.toString() : rawUrl;
  const redirectCount = options.redirectCount || 0;

  if (redirectCount > MAX_REDIRECTS) {
    return {
      requestedUrl,
      finalUrl: requestedUrl,
      status: 0,
      ok: false,
      html: '',
      contentType: '',
      bytesRead: 0,
      error: 'Too many redirects.',
    };
  }

  let url: URL;
  try {
    url = await normalizeAndValidateUrl(requestedUrl);
  } catch (error) {
    return {
      requestedUrl,
      finalUrl: requestedUrl,
      status: 0,
      ok: false,
      html: '',
      contentType: '',
      bytesRead: 0,
      error: error instanceof Error ? error.message : 'The URL was blocked by audit safety checks.',
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: options.allowNonHtml
          ? 'text/html,application/xhtml+xml,text/plain,application/xml,text/xml;q=0.9'
          : 'text/html,application/xhtml+xml;q=0.9',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect response did not include a destination.');
      const destination = new URL(location, url);
      return safeFetchPage(destination, {
        ...options,
        redirectCount: redirectCount + 1,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const allowed =
      /text\/html|application\/xhtml\+xml/i.test(contentType) ||
      (options.allowNonHtml && /text\/plain|application\/xml|text\/xml/i.test(contentType));

    if (!allowed) {
      return {
        requestedUrl,
        finalUrl: url.toString(),
        status: response.status,
        ok: false,
        html: '',
        contentType,
        bytesRead: 0,
        error: 'The response was not a supported text document.',
      };
    }

    const { text, bytesRead } = await readLimitedBody(response);
    return {
      requestedUrl,
      finalUrl: url.toString(),
      status: response.status,
      ok: response.ok,
      html: text,
      contentType,
      bytesRead,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      requestedUrl,
      finalUrl: url.toString(),
      status: 0,
      ok: false,
      html: '',
      contentType: '',
      bytesRead: 0,
      error: error instanceof Error && error.name === 'AbortError'
        ? 'The page timed out.'
        : error instanceof Error
          ? error.message
          : 'The page could not be fetched.',
    };
  } finally {
    clearTimeout(timer);
  }
}
