import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PricingPlanSlug } from '../data/pricing/helpers';
import { getPricingPlanBySlug, isPricingPlanSlug } from '../data/pricing/helpers';
import {
  migrateLegacyStorageIfNeeded,
  resolvePricingSelectionFromQuery,
  type StoredPricingSelectionV1,
  writeStoredPricingSelection,
} from '../lib/pricing/pricingSelection';
import {
  trackPricingPageView,
  trackPricingPlanChanged,
  trackPricingPlanHighlighted,
} from '../lib/pricing/analytics';

export function usePricingSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selection, setSelection] = useState<StoredPricingSelectionV1 | null>(null);
  const [selectionSource, setSelectionSource] = useState<'query' | 'session' | 'legacy' | 'none'>('none');
  const [hydrated, setHydrated] = useState(false);
  const [invalidQueryPlan, setInvalidQueryPlan] = useState(false);
  const [detailPlanSlug, setDetailPlanSlug] = useState<PricingPlanSlug | null>(null);
  const hasTrackedViewRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);

  const planParam = searchParams.get('plan');

  useEffect(() => {
    migrateLegacyStorageIfNeeded();
    const resolved = resolvePricingSelectionFromQuery(planParam);
    setSelection(resolved.selection);
    setSelectionSource(resolved.source);
    setInvalidQueryPlan(resolved.invalidQuery);
    setHydrated(true);

    if (resolved.selection && resolved.source === 'query') {
      writeStoredPricingSelection({
        planSlug: resolved.selection.planSlug,
        sourcePage: '/pricing',
        sourceSection: 'query_param',
      });
    }
  }, [planParam]);

  useEffect(() => {
    if (!hydrated || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    trackPricingPageView({
      page_path: '/pricing',
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      section_name: 'pricing_page',
      selection,
    });
  }, [hydrated, selection]);

  useEffect(() => {
    if (!hydrated || hasAutoOpenedRef.current) return;

    if (planParam && isPricingPlanSlug(planParam)) {
      const plan = getPricingPlanBySlug(planParam);
      if (plan?.active) {
        hasAutoOpenedRef.current = true;
        setDetailPlanSlug(planParam);
        trackPricingPlanHighlighted({
          selected_plan: planParam,
          page_path: '/pricing',
          source: 'query',
        });
      }
    }
  }, [hydrated, planParam]);

  const openPlanDetail = useCallback(
    (planSlug: PricingPlanSlug, sourceSection = 'pricing_plan_card') => {
      const next = writeStoredPricingSelection({
        planSlug,
        sourcePage: '/pricing',
        sourceSection,
      });
      if (!next) return;

      setSelection(next);
      setSelectionSource('session');
      setInvalidQueryPlan(false);
      setDetailPlanSlug(planSlug);
      trackPricingPlanChanged({
        selected_plan: planSlug,
        page_path: '/pricing',
        source_section: sourceSection,
      });
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('plan', planSlug);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closePlanDetail = useCallback(() => {
    setDetailPlanSlug(null);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('plan');
        return params;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const detailPlan = detailPlanSlug ? getPricingPlanBySlug(detailPlanSlug) ?? null : null;
  const selectedPlan = selection ? getPricingPlanBySlug(selection.planSlug) : null;

  return {
    selection,
    selectedPlan,
    selectionSource,
    invalidQueryPlan,
    hydrated,
    detailPlanSlug,
    detailPlan,
    detailOpen: detailPlanSlug !== null,
    openPlanDetail,
    closePlanDetail,
    selectPlan: openPlanDetail,
  };
}
