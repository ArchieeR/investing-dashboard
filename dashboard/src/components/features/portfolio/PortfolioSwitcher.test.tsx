import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioSwitcher } from './PortfolioSwitcher';

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    portfolios: [
      { id: 'p1', name: 'Main', type: 'actual' },
      { id: 'p2', name: 'Draft Copy', type: 'draft', parentId: 'p1' },
    ],
    portfolio: { id: 'p1', name: 'Main', type: 'actual' },
    allPortfolios: [
      { id: 'p1', name: 'Main', type: 'actual', holdings: [{ id: 'h1' }, { id: 'h2' }] },
      { id: 'p2', name: 'Draft Copy', type: 'draft', parentId: 'p1', holdings: [{ id: 'h3' }] },
    ],
    setActivePortfolio: vi.fn(),
    addPortfolio: vi.fn(),
    renamePortfolio: vi.fn(),
    removePortfolio: vi.fn(),
    createDraftPortfolio: vi.fn(),
    promoteDraftToActual: vi.fn(),
  }),
}));

describe('PortfolioSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders portfolio tabs', () => {
    render(<PortfolioSwitcher />);
    expect(screen.getByText('Main')).toBeDefined();
    expect(screen.getByText('Draft Copy')).toBeDefined();
  });

  it('shows holdings count badges', () => {
    render(<PortfolioSwitcher />);
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it('shows draft label for draft portfolios', () => {
    render(<PortfolioSwitcher />);
    expect(screen.getByText('Draft')).toBeDefined();
  });

  it('renders add portfolio button', () => {
    render(<PortfolioSwitcher />);
    const buttons = screen.getAllByRole('button');
    // Last button should be the + button
    expect(buttons.length).toBeGreaterThan(2);
  });
});
