// =============================================================================
// Percentage Preservation - Maintains child ratios when parent allocations change
// Ported from _portfolio-reference/src/utils/percentagePreservation.ts
// =============================================================================

import type { BudgetLimit, Portfolio } from '@/types/portfolio';

export const preserveChildPercentageRatios = (
  childPercentages: Map<string, number>,
  parentOldPercent: number,
  parentNewPercent: number,
): Map<string, number> => {
  const adjustedPercentages = new Map<string, number>();

  if (parentOldPercent <= 0 || parentNewPercent < 0) {
    return adjustedPercentages;
  }

  const scaleFactor = parentNewPercent / parentOldPercent;

  for (const [key, percentage] of childPercentages) {
    if (percentage > 0) {
      adjustedPercentages.set(key, percentage * scaleFactor);
    }
  }

  return adjustedPercentages;
};

export const getThemePercentagesInSection = (
  portfolio: Portfolio,
  sectionName: string,
): Map<string, number> => {
  const themePercentages = new Map<string, number>();
  const themeSections = portfolio.lists.themeSections || {};
  const themeBudgets = portfolio.budgets?.themes || {};

  for (const [theme, section] of Object.entries(themeSections)) {
    if (section === sectionName) {
      const themeBudget = themeBudgets[theme];
      const percentage = themeBudget?.percentOfSection || 0;
      if (percentage > 0) {
        themePercentages.set(theme, percentage);
      }
    }
  }

  return themePercentages;
};

export const getHoldingPercentagesInTheme = (
  portfolio: Portfolio,
  themeName: string,
): Map<string, number> => {
  const holdingPercentages = new Map<string, number>();

  for (const holding of portfolio.holdings) {
    if (holding.theme === themeName && holding.targetPct && holding.targetPct > 0) {
      holdingPercentages.set(holding.id, holding.targetPct);
    }
  }

  return holdingPercentages;
};

export const preserveThemeRatiosOnSectionChange = (
  portfolio: Portfolio,
  sectionName: string,
  oldSectionPercent: number,
  newSectionPercent: number,
): Portfolio => {
  const themePercentages = getThemePercentagesInSection(portfolio, sectionName);

  if (themePercentages.size === 0 || oldSectionPercent <= 0) {
    return portfolio;
  }

  const preservedPercentages = preserveChildPercentageRatios(
    themePercentages,
    oldSectionPercent,
    newSectionPercent,
  );

  const updatedBudgets = { ...portfolio.budgets };
  const updatedThemes = { ...updatedBudgets.themes };

  for (const [theme, newPercentOfSection] of preservedPercentages) {
    const existingBudget = updatedThemes[theme] || {};
    updatedThemes[theme] = {
      ...existingBudget,
      percentOfSection: newPercentOfSection,
    };
  }

  return {
    ...portfolio,
    budgets: {
      ...updatedBudgets,
      themes: updatedThemes,
    },
  };
};

export const preserveHoldingRatiosOnThemeChange = (
  portfolio: Portfolio,
  themeName: string,
  oldThemePercent: number,
  newThemePercent: number,
): Portfolio => {
  const holdingPercentages = getHoldingPercentagesInTheme(portfolio, themeName);

  if (holdingPercentages.size === 0 || oldThemePercent <= 0) {
    return portfolio;
  }

  const preservedPercentages = preserveChildPercentageRatios(
    holdingPercentages,
    oldThemePercent,
    newThemePercent,
  );

  const updatedHoldings = portfolio.holdings.map((holding) => {
    const newTargetPct = preservedPercentages.get(holding.id);
    if (newTargetPct !== undefined) {
      return { ...holding, targetPct: newTargetPct };
    }
    return holding;
  });

  return {
    ...portfolio,
    holdings: updatedHoldings,
  };
};

export const calculateSectionCurrentPercent = (
  sectionBudget: BudgetLimit | undefined,
  totalPortfolioValue: number,
): number => {
  if (!sectionBudget) return 0;

  if (sectionBudget.percent !== undefined) {
    return sectionBudget.percent;
  }

  if (sectionBudget.amount !== undefined && totalPortfolioValue > 0) {
    return (sectionBudget.amount / totalPortfolioValue) * 100;
  }

  return 0;
};

export const calculateThemeCurrentPercent = (themeBudget: BudgetLimit | undefined): number => {
  if (!themeBudget) return 0;
  return themeBudget.percentOfSection || 0;
};
