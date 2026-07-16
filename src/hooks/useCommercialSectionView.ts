import { useEffect, useRef } from 'react';
import type { SdaasEventName } from '../lib/sdaasAnalytics';
import { trackSdaasEvent } from '../lib/sdaasAnalytics';

type SectionViewOptions = {
  eventName?: SdaasEventName;
  sectionName?: string;
  contentCluster?: string;
  extraParams?: Record<string, string | number | boolean | undefined>;
};

/** Fire once when a commercial or pillar section enters the viewport (~35% visible). */
export function useCommercialSectionView(
  sectionKey: string | undefined,
  options: SectionViewOptions = {},
) {
  const ref = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);
  const eventName = options.eventName || 'sdaas_section_view';
  const sectionName = options.sectionName;
  const contentCluster = options.contentCluster || 'sdaas';
  const extraParams = options.extraParams;

  useEffect(() => {
    if (!sectionKey || firedRef.current) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || firedRef.current) return;
        firedRef.current = true;
        trackSdaasEvent(eventName, {
          section_key: sectionKey,
          section_id: sectionKey,
          section_name: sectionName || sectionKey,
          cta_location: sectionKey,
          content_cluster: contentCluster,
          ...extraParams,
        });
        observer.disconnect();
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionKey, eventName, sectionName, contentCluster, extraParams]);

  return ref;
}
