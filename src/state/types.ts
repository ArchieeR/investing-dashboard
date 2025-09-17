export type AssetType =
  | 'ETF'
  | 'Stock'
  | 'Crypto'
  | 'Cash'
  | 'Bond'
  | 'Fund'
  | 'Other';

export interface Holding {
  id: string;
  section: string;
  theme: string;
  assetType: AssetType;
  name: string;
  ticker: string;
  account: string;
  price: number;
  qty: number;
  include: boolean;
  targetPct?: number;
  avgCost?: number;
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

export interface Portfolio {
  id: string;
  name: string;
  lists: Lists;
  holdings: Holding[];
  settings: Settings;
  budgets: Budgets;
  trades: Trade[];
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

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `holding-${Math.random().toString(36).slice(2, 11)}`;
};

export const createEmptyLists = (): Lists => ({
  sections: ['Core', 'Satellite', 'Cash'],
  themes: ['All'],
  accounts: ['Brokerage'],
  themeSections: { All: 'Core' },
});

export const createEmptyPortfolio = (id: string, name: string): Portfolio => ({
  id,
  name,
  lists: createEmptyLists(),
  holdings: [],
  settings: {
    currency: 'GBP',
    lockTotal: false,
  },
  budgets: { sections: {}, accounts: {}, themes: {} },
  trades: [],
});

export const createInitialState = (): AppState => {
  const portfolios = [
    createEmptyPortfolio('portfolio-1', 'Main Portfolio'),
    createEmptyPortfolio('portfolio-2', 'Family ISA'),
    createEmptyPortfolio('portfolio-3', 'Play Portfolio'),
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
  account: overrides.account ?? 'Brokerage',
  price: overrides.price ?? 0,
  qty: overrides.qty ?? 0,
  include: overrides.include ?? true,
  targetPct: overrides.targetPct,
  avgCost: overrides.avgCost ?? overrides.price ?? 0,
});
