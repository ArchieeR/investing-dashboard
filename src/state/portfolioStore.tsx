import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  createHolding,
  createInitialState,
  getActivePortfolio,
  createEmptyPortfolio,
  createDefaultVisibleColumns,
  type AppState,
  type Holding,
  type Portfolio,
  type PortfolioType,
  type BudgetLimit,
  type Lists,
  type Trade,
  type TradeType,
} from './types';
import { loadState, saveState } from './storage';
import {
  selectBreakdownByAccount,
  selectBreakdownBySection,
  selectBreakdownByTheme,
  selectBudgetRemaining,
  selectHoldingsWithDerived,
  selectTotalValue,
  selectTargetPortfolioValue,
  type BreakdownEntry,
  type HoldingDerived,
} from './selectors';
import { calculateCashBufferQty, roundToPennies } from '../utils/calculations';
import type { HoldingCsvRow } from '../utils/csv';
import {
  preserveThemeRatiosOnSectionChange,
  preserveHoldingRatiosOnThemeChange,
  calculateSectionCurrentPercent,
  calculateThemeCurrentPercent,
} from '../utils/percentagePreservation';

const INITIAL_STATE = (): AppState => {
  // Start with default state, we'll load from storage asynchronously
  return createInitialState();
};

const generatePortfolioId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `portfolio-${Math.random().toString(36).slice(2, 11)}`;
};

const generateTradeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `trade-${Math.random().toString(36).slice(2, 11)}`;
};

const createUniquePortfolioName = (existingNames: string[], base: string): string => {
  if (!existingNames.includes(base)) {
    return base;
  }

  let counter = 2;
  let candidate = `${base} ${counter}`;
  while (existingNames.includes(candidate)) {
    counter += 1;
    candidate = `${base} ${counter}`;
  }
  return candidate;
};

const applyTradeToHolding = (holding: Holding, trade: { type: TradeType; price: number; qty: number }): Holding => {
  const cleanQty = Number.isFinite(trade.qty) && trade.qty > 0 ? trade.qty : 0;
  const cleanPrice = Number.isFinite(trade.price) && trade.price >= 0 ? trade.price : 0;
  const currentQty = holding.qty;
  const currentAvg = holding.avgCost ?? holding.price ?? 0;

  if (trade.type === 'buy') {
    const newQty = currentQty + cleanQty;
    const totalCost = currentAvg * currentQty + cleanPrice * cleanQty;
    const newAvg = newQty > 0 ? totalCost / newQty : 0;
    return {
      ...holding,
      qty: newQty,
      avgCost: newAvg,
      price: cleanPrice > 0 ? cleanPrice : holding.price,
    };
  }

  const newQty = Math.max(0, currentQty - cleanQty);
  return {
    ...holding,
    qty: newQty,
    avgCost: newQty === 0 ? 0 : currentAvg,
  };
};

export type PortfolioAction =
  | { type: 'add-holding'; holding?: Holding }
  | { type: 'delete-holding'; id: string }
  | { type: 'duplicate-holding'; id: string }
  | { type: 'update-holding'; id: string; patch: Partial<Holding> }
  | { type: 'set-total'; total: number }
  | { type: 'set-filter'; key: keyof AppState['filters']; value?: string }
  | { type: 'set-budget'; domain: keyof Portfolio['budgets']; key: string; limit?: BudgetLimit }
  | { type: 'set-holding-target-percent'; holdingId: string; targetPct?: number }
  | { type: 'set-theme-section'; theme: string; section?: string }
  | { type: 'add-list-item'; domain: Exclude<keyof Lists, 'themeSections'>; value: string; section?: string }
  | { type: 'rename-list-item'; domain: Exclude<keyof Lists, 'themeSections'>; previous: string; next: string }
  | { type: 'remove-list-item'; domain: Exclude<keyof Lists, 'themeSections'>; value: string }
  | { type: 'reorder-list'; domain: Exclude<keyof Lists, 'themeSections'>; from: number; to: number }
  | { type: 'import-holdings'; rows: HoldingCsvRow[]; account?: string }
  | {
      type: 'record-trade';
      holdingId: string;
      trade: { type: TradeType; date: string; price: number; qty: number };
    }
  | { type: 'import-trades'; trades: { ticker: string; name?: string; type: TradeType; date: string; price: number; qty: number }[] }
  | { type: 'set-active-portfolio'; id: string }
  | { type: 'rename-portfolio'; id: string; name: string }
  | { type: 'add-portfolio'; id: string; name?: string; owner?: string; portfolioType?: PortfolioType; parentId?: string }
  | { type: 'remove-portfolio'; id: string }
  | { type: 'create-draft-portfolio'; parentId: string; name?: string }
  | { type: 'promote-draft-to-actual'; draftId: string }
  | { type: 'set-playground-enabled'; enabled: boolean }
  | { type: 'restore-playground' }
  | { type: 'restore-state'; state: AppState }
  | { type: 'restore-portfolio-backup'; portfolioData: Portfolio }
  | { type: 'update-portfolio-settings'; settings: Partial<Portfolio['settings']> }
  | { type: 'update-live-prices'; prices: Map<string, { price: number; change: number; changePercent: number; updated: Date; originalPrice?: number; originalCurrency?: string; conversionRate?: number }> };

const CASH_BUFFER_NAME = 'Cash buffer';
const CASH_BUFFER_PRICE = 1;
const CASH_SECTION = 'Cash';
const IMPORTED_LABEL = 'Imported';

const ensureCashLists = (lists: Lists): Lists => {
  let changed = false;

  const ensureSectionAtEnd = (items: string[], value: string): string[] => {
    const filtered = items.filter((item) => item !== value);
    const next = [...filtered, value];
    if (next.length === items.length && next.every((entry, index) => entry === items[index])) {
      return items;
    }
    changed = true;
    return next;
  };

  // Ensure Cash section at the end
  const sections = ensureSectionAtEnd(
    lists.sections.includes(CASH_SECTION) ? lists.sections : [...lists.sections, CASH_SECTION],
    CASH_SECTION
  );

  // Ensure Cash theme at the end
  const themes = ensureSectionAtEnd(
    lists.themes.includes(CASH_SECTION) ? lists.themes : [...lists.themes, CASH_SECTION],
    CASH_SECTION
  );

  // Ensure Cash theme maps to Cash section
  const themeSections = { ...lists.themeSections };
  if (themeSections[CASH_SECTION] !== CASH_SECTION) {
    themeSections[CASH_SECTION] = CASH_SECTION;
    changed = true;
  }

  if (!changed) {
    return lists;
  }

  return {
    ...lists,
    sections,
    themes,
    themeSections,
  };
};

