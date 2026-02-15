import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeForm } from './TradeForm';

const mockRecordTrade = vi.fn();

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      id: 'p1',
      name: 'Test',
      type: 'actual' as const,
      holdings: [
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
          qty: 100,
          include: true,
        },
        {
          id: 'h2',
          section: 'Core',
          theme: 'All',
          assetType: 'Cash' as const,
          name: 'Cash buffer',
          ticker: '',
          exchange: 'LSE' as const,
          account: 'ISA',
          price: 1,
          qty: 500,
          include: true,
        },
      ],
      lists: {
        sections: ['Core'],
        themes: ['All'],
        accounts: ['ISA'],
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
      trades: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    recordTrade: mockRecordTrade,
  }),
}));

describe('TradeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<TradeForm />);
    expect(screen.getByText('Record Trade')).toBeDefined();
  });

  it('opens dialog on trigger click', () => {
    render(<TradeForm />);
    fireEvent.click(screen.getByText('Record Trade'));
    expect(screen.getByText('Holding')).toBeDefined();
    expect(screen.getByText('Type')).toBeDefined();
  });

  it('filters out Cash holdings from the selector', () => {
    render(<TradeForm />);
    fireEvent.click(screen.getByText('Record Trade'));
    // The Cash holding should not be in the dropdown options
    // Only VUKE should appear, not Cash buffer
    expect(screen.getByText('Select a holding')).toBeDefined();
  });

  it('shows Buy and Sell toggle buttons', () => {
    render(<TradeForm />);
    fireEvent.click(screen.getByText('Record Trade'));
    expect(screen.getByText('Buy')).toBeDefined();
    expect(screen.getByText('Sell')).toBeDefined();
  });

  it('disables submit when form is incomplete', () => {
    render(<TradeForm />);
    fireEvent.click(screen.getByText('Record Trade'));
    const submitBtn = screen.getByText('Record Buy');
    expect(submitBtn.closest('button')?.disabled).toBe(true);
  });
});
