// =============================================================================
// 3-Tier Calculation Cache
// =============================================================================

import type { Portfolio } from '@/types/portfolio';
import type { HoldingDerived } from './selectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HoldingValueResult {
  value: number;
  liveValue: number;
  manualValue: number;
  dayChangeValue: number;
  usedLivePrice: boolean;
}

interface LivePortfolioTotals {
  totalAllocatedValue: number;
  sectionTotals: Map<string, number>;
  themeTotals: Map<string, number>;
}

interface SectionTarget {
  percentage: number;
  targetValue: number;
  allocatedValue: number;
}

interface ThemeTarget {
  section: string;
  percentage: number;
  percentageOfPortfolio: number;
  targetValue: number;
  allocatedValue: number;
}

interface TargetHierarchy {
  portfolioTarget: number;
  sectionTargets: Map<string, SectionTarget>;
  themeTargets: Map<string, ThemeTarget>;
}

export type LiveCacheEntry = {
  liveTotals: LivePortfolioTotals;
  liveResults: Map<string, HoldingValueResult & { profitLoss?: HoldingDerived['profitLoss'] }>;
};

export type TargetCacheEntry = {
  targetHierarchy: TargetHierarchy | null;
  targetResults: Map<
    string,
    { targetValue?: number; targetValueDiff?: number; targetPctDiff?: number }
  >;
};

// ---------------------------------------------------------------------------
// Cache instances
// ---------------------------------------------------------------------------

export const liveCalculationCache = new Map<string, LiveCacheEntry>();
export const targetCalculationCache = new Map<string, TargetCacheEntry>();
export const derivedHoldingsCache = new Map<string, HoldingDerived[]>();

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

export const generateLiveCacheKey = (portfolio: Portfolio): string => {
  const liveDataKey = portfolio.holdings
    .map(
      (h) =>
        `${h.id}-${h.qty}-${h.price}-${h.livePrice}-${h.avgCost}-${h.dayChange}-${h.dayChangePercent}-${h.include}-${h.section}-${h.theme}-${h.account}-${h.assetType}-${h.exchange}`,
    )
    .join('|');
  return `live:${liveDataKey}`;
};

export const generateTargetCacheKey = (portfolio: Portfolio): string => {
  const targetDataKey = portfolio.holdings
    .map(
      (h) =>
        `${h.id}-${h.targetPct}-${h.include}-${h.section}-${h.theme}-${h.account}-${h.assetType}-${h.exchange}`,
    )
    .join('|');
  const targetValue = portfolio.settings.targetPortfolioValue ?? 0;
  const budgetsKey = JSON.stringify({
    sections: portfolio.budgets?.sections || {},
    themes: portfolio.budgets?.themes || {},
  });
  const themeSectionsKey = JSON.stringify(portfolio.lists.themeSections || {});
  return `target:${targetDataKey}-${targetValue}-${budgetsKey}-${themeSectionsKey}`;
};

export const generateDerivedCacheKey = (liveKey: string, targetKey: string): string =>
  `derived:${liveKey}|${targetKey}`;

// ---------------------------------------------------------------------------
// Pruning
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 10;

export const pruneCache = <T>(cache: Map<string, T>): void => {
  if (cache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(cache.keys());
    const oldKeys = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    oldKeys.forEach((key) => cache.delete(key));
  }
};

// ---------------------------------------------------------------------------
// Invalidation API
// ---------------------------------------------------------------------------

export const cacheInvalidation = {
  invalidateLiveCalculations: (): void => {
    liveCalculationCache.clear();
    derivedHoldingsCache.clear();
  },
  invalidateTargetCalculations: (): void => {
    targetCalculationCache.clear();
    derivedHoldingsCache.clear();
  },
  invalidateAllCalculations: (): void => {
    liveCalculationCache.clear();
    targetCalculationCache.clear();
    derivedHoldingsCache.clear();
  },
};
