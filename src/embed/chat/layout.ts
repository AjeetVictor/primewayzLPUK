/**
 * Launcher placement and responsive breakpoints for the embedded chat.
 * Host floating controls are read only; they are never moved or hidden.
 */

export const PW_CHAT_BREAKPOINTS = {
  wide: 1180,
  tablet: 1024,
  mobile: 767,
  compact: 480,
} as const;

export const PW_CHAT_LAUNCHER_SIZE_PX = 56;
export const PW_CHAT_EDGE_OFFSET_PX = 18;
export const PW_CHAT_COLLISION_GAP_PX = 12;

export const PW_CHAT_COLLISION_SELECTORS = ['#back-to-top'] as const;

export type RectLike = { top: number; right: number; bottom: number; left: number };

export function isPwChatMobileViewport(width: number): boolean {
  return width <= PW_CHAT_BREAKPOINTS.mobile;
}

export function rectsIntersect(a: RectLike, b: RectLike): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Returns the launcher `bottom` offset (px). When a visible obstacle overlaps the
 * default launcher box, the launcher is lifted to sit `gap` px above the obstacle.
 */
export function computeLauncherBottom(params: {
  viewportWidth: number;
  viewportHeight: number;
  obstacles: readonly RectLike[];
  size?: number;
  edge?: number;
  gap?: number;
}): number {
  const size = params.size ?? PW_CHAT_LAUNCHER_SIZE_PX;
  const edge = params.edge ?? PW_CHAT_EDGE_OFFSET_PX;
  const gap = params.gap ?? PW_CHAT_COLLISION_GAP_PX;

  let bottom = edge;
  for (const obstacle of params.obstacles) {
    const launcher: RectLike = {
      right: params.viewportWidth - edge,
      left: params.viewportWidth - edge - size,
      bottom: params.viewportHeight - bottom,
      top: params.viewportHeight - bottom - size,
    };
    if (rectsIntersect(launcher, obstacle)) {
      bottom = Math.max(bottom, Math.ceil(params.viewportHeight - obstacle.top + gap));
    }
  }
  return bottom;
}

/** Visible means rendered, not hidden, not transparent, and with a non-empty box. */
export function readVisibleObstacleRect(win: Window, element: Element | null): RectLike | null {
  if (!element) return null;
  const style = win.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return null;
  if (Number.parseFloat(style.opacity || '1') <= 0.05) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
}
