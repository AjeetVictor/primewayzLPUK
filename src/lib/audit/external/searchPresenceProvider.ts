import type { AuditSignal, WebPresenceAuditInput } from '../types.ts';

export interface SearchPresenceProvider {
  check(input: WebPresenceAuditInput): Promise<AuditSignal[]>;
}
