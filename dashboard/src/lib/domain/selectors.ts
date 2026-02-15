// =============================================================================
// Portfolio Selectors - Derived calculations with 3-tier caching
// =============================================================================

import type { Holding, Portfolio, BudgetLimit } from '@/types/portfolio';
import { calculateTargetDelta, roundToPennies, calculateProfitLoss } from './calculations';
import {
  liveCalculationCache,
  targetCalculationCache,
  derivedHoldingsCache,
  generateLiveCacheKey,
  generateTargetCacheKey,
  generateDerivedCacheKey,
  pruneCache,
  type LiveCacheEntry,
  type TargetCacheEntry,
} from './cache';

// ---------------------------------------------------------------------------
// Internal types
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

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HoldingDerived {
  holding: Holding;
  value: number;
  liveValue: number;
  manualValue: number;
  dayChangeValue: number;
  usedLivePrice: boolean;
  pctOfTotal: number;
  pctOfSection: number;
  sectionTotal: number;
  pctOfTheme: number;
  targetValue?: number;
  targetValueDiff?: number;
  targetPctDiff?: number;
  profitLoss?: {
    totalGain: number;
    totalGainPercent: number;
    dayChangeValue: number;
    dayChangePercent: number;
    costBasis: number;
    marketValue: number;
  };
}

export interface BreakdownEntry {
  label: string;
  value: number;
  percentage: number;
}

