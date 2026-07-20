/**
 * Allowlisted post-OAuth browser redirects for GSC admin UX.
 */

const ALLOWED_GSC_ADMIN_REDIRECTS = new Set([
  '/admin',
  '/admin?tab=autopilot',
  '/admin?tab=autopilot&gsc=connected',
  '/admin?tab=autopilot&gsc=error',
]);

export function resolveGscAdminRedirect(outcome: 'connected' | 'error', message?: string): string {
  if (outcome === 'connected') {
    return '/admin?tab=autopilot&gsc=connected';
  }
  const params = new URLSearchParams({ tab: 'autopilot', gsc: 'error' });
  if (message) {
    // Keep short, non-sensitive user-facing hint only.
    const safe = message.replace(/[^\w\s.,:;()-]/g, '').trim().slice(0, 120);
    if (safe) params.set('gscMessage', safe);
  }
  const target = `/admin?${params.toString()}`;
  // Path-only allowlist check (ignore message param variance by checking prefix).
  if (target.startsWith('/admin?tab=autopilot&gsc=error')) {
    return target;
  }
  return '/admin?tab=autopilot&gsc=error';
}

export function isAllowedGscAdminRedirect(pathnameWithQuery: string): boolean {
  if (ALLOWED_GSC_ADMIN_REDIRECTS.has(pathnameWithQuery)) return true;
  return pathnameWithQuery.startsWith('/admin?tab=autopilot&gsc=');
}
