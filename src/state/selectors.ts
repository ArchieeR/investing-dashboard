import type { Holding, Portfolio, BudgetLimit } from './types';
import { calculateTargetDelta, roundToPennies, calculateProfitLoss } from '../utils/calculations';

/**
 * Result of holding value calculation containing both live and manual values
 */
interface HoldingValueResult {
  /** Current market value using live price if available, otherwise manual price */
  value: number;
  /** Live market value using live price (if available) or manual price as fallback */
  liveValue: number;
  /** Manual value using only the manual price */
  manualValue: number;
  /** Difference between live and manual values (dayChange equivalent) */
  dayChangeValue: number;
  /** Whether live price was actually used in the calculation */
  usedLivePrice: boolean;
}

/**
 * Live portfolio totals based on actual holdings and current prices
 */
interface LivePortfolioTotals {
  /** Total allocated value using live prices */
  totalAllocatedValue: number;
  /** Section totals using live values */
  sectionTotals: Map<string, number>;
  /** Theme totals using live values */
  themeTotals: Map<string, number>;
}

/**
 * Target calculation results for a section
 */
interface SectionTarget {
  /** User-set percentage of portfolio */
  percentage: number;
  /** Calculated target value (portfolioTarget * percentage) */
  targetValue: number;
  /** Current allocated live value */
  allocatedValue: number;
}

/**
 * Target calculation results for a theme
 */
interface ThemeTarget {
  /** Parent section */
  section: string;
  /** User-set percentage of section */
  percentage: number;
  /** Calculated percentage of total portfolio */
  percentageOfPortfolio: number;
  /** Calculated target value (sectionTarget * percentage) */
  targetValue: number;
  /** Current allocated live value */
  allocatedValue: number;
}

/**
 * Complete target hierarchy calculations
 */
interface TargetHierarchy {
  /** Target portfolio value */
  portfolioTarget: number;
  /** Section target calculations */
  sectionTargets: Map<string, SectionTarget>;
  /** Theme target calculations */
  themeTargets: Map<string, ThemeTarget>;
}

/**
 * Calculates holding values with clear separation between live and manual calculations.
 * 
 * Live values should be used for:
 * - Current portfolio totals and percentages
 * - Real-time portfolio tracking
 * - Profit/loss calculations
 * 
 * Manual values should be used for:
 * - Fallback when live prices are unavailable
 * - Historical comparisons
 * - User-entered price scenarios
 * 
 * @param holding The holding to calculate values for
 * @returns Object containing both live and manual values with metadata
 */
const calculateHoldingValue = (holding: Holding): HoldingValueResult => {
  const livePrice = holding.livePrice;
  const manualPrice = holding.price;
  const qty = holding.qty;
  
  // Always calculate manual value using manual price
  const manualValue = manualPrice * qty;
  
  // Determine if we can use live price
  const usedLivePrice = livePrice !== undefined;
  const effectivePrice = usedLivePrice ? livePrice : manualPrice;
  
  // Live value uses live price if available, otherwise falls back to manual price
  const liveValue = effectivePrice * qty;
  
  // Current value is the same as live value (prioritizes live price)
  const value = liveValue;
  
  // Day change is the difference between live and manual values
  const dayChangeValue = usedLivePrice ? liveValue - manualValue : 0;
  
  return {
    value,
    liveValue,
    manualValue,
    dayChangeValue,
    usedLivePrice
  };
};

const filterIncludedHoldings = (holdings: Holding[]): Holding[] => holdings.filter((holding) => holding.include);

/**
 * Calculates live portfolio totals based on actual holdings and current prices.
 * This is completely separate from target calculations.
 */
const calculateLivePortfolioTotals = (holdings: Holding[]): LivePortfolioTotals => {
  const included = filterIncludedHoldings(holdings);
  const sectionTotals = new Map<string, number>();
  const themeTotals = new Map<string, number>();
  let totalAllocatedValue = 0;

  included.forEach((holding) => {
    const { liveValue } = calculateHoldingValue(holding);
    
    totalAllocatedValue += liveValue;
    
    const currentSection = sectionTotals.get(holding.section) ?? 0;
    sectionTotals.set(holding.section, currentSection + liveValue);
    
    const currentTheme = themeTotals.get(holding.theme) ?? 0;
    themeTotals.set(holding.theme, currentTheme + liveValue);
  });

  return {
    totalAllocatedValue,
    sectionTotals,
    themeTotals
  };
};

