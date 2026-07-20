/**
 * Pure Autopilot slug reservation checks against static blog posts.
 * CMS / insights / legacy reserved providers can be passed via additionalReserved.
 */

import { blogPosts } from '../../data/blog/utils.ts';
import type { BlogPost } from '../../data/blog/types.ts';
import type {
  AutopilotSlugReservationInput,
  AutopilotSlugReservationResult,
} from '../../data/autopilot/types.ts';

const BLOG_PATH_PREFIX = '/blog/';

/**
 * Normalise a candidate to the public blog slug form used by `/blog/:id`.
 * `/blog/example`, `/blog/example/`, `example`, and `example/` → `example`.
 */
export function normaliseAutopilotSlugCandidate(candidate: string): string {
  let value = candidate.trim();
  if (!value) return '';

  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      value = url.pathname;
    }
  } catch {
    // Keep original trimmed value when URL parsing fails.
  }

  value = value.replace(/\\/g, '/');
  value = value.replace(/^\/+/, '/');

  while (value.endsWith('/') && value.length > 1) {
    value = value.slice(0, -1);
  }

  const lowerPath = value.toLowerCase();
  if (lowerPath === '/blog') {
    return '';
  }

  if (lowerPath.startsWith(BLOG_PATH_PREFIX)) {
    value = value.slice(BLOG_PATH_PREFIX.length);
  } else if (value.startsWith('/')) {
    value = value.slice(1);
  }

  while (value.endsWith('/')) {
    value = value.slice(0, -1);
  }

  // Reject nested paths — blog ids are single-segment slugs.
  if (value.includes('/')) {
    return '';
  }

  return value;
}

function collectStaticIdentifiers(posts: BlogPost[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const post of posts) {
    if (post.slug) map.set(post.slug, post.slug);
    if (post.id) map.set(post.id, post.id);
  }
  return map;
}

function collectAdditionalIdentifiers(paths: string[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const path of paths || []) {
    const normalised = normaliseAutopilotSlugCandidate(path);
    if (normalised) {
      map.set(normalised, path);
    }
  }
  return map;
}

export function checkAutopilotSlugReservation(
  input: AutopilotSlugReservationInput,
  options: { staticPosts?: BlogPost[] } = {},
): AutopilotSlugReservationResult {
  const normalisedSlug = normaliseAutopilotSlugCandidate(input.candidate);

  if (!normalisedSlug) {
    return {
      ok: false,
      normalisedSlug: '',
      conflict: true,
      conflictSource: 'malformed',
      message: 'Slug candidate is empty or malformed after normalisation.',
    };
  }

  // Match current blog route behaviour: identifiers are compared exactly (case-sensitive).
  const staticIds = collectStaticIdentifiers(options.staticPosts || blogPosts);
  const staticHit = staticIds.get(normalisedSlug);
  if (staticHit) {
    return {
      ok: false,
      normalisedSlug,
      conflict: true,
      conflictSource: 'static_blog',
      conflictValue: staticHit,
      message: `Slug is reserved by a static blog article (${staticHit}).`,
    };
  }

  const additional = collectAdditionalIdentifiers(input.additionalReserved);
  const additionalHit = additional.get(normalisedSlug);
  if (additionalHit) {
    return {
      ok: false,
      normalisedSlug,
      conflict: true,
      conflictSource: 'additional_reserved',
      conflictValue: additionalHit,
      message: `Slug is reserved by an additional reserved path (${additionalHit}).`,
    };
  }

  return {
    ok: true,
    normalisedSlug,
    conflict: false,
    conflictSource: 'none',
  };
}

export function isAutopilotSlugAvailable(
  candidate: string,
  additionalReserved?: string[],
): boolean {
  return checkAutopilotSlugReservation({ candidate, additionalReserved }).ok;
}
