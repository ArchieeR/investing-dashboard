// =============================================================================
// Portfolio Domain Types
// Ported from _portfolio-reference - the battle-tested domain model
// =============================================================================

export type AssetType =
  | 'ETF'
  | 'Stock'
  | 'Crypto'
  | 'Cash'
  | 'Bond'
  | 'Fund'
  | 'Other';

export type Exchange = 'LSE' | 'NYSE' | 'NASDAQ' | 'AMS' | 'XETRA' | 'XC' | 'VI' | 'Other';

export interface Holding {
  id: string;
  section: string;
  theme: string;
  assetType: AssetType;
  name: string;
  ticker: string;
  exchange: Exchange;
  account: string;
  price: number;
  qty: number;
  include: boolean;
  targetPct?: number;
  avgCost?: number;
  livePrice?: number;
  livePriceUpdated?: Date;
  dayChange?: number;
  dayChangePercent?: number;
  originalLivePrice?: number;
  originalCurrency?: string;
  conversionRate?: number;
}

export type TradeType = 'buy' | 'sell';

export interface Trade {
  id: string;
  holdingId: string;
  type: TradeType;
  date: string;
  price: number;
  qty: number;
}

export interface Lists {
  sections: string[];
  themes: string[];
  accounts: string[];
  themeSections: Record<string, string>;
}

export interface Settings {
  currency: string;
  lockTotal: boolean;
  lockedTotal?: number;
  targetPortfolioValue?: number;
  enableLivePrices: boolean;
  livePriceUpdateInterval: number;
  visibleColumns: VisibleColumns;
}

export interface VisibleColumns {
  section: boolean;
  theme: boolean;
  assetType: boolean;
  name: boolean;
  ticker: boolean;
  exchange: boolean;
  account: boolean;
  price: boolean;
  livePrice: boolean;
  avgCost: boolean;
  qty: boolean;
  value: boolean;
  liveValue: boolean;
  costBasis: boolean;
  dayChange: boolean;
  dayChangePercent: boolean;
  pctOfPortfolio: boolean;
  pctOfSection: boolean;
  pctOfTheme: boolean;
  targetPct: boolean;
  targetDelta: boolean;
  performance1d: boolean;
  performance2d: boolean;
  performance3d: boolean;
  performance1w: boolean;
  performance1m: boolean;
  performance6m: boolean;
  performanceYtd: boolean;
  performance1y: boolean;
  performance2y: boolean;
  include: boolean;
  actions: boolean;
}

export interface BudgetLimit {
  amount?: number;
  percent?: number;
  percentOfSection?: number;
}

export interface Budgets {
  sections: Record<string, BudgetLimit>;
  accounts: Record<string, BudgetLimit>;
  themes: Record<string, BudgetLimit>;
}

export type PortfolioType = 'actual' | 'draft';

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  parentId?: string;
  lists: Lists;
  holdings: Holding[];
  settings: Settings;
  budgets: Budgets;
  trades: Trade[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Filters {
  section?: string;
  theme?: string;
  account?: string;
}

export interface PlaygroundState {
  enabled: boolean;
  snapshot?: Portfolio;
}

export interface AppState {
  portfolios: Portfolio[];
  activePortfolioId: string;
  playground: PlaygroundState;
  filters: Filters;
}

// =============================================================================
// Factory Functions
// =============================================================================

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `holding-${Math.random().toString(36).slice(2, 11)}`;
};

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