/**
 * Calculates target hierarchy using proper Portfolio → Section → Theme structure.
 * Supports both explicit target portfolio value and legacy fallback behavior.
 */
const calculateTargetHierarchy = (portfolio: Portfolio, liveTotals: LivePortfolioTotals): TargetHierarchy | null => {
  const portfolioTarget = portfolio.settings.targetPortfolioValue;
  const normalizedBudgets = normalizeBudgets(portfolio.budgets);
  const sectionTargets = new Map<string, SectionTarget>();
  const themeTargets = new Map<string, ThemeTarget>();

  // If target portfolio value is set, use proper hierarchy
  if (portfolioTarget && portfolioTarget > 0) {
    // Calculate section targets first (Portfolio → Section)
    portfolio.lists.sections.forEach((section) => {
      const sectionBudget = normalizedBudgets.sections[section];
      const percentage = sectionBudget?.percent ?? 0;
      const targetValue = (percentage / 100) * portfolioTarget;
      const allocatedValue = liveTotals.sectionTotals.get(section) ?? 0;

      sectionTargets.set(section, {
        percentage,
        targetValue,
        allocatedValue
      });
    });

    // Calculate theme targets (Section → Theme)
    portfolio.lists.themes.forEach((theme) => {
      const themeBudget = normalizedBudgets.themes[theme];
      const section = portfolio.lists.themeSections?.[theme];
      

      
      if (section && themeBudget?.percentOfSection) {
        const sectionTarget = sectionTargets.get(section);
        if (sectionTarget) {
          const percentage = themeBudget.percentOfSection;
          const targetValue = (percentage / 100) * sectionTarget.targetValue;
          const percentageOfPortfolio = portfolioTarget > 0 ? (targetValue / portfolioTarget) * 100 : 0;
          const allocatedValue = liveTotals.themeTotals.get(theme) ?? 0;

          themeTargets.set(theme, {
            section,
            percentage,
            percentageOfPortfolio,
            targetValue,
            allocatedValue
          });

        }
      }
    });

    return {
      portfolioTarget,
      sectionTargets,
      themeTargets
    };
  }

  // Legacy fallback: use current theme totals as targets for backward compatibility
  // This allows target calculations to work even without explicit target portfolio value
  const fallbackPortfolioTarget = liveTotals.totalAllocatedValue;
  
  if (fallbackPortfolioTarget <= 0) {
    return null;
  }

  // Create fallback theme targets using current theme totals
  portfolio.lists.themes.forEach((theme) => {
    const themeTotal = liveTotals.themeTotals.get(theme) ?? 0;
    const section = portfolio.lists.themeSections?.[theme] ?? 'Core';
    
    if (themeTotal > 0) {
      themeTargets.set(theme, {
        section,
        percentage: 100, // 100% of current theme total
        percentageOfPortfolio: fallbackPortfolioTarget > 0 ? (themeTotal / fallbackPortfolioTarget) * 100 : 0,
        targetValue: themeTotal,
        allocatedValue: themeTotal
      });
    }
  });

  return {
    portfolioTarget: fallbackPortfolioTarget,
    sectionTargets,
    themeTargets
  };
};

export const selectIncludedHoldings = (portfolio: Portfolio): Holding[] =>
  filterIncludedHoldings(portfolio.holdings);

export const selectTotalValue = (portfolio: Portfolio): number => {
  const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
  return liveTotals.totalAllocatedValue;
};

export const selectTargetPortfolioValue = (portfolio: Portfolio): number =>
  portfolio.settings.targetPortfolioValue ?? 0;

