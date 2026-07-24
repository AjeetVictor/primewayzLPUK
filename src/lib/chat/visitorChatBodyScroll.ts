/**
 * Mobile body-scroll lock helpers for the visitor chat panel.
 */

export type BodyScrollStyleTarget = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
};

export function clearBodyScrollStyles(bodyStyle: BodyScrollStyleTarget): void {
  bodyStyle.position = '';
  bodyStyle.top = '';
  bodyStyle.left = '';
  bodyStyle.right = '';
  bodyStyle.width = '';
}

export type UnlockBodyScrollParams = {
  restorePosition: boolean;
  savedScrollY: number;
  bodyStyle: BodyScrollStyleTarget;
  scrollTo: (x: number, y: number) => void;
};

/**
 * Clears fixed body styles. When `restorePosition` is true, scrolls back to the
 * saved Y. Navigation / route cleanup must use `restorePosition: false` so a
 * later cleanup cannot jump back to the previous route's scroll.
 */
export function unlockBodyScroll(params: UnlockBodyScrollParams): void {
  clearBodyScrollStyles(params.bodyStyle);
  if (params.restorePosition) {
    params.scrollTo(0, params.savedScrollY);
  }
}

export type LockBodyScrollParams = {
  currentScrollY: number;
  bodyStyle: BodyScrollStyleTarget;
};

/** Applies the fixed-body lock and returns the scroll Y that was saved. */
export function lockBodyScroll(params: LockBodyScrollParams): number {
  const y = params.currentScrollY;
  params.bodyStyle.position = 'fixed';
  params.bodyStyle.top = `-${y}px`;
  params.bodyStyle.left = '0';
  params.bodyStyle.right = '0';
  params.bodyStyle.width = '100%';
  return y;
}
