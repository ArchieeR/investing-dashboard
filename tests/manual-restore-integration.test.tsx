import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManualRestoreButton from '../src/components/ManualRestoreButton';
import { RestoreService } from '../src/services/restoreService';
import type { AppState } from '../src/state/types';

// Mock the RestoreService
vi.mock('../src/services/restoreService', () => ({
  RestoreService: {
    restoreFromBackup: vi.fn(),
    getAvailableBackups: vi.fn(),
  },
}));

const mockRestoreService = RestoreService as any;

describe('Manual Restore Integration', () => {
  const mockOnRestore = vi.fn();
  
  const mockCurrentPortfolioData: AppState = {
    portfolios: [
      {
        id: 'current-portfolio',
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
            id: 'current-holding',
            section: 'Core',
            theme: 'All',
            assetType: 'Stock',
            name: 'Current Stock',
            ticker: 'CURR',
            exchange: 'LSE',
            account: 'Brokerage',
            price: 50,
            qty: 20,
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
        createdAt: new Date('2025-09-23T10:00:00Z'),
        updatedAt: new Date('2025-09-23T10:00:00Z'),
      },
    ],
    activePortfolioId: 'current-portfolio',
    playground: { enabled: false },
    filters: {},
  };

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
      portfolioCount: 1,
      holdingsCount: 8,
    },
    {
      timestamp: '2025-09-23T19-30-15-123Z',
      filePath: 'portfolio-2025-09-23T19-30-15-123Z.json',
      portfolioCount: 2,
      holdingsCount: 12,
    },
  ];

  const mockRestoredData: AppState = {
    portfolios: [
      {
        id: 'restored-portfolio-1',
        name: 'Restored Portfolio 1',
        type: 'actual',
        lists: {
          sections: ['Core', 'Growth', 'Cash'],
          themes: ['Tech', 'Finance', 'Cash'],
          accounts: ['ISA', 'SIPP'],
          themeSections: { Tech: 'Core', Finance: 'Growth', Cash: 'Cash' },
        },
        holdings: [
          {
            id: 'restored-holding-1',
            section: 'Core',
            theme: 'Tech',
            assetType: 'ETF',
            name: 'Tech ETF',
            ticker: 'TECH',
            exchange: 'LSE',
            account: 'ISA',
            price: 100,
            qty: 10,
            include: true,
          },
          {
            id: 'restored-holding-2',
            section: 'Growth',
            theme: 'Finance',
            assetType: 'Stock',
            name: 'Bank Stock',
            ticker: 'BANK',
            exchange: 'LSE',
            account: 'SIPP',
            price: 200,
            qty: 5,
            include: true,
          },
        ],
        settings: {
          currency: 'GBP',
          lockTotal: true,
          lockedTotal: 2000,
          enableLivePrices: false,
          livePriceUpdateInterval: 10,
          visibleColumns: {} as any,
        },
        budgets: {
          sections: { Core: { percent: 70 }, Growth: { percent: 30 } },
          accounts: {},
          themes: {},
        },
        trades: [],
        createdAt: new Date('2025-09-22T15:30:00Z'),
        updatedAt: new Date('2025-09-23T21:24:33Z'),
      },
    ],
    activePortfolioId: 'restored-portfolio-1',
    playground: { enabled: false },
    filters: { section: 'Core' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackupMetadata);
    mockRestoreService.restoreFromBackup.mockResolvedValue({
      success: true,
      restoredData: mockRestoredData,
      message: 'Successfully restored from backup',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    onRestore: mockOnRestore,
    currentPortfolioData: mockCurrentPortfolioData,
  };

  it('should complete full manual restore workflow', async () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Step 1: Click the restore button to open dialog
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    // Step 2: Wait for dialog to open and backups to load
    await waitFor(() => {
      expect(screen.getByText('Manual Restore from Backup')).toBeInTheDocument();
    });
    
    expect(mockRestoreService.getAvailableBackups).toHaveBeenCalled();
    
    // Step 3: Wait for backup list to appear
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    // Step 4: Select the first backup
    const firstBackup = screen.getByText(/2025-09-23.*21:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    // Step 5: Verify preview is shown
    await waitFor(() => {
      expect(screen.getByText('Backup Preview')).toBeInTheDocument();
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
    });
    
    // Step 6: Click restore button
    const restoreFromBackupButton = screen.getByText('Restore from This Backup');
    fireEvent.click(restoreFromBackupButton);
    
    // Step 7: Verify confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText('Confirm Restore Operation')).toBeInTheDocument();
      expect(screen.getByText(/This will replace your current portfolio data/)).toBeInTheDocument();
      expect(screen.getByText('Current data: 1 portfolio, 1 holding')).toBeInTheDocument();
    });
    
    // Step 8: Confirm the restore
    const confirmButton = screen.getByText('Confirm Restore');
    fireEvent.click(confirmButton);
    
    // Step 9: Verify restore service is called
    expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith('portfolio-2025-09-23T21-24-33-089Z.json');
    
    // Step 10: Verify onRestore callback is called with restored data
    await waitFor(() => {
      expect(mockOnRestore).toHaveBeenCalledWith(mockRestoredData);
    });
    
    // Step 11: Verify dialog is closed
    expect(screen.queryByText('Manual Restore from Backup')).not.toBeInTheDocument();
  });

  it('should handle backup loading failure gracefully', async () => {
    const errorMessage = 'Network connection failed';
    mockRestoreService.getAvailableBackups.mockRejectedValue(new Error(errorMessage));
    
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
    
    // Verify retry functionality
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    // Mock successful retry
    mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackupMetadata);
    fireEvent.click(retryButton);
    
    // Verify backups load after retry
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
  });

  it('should handle restore operation failure', async () => {
    const restoreError = 'Backup file corrupted';
    mockRestoreService.restoreFromBackup.mockResolvedValue({
      success: false,
      error: restoreError,
    });
    
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog and select backup
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/2025-09-23.*21:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    // Proceed to restore
    await waitFor(() => {
      const restoreFromBackupButton = screen.getByText('Restore from This Backup');
      fireEvent.click(restoreFromBackupButton);
    });
    
    const confirmButton = screen.getByText('Confirm Restore');
    fireEvent.click(confirmButton);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(`Restore Error: ${restoreError}`)).toBeInTheDocument();
    });
    
    // Verify onRestore is not called
    expect(mockOnRestore).not.toHaveBeenCalled();
    
    // Verify dialog remains open for user to try again
    expect(screen.getByText('Manual Restore from Backup')).toBeInTheDocument();
  });

  it('should handle empty backup list', async () => {
    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    
    render(<ManualRestoreButton {...defaultProps} />);
    
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('No Backup Files Found')).toBeInTheDocument();
      expect(screen.getByText('No backup files are available for restoration.')).toBeInTheDocument();
    });
    
    // Verify no restore button is available
    expect(screen.queryByText('Restore from This Backup')).not.toBeInTheDocument();
  });

  it('should allow canceling at any stage', async () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Manual Restore from Backup')).toBeInTheDocument();
    });
    
    // Cancel from initial state
    let cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Manual Restore from Backup')).not.toBeInTheDocument();
    expect(mockOnRestore).not.toHaveBeenCalled();
    
    // Open again and select backup
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/2025-09-23.*21:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    // Cancel after selection
    cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Manual Restore from Backup')).not.toBeInTheDocument();
    expect(mockOnRestore).not.toHaveBeenCalled();
  });

  it('should show loading states appropriately', async () => {
    // Mock slow backup loading
    let resolveBackups: (value: any) => void;
    const backupsPromise = new Promise((resolve) => {
      resolveBackups = resolve;
    });
    mockRestoreService.getAvailableBackups.mockReturnValue(backupsPromise);
    
    render(<ManualRestoreButton {...defaultProps} />);
    
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    // Should show loading state
    expect(screen.getByText('Loading backups...')).toBeInTheDocument();
    
    // Complete loading
    resolveBackups!(mockBackupMetadata);
    
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Loading backups...')).not.toBeInTheDocument();
  });

  it('should handle network errors during restore', async () => {
    mockRestoreService.restoreFromBackup.mockRejectedValue(new Error('Network timeout'));
    
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Complete workflow until restore
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    const firstBackup = screen.getByText(/2025-09-23.*21:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      const restoreFromBackupButton = screen.getByText('Restore from This Backup');
      fireEvent.click(restoreFromBackupButton);
    });
    
    const confirmButton = screen.getByText('Confirm Restore');
    fireEvent.click(confirmButton);
    
    // Should handle the network error
    await waitFor(() => {
      expect(screen.getByText('Restore Error: Network timeout')).toBeInTheDocument();
    });
    
    expect(mockOnRestore).not.toHaveBeenCalled();
  });

  it('should preserve backup selection when switching between backups', async () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    const restoreButton = screen.getByText('Restore from Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('2 portfolios • 15 holdings')).toBeInTheDocument();
    });
    
    // Select first backup
    const firstBackup = screen.getByText(/2025-09-23.*21:24:33/).closest('div');
    fireEvent.click(firstBackup!);
    
    await waitFor(() => {
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
    });
    
    // Select second backup
    const secondBackup = screen.getByText(/2025-09-23.*20:58:00/).closest('div');
    fireEvent.click(secondBackup!);
    
    await waitFor(() => {
      expect(screen.getByText('portfolio-2025-09-23T20-58-00-669Z.json')).toBeInTheDocument();
    });
    
    // Verify the correct backup is selected for restore
    const restoreFromBackupButton = screen.getByText('Restore from This Backup');
    fireEvent.click(restoreFromBackupButton);
    
    const confirmButton = screen.getByText('Confirm Restore');
    fireEvent.click(confirmButton);
    
    expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith('portfolio-2025-09-23T20-58-00-669Z.json');
  });
});