export interface BudgetRemaining {
  label: string;
  used: number;
  percentage: number;
  amountLimit?: number;
  amountRemaining?: number;
  percentLimit?: number;
  percentRemaining?: number;
  section?: string;
  sectionPercentLimit?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export const calculateHoldingValue = (holding: Holding): HoldingValueResult => {
  const livePrice = holding.livePrice;
  const manualPrice = holding.price;
  const qty = holding.qty;

  const manualValue = manualPrice * qty;
  const usedLivePrice = livePrice !== undefined;
  const effectivePrice = usedLivePrice ? livePrice : manualPrice;
  const liveValue = effectivePrice * qty;
  const value = liveValue;
  const dayChangeValue = usedLivePrice ? liveValue - manualValue : 0;

  return { value, liveValue, manualValue, dayChangeValue, usedLivePrice };
};

const filterIncludedHoldings = (holdings: Holding[]): Holding[] =>
  holdings.filter((holding) => holding.include);

export const calculateLivePortfolioTotals = (holdings: Holding[]): LivePortfolioTotals => {
  const included = filterIncludedHoldings(holdings);
  const sectionTotals = new Map<string, number>();
  const themeTotals = new Map<string, number>();
  let totalAllocatedValue = 0;

  included.forEach((holding) => {
    const { liveValue } = calculateHoldingValue(holding);
    totalAllocatedValue += liveValue;
    sectionTotals.set(holding.section, (sectionTotals.get(holding.section) ?? 0) + liveValue);
    themeTotals.set(holding.theme, (themeTotals.get(holding.theme) ?? 0) + liveValue);
  });

  return { totalAllocatedValue, sectionTotals, themeTotals };
};

export const calculateTargetHierarchy = (
  portfolio: Portfolio,
  liveTotals: LivePortfolioTotals,
): TargetHierarchy | null => {
  const portfolioTarget = portfolio.settings.targetPortfolioValue;
  const normalizedBudgets = normalizeBudgets(portfolio.budgets);
  const sectionTargets = new Map<string, SectionTarget>();
  const themeTargets = new Map<string, ThemeTarget>();

  if (portfolioTarget && portfolioTarget > 0) {
    portfolio.lists.sections.forEach((section) => {
      const sectionBudget = normalizedBudgets.sections[section];
      const percentage = sectionBudget?.percent ?? 0;
      const targetValue = (percentage / 100) * portfolioTarget;
      const allocatedValue = liveTotals.sectionTotals.get(section) ?? 0;
      sectionTargets.set(section, { percentage, targetValue, allocatedValue });
    });

    portfolio.lists.themes.forEach((theme) => {
      const themeBudget = normalizedBudgets.themes[theme];
      const section = portfolio.lists.themeSections?.[theme];

      if (section && themeBudget?.percentOfSection) {
        const sectionTarget = sectionTargets.get(section);
        if (sectionTarget) {
          const percentage = themeBudget.percentOfSection;
          const targetValue = (percentage / 100) * sectionTarget.targetValue;
          const percentageOfPortfolio =
            portfolioTarget > 0 ? (targetValue / portfolioTarget) * 100 : 0;
          const allocatedValue = liveTotals.themeTotals.get(theme) ?? 0;
          themeTargets.set(theme, {
            section,
            percentage,
            percentageOfPortfolio,
            targetValue,
            allocatedValue,
          });
        }
      }
    });

    return { portfolioTarget, sectionTargets, themeTargets };
  }

  const fallbackPortfolioTarget = liveTotals.totalAllocatedValue;
  if (fallbackPortfolioTarget <= 0) {
    return null;
  }

  portfolio.lists.themes.forEach((theme) => {
    const themeTotal = liveTotals.themeTotals.get(theme) ?? 0;
    const section = portfolio.lists.themeSections?.[theme] ?? 'Core';

    if (themeTotal > 0) {
      themeTargets.set(theme, {
        section,
        percentage: 100,
        percentageOfPortfolio:
          fallbackPortfolioTarget > 0 ? (themeTotal / fallbackPortfolioTarget) * 100 : 0,
        targetValue: themeTotal,
        allocatedValue: themeTotal,
      });
    }
  });

  return { portfolioTarget: fallbackPortfolioTarget, sectionTargets, themeTargets };
};

// ---------------------------------------------------------------------------
// Public selectors
// ---------------------------------------------------------------------------

export const selectIncludedHoldings = (portfolio: Portfolio): Holding[] =>
  filterIncludedHoldings(portfolio.holdings);

export const selectTotalValue = (portfolio: Portfolio): number => {
  const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
  return liveTotals.totalAllocatedValue;
};

export const selectTargetPortfolioValue = (portfolio: Portfolio): number =>
  portfolio.settings.targetPortfolioValue ?? 0;

export const selectHoldingsWithDerived = (portfolio: Portfolio): HoldingDerived[] => {
  const liveCacheKey = generateLiveCacheKey(portfolio);
  const targetCacheKey = generateTargetCacheKey(portfolio);
  const derivedCacheKey = generateDerivedCacheKey(liveCacheKey, targetCacheKey);

  const cachedDerived = derivedHoldingsCache.get(derivedCacheKey);
  if (cachedDerived) {
    return cachedDerived;
  }

  let liveCache: LiveCacheEntry | undefined = liveCalculationCache.get(liveCacheKey);
  if (!liveCache) {
    const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
    const liveResults = new Map<
      string,
      HoldingValueResult & { profitLoss?: HoldingDerived['profitLoss'] }
    >();

    portfolio.holdings.forEach((holding) => {
      const holdingValue = calculateHoldingValue(holding);

      let profitLoss: HoldingDerived['profitLoss'];
      if (holding.avgCost !== undefined && holding.qty > 0) {
        const currentPrice = holding.livePrice ?? holding.price;
        const profitLossResult = calculateProfitLoss({
          currentPrice,
          avgCost: holding.avgCost,
          quantity: holding.qty,
          dayChange: holding.dayChange,
          dayChangePercent: holding.dayChangePercent,
        });
        profitLoss = {
          totalGain: profitLossResult.totalGain,
          totalGainPercent: profitLossResult.totalGainPercent,
          dayChangeValue: profitLossResult.dayChangeValue,
          dayChangePercent: profitLossResult.dayChangePercent,
          costBasis: profitLossResult.costBasis,
          marketValue: profitLossResult.marketValue,
        };
      }

      liveResults.set(holding.id, { ...holdingValue, profitLoss });
    });

    liveCache = { liveTotals, liveResults };
    liveCalculationCache.set(liveCacheKey, liveCache);
    pruneCache(liveCalculationCache);
  }

  let targetCache: TargetCacheEntry | undefined = targetCalculationCache.get(targetCacheKey);
  if (!targetCache) {
    const targetHierarchy = calculateTargetHierarchy(portfolio, liveCache.liveTotals);
    const targetResults = new Map<
      string,
      { targetValue?: number; targetValueDiff?: number; targetPctDiff?: number }
    >();

    portfolio.holdings.forEach((holding) => {
      if (!holding.include || typeof holding.targetPct !== 'number') {
        targetResults.set(holding.id, {});
        return;
      }

      const liveResult = liveCache!.liveResults.get(holding.id);
      if (!liveResult) {
        targetResults.set(holding.id, {});
        return;
      }

      if (
        targetHierarchy &&
        portfolio.settings.targetPortfolioValue &&
        portfolio.settings.targetPortfolioValue > 0
      ) {
        const themeTarget = targetHierarchy.themeTargets.get(holding.theme);
        if (themeTarget && themeTarget.targetValue > 0) {
          const targetValue = (holding.targetPct / 100) * themeTarget.targetValue;
          const delta = calculateTargetDelta({
            value: liveResult.liveValue,
            total: themeTarget.targetValue,
            targetPct: holding.targetPct,
          });
          if (delta) {
            targetResults.set(holding.id, {
              targetValue,
              targetValueDiff: delta.valueDiff,
              targetPctDiff: delta.pctDiff,
            });
            return;
          }
        }
      }

      const themeTotal = liveCache!.liveTotals.themeTotals.get(holding.theme) ?? 0;
      if (themeTotal <= 0) {
        targetResults.set(holding.id, {});
        return;
      }

      const delta = calculateTargetDelta({
        value: liveResult.liveValue,
        total: themeTotal,
        targetPct: holding.targetPct,
      });

      if (!delta) {
        targetResults.set(holding.id, {});
        return;
      }

      const targetValue = (holding.targetPct / 100) * themeTotal;
      targetResults.set(holding.id, {
        targetValue,
        targetValueDiff: delta.valueDiff,
        targetPctDiff: delta.pctDiff,
      });
    });

    targetCache = { targetHierarchy, targetResults };
    targetCalculationCache.set(targetCacheKey, targetCache);
    pruneCache(targetCalculationCache);
  }

  const result = portfolio.holdings.map((holding) => {
    const liveResult = liveCache!.liveResults.get(holding.id)!;
    const targetResult = targetCache!.targetResults.get(holding.id)!;

    const pctOfTotal =
      holding.include && liveCache!.liveTotals.totalAllocatedValue > 0
        ? (liveResult.liveValue / liveCache!.liveTotals.totalAllocatedValue) * 100
        : 0;

    const sectionTotal = holding.include
      ? liveCache!.liveTotals.sectionTotals.get(holding.section) ?? 0
      : 0;
    const pctOfSection =
      holding.include && sectionTotal > 0 ? (liveResult.liveValue / sectionTotal) * 100 : 0;

    let pctOfTheme = 0;
    if (holding.include && targetCache!.targetHierarchy) {
      const themeTarget = targetCache!.targetHierarchy.themeTargets.get(holding.theme);
      if (themeTarget && themeTarget.targetValue > 0) {
        pctOfTheme = (liveResult.liveValue / themeTarget.targetValue) * 100;
      }
    }

    return {
      holding,
      value: liveResult.value,
      liveValue: liveResult.liveValue,
      manualValue: liveResult.manualValue,
      dayChangeValue: liveResult.dayChangeValue,
      usedLivePrice: liveResult.usedLivePrice,
      pctOfTotal,
      pctOfSection,
      sectionTotal,
      pctOfTheme,
      profitLoss: liveResult.profitLoss,
      targetValue: targetResult.targetValue,
      targetValueDiff: targetResult.targetValueDiff,
      targetPctDiff: targetResult.targetPctDiff,
    };
  });

  derivedHoldingsCache.set(derivedCacheKey, result);
  pruneCache(derivedHoldingsCache);

  return result;
};

// ---------------------------------------------------------------------------
// Breakdown selectors
// ---------------------------------------------------------------------------

const buildBreakdown = (portfolio: Portfolio, field: keyof Holding): BreakdownEntry[] => {
  const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
  const total = liveTotals.totalAllocatedValue;

  let aggregates: Map<string, number>;
  if (field === 'section') {
    aggregates = liveTotals.sectionTotals;
  } else if (field === 'theme') {
    aggregates = liveTotals.themeTotals;
  } else {
    const included = selectIncludedHoldings(portfolio);
    aggregates = new Map<string, number>();
    included.forEach((holding) => {
      const key = String(holding[field]);
      aggregates.set(key, (aggregates.get(key) ?? 0) + calculateHoldingValue(holding).liveValue);
    });
  }

  return Array.from(aggregates.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const selectBreakdownBySection = (portfolio: Portfolio): BreakdownEntry[] =>
  buildBreakdown(portfolio, 'section');

export const selectBreakdownByAccount = (portfolio: Portfolio): BreakdownEntry[] =>
  buildBreakdown(portfolio, 'account');

export const selectBreakdownByTheme = (portfolio: Portfolio): BreakdownEntry[] =>
  buildBreakdown(portfolio, 'theme');

// ---------------------------------------------------------------------------
// Budget remaining
// ---------------------------------------------------------------------------

const normalizeBudgetCollection = (collection?: Record<string, BudgetLimit | number>) => {
  const next: Record<string, BudgetLimit> = {};
  if (!collection) {
    return next;
  }

  Object.entries(collection).forEach(([key, value]) => {
    if (typeof value === 'number') {
      next[key] = { amount: value };
    } else if (value) {
      next[key] = {
        amount:
          value.amount !== undefined && Number.isFinite(value.amount)
            ? Math.max(value.amount, 0)
            : undefined,
        percent:
          value.percent !== undefined && Number.isFinite(value.percent)
            ? Math.max(value.percent, 0)
            : undefined,
        percentOfSection:
          value.percentOfSection !== undefined && Number.isFinite(value.percentOfSection)
            ? Math.max(value.percentOfSection, 0)
            : undefined,
      };
    }
  });

  return next;
};

const normalizeBudgets = (budgets?: Portfolio['budgets']) => ({
  sections: normalizeBudgetCollection(budgets?.sections),
  accounts: normalizeBudgetCollection(budgets?.accounts),
  themes: normalizeBudgetCollection(budgets?.themes),
});

const resolveBudgetAmount = (
  limit: BudgetLimit | undefined,
  total: number | undefined,
): number | undefined => {
  if (!limit) {
    return undefined;
  }

  if (limit.amount !== undefined && Number.isFinite(limit.amount)) {
    return Math.max(limit.amount, 0);
  }

  if (limit.percent !== undefined && Number.isFinite(limit.percent) && total && total > 0) {
    return Math.max((limit.percent / 100) * total, 0);
  }

  return undefined;
};

const buildBudgetRemaining = (
  breakdown: BreakdownEntry[],
  budgets: Record<string, BudgetLimit | number>,
  options: string[],
  computePercentage: (label: string, entry?: BreakdownEntry) => number,
  getSection?: (label: string) => string | undefined,
  augment?: (label: string) => Partial<BudgetRemaining> | undefined,
): BudgetRemaining[] => {
  const normalizedBudgets = normalizeBudgetCollection(budgets);
  const entriesByLabel = new Map<string, BreakdownEntry>();
  breakdown.forEach((entry) => entriesByLabel.set(entry.label, entry));

  const labels = new Set<string>([
    ...options,
    ...breakdown.map((entry) => entry.label),
    ...Object.keys(normalizedBudgets ?? {}).filter((key) => options.includes(key)),
  ]);

  const orderedLabels = Array.from(labels);
  orderedLabels.sort((a, b) => {
    const indexA = options.indexOf(a);
    const indexB = options.indexOf(b);
    const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    if (safeA !== safeB) {
      return safeA - safeB;
    }
    return a.localeCompare(b);
  });

  return orderedLabels.map((label) => {
    const entry = entriesByLabel.get(label);
    const used = entry?.value ?? 0;
    const percentage = computePercentage(label, entry);
    const limit = normalizedBudgets[label];
    let amountLimit = limit?.amount;
    const amountRemaining =
      amountLimit !== undefined ? roundToPennies(Math.max(amountLimit - used, 0)) : undefined;
    let percentLimit = limit?.percent;
    const percentRemaining =
      percentLimit !== undefined ? Math.max(percentLimit - percentage, 0) : undefined;
    const extra = augment ? augment(label) : undefined;
    if (extra?.amountLimit !== undefined) {
      amountLimit = extra.amountLimit;
    }
    const adjustedAmountRemaining =
      extra?.amountLimit !== undefined
        ? roundToPennies(Math.max(extra.amountLimit - used, 0))
        : amountRemaining;
    if (extra?.percentLimit !== undefined) {
      percentLimit = extra.percentLimit;
    }
    const adjustedPercentRemaining =
      extra?.percentLimit !== undefined
        ? Math.max(extra.percentLimit - percentage, 0)
        : percentRemaining;

    return {
      label,
      used,
      percentage,
      amountLimit,
      amountRemaining: adjustedAmountRemaining,
      percentLimit,
      percentRemaining: adjustedPercentRemaining,
      section: getSection ? getSection(label) : undefined,
      sectionPercentLimit: extra?.sectionPercentLimit,
    };
  });
};

export const selectBudgetRemaining = (portfolio: Portfolio) => {
  const normalizedBudgets = normalizeBudgets(portfolio.budgets);
  const sectionBreakdown = selectBreakdownBySection(portfolio);
  const accountBreakdown = selectBreakdownByAccount(portfolio);
  const themeBreakdown = selectBreakdownByTheme(portfolio);
  const sectionTotals = new Map(sectionBreakdown.map((entry) => [entry.label, entry.value]));
  const themeSections = portfolio.lists.themeSections ?? {};
  const totalValue = selectTotalValue(portfolio);

  return {
    sections: buildBudgetRemaining(
      sectionBreakdown,
      normalizedBudgets.sections,
      portfolio.lists.sections,
      (_label, entry) => entry?.percentage ?? 0,
    ),
    accounts: buildBudgetRemaining(
      accountBreakdown,
      normalizedBudgets.accounts,
      portfolio.lists.accounts,
      (_label, entry) => entry?.percentage ?? 0,
    ),
    themes: buildBudgetRemaining(
      themeBreakdown,
      normalizedBudgets.themes,
      portfolio.lists.themes,
      (label, entry) => {
        const section = themeSections[label];
        if (!section) {
          return entry?.percentage ?? 0;
        }
        const sectionValue = sectionTotals.get(section) ?? 0;
        if (!entry || sectionValue <= 0) {
          return 0;
        }
        return (entry.value / sectionValue) * 100;
      },
      (label) => themeSections[label],
      (label) => {
        const limit = normalizedBudgets.themes[label];
        const section = themeSections[label];

        if (!limit || !section) {
          return undefined;
        }

        const sectionLimit = normalizedBudgets.sections[section];
        const sectionValue = sectionTotals.get(section) ?? 0;
        const sectionTargetAmount = sectionLimit
          ? resolveBudgetAmount(sectionLimit, totalValue)
          : sectionValue;

        let amountLimit = limit.amount;
        let percentLimit = limit.percent;
        let sectionPercentLimit = limit.percentOfSection;

        if (sectionPercentLimit !== undefined && sectionTargetAmount !== undefined) {
          amountLimit = (sectionPercentLimit / 100) * sectionTargetAmount;
          percentLimit = totalValue > 0 ? (amountLimit / totalValue) * 100 : undefined;
        } else if (
          amountLimit !== undefined &&
          sectionTargetAmount !== undefined &&
          sectionTargetAmount > 0
        ) {
          sectionPercentLimit = (amountLimit / sectionTargetAmount) * 100;
          percentLimit = totalValue > 0 ? (amountLimit / totalValue) * 100 : undefined;
        } else if (percentLimit !== undefined && totalValue > 0) {
          amountLimit = (percentLimit / 100) * totalValue;
          sectionPercentLimit =
            sectionTargetAmount && sectionTargetAmount > 0
              ? (amountLimit / sectionTargetAmount) * 100
              : undefined;
        }

        return { amountLimit, percentLimit, sectionPercentLimit };
      },
    ),
  };
};
