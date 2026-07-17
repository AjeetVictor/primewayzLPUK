import { useEffect, useRef, useState, type RefObject } from 'react';

const OBSERVER_ROOT_MARGIN = '-120px 0px -65% 0px';
const OBSERVER_THRESHOLD: number[] = [0, 1];

export function scrollTocLinkIntoView(container: HTMLElement, link: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const padding = 8;

  if (linkRect.top < containerRect.top + padding) {
    container.scrollTop -= containerRect.top - linkRect.top + padding;
  } else if (linkRect.bottom > containerRect.bottom - padding) {
    container.scrollTop += linkRect.bottom - containerRect.bottom + padding;
  }
}

export function useActiveArticleHeading(
  containerRef: RefObject<HTMLElement | null>,
  headingIds: string[],
  contentKey: string,
) {
  const [activeId, setActiveId] = useState<string | null>(() => headingIds[0] ?? null);
  const intersectingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setActiveId(headingIds[0] ?? null);
    intersectingRef.current = new Set();
  }, [contentKey, headingIds.join('|')]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || headingIds.length === 0 || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const elements = headingIds
      .map((headingId) => document.getElementById(headingId))
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && container.contains(element),
      );

    if (elements.length === 0) {
      return undefined;
    }

    const pickActiveHeading = () => {
      const intersecting = intersectingRef.current;
      let nextActive: string | null = null;

      for (const headingId of headingIds) {
        if (intersecting.has(headingId)) {
          nextActive = headingId;
        }
      }

      if (nextActive) {
        setActiveId(nextActive);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const headingId = entry.target.id;
          if (!headingId) return;

          if (entry.isIntersecting) {
            intersectingRef.current.add(headingId);
          } else {
            intersectingRef.current.delete(headingId);
          }
        });

        pickActiveHeading();
      },
      {
        root: null,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: OBSERVER_THRESHOLD,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      intersectingRef.current = new Set();
    };
  }, [containerRef, contentKey, headingIds]);

  return { activeId, setActiveId };
}
