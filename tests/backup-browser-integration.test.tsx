import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BackupBrowser from '../src/components/BackupBrowser';
import { RestoreService } from '../src/services/restoreService';
import type { BackupMetadata, RestoreResult } from '../src/services/restoreService';
import type { AppState } from '../src/state/types';

// Mock the RestoreService
vi.mock('../src/services/restoreService', () => ({
  RestoreService: {
    getAvailableBackups: vi.fn(),
    restoreFromBackup: vi.fn(),
  },
}));

const mockRestoreService = RestoreService as any;

describe('BackupBrowser Integration', () => {
  const mockBackups: BackupMetadata[] = [
    {
      timestamp: '2025-09-23T21-24-33-089Z',
      filePath: 'portfolio-2025-09-23T21-24-33-089Z.json',
      portfolioCount: 2,
      holdingsCount: 10,
    },
  ];

  const mockRestoredData: AppState = {
    portfolios: [
      {
        id: 'portfolio-1',
        name: 'Main Portfolio',
        type: 'actual',
        lists: {
          sections: ['Core', 'Satellite'],
          themes: ['All', 'Tech'],
          accounts: ['ISA', 'Brokerage'],
          themeSections: { All: 'Core', Tech: 'Satellite' },
        },
        holdings: [
          {
            id: 'holding-1',
            section: 'Core',
            theme: 'All',
            assetType: 'ETF',
            name: 'Vanguard FTSE All-World',
            ticker: 'VWRL',
            exchange: 'LSE',
            account: 'ISA',
            price: 100,
            qty: 10,
            include: true,
            avgCost: 95,
          },
        ],
        settings: {
          currency: 'GBP',
          lockTotal: false,
          enableLivePrices: true,
          livePriceUpdateInterval: 10,
          visibleColumns: {} as any,
        },
        budgets: { sections: {}, accounts: {}, themes: {} },
        trades: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    activePortfolioId: 'portfolio-1',
    playground: { enabled: false },
    filters: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackups);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Restore Workflow', () => {
    it('should complete full restore workflow successfully', async () => {
      const mockOnRestore = vi.fn();
      const mockRestoreResult: RestoreResult = {
        success: true,
        restoredData: mockRestoredData,
        message: 'Successfully restored from backup',
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

      render(<BackupBrowser onRestore={mockOnRestore} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Verify backup is displayed
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
      expect(screen.getByText('2 portfolios • 10 holdings')).toBeInTheDocument();

      // Select the backup
      const backupItem = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json').closest('div')!;
      fireEvent.click(backupItem);

      // Verify preview is shown
      await waitFor(() => {
        expect(screen.getByText('Backup Preview')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Portfolio count in preview
        expect(screen.getByText('10')).toBeInTheDocument(); // Holdings count in preview
      });

      // Perform restore
      const restoreButton = screen.getByText('Restore Selected');
      expect(restoreButton).not.toBeDisabled();
      
      fireEvent.click(restoreButton);

      // Verify restore process
      await waitFor(() => {
        expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith(
          'portfolio-2025-09-23T21-24-33-089Z.json'
        );
        expect(mockOnRestore).toHaveBeenCalledWith(mockRestoredData);
      });
    });

    it('should handle restore failure gracefully', async () => {
      const mockOnRestore = vi.fn();
      const mockRestoreResult: RestoreResult = {
        success: false,
        error: 'Backup file is corrupted',
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

      render(<BackupBrowser onRestore={mockOnRestore} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Select and restore backup
      const backupItem = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json').closest('div')!;
      fireEvent.click(backupItem);

      const restoreButton = screen.getByText('Restore Selected');
      fireEvent.click(restoreButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText('Error:')).toBeInTheDocument();
        expect(screen.getByText('Backup file is corrupted')).toBeInTheDocument();
        expect(mockOnRestore).not.toHaveBeenCalled();
      });
    });

    it('should handle network errors during backup loading', async () => {
      mockRestoreService.getAvailableBackups.mockRejectedValue(
        new Error('Network connection failed')
      );

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Error loading backups:')).toBeInTheDocument();
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });

      // Should show retry functionality
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should work with keyboard navigation for accessibility', async () => {
      const mockOnRestore = vi.fn();
      const mockRestoreResult: RestoreResult = {
        success: true,
        restoredData: mockRestoredData,
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

      render(<BackupBrowser onRestore={mockOnRestore} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Use keyboard to select backup
      const backupItem = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json').closest('div')!;
      
      // Focus and activate with keyboard
      backupItem.focus();
      fireEvent.keyDown(backupItem, { key: 'Enter' });

      // Verify selection worked
      await waitFor(() => {
        expect(screen.getByText('Backup Preview')).toBeInTheDocument();
      });

      // Use keyboard to trigger restore
      const restoreButton = screen.getByText('Restore Selected');
      restoreButton.focus();
      fireEvent.click(restoreButton); // Buttons handle click events, not keyDown for Enter

      await waitFor(() => {
        expect(mockOnRestore).toHaveBeenCalledWith(mockRestoredData);
      });
    });
  });

  describe('Component Integration with RestoreService', () => {
    it('should properly format and display backup metadata', async () => {
      const complexBackups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T21-24-33-089Z',
          filePath: 'portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 1,
          holdingsCount: 1,
        },
        {
          timestamp: '2025-09-23T20-58-00-670Z',
          filePath: 'portfolio-2025-09-23T20-58-00-670Z.json',
          portfolioCount: 3,
          holdingsCount: 25,
        },
      ];

      mockRestoreService.getAvailableBackups.mockResolvedValue(complexBackups);

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Verify singular/plural formatting
      expect(screen.getByText('1 portfolio • 1 holding')).toBeInTheDocument();
      expect(screen.getByText('3 portfolios • 25 holdings')).toBeInTheDocument();

      // Verify both backups are displayed
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
      expect(screen.getByText('portfolio-2025-09-23T20-58-00-670Z.json')).toBeInTheDocument();
    });

    it('should handle API errors and provide user feedback', async () => {
      // First call fails, second succeeds
      mockRestoreService.getAvailableBackups
        .mockRejectedValueOnce(new Error('Server temporarily unavailable'))
        .mockResolvedValueOnce(mockBackups);

      render(<BackupBrowser />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Error loading backups:')).toBeInTheDocument();
        expect(screen.getByText('Server temporarily unavailable')).toBeInTheDocument();
      });

      // Retry should work
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Should load successfully after retry
      await waitFor(() => {
        expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
        expect(screen.queryByText('Error loading backups:')).not.toBeInTheDocument();
      });
    });
  });
});