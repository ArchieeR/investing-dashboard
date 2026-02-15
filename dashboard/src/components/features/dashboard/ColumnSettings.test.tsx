import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnSettings } from './ColumnSettings';

const mockUpdatePortfolioSettings = vi.fn();
const mockVisibleColumns = {
  section: true,
  theme: true,
  assetType: true,
  name: true,
  ticker: true,
  exchange: false,
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

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      settings: {
        visibleColumns: mockVisibleColumns,
      },
    },
    updatePortfolioSettings: mockUpdatePortfolioSettings,
  }),
}));

describe('ColumnSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings trigger button', () => {
    render(<ColumnSettings />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('opens the dialog when trigger is clicked', () => {
    render(<ColumnSettings />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Column Settings')).toBeDefined();
  });

  it('shows column group headings', () => {
    render(<ColumnSettings />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Basic Info')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();
    expect(screen.getByText('Holdings')).toBeDefined();
    expect(screen.getByText('Daily Changes')).toBeDefined();
    expect(screen.getByText('Portfolio Metrics')).toBeDefined();
    expect(screen.getByText('Performance')).toBeDefined();
    expect(screen.getByText('Controls')).toBeDefined();
  });

  it('renders checkboxes for columns', () => {
    render(<ColumnSettings />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Section')).toBeDefined();
    expect(screen.getByText('Ticker')).toBeDefined();
    expect(screen.getByText('Quantity')).toBeDefined();
  });
});
