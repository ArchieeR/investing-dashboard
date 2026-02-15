// =============================================================================
// Portfolio Reducer - 32 actions with useReducer pattern
// =============================================================================

import type {
  AppState,
  BudgetLimit,
  Holding,
  Lists,
  Portfolio,
  PortfolioType,
  Trade,
  TradeType,
} from '@/types/portfolio';
import {
  CASH_BUFFER_NAME,
  CASH_BUFFER_PRICE,
  CASH_SECTION,
  IMPORTED_LABEL,
  createEmptyPortfolio,
  createHolding,
  createDefaultVisibleColumns,
  getActivePortfolio,
  generatePortfolioId,
  generateTradeId,
} from './factory';
import { calculateCashBufferQty } from './calculations';
import { selectTotalValue } from './selectors';
import {
  preserveThemeRatiosOnSectionChange,
  preserveHoldingRatiosOnThemeChange,
  calculateSectionCurrentPercent,
  calculateThemeCurrentPercent,
} from './budget-preservation';
import type { HoldingCsvRow } from './csv';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

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
  | {
      type: 'add-list-item';
      domain: Exclude<keyof Lists, 'themeSections'>;
      value: string;
      section?: string;
    }
  | {
      type: 'rename-list-item';
      domain: Exclude<keyof Lists, 'themeSections'>;
      previous: string;
      next: string;
    }
  | { type: 'remove-list-item'; domain: Exclude<keyof Lists, 'themeSections'>; value: string }
  | {
      type: 'reorder-list';
      domain: Exclude<keyof Lists, 'themeSections'>;
      from: number;
      to: number;
    }
  | { type: 'import-holdings'; rows: HoldingCsvRow[]; account?: string }
  | {
      type: 'record-trade';
      holdingId: string;
      trade: { type: TradeType; date: string; price: number; qty: number };
    }
  | {
      type: 'import-trades';
      trades: {
        ticker: string;
        name?: string;
        type: TradeType;
        date: string;
        price: number;
        qty: number;
      }[];
    }
  | { type: 'set-active-portfolio'; id: string }
  | { type: 'rename-portfolio'; id: string; name: string }
  | {
      type: 'add-portfolio';
      id: string;
      name?: string;
      portfolioType?: PortfolioType;
      parentId?: string;
    }
  | { type: 'remove-portfolio'; id: string }
  | { type: 'create-draft-portfolio'; parentId: string; name?: string }
  | { type: 'promote-draft-to-actual'; draftId: string }
  | { type: 'set-playground-enabled'; enabled: boolean }
  | { type: 'restore-playground' }
  | { type: 'restore-state'; state: AppState }
  | { type: 'restore-portfolio-backup'; portfolioData: Portfolio }
  | { type: 'update-portfolio-settings'; settings: Partial<Portfolio['settings']> }
  | {
      type: 'update-live-prices';
      prices: Map<
        string,
        {
          price: number;
          change: number;
          changePercent: number;
          updated: Date;
          originalPrice?: number;
          originalCurrency?: string;
          conversionRate?: number;
        }
      >;
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export const applyTradeToHolding = (
  holding: Holding,
  trade: { type: TradeType; price: number; qty: number },
): Holding => {
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

  const sections = ensureSectionAtEnd(
    lists.sections.includes(CASH_SECTION) ? lists.sections : [...lists.sections, CASH_SECTION],
    CASH_SECTION,
  );
  const themes = ensureSectionAtEnd(
    lists.themes.includes(CASH_SECTION) ? lists.themes : [...lists.themes, CASH_SECTION],
    CASH_SECTION,
  );

  const themeSections = { ...lists.themeSections };
  if (themeSections[CASH_SECTION] !== CASH_SECTION) {
    themeSections[CASH_SECTION] = CASH_SECTION;
    changed = true;
  }

  if (!changed) {
    return lists;
  }

  return { ...lists, sections, themes, themeSections };
};

const ensurePortfolioSettings = (portfolio: Portfolio): Portfolio => {
  const settings = portfolio.settings;
  let needsUpdate = false;
  const updatedSettings = { ...settings };

  if (updatedSettings.enableLivePrices === undefined) {
    updatedSettings.enableLivePrices = true;
    needsUpdate = true;
  }
  if (updatedSettings.livePriceUpdateInterval === undefined) {
    updatedSettings.livePriceUpdateInterval = 10;
    needsUpdate = true;
  }
  if (!updatedSettings.visibleColumns) {
    updatedSettings.visibleColumns = createDefaultVisibleColumns();
    needsUpdate = true;
  }

  if (!needsUpdate) {
    return portfolio;
  }
  return { ...portfolio, settings: updatedSettings };
};

export const ensureCashPortfolio = (portfolio: Portfolio): Portfolio => {
  const withSettings = ensurePortfolioSettings(portfolio);
  const nextLists = ensureCashLists(withSettings.lists);

  let needsPortfolioUpdate = false;
  const updatedPortfolio = { ...withSettings };

  if (!updatedPortfolio.type) {
    updatedPortfolio.type = 'actual';
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

  return { ...updatedPortfolio, lists: nextLists };
};

const createCashHolding = (portfolio: Portfolio): Holding => {
  const defaultAccount = portfolio.lists.accounts[0] ?? 'Brokerage';
  return createHolding({
    assetType: 'Cash',
    name: CASH_BUFFER_NAME,
    price: CASH_BUFFER_PRICE,
    section: CASH_SECTION,
    theme: CASH_SECTION,
    account: defaultAccount,
    avgCost: CASH_BUFFER_PRICE,
  });
};

export const updateActivePortfolio = (
  state: AppState,
  updater: (portfolio: Portfolio) => Portfolio,
): AppState => {
  const index = state.portfolios.findIndex((p) => p.id === state.activePortfolioId);
  if (index === -1) {
    return state;
  }

  const updatedPortfolio = ensureCashPortfolio(updater(state.portfolios[index]));
  const portfolios = state.portfolios.slice();
  portfolios[index] = updatedPortfolio;
  return { ...state, portfolios };
};

const clonePortfolio = (portfolio: Portfolio): Portfolio =>
  JSON.parse(JSON.stringify(portfolio)) as Portfolio;

const normalizeBudgetCollection = (collection?: Record<string, BudgetLimit | number>) => {
  const next: Record<string, BudgetLimit> = {};
  if (!collection) return next;

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

const renameBudgetKey = (
  collection: Record<string, BudgetLimit>,
  previous: string,
  next: string,
) => {
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
  next: string,
) =>
  holdings.map((holding) =>
    holding[field] === previous ? { ...holding, [field]: next } : holding,
  );

export const adjustTotal = (portfolio: Portfolio, total: number): Portfolio => {
  if (!Number.isFinite(total) || total <= 0) {
    return portfolio;
  }

  const holdings = portfolio.holdings.slice();
  let cashIndex = holdings.findIndex(
    (holding) => holding.assetType === 'Cash' && holding.name === CASH_BUFFER_NAME,
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
    theme: CASH_SECTION,
    account: existingCash.account || portfolio.lists.accounts[0] || 'Brokerage',
  };

  return { ...portfolio, holdings };
};

const normalizeTotalSetting = (total?: number) =>
  Number.isFinite(total) && total !== undefined ? total : undefined;

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

export const applyBudgetsAndLock = (portfolio: Portfolio): Portfolio => {
  const alignedHoldings = applyThemeSections(portfolio);
  const portfolioWithThemes =
    alignedHoldings === portfolio.holdings
      ? portfolio
      : { ...portfolio, holdings: alignedHoldings };

  if (portfolioWithThemes.settings.lockTotal && portfolioWithThemes.settings.lockedTotal) {
    return adjustTotal(portfolioWithThemes, portfolioWithThemes.settings.lockedTotal);
  }

  return portfolioWithThemes;
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

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
        return applyBudgetsAndLock({ ...portfolio, holdings: [...portfolio.holdings, holding] });
      });

    case 'delete-holding':
      return updateActivePortfolio(state, (portfolio) =>
        applyBudgetsAndLock({
          ...portfolio,
          holdings: portfolio.holdings.filter((h) => h.id !== action.id),
        }),
      );

    case 'duplicate-holding':
      return updateActivePortfolio(state, (portfolio) => {
        const existing = portfolio.holdings.find((h) => h.id === action.id);
        if (!existing) return portfolio;
        const { id: _ignored, ...rest } = existing;
        const clone = createHolding(rest);
        const targetIndex = portfolio.holdings.findIndex((h) => h.id === action.id);
        const next = portfolio.holdings.slice();
        next.splice(targetIndex + 1, 0, clone);
        return applyBudgetsAndLock({ ...portfolio, holdings: next });
      });

    case 'update-holding':
      return updateActivePortfolio(state, (portfolio) =>
        applyBudgetsAndLock({
          ...portfolio,
          holdings: portfolio.holdings.map((h) =>
            h.id === action.id ? { ...h, ...action.patch } : h,
          ),
        }),
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
        }),
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
            limit?.amount !== undefined && Number.isFinite(limit.amount)
              ? Math.max(limit.amount, 0)
              : undefined,
          percent:
            limit?.percent !== undefined && Number.isFinite(limit.percent)
              ? Math.max(limit.percent, 0)
              : undefined,
          percentOfSection:
            limit?.percentOfSection !== undefined && Number.isFinite(limit.percentOfSection)
              ? Math.max(limit.percentOfSection, 0)
              : undefined,
        };

        const total = selectTotalValue(portfolio);
        let updatedPortfolio = portfolio;

        if (
          normalized.amount === undefined &&
          normalized.percent === undefined &&
          normalized.percentOfSection === undefined
        ) {
          delete domainBudgets[action.key];
        } else {
          if (action.domain === 'sections' && normalized.percent !== undefined) {
            const currentSectionBudget = currentBudgets.sections[action.key];
            const oldSectionPercent = calculateSectionCurrentPercent(currentSectionBudget, total);
            const newSectionPercent = normalized.percent;

            if (oldSectionPercent > 0 && newSectionPercent !== oldSectionPercent) {
              updatedPortfolio = preserveThemeRatiosOnSectionChange(
                portfolio,
                action.key,
                oldSectionPercent,
                newSectionPercent,
              );
            }
          } else if (action.domain === 'themes' && normalized.percentOfSection !== undefined) {
            const currentThemeBudget = currentBudgets.themes[action.key];
            const oldThemePercent = calculateThemeCurrentPercent(currentThemeBudget);
            const newThemePercent = normalized.percentOfSection;

            if (oldThemePercent > 0 && newThemePercent !== oldThemePercent) {
              updatedPortfolio = preserveHoldingRatiosOnThemeChange(
                portfolio,
                action.key,
                oldThemePercent,
                newThemePercent,
              );
            }

            const section = portfolio.lists.themeSections?.[action.key];
            if (section) {
              const normalizedSections = normalizeBudgetCollection(currentBudgets.sections);
              const sectionLimit = normalizedSections[section];
              const sectionPercent =
                sectionLimit?.percent ??
                (sectionLimit?.amount !== undefined && total > 0
                  ? (sectionLimit.amount / total) * 100
                  : undefined);
              const sectionAmount =
                sectionLimit?.amount ??
                (sectionPercent !== undefined && total > 0
                  ? (sectionPercent / 100) * total
                  : undefined);

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

        return applyBudgetsAndLock({
          ...updatedPortfolio,
          budgets: { ...updatedPortfolio.budgets, [action.domain]: domainBudgets },
        });
      });

    case 'set-holding-target-percent':
      return updateActivePortfolio(state, (portfolio) => {
        const holding = portfolio.holdings.find((h) => h.id === action.holdingId);
        if (!holding) return portfolio;

        const newTargetPct = action.targetPct || 0;
        const updatedHoldings = portfolio.holdings.map((h) => {
          if (h.id === action.holdingId) {
            return { ...h, targetPct: newTargetPct > 0 ? newTargetPct : undefined };
          }
          return h;
        });

        return applyBudgetsAndLock({ ...portfolio, holdings: updatedHoldings });
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

        const updatedHoldings = portfolio.holdings.map((holding) => {
          if (holding.theme === action.theme && action.section) {
            return { ...holding, section: action.section };
          }
          return holding;
        });

        return applyBudgetsAndLock({
          ...portfolio,
          holdings: updatedHoldings,
          lists: { ...portfolio.lists, themeSections: next },
        });
      });

    case 'add-list-item': {
      const value = action.value.trim();
      if (!value) return state;

      return updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (list.includes(value)) return portfolio;

        list.push(value);
        if (action.domain === 'themes') {
          if (!lists.themeSections[value]) {
            lists.themeSections[value] = action.section || lists.sections[0];
          }
        }

        return applyBudgetsAndLock({ ...portfolio, lists });
      });
    }

    case 'rename-list-item': {
      if (action.domain === 'sections' && action.previous === CASH_SECTION) return state;

      const nextValue = action.next.trim();
      if (!nextValue || nextValue === action.previous) return state;

      const updatedState = updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (!list.includes(action.previous) || list.includes(nextValue)) return portfolio;

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
            updatedBudgets.sections = renameBudgetKey(
              updatedBudgets.sections,
              action.previous,
              nextValue,
            );
            Object.entries(themeSections).forEach(([theme, section]) => {
              if (section === action.previous) themeSections[theme] = nextValue;
            });
            break;
          case 'themes':
            holdings = updateHoldingsField(holdings, 'theme', action.previous, nextValue);
            updatedBudgets.themes = renameBudgetKey(
              updatedBudgets.themes,
              action.previous,
              nextValue,
            );
            if (action.previous in themeSections) {
              const mappedSection = themeSections[action.previous];
              delete themeSections[action.previous];
              themeSections[nextValue] = mappedSection;
            }
            break;
          case 'accounts':
            holdings = updateHoldingsField(holdings, 'account', action.previous, nextValue);
            updatedBudgets.accounts = renameBudgetKey(
              updatedBudgets.accounts,
              action.previous,
              nextValue,
            );
            break;
          default:
            return portfolio;
        }

        return applyBudgetsAndLock({
          ...portfolio,
          holdings,
          budgets: updatedBudgets,
          lists: { ...lists, themeSections },
        });
      });

      if (updatedState === state) return state;

      const filters = { ...updatedState.filters };
      switch (action.domain) {
        case 'sections':
          if (filters.section === action.previous) filters.section = action.next;
          break;
        case 'themes':
          if (filters.theme === action.previous) filters.theme = action.next;
          break;
        case 'accounts':
          if (filters.account === action.previous) filters.account = action.next;
          break;
      }
      return { ...updatedState, filters };
    }

    case 'remove-list-item': {
      if (action.domain === 'sections' && action.value === CASH_SECTION) return state;

      const updatedState = updateActivePortfolio(state, (portfolio) => {
        const lists: Lists = {
          ...portfolio.lists,
          sections: [...portfolio.lists.sections],
          themes: [...portfolio.lists.themes],
          accounts: [...portfolio.lists.accounts],
          themeSections: { ...(portfolio.lists.themeSections ?? {}) },
        };

        const list = lists[action.domain] as string[];
        if (!list.includes(action.value) || list.length <= 1) return portfolio;

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
              if (section === action.value) themeSections[theme] = fallback;
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

        return applyBudgetsAndLock({
          ...portfolio,
          holdings,
          budgets: updatedBudgets,
          lists: { ...lists, themeSections },
        });
      });

      if (updatedState === state) return state;

      const filters = { ...updatedState.filters };
      const active = getActivePortfolio(updatedState);
      switch (action.domain) {
        case 'sections':
          if (filters.section === action.value) filters.section = active.lists.sections[0];
          break;
        case 'themes':
          if (filters.theme === action.value) filters.theme = active.lists.themes[0];
          break;
        case 'accounts':
          if (filters.account === action.value) filters.account = active.lists.accounts[0];
          break;
      }
      return { ...updatedState, filters };
    }

    case 'reorder-list': {
      const { domain, from, to } = action;
      return updateActivePortfolio(state, (portfolio) => {
        const original = portfolio.lists[domain];
        const list = [...original];
        if (from < 0 || from >= list.length) return portfolio;

        const itemToMove = list[from];
        if (domain === 'sections' && itemToMove === CASH_SECTION) return portfolio;

        const [item] = list.splice(from, 1);
        const normalizedTarget = Math.min(Math.max(to, 0), list.length);
        list.splice(normalizedTarget, 0, item);

        const nextList =
          domain === 'sections'
            ? [...list.filter((v) => v !== CASH_SECTION), CASH_SECTION]
            : list;

        return { ...portfolio, lists: { ...portfolio.lists, [domain]: nextList } };
      });
    }

    case 'import-holdings': {
      const { rows, account: chosenAccount } = action;
      const defaultTheme = 'All';

      const updated = updateActivePortfolio(state, (portfolio) => {
        const targetAccount = chosenAccount?.trim() || undefined;
        const dedupeKey = (holding: HoldingCsvRow) =>
          `${(holding.ticker ?? '').trim().toLowerCase()}::${(holding.name ?? '').trim().toLowerCase()}`;
        const existingKeys = new Set(
          portfolio.holdings.map(
            (h) => `${h.ticker.trim().toLowerCase()}::${h.name.trim().toLowerCase()}`,
          ),
        );

        const holdings = portfolio.holdings.slice();
        const sections = new Set(portfolio.lists.sections);
        const themes = new Set(portfolio.lists.themes);
        const accounts = new Set(portfolio.lists.accounts);
        const themeSections = { ...(portfolio.lists.themeSections ?? {}) };

        rows.forEach((row) => {
          if (existingKeys.has(dedupeKey(row))) return;

          const section = row.section?.trim() || IMPORTED_LABEL;
          const theme = row.theme?.trim() || defaultTheme;
          const account = targetAccount || row.account?.trim() || IMPORTED_LABEL;

          sections.add(section);
          accounts.add(account);
          if (theme !== defaultTheme) {
            themes.add(theme);
            if (section) themeSections[theme] = section;
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
            }),
          );
          existingKeys.add(dedupeKey(row));
        });

        const orderedSections = [...sections];
        const orderedThemes = [defaultTheme, ...[...themes].filter((l) => l !== defaultTheme)];
        const orderedAccounts = [...accounts];

        const lists = ensureCashLists({
          sections: orderedSections,
          themes: orderedThemes,
          accounts: orderedAccounts,
          themeSections,
        });

        return applyBudgetsAndLock({ ...portfolio, holdings, lists });
      });

      return { ...updated, filters: {} };
    }

    case 'record-trade': {
      const { holdingId, trade } = action;
      return updateActivePortfolio(state, (portfolio) => {
        const index = portfolio.holdings.findIndex((h) => h.id === holdingId);
        if (index === -1) return portfolio;

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

        return applyBudgetsAndLock({ ...portfolio, holdings, trades });
      });
    }

    case 'import-trades': {
      const { trades: incoming } = action;
      return updateActivePortfolio(state, (portfolio) => {
        if (incoming.length === 0) return portfolio;

        const sections = new Set(portfolio.lists.sections);
        const themes = new Set(portfolio.lists.themes);
        const accounts = new Set(portfolio.lists.accounts);
        const themeSections = { ...(portfolio.lists.themeSections ?? {}) };

        const holdings = portfolio.holdings.slice();
        const trades = portfolio.trades.slice();

        incoming.forEach((tradeRow) => {
          const tickerKey = tradeRow.ticker.trim().toLowerCase();
          let index = holdings.findIndex((h) => h.ticker.trim().toLowerCase() === tickerKey);

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

        return applyBudgetsAndLock({ ...portfolio, holdings, trades, lists });
      });
    }

    case 'set-active-portfolio': {
      if (state.activePortfolioId === action.id) return state;
      if (!state.portfolios.some((p) => p.id === action.id)) return state;
      return {
        ...state,
        activePortfolioId: action.id,
        filters: {},
        playground: { enabled: false },
      };
    }

    case 'rename-portfolio': {
      const nextName = action.name.trim();
      if (!nextName) return state;
      const existingNames = state.portfolios
        .filter((p) => p.id !== action.id)
        .map((p) => p.name);
      const uniqueName = createUniquePortfolioName(existingNames, nextName);
      const portfolios = state.portfolios.map((p) =>
        p.id === action.id ? { ...p, name: uniqueName } : p,
      );
      return { ...state, portfolios };
    }

    case 'add-portfolio': {
      const baseName = action.name?.trim() || 'New Portfolio';
      const existingNames = state.portfolios.map((p) => p.name);
      const finalName = createUniquePortfolioName(existingNames, baseName);
      const portfolio = ensureCashPortfolio(
        createEmptyPortfolio(
          action.id,
          finalName,
          action.portfolioType || 'actual',
          action.parentId,
        ),
      );
      return {
        ...state,
        portfolios: [...state.portfolios, portfolio],
        activePortfolioId: portfolio.id,
        filters: {},
        playground: { enabled: false },
      };
    }

    case 'create-draft-portfolio': {
      const parentPortfolio = state.portfolios.find((p) => p.id === action.parentId);
      if (!parentPortfolio) return state;

      const baseName = action.name?.trim() || `${parentPortfolio.name} (Draft)`;
      const existingNames = state.portfolios.map((p) => p.name);
      const finalName = createUniquePortfolioName(existingNames, baseName);

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
      const draftPortfolio = state.portfolios.find((p) => p.id === action.draftId);
      if (!draftPortfolio || draftPortfolio.type !== 'draft' || !draftPortfolio.parentId)
        return state;

      const parentIndex = state.portfolios.findIndex((p) => p.id === draftPortfolio.parentId);
      if (parentIndex === -1) return state;

      const updatedParent: Portfolio = {
        ...draftPortfolio,
        id: draftPortfolio.parentId,
        name: state.portfolios[parentIndex].name,
        type: 'actual',
        parentId: undefined,
        updatedAt: new Date(),
      };

      const portfolios = [...state.portfolios];
      portfolios[parentIndex] = updatedParent;
      const filteredPortfolios = portfolios.filter((p) => p.id !== action.draftId);

      return {
        ...state,
        portfolios: filteredPortfolios,
        activePortfolioId: updatedParent.id,
        filters: {},
        playground: { enabled: false },
      };
    }

    case 'remove-portfolio': {
      if (state.portfolios.length <= 1) return state;
      const portfolios = state.portfolios.filter((p) => p.id !== action.id);
      if (portfolios.length === state.portfolios.length) return state;
      const nextActiveId =
        state.activePortfolioId === action.id
          ? portfolios[0]?.id ?? state.activePortfolioId
          : state.activePortfolioId;
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
            playground: { enabled: true, snapshot: clonePortfolio(active) },
          };
        } catch {
          return state;
        }
      }
      return { ...state, playground: { enabled: false } };
    }

    case 'restore-playground': {
      const snapshot = state.playground.snapshot;
      if (!snapshot) return state;
      const clonedSnapshot = clonePortfolio(snapshot);
      const portfolios = state.portfolios.map((p) =>
        p.id === clonedSnapshot.id ? clonePortfolio(clonedSnapshot) : p,
      );
      return { ...state, portfolios };
    }

    case 'restore-state':
      return action.state;

    case 'restore-portfolio-backup':
      return updateActivePortfolio(state, () => {
        const restoredPortfolio = {
          ...action.portfolioData,
          id:
            state.portfolios.find((p) => p.id === state.activePortfolioId)?.id ||
            action.portfolioData.id,
          updatedAt: new Date(),
        };
        return ensureCashPortfolio(restoredPortfolio);
      });

    case 'update-portfolio-settings':
      return updateActivePortfolio(state, (portfolio) => ({
        ...portfolio,
        settings: { ...portfolio.settings, ...action.settings },
      }));

    case 'update-live-prices':
      return updateActivePortfolio(state, (portfolio) => {
        let hasChanges = false;
        const updatedHoldings = portfolio.holdings.map((holding) => {
          const priceData = action.prices.get(holding.ticker);
          if (priceData && holding.ticker && holding.assetType !== 'Cash') {
            let calculationPrice = priceData.price;

            if (
              priceData.originalCurrency === 'GBX' ||
              priceData.originalCurrency === 'GBp'
            ) {
              calculationPrice = (priceData.originalPrice ?? priceData.price) * 0.01;
            } else if (
              holding.ticker.toUpperCase().endsWith('.L') &&
              (priceData.price > 1000 || (priceData.originalPrice ?? 0) > 1000)
            ) {
              const priceToConvert = priceData.originalPrice || priceData.price;
              calculationPrice = priceToConvert * 0.01;
            }

            if (
              holding.livePrice !== calculationPrice ||
              holding.dayChange !== priceData.change ||
              holding.dayChangePercent !== priceData.changePercent
            ) {
              hasChanges = true;
              return {
                ...holding,
                livePrice: calculationPrice,
                livePriceUpdated: priceData.updated,
                dayChange: priceData.change,
                dayChangePercent: priceData.changePercent,
                originalLivePrice: priceData.originalPrice,
                originalCurrency: priceData.originalCurrency,
                conversionRate: priceData.conversionRate,
              };
            }
          }
          return holding;
        });

        if (!hasChanges) return portfolio;
        return { ...portfolio, holdings: updatedHoldings };
      });

    default:
      return state;
  }
};
