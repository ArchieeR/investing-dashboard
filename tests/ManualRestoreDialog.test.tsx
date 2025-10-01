import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManualRestoreDialog from '../src/components/ManualRestoreDialog';
import { useManualRestore } from '../src/hooks/useManualRestore';
import type { AppState } from '../src/state/types';

// Mock the useManualRestore hook
vi.mock('../src/hooks/useManualRestore', () => ({
  useManualRestore: vi.fn(),
}));

const mockUseManualRestore = useManualRestore as any;

describe('ManualRestoreDialog', () => {
  const mockOnRestore = vi.fn();
  const mockOnCancel = vi.fn();
  
  const mockBackupMetadata = [
    {
      timestamp: '2025-09-23T21-24-33-089Z',
      filePath: 'portfolio-2025-09-23T21-24-33-089Z.json',
      portfolioCount: 2,
      holdingsCount: 15,
    },
    {
      timestamp: '2025-09-23T20-58-00-669Z',
      filePath: 'portfolio-2025-09-23T20-58-00-669Z.json',
      portfolioCount: 2,
      holdingsCount: 12,
    },
  ];

  const mockCurrentPortfolioData: AppState = {
    portfolios: [
      {
        id: 'portfolio-1',
        name: 'Current Portfolio',
        type: 'actual',
        lists: {
          sections: ['Core', 'Satellite', 'Cash'],
          themes: ['All', 'Cash'],
          accounts: ['Brokerage'],
          themeSections: { All: 'Core', Cash: 'Cash' },
        },
        holdings: [
          {
            id: 'holding-1',
            section: 'Core',
            theme: 'All',
            assetType: 'Stock',
            name: 'Test Stock',
            ticker: 'TEST',
            exchange: 'LSE',
            account: 'Brokerage',
            price: 100,
            qty: 10,
            include: true,
          },
        ],
        settings: {
          currency: 'GBP',
          lockTotal: false,
          enableLivePrices: true,
          livePriceUpdateInterval: 5,
          visibleColumns: {} as any,
        },
        budgets: {
          sections: {},
          accounts: {},
          themes: {},
        },
        trades: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    activePortfolioId: 'portfolio-1',
    playground: { enabled: false },
    filters: {},
  };

  const mockHookReturn = {
    restoreFromBackup: vi.fn(),
    getAvailableBackups: vi.fn(),
    isRestoring: false,
    restoreError: null,
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseManualRestore.mockReturnValue(mockHookReturn);
    mockHookReturn.getAvailableBackups.mockResolvedValue(mockBackupMetadata);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onRestore: mockOnRestore,
    onCancel: mockOnCancel,
    currentPortfolioData: mockCurrentPortfolioData,
  };

  it('should not render when isOpen is false', () => {
    render(<ManualRestoreDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Manual Restore from Backup')).not.toBeInTheDocument();
  });

  it('should render dialog when isOpen is true', () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    expect(screen.getByText('Manual Restore from Backup')).toBeInTheDocument();
    expect(screen.getByText('Available Backups')).toBeInTheDocument();
    expect(screen.getByText('Select a backup file to restore from')).toBeInTheDocument();
  });

  it('should load backups on mount', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockHookReturn.getAvailableBackups).toHaveBeenCalled();
    });
  });

  it('should display loading state while fetching backups', () => {
    mockHookReturn.getAvailableBackups.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    expect(screen.getByText('Loading backups...')).toBeInTheDocument();
  });

  it('should display backup list when loaded', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
      expect(screen.getByText(/9\/23\/2025.*9:58:00/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    expect(screen.getByText('2 portfolios • 12 holdings')).toBeInTheDocument();
  });

  it('should display error when backup loading fails', async () => {
    const errorMessage = 'Failed to load backups';
    mockHookReturn.getAvailableBackups.mockRejectedValue(new Error(errorMessage));
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display empty state when no backups available', async () => {
    mockHookReturn.getAvailableBackups.mockResolvedValue([]);
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No Backup Files Found')).toBeInTheDocument();
      expect(screen.getByText('No backup files are available for restoration.')).toBeInTheDocument();
    });
  });

  it('should select backup when clicked', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    // Should show preview section
    expect(screen.getByText('Backup Preview')).toBeInTheDocument();
    expect(screen.getByText('Review the backup contents before restoring')).toBeInTheDocument();
  });

  it('should show backup preview when backup is selected', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      expect(screen.getByText('Backup Preview')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Portfolio count
      expect(screen.getByText('15')).toBeInTheDocument(); // Holdings count
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
    });
  });

  it('should show restore button when backup is selected', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      expect(screen.getByText('Restore from This Backup')).toBeInTheDocument();
    });
  });

  it('should show confirmation dialog when restore button is clicked', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      const restoreButton = screen.getByText('Restore from This Backup');
      fireEvent.click(restoreButton);
    });
    
    expect(screen.getByText('Confirm Restore Operation')).toBeInTheDocument();
    expect(screen.getByText(/This will replace your current portfolio data/)).toBeInTheDocument();
    expect(screen.getByText('Current data: 1 portfolio, 1 holding')).toBeInTheDocument();
    expect(screen.getByText('Confirm Restore')).toBeInTheDocument();
  });

  it('should execute restore when confirmed', async () => {
    const mockRestoredData = { ...mockCurrentPortfolioData };
    mockHookReturn.restoreFromBackup.mockResolvedValue({
      success: true,
      restoredData: mockRestoredData,
    });
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    // Select backup
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    // Click restore button
    await waitFor(() => {
      const restoreButton = screen.getByText('Restore from This Backup');
      fireEvent.click(restoreButton);
    });
    
    // Confirm restore
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirm Restore');
      fireEvent.click(confirmButton);
    });
    
    expect(mockHookReturn.restoreFromBackup).toHaveBeenCalledWith('portfolio-2025-09-23T21-24-33-089Z.json');
    
    await waitFor(() => {
      expect(mockOnRestore).toHaveBeenCalledWith(mockRestoredData);
    });
  });

  it('should display restore error when restore fails', async () => {
    const errorMessage = 'Restore failed';
    mockHookReturn.restoreError = errorMessage;
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    expect(screen.getByText(`Restore Error: ${errorMessage}`)).toBeInTheDocument();
  });

  it('should show loading state during restore', async () => {
    mockHookReturn.isRestoring = true;
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    // Select backup and go to confirmation
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      const restoreButton = screen.getByText('Restore from This Backup');
      fireEvent.click(restoreButton);
    });
    
    // Should show "Restoring..." text
    expect(screen.getByText('Restoring...')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable buttons during restore operation', async () => {
    mockHookReturn.isRestoring = true;
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    const closeButton = screen.getByLabelText('Close');
    
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('should retry loading backups when retry button is clicked', async () => {
    mockHookReturn.getAvailableBackups.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockHookReturn.getAvailableBackups).toHaveBeenCalledTimes(2);
  });

  it('should clear error when dialog opens', () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    expect(mockHookReturn.clearError).toHaveBeenCalled();
  });

  it('should handle backup selection with keyboard navigation', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/9\/23\/2025.*10:24:33/).closest('div');
    
    // Simulate keyboard navigation
    fireEvent.keyDown(firstBackup!, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Backup Preview')).toBeInTheDocument();
    });
  });

  it('should format timestamps correctly', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      // Should format the timestamp to readable format (actual format may vary by locale)
      expect(screen.getByText(/9\/23\/2025.*10:24:33/)).toBeInTheDocument();
    });
  });

  it('should show relative time for backups', async () => {
    render(<ManualRestoreDialog {...defaultProps} />);
    
    await waitFor(() => {
      // Should show relative time like "X days ago" - use getAllByText since there are multiple
      const relativeTimeElements = screen.getAllByText(/days ago|hours ago|minutes ago/);
      expect(relativeTimeElements.length).toBeGreaterThan(0);
    });
  });
});