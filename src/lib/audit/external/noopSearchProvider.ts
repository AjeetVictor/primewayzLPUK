import type { SearchPresenceProvider } from './searchPresenceProvider.ts';
import type { AuditSignal, WebPresenceAuditInput } from '../types.ts';

export class NoopSearchPresenceProvider implements SearchPresenceProvider {
  async check(_input: WebPresenceAuditInput): Promise<AuditSignal[]> {
    return [
      {
        key: 'google-search-presence',
        category: 'external-presence',
        status: 'not_verified',
        confidence: 1,
        points: 0,
        maxPoints: 0,
        evidence: [{
          source: 'not_verified',
          label: 'Google Search Presence requires an external search provider.',
        }],
        recommendations: [],
      },
      {
        key: 'bing-search-presence',
        category: 'external-presence',
        status: 'not_verified',
        confidence: 1,
        points: 0,
        maxPoints: 0,
        evidence: [{
          source: 'not_verified',
          label: 'Bing Search Presence requires an external search provider.',
        }],
        recommendations: [],
      },
    ];
  }
}
