import type { AuditContext } from '../types.ts';
import { extractHeadReadiness } from '../extractors/headReadinessSignals.ts';
import { extractMobileReadiness } from '../extractors/mobileReadinessSignals.ts';
import { extractSiteClassification } from '../extractors/siteClassification.ts';

export function buildAuditDiagnostics(context: AuditContext) {
  return {
    classification: extractSiteClassification(context),
    mobileReadiness: extractMobileReadiness(context),
    headReadiness: extractHeadReadiness(context),
  };
}
