import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearStoredPricingSelection,
  parseStoredPricingSelection,
  resolvePricingSelectionFromQuery,
  writeStoredPricingSelection,
} from './pricingSelection';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
  };
}

test('valid query parameter resolves to canonical selection', () => {
  const result = resolvePricingSelectionFromQuery('growth');
  assert.equal(result.source, 'query');
  assert.equal(result.selection?.planSlug, 'growth');
  assert.equal(result.invalidQuery, false);
});

test('invalid query parameter is flagged and not stored', () => {
  const result = resolvePricingSelectionFromQuery('not-valid');
  assert.equal(result.selection, null);
  assert.equal(result.invalidQuery, true);
});

test('legacy plain slug string migrates to canonical object', () => {
  const parsed = parseStoredPricingSelection('essential');
  assert.ok(parsed);
  assert.equal(parsed!.version, 1);
  assert.equal(parsed!.planSlug, 'essential');
  assert.equal(parsed!.planName, 'Essential');
});

test('legacy JSON object format migrates by plan name', () => {
  const raw = JSON.stringify({
    plan_name: 'Growth',
    plan_launch_price: '£1,189/mo',
    plan_price_value: 1189,
    currency: 'GBP',
    billing_period: 'monthly',
  });
  const parsed = parseStoredPricingSelection(raw);
  assert.ok(parsed);
  assert.equal(parsed!.planSlug, 'growth');
});

test('malformed JSON returns null', () => {
  assert.equal(parseStoredPricingSelection('{not json'), null);
});

test('inactive or unknown slug returns null', () => {
  assert.equal(parseStoredPricingSelection('invalid-plan'), null);
});

test('canonical v1 JSON round-trips through storage', () => {
  const storage = createMemoryStorage();
  const written = writeStoredPricingSelection(
    { planSlug: 'maintenance-mode', sourcePage: '/pricing', sourceSection: 'plan_card' },
    storage,
  );
  assert.ok(written);
  const raw = storage.getItem('primewayz_selected_plan');
  assert.ok(raw?.includes('"version":1'));
  const parsed = parseStoredPricingSelection(raw);
  assert.equal(parsed?.planSlug, 'maintenance-mode');
});

test('write and read canonical session object', () => {
  const storage = createMemoryStorage();
  const written = writeStoredPricingSelection(
    { planSlug: 'maintenance-mode', sourcePage: '/pricing', sourceSection: 'plan_card' },
    storage,
  );
  assert.ok(written);
  const result = resolvePricingSelectionFromQuery(null, storage);
  assert.equal(result.selection?.planSlug, 'maintenance-mode');
  assert.equal(result.source, 'session');
});

test('selection update replaces previous value', () => {
  const storage = createMemoryStorage();
  writeStoredPricingSelection(
    { planSlug: 'essential', sourcePage: '/pricing' },
    storage,
  );
  writeStoredPricingSelection(
    { planSlug: 'growth', sourcePage: '/pricing', sourceSection: 'plan_changed' },
    storage,
  );
  const result = resolvePricingSelectionFromQuery(null, storage);
  assert.equal(result.selection?.planSlug, 'growth');
});

test('clearStoredPricingSelection removes value', () => {
  const storage = createMemoryStorage();
  writeStoredPricingSelection({ planSlug: 'growth', sourcePage: '/pricing' }, storage);
  clearStoredPricingSelection(storage);
  assert.equal(resolvePricingSelectionFromQuery(null, storage).selection, null);
});

test('SSR-safe: resolvePricingSelectionFromQuery works without window', () => {
  const result = resolvePricingSelectionFromQuery('foundation-sprint');
  assert.equal(result.selection?.planSlug, 'foundation-sprint');
});
