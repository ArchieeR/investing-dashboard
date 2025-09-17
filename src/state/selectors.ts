import type { Holding, Portfolio, BudgetLimit } from './types';
import { calculateTargetDelta, roundToPennies } from '../utils/calculations';

const calculateHoldingValue = (holding: Holding): number => holding.price * holding.qty;

const filterIncludedHoldings = (holdings: Holding[]): Holding[] => holdings.filter((holding) => holding.include);

export const selectIncludedHoldings = (portfolio: Portfolio): Holding[] =>
  filterIncludedHoldings(portfolio.holdings);

export const selectTotalValue = (portfolio: Portfolio): number =>
  selectIncludedHoldings(portfolio).reduce((sum, holding) => sum + calculateHoldingValue(holding), 0);

export interface HoldingDerived {
  holding: Holding;
  value: number;
  pctOfTotal: number;
  pctOfSection: number;
  sectionTotal: number;
  targetValueDiff?: number;
  targetPctDiff?: number;
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

export const selectHoldingsWithDerived = (portfolio: Portfolio): HoldingDerived[] => {
  const included = selectIncludedHoldings(portfolio);
  const total = included.reduce((sum, holding) => sum + calculateHoldingValue(holding), 0);
  const sectionTotals = new Map<string, number>();

  included.forEach((holding) => {
    const value = calculateHoldingValue(holding);
    const current = sectionTotals.get(holding.section) ?? 0;
    sectionTotals.set(holding.section, current + value);
  });

  return portfolio.holdings.map((holding) => {
    const value = calculateHoldingValue(holding);
    const pctOfTotal = holding.include && total > 0 ? (value / total) * 100 : 0;
    const sectionTotal = holding.include ? sectionTotals.get(holding.section) ?? 0 : 0;
    const pctOfSection = holding.include && sectionTotal > 0 ? (value / sectionTotal) * 100 : 0;

    if (!holding.include || typeof holding.targetPct !== 'number' || total <= 0) {
      return {
        holding,
        value,
        pctOfTotal,
        pctOfSection,
        sectionTotal,
      };
    }

    const delta = calculateTargetDelta({ value, total, targetPct: holding.targetPct });

    return {
      holding,
      value,
      pctOfTotal,
      pctOfSection,
      sectionTotal,
      targetValueDiff: delta?.valueDiff,
      targetPctDiff: delta?.pctDiff,
    };
  });
};

export interface BreakdownEntry {
  label: string;
  value: number;
  percentage: number;
}

const buildBreakdown = (portfolio: Portfolio, field: keyof Holding): BreakdownEntry[] => {
  const included = selectIncludedHoldings(portfolio);
  const total = selectTotalValue(portfolio);

  const aggregates = new Map<string, number>();
  included.forEach((holding) => {
    const key = String(holding[field]);
    const current = aggregates.get(key) ?? 0;
    aggregates.set(key, current + calculateHoldingValue(holding));
  });

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
    ...Object.keys(normalizedBudgets ?? {}),
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
        const sectionLimit = section ? normalizedBudgets.sections[section] : undefined;
        const sectionAmount = section ? resolveBudgetAmount(sectionLimit, totalValue) : undefined;
        let amountLimit = limit?.amount;
        let percentLimit = limit?.percent;
        let sectionPercentLimit = limit?.percentOfSection;

        if (sectionPercentLimit !== undefined && sectionAmount !== undefined) {
          amountLimit = (sectionPercentLimit / 100) * sectionAmount;
          percentLimit = totalValue > 0 ? (amountLimit / totalValue) * 100 : undefined;
        } else if (amountLimit !== undefined && sectionAmount) {
          sectionPercentLimit = (amountLimit / sectionAmount) * 100;
        } else if (percentLimit !== undefined && sectionAmount) {
          amountLimit = (percentLimit / 100) * totalValue;
          sectionPercentLimit = sectionAmount > 0 ? (amountLimit / sectionAmount) * 100 : undefined;
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
