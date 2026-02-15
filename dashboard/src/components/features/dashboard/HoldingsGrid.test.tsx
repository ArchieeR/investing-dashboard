import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HoldingsGrid } from './HoldingsGrid';

// Mock data
const mockDerivedHoldings = [
  {
    holding: {
      id: 'h1',
      section: 'Core',
      theme: 'Tech',
      assetType: 'ETF' as const,
      name: 'Vanguard S&P 500',
      ticker: 'VUSA',
      exchange: 'LSE' as const,
      account: 'ISA',
      price: 50,
      qty: 10,
      include: true,
      dayChange: 0.5,
      dayChangePercent: 1.0,
    },
    value: 500,
    liveValue: 505,
    manualValue: 500,
    dayChangeValue: 5,
    usedLivePrice: false,
    pctOfTotal: 60,
    pctOfSection: 100,
    sectionTotal: 505,
    pctOfTheme: 100,
  },
  {
    holding: {
      id: 'h2',
      section: 'Satellite',
      theme: 'Energy',
      assetType: 'Stock' as const,
      name: 'Shell PLC',
      ticker: 'SHEL',
      exchange: 'LSE' as const,
      account: 'GIA',
      price: 25,
      qty: 10,
      include: true,
      dayChange: -0.3,
      dayChangePercent: -1.2,
    },
    value: 250,
    liveValue: 247,
    manualValue: 250,
    dayChangeValue: -3,
    usedLivePrice: false,
    pctOfTotal: 40,
    pctOfSection: 100,
    sectionTotal: 247,
    pctOfTheme: 100,
  },
];

const mockVisibleColumns = {
  section: true,
  theme: true,
  assetType: true,
  name: true,
  ticker: true,
  exchange: true,
  account: true,
  price: true,
  livePrice: true,
  avgCost: false,
  qty: true,
  value: true,
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
};

const mockPortfolio = {
  id: 'p1',
  name: 'Main Portfolio',
  type: 'actual' as const,
  lists: {
    sections: ['Core', 'Satellite'],
    themes: ['Tech', 'Energy'],
    accounts: ['ISA', 'GIA'],
    themeSections: { Tech: 'Core', Energy: 'Satellite' },
  },
  holdings: mockDerivedHoldings.map((dh) => dh.holding),
  settings: {
    currency: 'GBP',
    lockTotal: false,
    enableLivePrices: true,
    livePriceUpdateInterval: 60000,
    visibleColumns: mockVisibleColumns,
  },
  budgets: { sections: {}, accounts: {}, themes: {} },
  trades: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

let mockReturnData = {
  derivedHoldings: mockDerivedHoldings,
  portfolio: mockPortfolio,
  filters: {} as Record<string, string | undefined>,
  setFilter: vi.fn(),
  updateHolding: vi.fn(),
  deleteHolding: vi.fn(),
  duplicateHolding: vi.fn(),
};

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => mockReturnData,
}));

describe('HoldingsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturnData = {
      derivedHoldings: mockDerivedHoldings,
      portfolio: mockPortfolio,
      filters: {},
      setFilter: vi.fn(),
      updateHolding: vi.fn(),
      deleteHolding: vi.fn(),
      duplicateHolding: vi.fn(),
    };
  });

  it('renders monitor mode with ticker and name columns', () => {
    render(<HoldingsGrid mode="monitor" />);
    expect(screen.getByText('VUSA')).toBeDefined();
    expect(screen.getByText('Vanguard S&P 500')).toBeDefined();
    expect(screen.getByText('SHEL')).toBeDefined();
    expect(screen.getByText('Shell PLC')).toBeDefined();
  });

  it('renders Ticker header in monitor mode', () => {
    render(<HoldingsGrid mode="monitor" />);
    expect(screen.getByText('Ticker')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Qty')).toBeDefined();
    expect(screen.getByText('Value')).toBeDefined();
  });

  it('renders editor mode with section and theme columns', () => {
    render(<HoldingsGrid mode="editor" />);
    expect(screen.getByText('Section')).toBeDefined();
    expect(screen.getByText('Theme')).toBeDefined();
  });

  it('shows "No holdings" when data is empty', () => {
    mockReturnData = {
      ...mockReturnData,
      derivedHoldings: [],
      portfolio: { ...mockPortfolio, holdings: [] },
    };

    render(<HoldingsGrid mode="monitor" />);
    expect(screen.getByText('No holdings')).toBeDefined();
  });

  it('renders filter toolbar only in editor mode', () => {
    const { unmount } = render(<HoldingsGrid mode="monitor" />);
    expect(screen.queryByText('Group: Theme')).toBeNull();
    unmount();

    render(<HoldingsGrid mode="editor" />);
    expect(screen.getByText('Group: Theme')).toBeDefined();
  });
});
