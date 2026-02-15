import { describe, it, expect, beforeEach } from 'vitest';
import {
  liveCalculationCache,
  targetCalculationCache,
  derivedHoldingsCache,
  generateLiveCacheKey,
  generateTargetCacheKey,
  generateDerivedCacheKey,
  pruneCache,
  cacheInvalidation,
} from './cache';
import { createEmptyPortfolio, createHolding } from './factory';

beforeEach(() => {
  cacheInvalidation.invalidateAllCalculations();
});

describe('generateLiveCacheKey', () => {
  it('generates a deterministic key', () => {
    const portfolio = createEmptyPortfolio('p1', 'Test');
    const key1 = generateLiveCacheKey(portfolio);
    const key2 = generateLiveCacheKey(portfolio);
    expect(key1).toBe(key2);
  });

  it('changes when holdings change', () => {
    const portfolio = createEmptyPortfolio('p1', 'Test');
    const key1 = generateLiveCacheKey(portfolio);

    const modified = { ...portfolio, holdings: [createHolding({ price: 100, qty: 5 })] };
    const key2 = generateLiveCacheKey(modified);
    expect(key1).not.toBe(key2);
  });
});

describe('generateTargetCacheKey', () => {
  it('generates a deterministic key', () => {
    const portfolio = createEmptyPortfolio('p1', 'Test');
    const key1 = generateTargetCacheKey(portfolio);
    const key2 = generateTargetCacheKey(portfolio);
    expect(key1).toBe(key2);
  });

  it('changes when target portfolio value changes', () => {
    const portfolio = createEmptyPortfolio('p1', 'Test');
    const key1 = generateTargetCacheKey(portfolio);

    const modified = {
      ...portfolio,
      settings: { ...portfolio.settings, targetPortfolioValue: 10000 },
    };
    const key2 = generateTargetCacheKey(modified);
    expect(key1).not.toBe(key2);
  });
});

describe('generateDerivedCacheKey', () => {
  it('combines live and target keys', () => {
    const key = generateDerivedCacheKey('live-key', 'target-key');
    expect(key).toBe('derived:live-key|target-key');
  });
});

describe('pruneCache', () => {
  it('keeps cache under 10 entries', () => {
    const cache = new Map<string, string>();
    for (let i = 0; i < 15; i++) {
      cache.set(`key-${i}`, `val-${i}`);
    }
    expect(cache.size).toBe(15);
    pruneCache(cache);
    expect(cache.size).toBe(10);
  });

  it('removes oldest entries', () => {
    const cache = new Map<string, string>();
    for (let i = 0; i < 12; i++) {
      cache.set(`key-${i}`, `val-${i}`);
    }
    pruneCache(cache);
    expect(cache.has('key-0')).toBe(false);
    expect(cache.has('key-1')).toBe(false);
    expect(cache.has('key-11')).toBe(true);
  });

  it('does nothing when under limit', () => {
    const cache = new Map<string, string>();
    cache.set('a', '1');
    cache.set('b', '2');
    pruneCache(cache);
    expect(cache.size).toBe(2);
  });
});

describe('cacheInvalidation', () => {
  it('invalidateLiveCalculations clears live and derived caches', () => {
    liveCalculationCache.set('test', {
      liveTotals: { totalAllocatedValue: 0, sectionTotals: new Map(), themeTotals: new Map() },
      liveResults: new Map(),
    });
    derivedHoldingsCache.set('test', []);

    cacheInvalidation.invalidateLiveCalculations();
    expect(liveCalculationCache.size).toBe(0);
    expect(derivedHoldingsCache.size).toBe(0);
  });

  it('invalidateTargetCalculations clears target and derived caches', () => {
    targetCalculationCache.set('test', {
      targetHierarchy: null,
      targetResults: new Map(),
    });
    derivedHoldingsCache.set('test', []);

    cacheInvalidation.invalidateTargetCalculations();
    expect(targetCalculationCache.size).toBe(0);
    expect(derivedHoldingsCache.size).toBe(0);
  });

  it('invalidateAllCalculations clears all caches', () => {
    liveCalculationCache.set('test', {
      liveTotals: { totalAllocatedValue: 0, sectionTotals: new Map(), themeTotals: new Map() },
      liveResults: new Map(),
    });
    targetCalculationCache.set('test', {
      targetHierarchy: null,
      targetResults: new Map(),
    });
    derivedHoldingsCache.set('test', []);

    cacheInvalidation.invalidateAllCalculations();
    expect(liveCalculationCache.size).toBe(0);
    expect(targetCalculationCache.size).toBe(0);
    expect(derivedHoldingsCache.size).toBe(0);
  });
});
