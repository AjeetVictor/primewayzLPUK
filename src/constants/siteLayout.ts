/** Locked site content max width (1200px) */
export const SITE_MAX_WIDTH_CLASS = 'max-w-[1200px]';

/**
 * Shared page width + horizontal padding (aligned with hero and main sections).
 */
export const SITE_CONTAINER_CLASS =
  `mx-auto w-full ${SITE_MAX_WIDTH_CLASS} px-4 sm:px-6 lg:px-8`;

/** Mockup-aligned soft surface for trust / audience strip */
export const TRUST_STRIP_SURFACE = '#F6FAFD';

/** Full-width panel inside SITE_CONTAINER — use for aligned bordered section blocks */
export const SITE_SECTION_PANEL_CLASS =
  'w-full rounded-2xl border border-brand-border bg-white shadow-[0_12px_34px_-28px_rgba(0,10,45,0.12)]';

/** Narrower inner width for Service Routes decision grid (mockup-controlled) */
export const SERVICE_ROUTES_CONTAINER_CLASS =
  'mx-auto w-full max-w-[1040px] px-4 sm:px-6';

/** Inner process grid width for Monthly Support Rhythm */
export const SUPPORT_RHYTHM_INNER_CLASS = 'mx-auto w-full max-w-[1040px]';
