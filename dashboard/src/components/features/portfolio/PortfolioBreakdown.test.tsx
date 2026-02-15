import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioBreakdown } from './PortfolioBreakdown';

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    bySection: [
      { label: 'Core', value: 5000, percentage: 60 },
      { label: 'Satellite', value: 3000, percentage: 40 },
    ],
    byTheme: [
      { label: 'Tech', value: 5000, percentage: 60 },
      { label: 'Energy', value: 3000, percentage: 40 },
    ],
    byAccount: [{ label: 'ISA', value: 8000, percentage: 100 }],
    portfolio: {
      holdings: [
        { id: 'h1', assetType: 'ETF', price: 50, qty: 100, include: true },
        { id: 'h2', assetType: 'Stock', price: 30, qty: 100, include: true },
      ],
    },
  }),
}));

describe('PortfolioBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs for breakdown types', () => {
    render(<PortfolioBreakdown />);
    expect(screen.getByText('Sections')).toBeDefined();
    expect(screen.getByText('Themes')).toBeDefined();
    expect(screen.getByText('Accounts')).toBeDefined();
    expect(screen.getByText('Asset Types')).toBeDefined();
  });

  it('displays section breakdown entries by default', () => {
    render(<PortfolioBreakdown />);
    expect(screen.getByText('Core')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
  });

  it('shows percentage values', () => {
    render(<PortfolioBreakdown />);
    expect(screen.getByText('60.0%')).toBeDefined();
    expect(screen.getByText('40.0%')).toBeDefined();
  });
});