const ensurePortfolioSettings = (portfolio: Portfolio): Portfolio => {
  const settings = portfolio.settings;
  let needsUpdate = false;
  
  // Ensure new settings exist with defaults
  const updatedSettings = { ...settings };
  
  if (updatedSettings.enableLivePrices === undefined) {
    updatedSettings.enableLivePrices = true;
    needsUpdate = true;
  }
  
  if (updatedSettings.livePriceUpdateInterval === undefined) {
    updatedSettings.livePriceUpdateInterval = 5;
    needsUpdate = true;
  }
  
  if (!updatedSettings.visibleColumns) {
    updatedSettings.visibleColumns = createDefaultVisibleColumns();
    needsUpdate = true;
  }
  
  if (!needsUpdate) {
    return portfolio;
  }
  
  return {
    ...portfolio,
    settings: updatedSettings,
  };
};

const ensureCashPortfolio = (portfolio: Portfolio): Portfolio => {
  const withSettings = ensurePortfolioSettings(portfolio);
  const nextLists = ensureCashLists(withSettings.lists);
  
  // Ensure new portfolio fields exist with defaults
  let needsPortfolioUpdate = false;
  const updatedPortfolio = { ...withSettings };
  
  if (!updatedPortfolio.type) {
    updatedPortfolio.type = 'actual';
    needsPortfolioUpdate = true;
  }
  
  if (!updatedPortfolio.owner) {
    updatedPortfolio.owner = 'Self';
    needsPortfolioUpdate = true;
  }
  
  if (!updatedPortfolio.createdAt) {
    updatedPortfolio.createdAt = new Date();
    needsPortfolioUpdate = true;
  }
  
  if (!updatedPortfolio.updatedAt) {
    updatedPortfolio.updatedAt = new Date();
    needsPortfolioUpdate = true;
  }
  
  if (nextLists === withSettings.lists && !needsPortfolioUpdate) {
    return updatedPortfolio;
  }

  return {
    ...updatedPortfolio,
    lists: nextLists,
  };
};

const createCashHolding = (portfolio: Portfolio): Holding => {
  const defaultAccount = portfolio.lists.accounts[0] ?? 'Brokerage';
  return createHolding({
    assetType: 'Cash',
    name: CASH_BUFFER_NAME,
    price: CASH_BUFFER_PRICE,
    section: CASH_SECTION,
    theme: CASH_SECTION, // Cash has its own theme
    account: defaultAccount,
    avgCost: CASH_BUFFER_PRICE,
  });
};

const updateActivePortfolio = (state: AppState, updater: (portfolio: Portfolio) => Portfolio): AppState => {
  const index = state.portfolios.findIndex((p) => p.id === state.activePortfolioId);
  if (index === -1) {
    return state;
  }

  const updatedPortfolio = ensureCashPortfolio(updater(state.portfolios[index]));
  const portfolios = state.portfolios.slice();
  portfolios[index] = updatedPortfolio;
  return { ...state, portfolios };
};

const applyHoldingPatch = (holding: Holding, patch: Partial<Holding>): Holding => ({
  ...holding,
  ...patch,
});

const holdingValue = (holding: Holding): number => holding.price * holding.qty;

const clonePortfolio = (portfolio: Portfolio): Portfolio =>
  JSON.parse(JSON.stringify(portfolio)) as Portfolio;

const resolveBudgetValue = (
  limit: BudgetLimit | undefined,
  targetTotal: number | undefined
): number | undefined => {
  if (!limit) {
    return undefined;
  }

  if (limit.amount !== undefined && Number.isFinite(limit.amount)) {
    return Math.max(limit.amount, 0);
  }

  if (limit.percent !== undefined && Number.isFinite(limit.percent) && targetTotal && targetTotal > 0) {
    return Math.max((limit.percent / 100) * targetTotal, 0);
  }

  return undefined;
};

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

const renameBudgetKey = (collection: Record<string, BudgetLimit>, previous: string, next: string) => {
  if (previous === next || !(previous in collection) || next in collection) {
    return collection;
  }

  const { [previous]: entry, ...rest } = collection;
  return { ...rest, [next]: entry };
};

const removeBudgetKey = (collection: Record<string, BudgetLimit>, key: string) => {
  if (!(key in collection)) {
    return collection;
  }

  const { [key]: _removed, ...rest } = collection;
  return rest;
};

const updateHoldingsField = (
  holdings: Holding[],
  field: 'section' | 'theme' | 'account',
  previous: string,
  next: string
) =>
  holdings.map((holding) => (holding[field] === previous ? { ...holding, [field]: next } : holding));

const adjustTotal = (portfolio: Portfolio, total: number): Portfolio => {
  if (!Number.isFinite(total) || total <= 0) {
    return portfolio;
  }

  const holdings = portfolio.holdings.slice();
  let cashIndex = holdings.findIndex(
    (holding) => holding.assetType === 'Cash' && holding.name === CASH_BUFFER_NAME
  );

  if (cashIndex === -1) {
    const cashHolding = createCashHolding(portfolio);
    holdings.push(cashHolding);
    cashIndex = holdings.length - 1;
  }

  const nonCashTotal = holdings.reduce((sum, holding, index) => {
    if (index === cashIndex || !holding.include) {
      return sum;
    }

    return sum + holding.price * holding.qty;
  }, 0);

  const cashQty = calculateCashBufferQty({ lockedTotal: total, nonCashTotal });
  const existingCash = holdings[cashIndex];
  holdings[cashIndex] = {
    ...existingCash,
    price: CASH_BUFFER_PRICE,
    qty: cashQty,
    include: true,
    section: CASH_SECTION,
    theme: CASH_SECTION, // Cash has its own theme
    account: existingCash.account || portfolio.lists.accounts[0] || 'Brokerage',
  };

  return { ...portfolio, holdings };
};

const normalizeTotalSetting = (total?: number) => (Number.isFinite(total) && total !== undefined ? total : undefined);

const applyThemeSections = (portfolio: Portfolio): Holding[] => {
  const themeSections = portfolio.lists.themeSections ?? {};
  return portfolio.holdings.map((holding) => {
    const targetSection = themeSections[holding.theme];
    if (targetSection && holding.section !== targetSection) {
      return { ...holding, section: targetSection };
    }
    return holding;
  });
};

const applyBudgetsAndLock = (portfolio: Portfolio): Portfolio => {
  const alignedHoldings = applyThemeSections(portfolio);
  const portfolioWithThemes =
    alignedHoldings === portfolio.holdings ? portfolio : { ...portfolio, holdings: alignedHoldings };

  // Apply total locking if enabled
  if (portfolioWithThemes.settings.lockTotal && portfolioWithThemes.settings.lockedTotal) {
    return adjustTotal(portfolioWithThemes, portfolioWithThemes.settings.lockedTotal);
  }

  return portfolioWithThemes;
};

