/**
 * Host-supplied runtime configuration for the embeddable visitor chat.
 *
 * `siteKey` is client presentation configuration only. Source identity
 * (tenant, market, site, channel) is resolved by the backend from the request
 * Origin and is never read from, or sent by, this widget.
 */

import type { VisitorChatRouteContextConfig } from '../../lib/chat/visitorChatContext.ts';

export const PW_CHAT_CONFIG_ELEMENT_ID = 'pwi-chat-config';

export type PwChatStorageKeys = {
  sessionId: string;
  visitorName: string;
  visitorEmail: string;
  panelOpen: string;
  openTracked: string;
  firstLanding: string;
};

export const DEFAULT_PW_CHAT_STORAGE_KEYS: PwChatStorageKeys = {
  sessionId: 'primewayz_chat_session_id',
  visitorName: 'primewayz_chat_visitor_name',
  visitorEmail: 'primewayz_chat_visitor_email',
  panelOpen: 'primewayz_chat_panel_open',
  openTracked: 'primewayz_chat_open_tracked',
  firstLanding: 'primewayz_chat_first_landing',
};

export type PwChatIntentConfig = { key: string; label: string };

export type PwChatPageContext = { greeting: string; supportingText: string };

export type PwChatEmbedConfig = {
  apiBaseUrl: string;
  siteKey: string;
  siteName: string;
  pageUrl: string | null;
  pageType: string | null;
  isFrontPage: boolean;
  storageKeys: PwChatStorageKeys;
  pageContext: PwChatPageContext | null;
  contexts: VisitorChatRouteContextConfig[];
  intents: PwChatIntentConfig[];
};

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const STORAGE_KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,100}$/;
const MAX_INTENTS = 6;
const MAX_CONTEXTS = 30;
const MAX_CONTEXT_PATHS = 20;

type Json = Record<string, unknown>;

function isPlainObject(value: unknown): value is Json {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** https only, except plain http on localhost for development. No credentials, query or hash. */
export function normalizeApiBaseUrl(value: unknown): string | null {
  const raw = boundedString(value, 300);
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const secure = url.protocol === 'https:';
  const localDev = url.protocol === 'http:' && isLocalDevHost(url.hostname);
  if (!secure && !localDev) return null;
  if (url.username || url.password || url.search || url.hash) return null;
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

function normalizePageUrl(value: unknown): string | null {
  const raw = boundedString(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function parseStorageKeys(value: unknown): PwChatStorageKeys {
  const keys = { ...DEFAULT_PW_CHAT_STORAGE_KEYS };
  if (!isPlainObject(value)) return keys;
  for (const name of Object.keys(keys) as (keyof PwChatStorageKeys)[]) {
    const candidate = value[name];
    if (typeof candidate === 'string' && STORAGE_KEY_PATTERN.test(candidate)) {
      keys[name] = candidate;
    }
  }
  return keys;
}

function parsePageContext(value: unknown): PwChatPageContext | null {
  if (!isPlainObject(value)) return null;
  const greeting = boundedString(value.greeting, 200);
  if (!greeting) return null;
  return { greeting, supportingText: boundedString(value.supportingText, 400) ?? '' };
}

function parsePathList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_CONTEXT_PATHS)
    .map((item) => boundedString(item, 300))
    .filter((item): item is string => Boolean(item && item.startsWith('/')));
}

function parseContexts(value: unknown): VisitorChatRouteContextConfig[] {
  if (!Array.isArray(value)) return [];
  const contexts: VisitorChatRouteContextConfig[] = [];
  for (const item of value.slice(0, MAX_CONTEXTS)) {
    if (!isPlainObject(item)) continue;
    const key = typeof item.key === 'string' && KEY_PATTERN.test(item.key) ? item.key : null;
    const greeting = boundedString(item.greeting, 200);
    if (!key || !greeting) continue;
    const paths = parsePathList(item.paths);
    const pathPrefixes = parsePathList(item.pathPrefixes);
    if (paths.length === 0 && pathPrefixes.length === 0) continue;
    contexts.push({
      key,
      greeting,
      supportingText: boundedString(item.supportingText, 400) ?? '',
      paths,
      pathPrefixes,
    });
  }
  return contexts;
}

function parseIntents(value: unknown): PwChatIntentConfig[] {
  if (!Array.isArray(value)) return [];
  const intents: PwChatIntentConfig[] = [];
  for (const item of value) {
    if (intents.length >= MAX_INTENTS) break;
    if (!isPlainObject(item)) continue;
    const key = typeof item.key === 'string' && KEY_PATTERN.test(item.key) ? item.key : null;
    const label = boundedString(item.label, 80);
    if (key && label && !intents.some((intent) => intent.key === key)) {
      intents.push({ key, label });
    }
  }
  return intents;
}

/** Returns null for missing or malformed required fields; optional malformed fields are dropped. */
export function parsePwChatConfig(raw: unknown): PwChatEmbedConfig | null {
  if (!isPlainObject(raw)) return null;
  const apiBaseUrl = normalizeApiBaseUrl(raw.apiBaseUrl);
  const siteKey =
    typeof raw.siteKey === 'string' && KEY_PATTERN.test(raw.siteKey) ? raw.siteKey : null;
  if (!apiBaseUrl || !siteKey) return null;

  const pageType = typeof raw.pageType === 'string' && KEY_PATTERN.test(raw.pageType)
    ? raw.pageType
    : null;

  return {
    apiBaseUrl,
    siteKey,
    siteName: boundedString(raw.siteName, 80) ?? 'Primewayz',
    pageUrl: normalizePageUrl(raw.pageUrl),
    pageType,
    isFrontPage: raw.isFrontPage === true,
    storageKeys: parseStorageKeys(raw.storageKeys),
    pageContext: parsePageContext(raw.pageContext),
    contexts: parseContexts(raw.contexts),
    intents: parseIntents(raw.intents),
  };
}

export function readPwChatConfig(doc: Document): PwChatEmbedConfig | null {
  const element = doc.getElementById(PW_CHAT_CONFIG_ELEMENT_ID);
  if (!element || element.tagName.toLowerCase() !== 'script') return null;
  try {
    return parsePwChatConfig(JSON.parse(element.textContent || ''));
  } catch {
    return null;
  }
}
