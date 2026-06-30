import crypto from 'node:crypto';

export function createPublicToken(): string {
  return `rpt_${crypto.randomBytes(24).toString('base64url')}`;
}