export const portfolioReducer = (state: AppState, action: PortfolioAction): AppState => {
  switch (action.type) {
    case 'add-holding':
      return updateActivePortfolio(state, (portfolio) => {
        const holding =
          action.holding ??
          createHolding({
            section: portfolio.lists.sections[0] ?? 'Core',
            theme: portfolio.lists.themes[0] ?? 'All',
            account: portfolio.lists.accounts[0] ?? 'Brokerage',
          });

        return applyBudgetsAndLock({
          ...portfolio,
          holdings: [...portfolio.holdings, holding],
        });
      });
    case 'delete-holding':
      return updateActivePortfolio(state, (portfolio) =>
        applyBudgetsAndLock({
          ...portfolio,
          holdings: portfolio.holdings.filter((holding) => holding.id !== action.id),
        })
      );
    case 'duplicate-holding':
      return updateActivePortfolio(state, (portfolio) => {
        const existing = portfolio.holdings.find((holding) => holding.id === action.id);
        if (!existing) {
          return portfolio;
        }

        const { id: _ignored, ...rest } = existing;
        const clone = createHolding(rest);
        const targetIndex = portfolio.holdings.findIndex((holding) => holding.id === action.id);
        const next = portfolio.holdings.slice();
        next.splice(targetIndex + 1, 0, clone);
        return applyBudgetsAndLock({ ...portfolio, holdings: next });
      });
    case 'update-holding':
      return updateActivePortfolio(state, (portfolio) =>
        applyBudgetsAndLock({
          ...portfolio,
          holdings: portfolio.holdings.map((holding) =>
            holding.id === action.id ? applyHoldingPatch(holding, action.patch) : holding
          ),
        })
      );
    case 'set-total':
      return updateActivePortfolio(state, (portfolio) =>
        applyBudgetsAndLock({
          ...portfolio,
          settings: {
            ...portfolio.settings,
            lockTotal: true,
            lockedTotal: normalizeTotalSetting(action.total),
          },
        })
      );
    case 'set-filter': {
      const nextFilters = { ...state.filters };
      if (!action.value) {
        delete nextFilters[action.key];
      } else {
        nextFilters[action.key] = action.value;
      }

      return { ...state, filters: nextFilters };
    }
    case 'set-budget':
      return updateActivePortfolio(state, (portfolio) => {
        const currentBudgets = portfolio.budgets ?? { sections: {}, accounts: {}, themes: {} };
        const domainBudgets = { ...currentBudgets[action.domain] };

        const limit = action.limit;
        const normalized: BudgetLimit = {
          amount:
            limit?.amount !== undefined && Number.isFinite(limit.amount) ? Math.max(limit.amount, 0) : undefined,
          percent:
            limit?.percent !== undefined && Number.isFinite(limit.percent)
              ? Math.max(limit.percent, 0)
              : undefined,
          percentOfSection:
            limit?.percentOfSection !== undefined && Number.isFinite(limit.percentOfSection)
              ? Math.max(limit.percentOfSection, 0)
              : undefined,
        };

        // Get current values for percentage preservation
        const total = selectTotalValue(portfolio);
        let updatedPortfolio = portfolio;

        if (
          normalized.amount === undefined &&
          normalized.percent === undefined &&
          normalized.percentOfSection === undefined
        ) {
          delete domainBudgets[action.key];
        } else {
          // Handle percentage preservation based on domain
          if (action.domain === 'sections' && normalized.percent !== undefined) {
            // Section percentage changed - preserve theme ratios within this section
            const currentSectionBudget = currentBudgets.sections[action.key];
            const oldSectionPercent = calculateSectionCurrentPercent(currentSectionBudget, total);
            const newSectionPercent = normalized.percent;
            
            if (oldSectionPercent > 0 && newSectionPercent !== oldSectionPercent) {
              updatedPortfolio = preserveThemeRatiosOnSectionChange(
                portfolio,
                action.key,
                oldSectionPercent,
                newSectionPercent
              );
            }
          } else if (action.domain === 'themes' && normalized.percentOfSection !== undefined) {
            // Theme percentage changed - preserve holding ratios within this theme
            const currentThemeBudget = currentBudgets.themes[action.key];
            const oldThemePercent = calculateThemeCurrentPercent(currentThemeBudget);
            const newThemePercent = normalized.percentOfSection;
            
            if (oldThemePercent > 0 && newThemePercent !== oldThemePercent) {
              updatedPortfolio = preserveHoldingRatiosOnThemeChange(
                portfolio,
                action.key,
                oldThemePercent,
                newThemePercent
              );
            }

            // Calculate derived values for theme budgets
            const section = portfolio.lists.themeSections?.[action.key];
            if (section) {
              const normalizedSections = normalizeBudgetCollection(currentBudgets.sections);
              const sectionLimit = normalizedSections[section];
              const sectionPercent = sectionLimit?.percent ??
                (sectionLimit?.amount !== undefined && total > 0 ? (sectionLimit.amount / total) * 100 : undefined);
              const sectionAmount = sectionLimit?.amount ??
                (sectionPercent !== undefined && total > 0 ? (sectionPercent / 100) * total : undefined);

              if (sectionPercent !== undefined) {
                normalized.percent = (sectionPercent * normalized.percentOfSection) / 100;
              }

              if (sectionAmount !== undefined) {
                normalized.amount = (normalized.percentOfSection / 100) * sectionAmount;
              } else if (normalized.percent !== undefined && total > 0) {
                normalized.amount = (normalized.percent / 100) * total;
              }
            }
          }

          domainBudgets[action.key] = normalized;
        }

        const updated = {
          ...updatedPortfolio,
          budgets: {
            ...updatedPortfolio.budgets,
            [action.domain]: domainBudgets,
          },
        };

        return applyBudgetsAndLock(updated);
      });
    case 'set-holding-target-percent':
      return updateActivePortfolio(state, (portfolio) => {
        const holding = portfolio.holdings.find(h => h.id === action.holdingId);
        if (!holding) {
          return portfolio;
        }

        // Get current holding percentages in this theme for preservation
        const oldTargetPct = holding.targetPct || 0;
        const newTargetPct = action.targetPct || 0;

        // Update the specific holding
        const updatedHoldings = portfolio.holdings.map(h => {
          if (h.id === action.holdingId) {
            return {
              ...h,
              targetPct: newTargetPct > 0 ? newTargetPct : undefined
            };
          }
          return h;
        });

        const updatedPortfolio = {
          ...portfolio,
          holdings: updatedHoldings
        };

        return applyBudgetsAndLock(updatedPortfolio);
      });
    case 'set-theme-section':
      return updateActivePortfolio(state, (portfolio) => {
        const current = portfolio.lists.themeSections ?? {};
        const next = { ...current };
        if (!action.section) {
          delete next[action.theme];
        } else {
          next[action.theme] = action.section;
        }

        // Update all holdings that use this theme to the new section
        const updatedHoldings = portfolio.holdings.map(holding => {
          if (holding.theme === action.theme && action.section) {
            return {
              ...holding,
              section: action.section
            };
          }
          return holding;
        });

        const updated: Portfolio = {
          ...portfolio,
          holdings: updatedHoldings,
          lists: {
            ...portfolio.lists,
            themeSections: next,
          },
        };

        return applyBudgetsAndLock(updated);
      });
    case 'add-list-item': {
      const value = action.value.trim();
      if (!value) {
        return state;
      }

      return updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (list.includes(value)) {
          return portfolio;
        }

        list.push(value);
        if (action.domain === 'themes') {
          if (!lists.themeSections[value]) {
            lists.themeSections[value] = action.section || lists.sections[0];
          }
        }

        const updated: Portfolio = {
          ...portfolio,
          lists,
        };

        return applyBudgetsAndLock(updated);
      });
    }
    case 'rename-list-item': {
      if (action.domain === 'sections' && action.previous === CASH_SECTION) {
        return state;
      }

      const nextValue = action.next.trim();
      if (!nextValue || nextValue === action.previous) {
        return state;
      }

      const updatedState = updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (!list.includes(action.previous) || list.includes(nextValue)) {
          return portfolio;
        }

        const listIndex = list.indexOf(action.previous);
        list[listIndex] = nextValue;

        let holdings = portfolio.holdings;
        const budgets = normalizeBudgets(portfolio.budgets);
        const updatedBudgets = {
          sections: { ...budgets.sections },
          accounts: { ...budgets.accounts },
          themes: { ...budgets.themes },
        };
        const themeSections = { ...lists.themeSections };

        switch (action.domain) {
          case 'sections':
            holdings = updateHoldingsField(holdings, 'section', action.previous, nextValue);
            updatedBudgets.sections = renameBudgetKey(updatedBudgets.sections, action.previous, nextValue);
            Object.entries(themeSections).forEach(([theme, section]) => {
              if (section === action.previous) {
                themeSections[theme] = nextValue;
              }
            });
            break;
          case 'themes':
            holdings = updateHoldingsField(holdings, 'theme', action.previous, nextValue);
            updatedBudgets.themes = renameBudgetKey(updatedBudgets.themes, action.previous, nextValue);
            if (action.previous in themeSections) {
              const mappedSection = themeSections[action.previous];
              delete themeSections[action.previous];
              themeSections[nextValue] = mappedSection;
            }
            break;
          case 'accounts':
            holdings = updateHoldingsField(holdings, 'account', action.previous, nextValue);
            updatedBudgets.accounts = renameBudgetKey(updatedBudgets.accounts, action.previous, nextValue);
            break;
          default:
            return portfolio;
        }

        const updatedPortfolio: Portfolio = {
          ...portfolio,
          holdings,
          budgets: updatedBudgets,
          lists: {
            ...lists,
            themeSections,
          },
        };

        return applyBudgetsAndLock(updatedPortfolio);
      });

      if (updatedState === state) {
        return state;
      }

      const filters = { ...updatedState.filters };
      switch (action.domain) {
        case 'sections':
          if (filters.section === action.previous) {
            filters.section = action.next;
          }
          break;
        case 'themes':
          if (filters.theme === action.previous) {
            filters.theme = action.next;
          }
          break;
        case 'accounts':
          if (filters.account === action.previous) {
            filters.account = action.next;
          }
          break;
        default:
          break;
      }

      return { ...updatedState, filters };
    }
    case 'remove-list-item': {
      if (action.domain === 'sections' && action.value === CASH_SECTION) {
        return state;
      }

      const updatedState = updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (!list.includes(action.value) || list.length <= 1) {
          return portfolio;
        }

        const nextList = list.filter((item) => item !== action.value);
        (lists as Lists)[action.domain] = nextList as never;
        const fallback = nextList[0];

        let holdings = portfolio.holdings;
        const budgets = normalizeBudgets(portfolio.budgets);
        const updatedBudgets = {
          sections: { ...budgets.sections },
          accounts: { ...budgets.accounts },
          themes: { ...budgets.themes },
        };
        const themeSections = { ...lists.themeSections };

        switch (action.domain) {
          case 'sections':
            holdings = updateHoldingsField(holdings, 'section', action.value, fallback);
            updatedBudgets.sections = removeBudgetKey(updatedBudgets.sections, action.value);
            Object.entries(themeSections).forEach(([theme, section]) => {
              if (section === action.value) {
                themeSections[theme] = fallback;
              }
            });
            break;
          case 'themes':
            holdings = updateHoldingsField(holdings, 'theme', action.value, fallback);
            updatedBudgets.themes = removeBudgetKey(updatedBudgets.themes, action.value);
            delete themeSections[action.value];
            break;
          case 'accounts':
            holdings = updateHoldingsField(holdings, 'account', action.value, fallback);
            updatedBudgets.accounts = removeBudgetKey(updatedBudgets.accounts, action.value);
            break;
          default:
            return portfolio;
        }

        const updatedPortfolio: Portfolio = {
          ...portfolio,
          holdings,
          budgets: updatedBudgets,
          lists: {
            ...lists,
            themeSections,
          },
        };

        return applyBudgetsAndLock(updatedPortfolio);
      });

      if (updatedState === state) {
        return state;
      }

      const filters = { ...updatedState.filters };
      const active = getActivePortfolio(updatedState);
      switch (action.domain) {
        case 'sections':
          if (filters.section === action.value) {
            filters.section = active.lists.sections[0];
          }
          break;
        case 'themes':
          if (filters.theme === action.value) {
            filters.theme = active.lists.themes[0];
          }
          break;
        case 'accounts':
          if (filters.account === action.value) {
            filters.account = active.lists.accounts[0];
          }
          break;
        default:
          break;
      }

      return { ...updatedState, filters };
    }
    case 'reorder-list': {
      const { domain, from, to } = action;
      return updateActivePortfolio(state, (portfolio) => {
        const original = portfolio.lists[domain];
        const list = [...original];
        if (from < 0 || from >= list.length) {
          return portfolio;
        }

        const itemToMove = list[from];
        if (domain === 'sections' && itemToMove === CASH_SECTION) {
          return portfolio;
        }

        const [item] = list.splice(from, 1);
        const normalizedTarget = Math.min(Math.max(to, 0), list.length);
        list.splice(normalizedTarget, 0, item);

        const nextList = domain === 'sections'
          ? [...list.filter((value) => value !== CASH_SECTION), CASH_SECTION]
          : list;

        return {
          ...portfolio,
          lists: {
            ...portfolio.lists,
            [domain]: nextList,
          },
        };
      });
    }
    case 'import-holdings': {
      const { rows, account: chosenAccount } = action;
      const defaultTheme = 'All';

      const updated = updateActivePortfolio(state, (portfolio) => {
        const targetAccount = chosenAccount?.trim() || undefined;
        const dedupeKey = (holding: HoldingCsvRow) => `${(holding.ticker ?? '').trim().toLowerCase()}::${
          (holding.name ?? '').trim().toLowerCase()
        }`;
        const existingKeys = new Set(
          portfolio.holdings.map((holding) => `${holding.ticker.trim().toLowerCase()}::${holding.name.trim().toLowerCase()}`)
        );

        const holdings = portfolio.holdings.slice();
        const sections = new Set(portfolio.lists.sections);
        const themes = new Set(portfolio.lists.themes);
        const accounts = new Set(portfolio.lists.accounts);
        const themeSections = { ...(portfolio.lists.themeSections ?? {}) };

        rows.forEach((row) => {
          if (existingKeys.has(dedupeKey(row))) {
            return;
          }

          const section = row.section?.trim() || IMPORTED_LABEL;
          const theme = row.theme?.trim() || defaultTheme;
          const account = targetAccount || row.account?.trim() || IMPORTED_LABEL;

          sections.add(section);
          accounts.add(account);
          if (theme !== defaultTheme) {
            themes.add(theme);
            if (section) {
              themeSections[theme] = section;
            }
          }

          holdings.push(
            createHolding({
              section,
              theme,
              assetType: row.assetType ?? 'Other',
              name: row.name ?? '',
              ticker: row.ticker ?? '',
              account,
              price: row.price ?? 0,
              qty: row.qty ?? 0,
              include: row.include ?? true,
              targetPct: row.targetPct,
            })
          );
          existingKeys.add(dedupeKey(row));
        });

        const orderedSections = [...sections];
        const orderedThemes = [defaultTheme, ...[...themes].filter((label) => label !== defaultTheme)];
        const orderedAccounts = [...accounts];

        const lists = ensureCashLists({
          sections: orderedSections,
          themes: orderedThemes,
          accounts: orderedAccounts,
          themeSections,
        });

        return applyBudgetsAndLock({
          ...portfolio,
          holdings,
          lists,
          trades: portfolio.trades,
        });
      });

      return { ...updated, filters: {} };
    }
    case 'record-trade': {
      const { holdingId, trade } = action;

      return updateActivePortfolio(state, (portfolio) => {
        const index = portfolio.holdings.findIndex((holding) => holding.id === holdingId);
        if (index === -1) {
          return portfolio;
        }

        const date = trade.date || new Date().toISOString();
        const holdings = portfolio.holdings.slice();
        holdings[index] = applyTradeToHolding(holdings[index], trade);

        const trades: Trade[] = [
          ...portfolio.trades,
          {
            id: generateTradeId(),
            holdingId,
            type: trade.type,
            date,
            price: Number.isFinite(trade.price) ? trade.price : 0,
            qty: Number.isFinite(trade.qty) ? trade.qty : 0,
          },
        ];

        return applyBudgetsAndLock({
          ...portfolio,
          holdings,
          trades,
        });
      });
    }
    case 'import-trades': {
      const { trades: incoming } = action;
      return updateActivePortfolio(state, (portfolio) => {
        if (incoming.length === 0) {
          return portfolio;
        }

        const sections = new Set(portfolio.lists.sections);
        const themes = new Set(portfolio.lists.themes);
        const accounts = new Set(portfolio.lists.accounts);
        const themeSections = { ...(portfolio.lists.themeSections ?? {}) };

        const holdings = portfolio.holdings.slice();
        const trades = portfolio.trades.slice();

        incoming.forEach((tradeRow) => {
          const tickerKey = tradeRow.ticker.trim().toLowerCase();
          let index = holdings.findIndex((holding) => holding.ticker.trim().toLowerCase() === tickerKey);

          if (index === -1) {
            const section = 'Imported';
            const theme = 'All';
            sections.add(section);
            themes.add(theme);
            accounts.add(IMPORTED_LABEL);
            themeSections[theme] = section;

            const holding = createHolding({
              section,
              theme,
              assetType: 'Other',
              name: tradeRow.name ?? tradeRow.ticker,
              ticker: tradeRow.ticker,
              account: IMPORTED_LABEL,
              price: tradeRow.price,
              qty: 0,
              avgCost: tradeRow.price,
            });

            holdings.push(holding);
            index = holdings.length - 1;
          }

          holdings[index] = applyTradeToHolding(holdings[index], tradeRow);

          trades.push({
            id: generateTradeId(),
            holdingId: holdings[index].id,
            type: tradeRow.type,
            date: tradeRow.date || new Date().toISOString(),
            price: tradeRow.price,
            qty: tradeRow.qty,
          });
        });

        const lists = ensureCashLists({
          sections: [...sections],
          themes: [...themes],
          accounts: [...accounts],
          themeSections,
        });

        return applyBudgetsAndLock({
          ...portfolio,
          holdings,
          trades,
          lists,
        });
      });
    }
    case 'set-active-portfolio': {
      if (state.activePortfolioId === action.id) {
        return state;
      }

      const exists = state.portfolios.some((portfolio) => portfolio.id === action.id);
      if (!exists) {
        return state;
      }

      return {
        ...state,
        activePortfolioId: action.id,
        filters: {},
        playground: { enabled: false },
      };
    }
    case 'rename-portfolio': {
      const nextName = action.name.trim();
      if (!nextName) {
        return state;
      }

      const existingNames = state.portfolios
        .filter((portfolio) => portfolio.id !== action.id)
        .map((portfolio) => portfolio.name);
      const uniqueName = createUniquePortfolioName(existingNames, nextName);
      const portfolios = state.portfolios.map((portfolio) =>
        portfolio.id === action.id ? { ...portfolio, name: uniqueName } : portfolio
      );

      return {
        ...state,
        portfolios,
      };
    }
    case 'add-portfolio': {
      const baseName = action.name?.trim() || 'New Portfolio';
      const existingNames = state.portfolios.map((portfolio) => portfolio.name);
      const finalName = createUniquePortfolioName(existingNames, baseName);
      const portfolio = ensureCashPortfolio(createEmptyPortfolio(
        action.id, 
        finalName, 
        action.owner || 'Self', 
        action.portfolioType || 'actual',
        action.parentId
      ));

      return {
        ...state,
        portfolios: [...state.portfolios, portfolio],
        activePortfolioId: portfolio.id,
        filters: {},
        playground: { enabled: false },
      };
    }
    case 'create-draft-portfolio': {
      const parentPortfolio = state.portfolios.find(p => p.id === action.parentId);
      if (!parentPortfolio) {
        return state;
      }

      const baseName = action.name?.trim() || `${parentPortfolio.name} (Draft)`;
      const existingNames = state.portfolios.map((portfolio) => portfolio.name);
      const finalName = createUniquePortfolioName(existingNames, baseName);
      
      // Create draft by cloning the parent portfolio
      const draftId = generatePortfolioId();
      const draftPortfolio: Portfolio = {
        ...clonePortfolio(parentPortfolio),
        id: draftId,
        name: finalName,
        type: 'draft',
        parentId: action.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        ...state,
        portfolios: [...state.portfolios, draftPortfolio],
        activePortfolioId: draftId,
        filters: {},
        playground: { enabled: false },
      };
    }
    case 'promote-draft-to-actual': {
      const draftPortfolio = state.portfolios.find(p => p.id === action.draftId);
      if (!draftPortfolio || draftPortfolio.type !== 'draft' || !draftPortfolio.parentId) {
        return state;
      }

      const parentIndex = state.portfolios.findIndex(p => p.id === draftPortfolio.parentId);
      if (parentIndex === -1) {
        return state;
      }

      // Replace parent with draft data, remove draft
      const updatedParent: Portfolio = {
        ...draftPortfolio,
        id: draftPortfolio.parentId,
        name: state.portfolios[parentIndex].name, // Keep original name
        type: 'actual',
        parentId: undefined,
        updatedAt: new Date(),
      };

      const portfolios = [...state.portfolios];
      portfolios[parentIndex] = updatedParent;
      const filteredPortfolios = portfolios.filter(p => p.id !== action.draftId);

      return {
        ...state,
        portfolios: filteredPortfolios,
        activePortfolioId: updatedParent.id,
        filters: {},
        playground: { enabled: false },
      };
    }
    case 'remove-portfolio': {
      if (state.portfolios.length <= 1) {
        return state;
      }

      const portfolios = state.portfolios.filter((portfolio) => portfolio.id !== action.id);
      if (portfolios.length === state.portfolios.length) {
        return state;
      }

      const nextActiveId =
        state.activePortfolioId === action.id ? portfolios[0]?.id ?? state.activePortfolioId : state.activePortfolioId;

      return {
        ...state,
        portfolios,
        activePortfolioId: nextActiveId,
        filters: {},
        playground: { enabled: false },
      };
    }
    case 'set-playground-enabled': {
      if (action.enabled) {
        try {
          const active = getActivePortfolio(state);
          return {
            ...state,
            playground: {
              enabled: true,
              snapshot: clonePortfolio(active),
            },
          };
        } catch {
          return state;
        }
      }

      return {
        ...state,
        playground: { enabled: false },
      };
    }
    case 'restore-playground': {
      const snapshot = state.playground.snapshot;
      if (!snapshot) {
        return state;
      }

      const clonedSnapshot = clonePortfolio(snapshot);
      const portfolios = state.portfolios.map((portfolio) =>
        portfolio.id === clonedSnapshot.id ? clonePortfolio(clonedSnapshot) : portfolio
      );

      return {
        ...state,
        portfolios,
      };
    }
    case 'restore-state': {
      // Replace entire state with loaded state
      return action.state;
    }
    case 'restore-portfolio-backup': {
      // Replace current portfolio with backup data
      return updateActivePortfolio(state, () => {
        const restoredPortfolio = {
          ...action.portfolioData,
          id: state.portfolios.find(p => p.id === state.activePortfolioId)?.id || action.portfolioData.id,
          updatedAt: new Date(),
        };
        return ensureCashPortfolio(restoredPortfolio);
      });
    }
    case 'update-portfolio-settings':
      return updateActivePortfolio(state, (portfolio) => ({
        ...portfolio,
        settings: {
          ...portfolio.settings,
          ...action.settings,
        },
      }));
    case 'update-live-prices':
      return updateActivePortfolio(state, (portfolio) => {
        let hasChanges = false;
        const updatedHoldings = portfolio.holdings.map((holding) => {
          const priceData = action.prices.get(holding.ticker);
          if (priceData && holding.ticker && holding.assetType !== 'Cash') {
            // Ensure GBX prices are properly converted to GBP for calculations
            let calculationPrice = priceData.price;
            
            console.log(`📊 Processing ${holding.ticker}:`, {
              originalPrice: priceData.originalPrice,
              originalCurrency: priceData.originalCurrency,
              priceDataPrice: priceData.price,
              currentLivePrice: holding.livePrice,
              quantity: holding.qty,
              calculatedValue: holding.qty * (holding.livePrice || holding.price)
            });
            
            if (priceData.originalCurrency === 'GBX' || priceData.originalCurrency === 'GBp') {
              // If original currency is GBX/GBp (pence), convert to GBP for calculations
              calculationPrice = priceData.originalPrice * 0.01;
              console.log(`🔧 Converting ${holding.ticker}: ${priceData.originalPrice}p → £${calculationPrice}`);
              
              // Special debugging for ORCP
              if (holding.ticker === 'ORCP') {
                console.log(`🚨 ORCP Debug:`, {
                  originalPrice: priceData.originalPrice,
                  calculationPrice: calculationPrice,
                  quantity: holding.qty,
                  expectedValue: calculationPrice * holding.qty,
                  priceDataPrice: priceData.price
                });
              }
            } else if (holding.ticker.toUpperCase().endsWith('.L') && (priceData.price > 1000 || priceData.originalPrice > 1000)) {
              // Fallback: if it's a UK stock and price is suspiciously high, assume it's in pence
              const priceToConvert = priceData.originalPrice || priceData.price;
              calculationPrice = priceToConvert * 0.01;
              console.log(`🚨 Emergency conversion for ${holding.ticker}: ${priceToConvert}p → £${calculationPrice} (currency was: ${priceData.originalCurrency})`);
            }
            
            // Only update if the price has actually changed
            if (
              holding.livePrice !== calculationPrice ||
              holding.dayChange !== priceData.change ||
              holding.dayChangePercent !== priceData.changePercent
            ) {
              hasChanges = true;
              return {
                ...holding,
                livePrice: calculationPrice, // GBP converted price for calculations
                livePriceUpdated: priceData.updated,
                dayChange: priceData.change, // GBP converted change for calculations
                dayChangePercent: priceData.changePercent,
                originalLivePrice: priceData.originalPrice, // Original price for display
                originalCurrency: priceData.originalCurrency, // Original currency for display
                conversionRate: priceData.conversionRate,
              };
            }
          }
          return holding;
        });

        // Only return a new portfolio object if there were actual changes
        if (!hasChanges) {
          return portfolio;
        }

        return {
          ...portfolio,
          holdings: updatedHoldings,
        };
      });
    default:
      return state;
  }
};

