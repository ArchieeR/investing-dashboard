/**
 * Utility functions for preserving percentage relationships when parent allocations change
 */

import type { BudgetLimit, Portfolio, Holding } from '../state/types';

/**
 * Preserves child percentage ratios when a parent percentage changes
 * @param childPercentages - Map of child keys to their current percentages
 * @param parentOldPercent - Previous parent percentage
 * @param parentNewPercent - New parent percentage
 * @returns Map of child keys to their adjusted percentages
 */
export const preserveChildPercentageRatios = (
  childPercentages: Map<string, number>,
  parentOldPercent: number,
  parentNewPercent: number
): Map<string, number> => {
  const adjustedPercentages = new Map<string, number>();
  
  // If parent percentage is 0 or invalid, return empty map
  if (parentOldPercent <= 0 || parentNewPercent < 0) {
    return adjustedPercentages;
  }
  
  // Calculate the scaling factor
  const scaleFactor = parentNewPercent / parentOldPercent;
  
  // Apply scaling to each child percentage
  for (const [key, percentage] of childPercentages) {
    if (percentage > 0) {
      adjustedPercentages.set(key, percentage * scaleFactor);
    }
  }
  
  return adjustedPercentages;
};

/**
 * Gets theme percentages within a specific section
 * @param portfolio - Portfolio containing budget data
 * @param sectionName - Name of the section to get themes for
 * @returns Map of theme names to their percentages within the section
 */
export const getThemePercentagesInSection = (
  portfolio: Portfolio,
  sectionName: string
): Map<string, number> => {
  const themePercentages = new Map<string, number>();
  const themeSections = portfolio.lists.themeSections || {};
  const themeBudgets = portfolio.budgets?.themes || {};
  
  // Find all themes that belong to this section
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

/**
 * Gets holding target percentages within a specific theme
 * @param portfolio - Portfolio containing holdings data
 * @param themeName - Name of the theme to get holdings for
 * @returns Map of holding IDs to their target percentages within the theme
 */
export const getHoldingPercentagesInTheme = (
  portfolio: Portfolio,
  themeName: string
): Map<string, number> => {
  const holdingPercentages = new Map<string, number>();
  
  // Find all holdings that belong to this theme
  for (const holding of portfolio.holdings) {
    if (holding.theme === themeName && holding.targetPct && holding.targetPct > 0) {
      holdingPercentages.set(holding.id, holding.targetPct);
    }
  }
  
  return holdingPercentages;
};

/**
 * Updates theme budgets to preserve their percentage ratios when section percentage changes
 * @param portfolio - Portfolio to update
 * @param sectionName - Name of the section that changed
 * @param oldSectionPercent - Previous section percentage
 * @param newSectionPercent - New section percentage
 * @returns Updated portfolio with preserved theme percentage ratios
 */
export const preserveThemeRatiosOnSectionChange = (
  portfolio: Portfolio,
  sectionName: string,
  oldSectionPercent: number,
  newSectionPercent: number
): Portfolio => {
  // Get current theme percentages in this section
  const themePercentages = getThemePercentagesInSection(portfolio, sectionName);
  
  // If no themes or invalid percentages, return unchanged
  if (themePercentages.size === 0 || oldSectionPercent <= 0) {
    return portfolio;
  }
  
  // Calculate preserved percentages
  const preservedPercentages = preserveChildPercentageRatios(
    themePercentages,
    oldSectionPercent,
    newSectionPercent
  );
  
  // Update theme budgets
  const updatedBudgets = { ...portfolio.budgets };
  const updatedThemes = { ...updatedBudgets.themes };
  
  for (const [theme, newPercentOfSection] of preservedPercentages) {
    const existingBudget = updatedThemes[theme] || {};
    updatedThemes[theme] = {
      ...existingBudget,
      percentOfSection: newPercentOfSection
    };
  }
  
  return {
    ...portfolio,
    budgets: {
      ...updatedBudgets,
      themes: updatedThemes
    }
  };
};

/**
 * Updates holding target percentages to preserve their ratios when theme percentage changes
 * @param portfolio - Portfolio to update
 * @param themeName - Name of the theme that changed
 * @param oldThemePercent - Previous theme percentage (of section)
 * @param newThemePercent - New theme percentage (of section)
 * @returns Updated portfolio with preserved holding percentage ratios
 */
export const preserveHoldingRatiosOnThemeChange = (
  portfolio: Portfolio,
  themeName: string,
  oldThemePercent: number,
  newThemePercent: number
): Portfolio => {
  // Get current holding percentages in this theme
  const holdingPercentages = getHoldingPercentagesInTheme(portfolio, themeName);
  
  // If no holdings or invalid percentages, return unchanged
  if (holdingPercentages.size === 0 || oldThemePercent <= 0) {
    return portfolio;
  }
  
  // Calculate preserved percentages
  const preservedPercentages = preserveChildPercentageRatios(
    holdingPercentages,
    oldThemePercent,
    newThemePercent
  );
  
  // Update holding target percentages
  const updatedHoldings = portfolio.holdings.map(holding => {
    const newTargetPct = preservedPercentages.get(holding.id);
    if (newTargetPct !== undefined) {
      return {
        ...holding,
        targetPct: newTargetPct
      };
    }
    return holding;
  });
  
  return {
    ...portfolio,
    holdings: updatedHoldings
  };
};

/**
 * Calculates the current percentage of a section from its budget
 * @param sectionBudget - Budget limit for the section
 * @param totalPortfolioValue - Total portfolio value for percentage calculation
 * @returns Current percentage of the section, or 0 if not calculable
 */
export const calculateSectionCurrentPercent = (
  sectionBudget: BudgetLimit | undefined,
  totalPortfolioValue: number
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

/**
 * Calculates the current percentage of a theme within its section
 * @param themeBudget - Budget limit for the theme
 * @returns Current percentage of the theme within its section, or 0 if not set
 */
export const calculateThemeCurrentPercent = (
  themeBudget: BudgetLimit | undefined
): number => {
  if (!themeBudget) return 0;
  return themeBudget.percentOfSection || 0;
};