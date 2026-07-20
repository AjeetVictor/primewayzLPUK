import crypto from 'node:crypto';

const SAFE_CORRELATION_ID = /^[a-zA-Z0-9_-]{8,128}$/;

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function resolveCorrelationId(headerValue?: string): string {
  if (typeof headerValue === 'string') {
    const trimmed = headerValue.trim();
    if (SAFE_CORRELATION_ID.test(trimmed)) {
      return trimmed;
    }
  }
  return createCorrelationId();
}
