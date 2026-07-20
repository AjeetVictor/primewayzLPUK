import {
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes.ts';
import {
  LIVE_INSIGHTS_PATHS,
  getValidatedLegacyBlogRedirects,
} from '../../data/blog/legacyRedirects.ts';
import type { PrismaLike } from './activityLogService.ts';
import {
  checkAutopilotSlugReservation,
  normaliseAutopilotSlugCandidate,
} from './slugReservation.ts';

export type AutopilotSlugAdvisory = {
  proposedSlug: string | null;
  normalisedSlug: string;
  blocking: ReturnType<typeof checkAutopilotSlugReservation>;
  caseInsensitiveWarning?: {
    conflict: true;
    conflictSource: string;
    conflictValue: string;
    message: string;
  };
  candidateTopicWarning?: {
    conflictTopicIds: number[];
    message: string;
  };
};

const SDAAS_INSIGHT_PATHS = [
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_USE_CASES_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
] as const;

function collectKnownReservedPaths(): string[] {
  const reserved: string[] = [...LIVE_INSIGHTS_PATHS, ...SDAAS_INSIGHT_PATHS];
  for (const entry of getValidatedLegacyBlogRedirects()) {
    reserved.push(entry.from);
    reserved.push(entry.to);
  }
  return reserved;
}

async function loadCmsReservedSlugs(db: PrismaLike): Promise<string[]> {
  try {
    const posts = await db.cmsBlogPost.findMany({
      select: { slug: true },
      take: 5000,
    });
    return posts.map((post) => post.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export async function buildAutopilotSlugAdvisory(
  db: PrismaLike,
  proposedSlug: string | null | undefined,
  options?: { excludeTopicId?: number },
): Promise<AutopilotSlugAdvisory> {
  const raw = typeof proposedSlug === 'string' ? proposedSlug.trim() : '';
  if (!raw) {
    return {
      proposedSlug: null,
      normalisedSlug: '',
      blocking: {
        ok: true,
        normalisedSlug: '',
        conflict: false,
        conflictSource: 'none',
        message: 'No proposed slug provided.',
      },
    };
  }

  const cmsSlugs = await loadCmsReservedSlugs(db);
  const additionalReserved = [...collectKnownReservedPaths(), ...cmsSlugs];
  const blocking = checkAutopilotSlugReservation({
    candidate: raw,
    additionalReserved,
  });

  const normalisedSlug = blocking.normalisedSlug || normaliseAutopilotSlugCandidate(raw);
  const result: AutopilotSlugAdvisory = {
    proposedSlug: raw,
    normalisedSlug,
    blocking,
  };

  if (normalisedSlug && blocking.ok) {
    const lower = normalisedSlug.toLowerCase();
    const reservedNormalised = additionalReserved
      .map((item) => normaliseAutopilotSlugCandidate(item))
      .filter(Boolean);
    const caseHit = reservedNormalised.find(
      (item) => item.toLowerCase() === lower && item !== normalisedSlug,
    );
    if (caseHit) {
      result.caseInsensitiveWarning = {
        conflict: true,
        conflictSource: 'case_variant',
        conflictValue: caseHit,
        message: `Case-insensitive conflict with reserved slug "${caseHit}". Public routes remain case-sensitive.`,
      };
    }
  }

  if (normalisedSlug) {
    try {
      const peers = await db.autopilotTopic.findMany({
        where: {
          proposedSlug: { not: null },
          archivedAt: null,
          ...(options?.excludeTopicId ? { id: { not: options.excludeTopicId } } : {}),
        },
        select: { id: true, proposedSlug: true },
        take: 500,
      });
      const conflictTopicIds = peers
        .filter(
          (peer) => normaliseAutopilotSlugCandidate(peer.proposedSlug || '') === normalisedSlug,
        )
        .map((peer) => peer.id);
      if (conflictTopicIds.length > 0) {
        result.candidateTopicWarning = {
          conflictTopicIds,
          message: `Another unapproved Autopilot topic already proposes this slug (${conflictTopicIds.join(', ')}).`,
        };
      }
    } catch {
      // Advisory only.
    }
  }

  return result;
}
