import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';

const mockUpdatePortfolioSettings = vi.fn();

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      id: 'p1',
      name: 'Test Portfolio',
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
    allPortfolios: [],
    importHoldings: vi.fn(),
    updatePortfolioSettings: mockUpdatePortfolioSettings,
    restoreFullBackup: vi.fn(),
  }),
}));

vi.mock('@/components/shared/Toast', () => ({
  toast: vi.fn(),
}));

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the four tab triggers', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('General')).toBeDefined();
    expect(screen.getByText('Exchanges')).toBeDefined();
    expect(screen.getByText('Assets')).toBeDefined();
    expect(screen.getByText('Data')).toBeDefined();
  });

  it('shows General tab content by default', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Base Currency')).toBeDefined();
    expect(screen.getByText('Lock portfolio total')).toBeDefined();
    expect(screen.getByText('Enable live prices')).toBeDefined();
  });

  it('renders GBP as default currency', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('GBP')).toBeDefined();
  });
});
