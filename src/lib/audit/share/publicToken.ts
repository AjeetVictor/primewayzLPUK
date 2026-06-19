import crypto from 'node:crypto';

const TOKEN_PATTERN = /^rpt_[A-Za-z0-9_-]{20,128}$/;

export function createPublicToken(): string {
  return `rpt_${crypto.randomBytes(24).toString('base64url')}`;
}

export function isValidPublicToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}
