import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightsPanel } from './InsightsPanel';

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolio: {
      lists: {
        sections: ['Core', 'Satellite'],
        themes: ['Tech', 'Energy'],
        accounts: ['ISA'],
        themeSections: {},
      },
      budgets: {
        sections: {},
        themes: {},
        accounts: {},
      },
    },
    budgets: {
      sections: {},
      themes: {},
      accounts: {},
    },
    remaining: {
      sections: [
        { label: 'Core', used: 5000, percentage: 60 },
        { label: 'Satellite', used: 3000, percentage: 40 },
      ],
      themes: [
        { label: 'Tech', used: 5000, percentage: 60 },
        { label: 'Energy', used: 3000, percentage: 40 },
      ],
      accounts: [{ label: 'ISA', used: 8000, percentage: 100 }],
    },
    setBudget: vi.fn(),
    renameListItem: vi.fn(),
    removeListItem: vi.fn(),
  }),
}));

describe('InsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders three insight cards', () => {
    render(<InsightsPanel />);
    expect(screen.getByText('Sections')).toBeDefined();
    expect(screen.getByText('Themes')).toBeDefined();
    expect(screen.getByText('Accounts')).toBeDefined();
  });

  it('displays list items', () => {
    render(<InsightsPanel />);
    expect(screen.getByText('Core')).toBeDefined();
    expect(screen.getByText('Satellite')).toBeDefined();
    expect(screen.getByText('Tech')).toBeDefined();
    expect(screen.getByText('Energy')).toBeDefined();
    expect(screen.getByText('ISA')).toBeDefined();
  });
});