interface PortfolioContextValue {
  portfolios: Array<{ id: string; name: string; type: PortfolioType; owner: string; parentId?: string }>;
  allPortfolios: Portfolio[];
  portfolio: Portfolio;
  derivedHoldings: HoldingDerived[];
  totalValue: number; // Allocated value (sum of live prices × quantities)
  targetPortfolioValue: number; // Target portfolio value for planning
  filters: AppState['filters'];
  bySection: BreakdownEntry[];
  byAccount: BreakdownEntry[];
  byTheme: BreakdownEntry[];
  budgets: Portfolio['budgets'];
  remaining: ReturnType<typeof selectBudgetRemaining>;
  trades: Trade[];
  setBudget: (domain: keyof Portfolio['budgets'], key: string, limit?: BudgetLimit) => void;
  setHoldingTargetPercent: (holdingId: string, targetPct?: number) => void;
  setThemeSection: (theme: string, section?: string) => void;
  addListItem: (domain: Exclude<keyof Lists, 'themeSections'>, value: string, section?: string) => void;
  renameListItem: (domain: Exclude<keyof Lists, 'themeSections'>, previous: string, next: string) => void;
  removeListItem: (domain: Exclude<keyof Lists, 'themeSections'>, value: string) => void;
  reorderList: (domain: Exclude<keyof Lists, 'themeSections'>, from: number, to: number) => void;
  importHoldings: (rows: HoldingCsvRow[], account?: string) => void;
  setActivePortfolio: (id: string) => void;
  renamePortfolio: (id: string, name: string) => void;
  addPortfolio: (name?: string, owner?: string, type?: PortfolioType, parentId?: string) => string;
  removePortfolio: (id: string) => void;
  createDraftPortfolio: (parentId: string, name?: string) => void;
  promoteDraftToActual: (draftId: string) => void;
  recordTrade: (holdingId: string, trade: { type: TradeType; date: string; price: number; qty: number }) => void;
  importTrades: (trades: { ticker: string; name?: string; type: TradeType; date: string; price: number; qty: number }[]) => void;
  playground: AppState['playground'];
  setPlaygroundEnabled: (enabled: boolean) => void;
  restorePlayground: () => void;
  restorePortfolioBackup: (portfolioData: Portfolio) => void;
  restoreFullBackup: (appState: AppState) => void;
  addHolding: (initial?: Partial<Holding>) => string;
  duplicateHolding: (id: string) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;
  setTotal: (total: number) => void;
  setTargetPortfolioValue: (value: number) => void;
  setFilter: (key: keyof AppState['filters'], value?: string) => void;
  updatePortfolioSettings: (settings: Partial<Portfolio['settings']>) => void;
  updateLivePrices: (prices: Map<string, { price: number; change: number; changePercent: number; updated: Date; originalPrice?: number; originalCurrency?: string; conversionRate?: number }>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export const PortfolioProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(portfolioReducer, undefined, INITIAL_STATE);
  const portfolio = useMemo(() => getActivePortfolio(state), [state]);
  const derivedHoldings = useMemo(() => selectHoldingsWithDerived(portfolio), [portfolio]);
  const totalValue = useMemo(() => selectTotalValue(portfolio), [portfolio]);
  const targetPortfolioValue = useMemo(() => selectTargetPortfolioValue(portfolio), [portfolio]);
  const bySection = useMemo(() => selectBreakdownBySection(portfolio), [portfolio]);
  const byAccount = useMemo(() => selectBreakdownByAccount(portfolio), [portfolio]);
  const byTheme = useMemo(() => selectBreakdownByTheme(portfolio), [portfolio]);
  const remaining = useMemo(() => selectBudgetRemaining(portfolio), [portfolio]);
  const budgets = useMemo(
    () => portfolio.budgets ?? { sections: {}, accounts: {}, themes: {} },
    [portfolio]
  );
  const portfoliosSummary = useMemo(
    () => state.portfolios.map((entry) => ({ 
      id: entry.id, 
      name: entry.name, 
      type: entry.type, 
      owner: entry.owner,
      parentId: entry.parentId 
    })),
    [state.portfolios]
  );

  // Track if we've loaded initial state to prevent premature saves
  const [hasLoadedInitialState, setHasLoadedInitialState] = React.useState(false);

  // Load state on mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const loaded = await loadState();
        if (loaded) {
          console.log('🔍 Loaded data from file:', {
            portfolios: loaded.portfolios.length,
            mainPortfolioHoldings: loaded.portfolios[0]?.holdings?.length || 0,
            firstHolding: loaded.portfolios[0]?.holdings?.[0]?.name || 'none'
          });
          
          // Restore ensureCashPortfolio to ensure data integrity
          const portfolios = loaded.portfolios.map(ensureCashPortfolio);
          const loadedState = { ...loaded, portfolios };
          
          console.log('🔍 State after processing:', {
            portfolios: loadedState.portfolios.length,
            mainPortfolioHoldings: loadedState.portfolios[0]?.holdings?.length || 0,
            firstHolding: loadedState.portfolios[0]?.holdings?.[0]?.name || 'none'
          });
          
          // Replace the entire state with loaded data
          dispatch({ type: 'restore-state', state: loadedState });
        }
        
        // Mark that we've completed initial loading (whether we found data or not)
        setHasLoadedInitialState(true);
      } catch (error) {
        console.error('Failed to load initial state:', error);
        setHasLoadedInitialState(true); // Still mark as loaded to enable saves
      }
    };
    
    loadInitialState();
  }, []); // Only run on mount

  useEffect(() => {
    // Don't save until we've loaded initial state to prevent overwriting saved data
    if (!hasLoadedInitialState) {
      console.log('⏳ Skipping save - initial state not loaded yet');
      return;
    }

    console.log('💾 Save effect triggered with state:', {
      portfolios: state.portfolios.length,
      mainPortfolioHoldings: state.portfolios[0]?.holdings?.length || 0,
      firstHolding: state.portfolios[0]?.holdings?.[0]?.name || 'none',
      activePortfolioId: state.activePortfolioId
    });
    
    // Add error handling for save
    saveState(state).catch(error => {
      console.error('❌ Save effect failed:', error);
    });
  }, [state, hasLoadedInitialState]);

  const addHolding = useCallback((initial?: Partial<Holding>) => {
    const holding = createHolding(initial);
    dispatch({ type: 'add-holding', holding });
    return holding.id;
  }, []);
  const duplicateHolding = useCallback((id: string) => dispatch({ type: 'duplicate-holding', id }), []);
  const deleteHolding = useCallback((id: string) => dispatch({ type: 'delete-holding', id }), []);
  const updateHolding = useCallback(
    (id: string, patch: Partial<Holding>) => dispatch({ type: 'update-holding', id, patch }),
    []
  );
  const setTotal = useCallback((total: number) => dispatch({ type: 'set-total', total }), []);
  const setTargetPortfolioValue = useCallback(
    (value: number) => dispatch({ type: 'update-portfolio-settings', settings: { targetPortfolioValue: value } }),
    []
  );
  const setFilter = useCallback(
    (key: keyof AppState['filters'], value?: string) => dispatch({ type: 'set-filter', key, value }),
    []
  );
  const updatePortfolioSettings = useCallback(
    (settings: Partial<Portfolio['settings']>) => dispatch({ type: 'update-portfolio-settings', settings }),
    []
  );
  const updateLivePrices = useCallback(
    (prices: Map<string, { price: number; change: number; changePercent: number; updated: Date; originalPrice?: number; originalCurrency?: string; conversionRate?: number }>) =>
      dispatch({ type: 'update-live-prices', prices }),
    []
  );
  const setBudget = useCallback(
    (domain: keyof Portfolio['budgets'], key: string, limit?: BudgetLimit) =>
      dispatch({ type: 'set-budget', domain, key, limit }),
    []
  );
  const setHoldingTargetPercent = useCallback(
    (holdingId: string, targetPct?: number) =>
      dispatch({ type: 'set-holding-target-percent', holdingId, targetPct }),
    []
  );
  const setThemeSection = useCallback(
    (theme: string, section?: string) => dispatch({ type: 'set-theme-section', theme, section }),
    []
  );
  const addListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, value: string, section?: string) =>
      dispatch({ type: 'add-list-item', domain, value, section }),
    []
  );
  const renameListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, previous: string, next: string) =>
      dispatch({ type: 'rename-list-item', domain, previous, next }),
    []
  );
  const removeListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, value: string) =>
      dispatch({ type: 'remove-list-item', domain, value }),
    []
  );
  const reorderList = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, from: number, to: number) =>
      dispatch({ type: 'reorder-list', domain, from, to }),
    []
  );
  const importHoldings = useCallback(
    (rows: HoldingCsvRow[], account?: string) => dispatch({ type: 'import-holdings', rows, account }),
    []
  );
  const recordTrade = useCallback(
    (holdingId: string, trade: { type: TradeType; date: string; price: number; qty: number }) =>
      dispatch({ type: 'record-trade', holdingId, trade }),
    []
  );
  const setActivePortfolio = useCallback((id: string) => dispatch({ type: 'set-active-portfolio', id }), []);
  const renamePortfolio = useCallback(
    (id: string, name: string) => dispatch({ type: 'rename-portfolio', id, name }),
    []
  );
  const addPortfolio = useCallback(
    (name?: string, owner?: string, type?: PortfolioType, parentId?: string) => {
      const id = generatePortfolioId();
      dispatch({ type: 'add-portfolio', id, name, owner, portfolioType: type, parentId });
      return id;
    },
    []
  );
  const removePortfolio = useCallback((id: string) => dispatch({ type: 'remove-portfolio', id }), []);
  const createDraftPortfolio = useCallback(
    (parentId: string, name?: string) => dispatch({ type: 'create-draft-portfolio', parentId, name }),
    []
  );
  const promoteDraftToActual = useCallback(
    (draftId: string) => dispatch({ type: 'promote-draft-to-actual', draftId }),
    []
  );
  const importTrades = useCallback(
    (trades: { ticker: string; name?: string; type: TradeType; date: string; price: number; qty: number }[]) =>
      dispatch({ type: 'import-trades', trades }),
    []
  );
  const setPlaygroundEnabled = useCallback(
    (enabled: boolean) => dispatch({ type: 'set-playground-enabled', enabled }),
    []
  );
  const restorePlayground = useCallback(() => dispatch({ type: 'restore-playground' }), []);
  const restorePortfolioBackup = useCallback(
    (portfolioData: Portfolio) => dispatch({ type: 'restore-portfolio-backup', portfolioData }),
    []
  );
  
  const restoreFullBackup = useCallback(
    (appState: AppState) => {
      console.log('🔄 Starting restore with data:', {
        portfolios: appState.portfolios.length,
        mainPortfolioHoldings: appState.portfolios[0]?.holdings?.length || 0,
        firstHolding: appState.portfolios[0]?.holdings?.[0]?.name || 'none'
      });
      
      // Just update the state - let the save effect handle saving
      dispatch({ type: 'restore-state', state: appState });
      console.log('✅ Backup data restored to state');
    },
    []
  );

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolios: portfoliosSummary,
      allPortfolios: state.portfolios,
      portfolio,
      derivedHoldings,
      totalValue,
      targetPortfolioValue,
      bySection,
      byAccount,
      byTheme,
      filters: state.filters,
      budgets,
      remaining,
      trades: portfolio.trades,
      setThemeSection,
      addListItem,
      renameListItem,
      removeListItem,
      reorderList,
      importHoldings,
      recordTrade,
      importTrades,
      setActivePortfolio,
      renamePortfolio,
      addPortfolio,
      removePortfolio,
      createDraftPortfolio,
      promoteDraftToActual,
      playground: state.playground,
      setPlaygroundEnabled,
      restorePlayground,
      restorePortfolioBackup,
      addHolding,
      duplicateHolding,
      updateHolding,
      deleteHolding,
      setTotal,
      setTargetPortfolioValue,
      setFilter,
      updatePortfolioSettings,
      updateLivePrices,
      setBudget,
      setHoldingTargetPercent,
      restoreFullBackup,
    }),
    [
      portfoliosSummary,
      state.portfolios,
      portfolio,
      derivedHoldings,
      totalValue,
      targetPortfolioValue,
      bySection,
      byAccount,
      byTheme,
      budgets,
      state.filters,
      setThemeSection,
      addListItem,
      renameListItem,
      removeListItem,
      reorderList,
      importHoldings,
      recordTrade,
      importTrades,
      setActivePortfolio,
      renamePortfolio,
      addPortfolio,
      removePortfolio,
      createDraftPortfolio,
      promoteDraftToActual,
      state.playground,
      setPlaygroundEnabled,
      restorePlayground,
      restorePortfolioBackup,
      addHolding,
      duplicateHolding,
      updateHolding,
      deleteHolding,
      setTotal,
      setTargetPortfolioValue,
      setFilter,
      updatePortfolioSettings,
      updateLivePrices,
      setBudget,
      setHoldingTargetPercent,
      restoreFullBackup,
      remaining,
    ]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

export const usePortfolio = (): PortfolioContextValue => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }

  return ctx;
};
