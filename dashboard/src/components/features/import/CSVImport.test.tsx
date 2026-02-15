import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CSVImport } from './CSVImport';

const mockImportHoldings = vi.fn();

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    importHoldings: mockImportHoldings,
  }),
}));

vi.mock('@/components/shared/Toast', () => ({
  toast: vi.fn(),
}));

describe('CSVImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drag-and-drop zone', () => {
    render(<CSVImport />);
    expect(screen.getByText('Drop CSV file here or click to browse')).toBeDefined();
  });

  it('mentions supported formats', () => {
    render(<CSVImport />);
    expect(
      screen.getByText('Supports Spec, Interactive Investor, and Hargreaves Lansdown formats'),
    ).toBeDefined();
  });

  it('renders hidden file input with .csv accept', () => {
    const { container } = render(<CSVImport />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.accept).toBe('.csv');
  });
});
