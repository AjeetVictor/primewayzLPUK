import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PricingPlanSlug } from '../data/pricing/helpers';
import { getPricingPlanBySlug } from '../data/pricing/helpers';
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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePricingSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selection, setSelection] = useState<StoredPricingSelectionV1 | null>(null);
  const [selectionSource, setSelectionSource] = useState<'query' | 'session' | 'legacy' | 'none'>('none');
  const [hydrated, setHydrated] = useState(false);
  const [invalidQueryPlan, setInvalidQueryPlan] = useState(false);
  const hasScrolledRef = useRef(false);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    migrateLegacyStorageIfNeeded();
    const planParam = searchParams.get('plan');
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
  }, [searchParams]);

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
    if (!hydrated || !selection || selectionSource !== 'query' || hasScrolledRef.current) return;
    const el = document.getElementById(`pricing-plan-${selection.planSlug}`);
    if (!el) return;
    hasScrolledRef.current = true;
    trackPricingPlanHighlighted({
      selected_plan: selection.planSlug,
      page_path: '/pricing',
      source: selectionSource,
    });
    if (!prefersReducedMotion()) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [hydrated, selection, selectionSource]);

  const selectPlan = useCallback(
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

  const selectedPlan = selection ? getPricingPlanBySlug(selection.planSlug) : null;

  return {
    selection,
    selectedPlan,
    selectionSource,
    invalidQueryPlan,
    hydrated,
    selectPlan,
  };
}
