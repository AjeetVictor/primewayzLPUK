import { validationError } from './apiErrors.ts';

export const AUTOPILOT_MAX_TITLE_LENGTH = 200;
export const AUTOPILOT_MAX_KEYWORD_LENGTH = 120;
export const AUTOPILOT_MAX_REASON_LENGTH = 2000;
export const AUTOPILOT_MAX_USER_PROBLEM_LENGTH = 5000;
export const AUTOPILOT_MAX_AUDIENCE_LENGTH = 500;
export const AUTOPILOT_MAX_LOCATION_LENGTH = 120;
export const AUTOPILOT_MAX_SLUG_LENGTH = 200;
export const AUTOPILOT_MAX_DISPLAY_NAME_LENGTH = 200;
export const AUTOPILOT_MAX_MARKET_LENGTH = 120;
export const AUTOPILOT_MAX_LANGUAGE_LENGTH = 32;
export const AUTOPILOT_MAX_SOURCE_LENGTH = 64;
export const AUTOPILOT_MAX_CATEGORY_LENGTH = 120;
export const AUTOPILOT_MAX_ENTITY_ID_LENGTH = 64;
export const AUTOPILOT_MAX_CORRELATION_ID_LENGTH = 128;

export const AUTOPILOT_DECISION_ACTIONS = [
  'submit',
  'approve',
  'reject',
  'defer',
  'needs_more_research',
] as const;

export type AutopilotDecisionAction = (typeof AUTOPILOT_DECISION_ACTIONS)[number];

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePositiveIntId(value: unknown): number {
  const raw =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : NaN;

  if (!Number.isInteger(raw) || raw < 1) {
    throw validationError('Invalid positive integer id.', { field: 'id', value });
  }

  return raw;
}

export function parsePagination(
  query: Record<string, unknown> | null | undefined,
  options?: { defaultLimit?: number; maxLimit?: number },
): { limit: number; offset: number } {
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;
  const source = query ?? {};

  let limit = defaultLimit;
  if (source.limit !== undefined && source.limit !== null && source.limit !== '') {
    const parsed =
      typeof source.limit === 'number'
        ? source.limit
        : Number.parseInt(String(source.limit), 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw validationError('Invalid pagination limit.', { field: 'limit' });
    }
    limit = Math.min(parsed, maxLimit);
  }

  let offset = 0;
  if (source.offset !== undefined && source.offset !== null && source.offset !== '') {
    const parsed =
      typeof source.offset === 'number'
        ? source.offset
        : Number.parseInt(String(source.offset), 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw validationError('Invalid pagination offset.', { field: 'offset' });
    }
    offset = parsed;
  }

  return { limit, offset };
}

export function requireNonEmptyString(
  value: unknown,
  field: string,
  maxLen: number,
): string {
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a non-empty string.`, { field });
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError(`${field} must be a non-empty string.`, { field });
  }
  if (trimmed.length > maxLen) {
    throw validationError(`${field} exceeds maximum length of ${maxLen}.`, {
      field,
      maxLen,
    });
  }
  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  maxLen: number,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`, { field });
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length > maxLen) {
    throw validationError(`${field} exceeds maximum length of ${maxLen}.`, {
      field,
      maxLen,
    });
  }
  return trimmed;
}

export function parseStringArray(
  value: unknown,
  field: string,
  options?: { maxItems?: number; maxItemLen?: number },
): string[] {
  const maxItems = options?.maxItems ?? 50;
  const maxItemLen = options?.maxItemLen ?? 200;

  if (value === undefined || value === null) {
    return [];
  }

  let items: unknown[];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    items = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  } else {
    throw validationError(`${field} must be a string array.`, { field });
  }

  if (items.length > maxItems) {
    throw validationError(`${field} exceeds maximum of ${maxItems} items.`, {
      field,
      maxItems,
    });
  }

  const result: string[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (typeof item !== 'string') {
      throw validationError(`${field}[${index}] must be a string.`, {
        field,
        index,
      });
    }
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.length > maxItemLen) {
      throw validationError(
        `${field}[${index}] exceeds maximum length of ${maxItemLen}.`,
        { field, index, maxItemLen },
      );
    }
    result.push(trimmed);
  }

  return result;
}

export function assertNoPrototypePollution(
  obj: unknown,
  maxDepth = 8,
  depth = 0,
): void {
  if (depth > maxDepth) {
    throw validationError('Object exceeds maximum nesting depth.', {
      maxDepth,
    });
  }

  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      assertNoPrototypePollution(item, maxDepth, depth + 1);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) {
      throw validationError('Prototype pollution keys are not allowed.', {
        key,
      });
    }
    assertNoPrototypePollution(obj[key], maxDepth, depth + 1);
  }
}

export function assertJsonDepth(value: unknown, maxDepth = 8, depth = 0): void {
  if (depth > maxDepth) {
    throw validationError('JSON exceeds maximum nesting depth.', { maxDepth });
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      assertJsonDepth(item, maxDepth, depth + 1);
    }
    return;
  }

  if (isPlainObject(value)) {
    for (const nested of Object.values(value)) {
      assertJsonDepth(nested, maxDepth, depth + 1);
    }
  }
}

export function parseDecisionAction(value: unknown): AutopilotDecisionAction {
  if (
    typeof value !== 'string' ||
    !AUTOPILOT_DECISION_ACTIONS.includes(value as AutopilotDecisionAction)
  ) {
    throw validationError('Invalid decision action.', {
      field: 'action',
      allowed: AUTOPILOT_DECISION_ACTIONS,
    });
  }
  return value as AutopilotDecisionAction;
}

export function rejectUnknownKeys(
  body: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  if (!isPlainObject(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw validationError('Unknown fields are not allowed.', {
      unknown,
      allowed: allowedKeys,
    });
  }
}

export function emptyPatchGuard(body: unknown): asserts body is Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw validationError('Request body must be a JSON object.');
  }
  if (Object.keys(body).length === 0) {
    throw validationError('Patch body must include at least one field.');
  }
}
