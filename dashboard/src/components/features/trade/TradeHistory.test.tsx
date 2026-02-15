import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TradeHistory } from './TradeHistory';

const mockTrades = [
  { id: 't1', holdingId: 'h1', type: 'buy' as const, date: '2024-06-01', price: 30, qty: 50 },
  { id: 't2', holdingId: 'h1', type: 'sell' as const, date: '2024-07-15', price: 35, qty: 20 },
  { id: 't3', holdingId: 'h2', type: 'buy' as const, date: '2024-08-01', price: 100, qty: 10 },
];

const mockHoldings = [
  {
    id: 'h1',
    section: 'Core',
    theme: 'All',
    assetType: 'ETF' as const,
    name: 'Vanguard FTSE',
    ticker: 'VUKE',
    exchange: 'LSE' as const,
    account: 'ISA',
    price: 30,
    qty: 30,
    include: true,
  },
  {
    id: 'h2',
    section: 'Core',
    theme: 'All',
    assetType: 'Stock' as const,
    name: 'Shell PLC',
    ticker: 'SHEL',
    exchange: 'LSE' as const,
    account: 'GIA',
    price: 100,
    qty: 10,
    include: true,
  },
];

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      id: 'p1',
      name: 'Test',
      type: 'actual' as const,
      holdings: mockHoldings,
      lists: {
        sections: ['Core'],
        themes: ['All'],
        accounts: ['ISA', 'GIA'],
        themeSections: {},
      },
      settings: {
        currency: 'GBP',
        lockTotal: false,
        enableLivePrices: true,
        livePriceUpdateInterval: 10,
        visibleColumns: {},
      },
      budgets: { sections: {}, accounts: {}, themes: {} },
      trades: mockTrades,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    trades: mockTrades,
  }),
}));

describe('TradeHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trade rows', () => {
    render(<TradeHistory />);
    expect(screen.getAllByText('VUKE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SHEL').length).toBeGreaterThan(0);
  });

  it('renders buy and sell badges', () => {
    render(<TradeHistory />);
    const buyBadges = screen.getAllByText('BUY');
    const sellBadges = screen.getAllByText('SELL');
    expect(buyBadges.length).toBe(2);
    expect(sellBadges.length).toBe(1);
  });

  it('shows summary stats', () => {
    render(<TradeHistory />);
    expect(screen.getByText('Total Trades')).toBeDefined();
    expect(screen.getByText('Buys')).toBeDefined();
    expect(screen.getByText('Sells')).toBeDefined();
    expect(screen.getByText('Net Investment')).toBeDefined();
  });

  it('shows type filter dropdown', () => {
    render(<TradeHistory />);
    expect(screen.getByText('All Types')).toBeDefined();
  });

  it('renders date column', () => {
    render(<TradeHistory />);
    expect(screen.getByText('2024-06-01')).toBeDefined();
    expect(screen.getByText('2024-07-15')).toBeDefined();
  });
});
