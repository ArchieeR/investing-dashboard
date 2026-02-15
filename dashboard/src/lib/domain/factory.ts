// =============================================================================
// Factory Functions & Constants
// =============================================================================

import type { AppState, Holding, Lists, Portfolio, PortfolioType, VisibleColumns } from '@/types/portfolio';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CASH_BUFFER_NAME = 'Cash buffer';
export const CASH_BUFFER_PRICE = 1;
export const CASH_SECTION = 'Cash';
export const IMPORTED_LABEL = 'Imported';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `holding-${Math.random().toString(36).slice(2, 11)}`;
};

export const generatePortfolioId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `portfolio-${Math.random().toString(36).slice(2, 11)}`;
};

export const generateTradeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `trade-${Math.random().toString(36).slice(2, 11)}`;
};

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export const createEmptyLists = (): Lists => ({
  sections: ['Core', 'Satellite', 'Cash'],
  themes: ['All', 'Cash'],
  accounts: ['Brokerage'],
  themeSections: { All: 'Core', Cash: 'Cash' },
});

export const createDefaultVisibleColumns = (): VisibleColumns => ({
  section: true,
  theme: true,
  assetType: true,
  name: true,
  ticker: true,
  exchange: true,
  account: true,
  price: false,
  livePrice: true,
  avgCost: true,
  qty: true,
  value: false,
  liveValue: true,
  costBasis: false,
  dayChange: true,
  dayChangePercent: true,
  pctOfPortfolio: true,
  pctOfSection: false,
  pctOfTheme: true,
  targetPct: true,
  targetDelta: true,
  performance1d: false,
  performance2d: false,
  performance3d: false,
  performance1w: false,
  performance1m: false,
  performance6m: false,
  performanceYtd: false,
  performance1y: false,
  performance2y: false,
  include: true,
  actions: true,
});

export const createEmptyPortfolio = (
  id: string,
  name: string,
  type: PortfolioType = 'actual',
  parentId?: string,
): Portfolio => ({
  id,
  name,
  type,
  parentId,
  lists: createEmptyLists(),
  holdings: [],
  settings: {
    currency: 'GBP',
    lockTotal: false,
    enableLivePrices: true,
    livePriceUpdateInterval: 10,
    visibleColumns: createDefaultVisibleColumns(),
  },
  budgets: { sections: {}, accounts: {}, themes: {} },
  trades: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: overrides.id ?? generateId(),
  section: overrides.section ?? 'Core',
  theme: overrides.theme ?? 'All',
  assetType: overrides.assetType ?? 'ETF',
  name: overrides.name ?? '',
  ticker: overrides.ticker ?? '',
  exchange: overrides.exchange ?? 'LSE',
  account: overrides.account ?? 'Brokerage',
  price: overrides.price ?? 0,
  qty: overrides.qty ?? 0,
  include: overrides.include ?? true,
  targetPct: overrides.targetPct,
  avgCost: overrides.avgCost ?? overrides.price ?? 0,
});

export const createInitialState = (): AppState => {
  const portfolios = [
    createEmptyPortfolio('portfolio-1', 'Main Portfolio', 'actual'),
    createEmptyPortfolio('portfolio-2', 'ISA Portfolio', 'actual'),
    createEmptyPortfolio('portfolio-3', 'SIPP Portfolio', 'actual'),
  ];

  return {
    portfolios,
    activePortfolioId: portfolios[0].id,
    playground: { enabled: false },
    filters: {},
  };
};

export const getActivePortfolio = (state: AppState): Portfolio => {
  const portfolio = state.portfolios.find((p) => p.id === state.activePortfolioId);
  if (!portfolio) {
    throw new Error('Active portfolio not found');
  }
  return portfolio;
};