export interface HoldingDerived {
  holding: Holding;
  /** Current market value (live price if available, otherwise manual price) */
  value: number;
  /** Live market value (live price if available, otherwise manual price as fallback) */
  liveValue: number;
  /** Manual value using only manual price */
  manualValue: number;
  /** Difference between live and manual values */
  dayChangeValue: number;
  /** Whether live price was used in calculation */
  usedLivePrice: boolean;
  /** Percentage of total portfolio (based on live values) */
  pctOfTotal: number;
  /** Percentage of section (based on live values) */
  pctOfSection: number;
  /** Total value of the section (based on live values) */
  sectionTotal: number;
  /** Percentage of theme (based on live values) */
  pctOfTheme: number;
  /** Target value for this holding (if target system is enabled) */
  targetValue?: number;
  /** Difference between current and target value */
  targetValueDiff?: number;
  /** Percentage difference from target */
  targetPctDiff?: number;
  /** Profit/loss calculations based on current price vs average cost */
  profitLoss?: {
    /** Total gain/loss in absolute currency terms */
    totalGain: number;
    /** Total gain/loss as percentage of cost basis */
    totalGainPercent: number;
    /** Day change in absolute currency terms */
    dayChangeValue: number;
    /** Day change as percentage */
    dayChangePercent: number;
    /** Cost basis (avgCost × quantity) */
    costBasis: number;
    /** Current market value */
    marketValue: number;
  };
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

// Separate caches for live and target calculations to enable independent invalidation
const liveCalculationCache = new Map<string, {
  liveTotals: LivePortfolioTotals;
  liveResults: Map<string, HoldingValueResult & { profitLoss?: HoldingDerived['profitLoss'] }>;
}>();

const targetCalculationCache = new Map<string, {
  targetHierarchy: TargetHierarchy | null;
  targetResults: Map<string, { targetValue?: number; targetValueDiff?: number; targetPctDiff?: number; }>;
}>();

const derivedHoldingsCache = new Map<string, HoldingDerived[]>();

/**
 * Generates cache key for live calculations based only on data that affects live values
 */
const generateLiveCacheKey = (portfolio: Portfolio): string => {
  // Only include data that affects live calculations
  const liveDataKey = portfolio.holdings.map(h => 
    `${h.id}-${h.qty}-${h.price}-${h.livePrice}-${h.avgCost}-${h.dayChange}-${h.dayChangePercent}-${h.include}-${h.section}-${h.theme}-${h.account}-${h.assetType}-${h.exchange}`
  ).join('|');
  
  return `live:${liveDataKey}`;
};

/**
 * Generates cache key for target calculations based only on data that affects target values
 */
const generateTargetCacheKey = (portfolio: Portfolio): string => {
  // Only include data that affects target calculations
  const targetDataKey = portfolio.holdings.map(h => 
    `${h.id}-${h.targetPct}-${h.include}-${h.section}-${h.theme}-${h.account}-${h.assetType}-${h.exchange}`
  ).join('|');
  
  const targetValue = portfolio.settings.targetPortfolioValue ?? 0;
  
  // Include budget information that affects target calculations
  const budgetsKey = JSON.stringify({
    sections: portfolio.budgets?.sections || {},
    themes: portfolio.budgets?.themes || {}
  });
  
  // Include theme-section mappings that affect target hierarchy
  const themeSectionsKey = JSON.stringify(portfolio.lists.themeSections || {});
  
  return `target:${targetDataKey}-${targetValue}-${budgetsKey}-${themeSectionsKey}`;
};

/**
 * Generates combined cache key for final derived holdings results
 */
const generateDerivedCacheKey = (liveKey: string, targetKey: string): string => {
  return `derived:${liveKey}|${targetKey}`;
};

/**
 * Cache invalidation functions for selective cache clearing
 */
export const cacheInvalidation = {
  /**
   * Invalidates only live calculation caches when live prices or quantities change
   * This should be called when: live prices update, quantities change, holdings added/removed
   */
  invalidateLiveCalculations: () => {
    liveCalculationCache.clear();
    derivedHoldingsCache.clear(); // Derived cache depends on live calculations
  },

  /**
   * Invalidates only target calculation caches when target settings change
   * This should be called when: target percentages change, target portfolio value changes, budgets change
   */
  invalidateTargetCalculations: () => {
    targetCalculationCache.clear();
    derivedHoldingsCache.clear(); // Derived cache depends on target calculations
  },

  /**
   * Invalidates both live and target caches when structural changes occur
   * This should be called when: holdings added/removed, sections/themes change
   */
  invalidateAllCalculations: () => {
    liveCalculationCache.clear();
    targetCalculationCache.clear();
    derivedHoldingsCache.clear();
  },

  /**
   * Gets cache statistics for debugging and monitoring
   */
  getCacheStats: () => ({
    liveCache: {
      size: liveCalculationCache.size,
      keys: Array.from(liveCalculationCache.keys())
    },
    targetCache: {
      size: targetCalculationCache.size,
      keys: Array.from(targetCalculationCache.keys())
    },
    derivedCache: {
      size: derivedHoldingsCache.size,
      keys: Array.from(derivedHoldingsCache.keys())
    }
  })
};

export const selectHoldingsWithDerived = (portfolio: Portfolio): HoldingDerived[] => {
  // Generate separate cache keys for live and target calculations
  const liveCacheKey = generateLiveCacheKey(portfolio);
  const targetCacheKey = generateTargetCacheKey(portfolio);
  const derivedCacheKey = generateDerivedCacheKey(liveCacheKey, targetCacheKey);
  
  // Check if we have the final derived result cached
  const cachedDerived = derivedHoldingsCache.get(derivedCacheKey);
  if (cachedDerived) {
    return cachedDerived;
  }

  // Get or calculate live calculations
  let liveCache = liveCalculationCache.get(liveCacheKey);
  if (!liveCache) {
    // Calculate live portfolio totals (completely separate from targets)
    const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
    
    // Calculate live results for each holding
    const liveResults = new Map<string, HoldingValueResult & { profitLoss?: HoldingDerived['profitLoss'] }>();
    
    portfolio.holdings.forEach((holding) => {
      const holdingValue = calculateHoldingValue(holding);
      
      // Calculate profit/loss if we have the necessary data
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
    
    // Clean up old live cache entries (keep only last 10)
    if (liveCalculationCache.size > 10) {
      const keys = Array.from(liveCalculationCache.keys());
      const oldKeys = keys.slice(0, keys.length - 10);
      oldKeys.forEach(key => liveCalculationCache.delete(key));
    }
  }

  // Get or calculate target calculations
  let targetCache = targetCalculationCache.get(targetCacheKey);
  if (!targetCache) {
    // Calculate target hierarchy (only when target portfolio value is set)
    const targetHierarchy = calculateTargetHierarchy(portfolio, liveCache.liveTotals);
    
    // Calculate target results for each holding
    const targetResults = new Map<string, { targetValue?: number; targetValueDiff?: number; targetPctDiff?: number; }>();
    
    portfolio.holdings.forEach((holding) => {
      // Add target calculations only if holding has target percentage and is included
      if (!holding.include || typeof holding.targetPct !== 'number') {
        targetResults.set(holding.id, {});
        return;
      }

      const liveResult = liveCache!.liveResults.get(holding.id);
      if (!liveResult) {
        targetResults.set(holding.id, {});
        return;
      }

      // If we have a proper target hierarchy with explicit target portfolio value, use it
      if (targetHierarchy && portfolio.settings.targetPortfolioValue && portfolio.settings.targetPortfolioValue > 0) {
        const themeTarget = targetHierarchy.themeTargets.get(holding.theme);
        
        if (themeTarget && themeTarget.targetValue > 0) {
          // Use proper hierarchy: holding target = theme target × holding percentage
          const targetValue = (holding.targetPct / 100) * themeTarget.targetValue;
          
          // Calculate target delta using theme target as base
          const delta = calculateTargetDelta({ 
            value: liveResult.liveValue, 
            total: themeTarget.targetValue, 
            targetPct: holding.targetPct 
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

      // Legacy fallback: use current theme total as base (for backward compatibility)
      const themeTotal = liveCache!.liveTotals.themeTotals.get(holding.theme) ?? 0;
      
      if (themeTotal <= 0) {
        targetResults.set(holding.id, {});
        return;
      }

      // Calculate target value and delta using theme total as base
      const delta = calculateTargetDelta({ 
        value: liveResult.liveValue, 
        total: themeTotal, 
        targetPct: holding.targetPct 
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
    
    // Clean up old target cache entries (keep only last 10)
    if (targetCalculationCache.size > 10) {
      const keys = Array.from(targetCalculationCache.keys());
      const oldKeys = keys.slice(0, keys.length - 10);
      oldKeys.forEach(key => targetCalculationCache.delete(key));
    }
  }

  // Combine live and target results
  const result = portfolio.holdings.map((holding) => {
    const liveResult = liveCache!.liveResults.get(holding.id)!;
    const targetResult = targetCache!.targetResults.get(holding.id)!;
    
    // Live percentage calculations (always based on live values)
    const pctOfTotal = holding.include && liveCache!.liveTotals.totalAllocatedValue > 0 
      ? (liveResult.liveValue / liveCache!.liveTotals.totalAllocatedValue) * 100 
      : 0;
    
    const sectionTotal = holding.include ? liveCache!.liveTotals.sectionTotals.get(holding.section) ?? 0 : 0;
    const pctOfSection = holding.include && sectionTotal > 0 
      ? (liveResult.liveValue / sectionTotal) * 100 
      : 0;
    
    // Calculate percentage of target theme total (not current theme total)
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

  // Cache the final derived result
  derivedHoldingsCache.set(derivedCacheKey, result);
  
  // Clean up old derived cache entries (keep only last 10)
  if (derivedHoldingsCache.size > 10) {
    const keys = Array.from(derivedHoldingsCache.keys());
    const oldKeys = keys.slice(0, keys.length - 10);
    oldKeys.forEach(key => derivedHoldingsCache.delete(key));
  }
  
  return result;
};

export interface BreakdownEntry {
  label: string;
  value: number;
  percentage: number;
}

const buildBreakdown = (portfolio: Portfolio, field: keyof Holding): BreakdownEntry[] => {
  const liveTotals = calculateLivePortfolioTotals(portfolio.holdings);
  const total = liveTotals.totalAllocatedValue;

  // Use the appropriate totals map based on the field
  let aggregates: Map<string, number>;
  if (field === 'section') {
    aggregates = liveTotals.sectionTotals;
  } else if (field === 'theme') {
    aggregates = liveTotals.themeTotals;
  } else {
    // For account or other fields, calculate manually
    const included = selectIncludedHoldings(portfolio);
    aggregates = new Map<string, number>();
    included.forEach((holding) => {
      const key = String(holding[field]);
      const current = aggregates.get(key) ?? 0;
      aggregates.set(key, current + calculateHoldingValue(holding).liveValue);
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
          value.amount !== undefined && Number.isFinite(value.amount) ? Math.max(value.amount, 0) : undefined,
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

const resolveBudgetAmount = (limit: BudgetLimit | undefined, total: number | undefined): number | undefined => {
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
  augment?: (label: string) => Partial<BudgetRemaining> | undefined
): BudgetRemaining[] => {
  const normalizedBudgets = normalizeBudgetCollection(budgets);
  const entriesByLabel = new Map<string, BreakdownEntry>();
  breakdown.forEach((entry) => entriesByLabel.set(entry.label, entry));

  const labels = new Set<string>([
    ...options,
    ...breakdown.map((entry) => entry.label),
    // Only include budget keys that are also in the options list
    ...Object.keys(normalizedBudgets ?? {}).filter(key => options.includes(key)),
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
      (_label, entry) => entry?.percentage ?? 0
    ),
    accounts: buildBudgetRemaining(
      accountBreakdown,
      normalizedBudgets.accounts,
      portfolio.lists.accounts,
      (_label, entry) => entry?.percentage ?? 0
    ),
    themes: buildBudgetRemaining(
      themeBreakdown,
      normalizedBudgets.themes,
      portfolio.lists.themes,
      (label, entry) => {
        // Calculate theme percentage relative to its section total (not portfolio total)
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
        // Theme budget calculation following proper hierarchy:
        // Portfolio → Section → Theme
        // Theme target = Section target × Theme percentage of section
        const limit = normalizedBudgets.themes[label];
        const section = themeSections[label];
        
        if (!limit || !section) {
          return undefined;
        }

        const sectionLimit = normalizedBudgets.sections[section];
        const sectionValue = sectionTotals.get(section) ?? 0;
        
        // Calculate section target amount (used as basis for theme calculations)
        const sectionTargetAmount = sectionLimit ? resolveBudgetAmount(sectionLimit, totalValue) : sectionValue;
        
        let amountLimit = limit.amount;
        let percentLimit = limit.percent;
        let sectionPercentLimit = limit.percentOfSection;

        // Priority 1: Theme percentage of section (preferred approach)
        // Theme target = Section target × (Theme % of Section)
        if (sectionPercentLimit !== undefined && sectionTargetAmount !== undefined) {
          amountLimit = (sectionPercentLimit / 100) * sectionTargetAmount;
          percentLimit = totalValue > 0 ? (amountLimit / totalValue) * 100 : undefined;
        }
        // Priority 2: Theme absolute amount
        // Calculate what percentage this represents of the section
        else if (amountLimit !== undefined && sectionTargetAmount !== undefined && sectionTargetAmount > 0) {
          sectionPercentLimit = (amountLimit / sectionTargetAmount) * 100;
          percentLimit = totalValue > 0 ? (amountLimit / totalValue) * 100 : undefined;
        }
        // Priority 3: Theme percentage of total portfolio
        // Calculate amount and derive section percentage
        else if (percentLimit !== undefined && totalValue > 0) {
          amountLimit = (percentLimit / 100) * totalValue;
          sectionPercentLimit = sectionTargetAmount && sectionTargetAmount > 0 ? (amountLimit / sectionTargetAmount) * 100 : undefined;
        }

        return {
          amountLimit,
          percentLimit,
          sectionPercentLimit,
        };
      }
    ),
  };
};
