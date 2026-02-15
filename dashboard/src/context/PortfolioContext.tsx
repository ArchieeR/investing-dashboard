'use client';

// =============================================================================
// Portfolio Context - React provider wrapping domain reducer
// =============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type {
  AppState,
  Holding,
  Portfolio,
  PortfolioType,
  BudgetLimit,
  Lists,
  Trade,
  TradeType,
} from '@/types/portfolio';
import {
  createHolding,
  createInitialState,
  getActivePortfolio,
  generatePortfolioId,
} from '@/lib/domain/factory';
import {
  portfolioReducer,
  type PortfolioAction,
} from '@/lib/domain/reducer';
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
} from '@/lib/domain/selectors';
import type { HoldingCsvRow } from '@/lib/domain/csv';
import { loadState, saveState } from '@/lib/domain/persistence';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PortfolioContextValue {
  portfolios: Array<{
    id: string;
    name: string;
    type: PortfolioType;
    parentId?: string;
  }>;
  allPortfolios: Portfolio[];
  portfolio: Portfolio;
  derivedHoldings: HoldingDerived[];
  totalValue: number;
  targetPortfolioValue: number;
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
  addListItem: (
    domain: Exclude<keyof Lists, 'themeSections'>,
    value: string,
    section?: string,
  ) => void;
  renameListItem: (
    domain: Exclude<keyof Lists, 'themeSections'>,
    previous: string,
    next: string,
  ) => void;
  removeListItem: (domain: Exclude<keyof Lists, 'themeSections'>, value: string) => void;
  reorderList: (domain: Exclude<keyof Lists, 'themeSections'>, from: number, to: number) => void;
  importHoldings: (rows: HoldingCsvRow[], account?: string) => void;
  setActivePortfolio: (id: string) => void;
  renamePortfolio: (id: string, name: string) => void;
  addPortfolio: (name?: string, type?: PortfolioType, parentId?: string) => string;
  removePortfolio: (id: string) => void;
  createDraftPortfolio: (parentId: string, name?: string) => void;
  promoteDraftToActual: (draftId: string) => void;
  recordTrade: (
    holdingId: string,
    trade: { type: TradeType; date: string; price: number; qty: number },
  ) => void;
  importTrades: (
    trades: {
      ticker: string;
      name?: string;
      type: TradeType;
      date: string;
      price: number;
      qty: number;
    }[],
  ) => void;
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
  updateLivePrices: (
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
    >,
  ) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, undefined, createInitialState);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

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
    [portfolio],
  );
  const portfoliosSummary = useMemo(
    () =>
      state.portfolios.map((entry) => ({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        parentId: entry.parentId,
      })),
    [state.portfolios],
  );

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      dispatch({ type: 'restore-state', state: loaded });
    }
    setHasLoadedInitialState(true);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!hasLoadedInitialState) return;
    saveState(state);
  }, [state, hasLoadedInitialState]);

  // Stable action callbacks
  const addHolding = useCallback((initial?: Partial<Holding>) => {
    const holding = createHolding(initial);
    dispatch({ type: 'add-holding', holding });
    return holding.id;
  }, []);
  const duplicateHolding = useCallback(
    (id: string) => dispatch({ type: 'duplicate-holding', id }),
    [],
  );
  const deleteHolding = useCallback(
    (id: string) => dispatch({ type: 'delete-holding', id }),
    [],
  );
  const updateHolding = useCallback(
    (id: string, patch: Partial<Holding>) => dispatch({ type: 'update-holding', id, patch }),
    [],
  );
  const setTotal = useCallback(
    (total: number) => dispatch({ type: 'set-total', total }),
    [],
  );
  const setTargetPortfolioValue = useCallback(
    (value: number) =>
      dispatch({ type: 'update-portfolio-settings', settings: { targetPortfolioValue: value } }),
    [],
  );
  const setFilter = useCallback(
    (key: keyof AppState['filters'], value?: string) =>
      dispatch({ type: 'set-filter', key, value }),
    [],
  );
  const updatePortfolioSettings = useCallback(
    (settings: Partial<Portfolio['settings']>) =>
      dispatch({ type: 'update-portfolio-settings', settings }),
    [],
  );
  const updateLivePrices = useCallback(
    (
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
      >,
    ) => dispatch({ type: 'update-live-prices', prices }),
    [],
  );
  const setBudget = useCallback(
    (domain: keyof Portfolio['budgets'], key: string, limit?: BudgetLimit) =>
      dispatch({ type: 'set-budget', domain, key, limit }),
    [],
  );
  const setHoldingTargetPercent = useCallback(
    (holdingId: string, targetPct?: number) =>
      dispatch({ type: 'set-holding-target-percent', holdingId, targetPct }),
    [],
  );
  const setThemeSection = useCallback(
    (theme: string, section?: string) => dispatch({ type: 'set-theme-section', theme, section }),
    [],
  );
  const addListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, value: string, section?: string) =>
      dispatch({ type: 'add-list-item', domain, value, section }),
    [],
  );
  const renameListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, previous: string, next: string) =>
      dispatch({ type: 'rename-list-item', domain, previous, next }),
    [],
  );
  const removeListItem = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, value: string) =>
      dispatch({ type: 'remove-list-item', domain, value }),
    [],
  );
  const reorderList = useCallback(
    (domain: Exclude<keyof Lists, 'themeSections'>, from: number, to: number) =>
      dispatch({ type: 'reorder-list', domain, from, to }),
    [],
  );
  const importHoldings = useCallback(
    (rows: HoldingCsvRow[], account?: string) =>
      dispatch({ type: 'import-holdings', rows, account }),
    [],
  );
  const recordTrade = useCallback(
    (holdingId: string, trade: { type: TradeType; date: string; price: number; qty: number }) =>
      dispatch({ type: 'record-trade', holdingId, trade }),
    [],
  );
  const setActivePortfolio = useCallback(
    (id: string) => dispatch({ type: 'set-active-portfolio', id }),
    [],
  );
  const renamePortfolio = useCallback(
    (id: string, name: string) => dispatch({ type: 'rename-portfolio', id, name }),
    [],
  );
  const addPortfolio = useCallback(
    (name?: string, type?: PortfolioType, parentId?: string) => {
      const id = generatePortfolioId();
      dispatch({ type: 'add-portfolio', id, name, portfolioType: type, parentId });
      return id;
    },
    [],
  );
  const removePortfolio = useCallback(
    (id: string) => dispatch({ type: 'remove-portfolio', id }),
    [],
  );
  const createDraftPortfolio = useCallback(
    (parentId: string, name?: string) =>
      dispatch({ type: 'create-draft-portfolio', parentId, name }),
    [],
  );
  const promoteDraftToActual = useCallback(
    (draftId: string) => dispatch({ type: 'promote-draft-to-actual', draftId }),
    [],
  );
  const importTrades = useCallback(
    (
      trades: {
        ticker: string;
        name?: string;
        type: TradeType;
        date: string;
        price: number;
        qty: number;
      }[],
    ) => dispatch({ type: 'import-trades', trades }),
    [],
  );
  const setPlaygroundEnabled = useCallback(
    (enabled: boolean) => dispatch({ type: 'set-playground-enabled', enabled }),
    [],
  );
  const restorePlayground = useCallback(() => dispatch({ type: 'restore-playground' }), []);
  const restorePortfolioBackup = useCallback(
    (portfolioData: Portfolio) =>
      dispatch({ type: 'restore-portfolio-backup', portfolioData }),
    [],
  );
  const restoreFullBackup = useCallback(
    (appState: AppState) => dispatch({ type: 'restore-state', state: appState }),
    [],
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
      state.playground,
      remaining,
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
    ],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return ctx;
}

// Re-export domain types for convenience
export type { PortfolioAction } from '@/lib/domain/reducer';
export type { HoldingDerived, BreakdownEntry } from '@/lib/domain/selectors';
export type { HoldingCsvRow } from '@/lib/domain/csv';
