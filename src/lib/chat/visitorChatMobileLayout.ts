/**
 * Mobile full-screen sheet + visualViewport helpers (Phase 2F-1.1.2).
 * Client presentation only — no API / persistence changes.
 */

export const VISITOR_CHAT_MOBILE_MAX_WIDTH_PX = 639;
export const VISITOR_CHAT_COMPACT_MAX_WIDTH_PX = 479;

export const VISITOR_CHAT_MOBILE_MQ = `(max-width: ${VISITOR_CHAT_MOBILE_MAX_WIDTH_PX}px)`;

export type VisualViewportLike = {
  height: number;
  offsetTop: number;
  offsetLeft: number;
  width: number;
};

export type MobileSheetViewportStyle = {
  position: 'fixed';
  top: string;
  left: string;
  width: string;
  height: string;
  maxWidth: string;
  maxHeight: string;
  margin: string;
  borderRadius: string;
};

/**
 * Maps visualViewport metrics to a full-bleed mobile sheet that tracks the
 * visible viewport while the soft keyboard is open. Does not scroll the page.
 */
export function buildMobileSheetViewportStyle(
  viewport: VisualViewportLike | null | undefined,
): MobileSheetViewportStyle {
  const height =
    viewport && Number.isFinite(viewport.height) && viewport.height > 0
      ? `${Math.round(viewport.height)}px`
      : '100dvh';
  const top =
    viewport && Number.isFinite(viewport.offsetTop)
      ? `${Math.round(viewport.offsetTop)}px`
      : '0px';
  const left =
    viewport && Number.isFinite(viewport.offsetLeft)
      ? `${Math.round(viewport.offsetLeft)}px`
      : '0px';
  const width =
    viewport && Number.isFinite(viewport.width) && viewport.width > 0
      ? `${Math.round(viewport.width)}px`
      : '100dvw';

  return {
    position: 'fixed',
    top,
    left,
    width,
    height,
    maxWidth: 'none',
    maxHeight: 'none',
    margin: '0',
    borderRadius: '0',
  };
}

export function isVisitorChatMobileViewport(width: number): boolean {
  return width <= VISITOR_CHAT_MOBILE_MAX_WIDTH_PX;
}

export function isVisitorChatCompactViewport(width: number): boolean {
  return width <= VISITOR_CHAT_COMPACT_MAX_WIDTH_PX;
}
