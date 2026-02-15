import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllocationManager } from './AllocationManager';

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      lists: {
        sections: ['Core', 'Satellite'],
        themes: ['Tech', 'Energy'],
        accounts: ['ISA', 'GIA'],
        themeSections: { Tech: 'Core', Energy: 'Satellite' },
      },
      budgets: {
        sections: { Core: { percent: 60 }, Satellite: { percent: 40 } },
        themes: {},
        accounts: {},
      },
    },
    remaining: {
      sections: [
        { label: 'Core', used: 5000, percentage: 60, amountLimit: undefined },
        { label: 'Satellite', used: 3000, percentage: 40, amountLimit: undefined },
      ],
      themes: [
        { label: 'Tech', used: 5000, percentage: 100, section: 'Core' },
        { label: 'Energy', used: 3000, percentage: 100, section: 'Satellite' },
      ],
      accounts: [
        { label: 'ISA', used: 4000, percentage: 50 },
        { label: 'GIA', used: 4000, percentage: 50 },
      ],
    },
    totalValue: 8000,
    targetPortfolioValue: 10000,
    setBudget: vi.fn(),
  }),
}));

describe('AllocationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders allocation manager title', () => {
    render(<AllocationManager />);
    expect(screen.getByText('Allocation Manager')).toBeDefined();
  });

  it('renders portfolio structure and accounts tabs', () => {
    render(<AllocationManager />);
    expect(screen.getByText('Portfolio Structure')).toBeDefined();
    expect(screen.getByText('Accounts')).toBeDefined();
  });

  it('displays section rows', () => {
    render(<AllocationManager />);
    expect(screen.getByText('Core')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
  });

  it('shows running total percentage', () => {
    render(<AllocationManager />);
    expect(screen.getByText('100.0% allocated')).toBeDefined();
  });
});
