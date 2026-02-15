import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackupRestore } from './BackupRestore';

const mockRestoreFullBackup = vi.fn();

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    allPortfolios: [
      {
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
    ],
    restoreFullBackup: mockRestoreFullBackup,
  }),
}));

vi.mock('@/components/shared/Toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/services/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('BackupRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Backup and Restore buttons', () => {
    render(<BackupRestore />);
    expect(screen.getByText('Backup')).toBeDefined();
    expect(screen.getByText('Restore')).toBeDefined();
  });

  it('renders hidden file input for JSON files', () => {
    const { container } = render(<BackupRestore />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.accept).toBe('.json');
  });

  it('triggers file download on backup click', () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = origCreateElement(tag, options);
      if (tag === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    render(<BackupRestore />);
    fireEvent.click(screen.getByText('Backup'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
