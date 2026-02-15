// =============================================================================
// Portfolio Domain Types
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

// Re-export factory functions from domain for backward compatibility
export {
  createEmptyLists,
  createDefaultVisibleColumns,
  createEmptyPortfolio,
  createHolding,
  createInitialState,
  getActivePortfolio,
} from '@/lib/domain/factory';
