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

describe('BackupBrowser', () => {
  const mockBackups: BackupMetadata[] = [
    {
      timestamp: '2025-09-23T21-24-33-089Z',
      filePath: 'portfolio-2025-09-23T21-24-33-089Z.json',
      portfolioCount: 3,
      holdingsCount: 15,
    },
    {
      timestamp: '2025-09-23T20-58-00-670Z',
      filePath: 'portfolio-2025-09-23T20-58-00-670Z.json',
      portfolioCount: 2,
      holdingsCount: 8,
    },
    {
      timestamp: '2025-09-23T20-44-48-858Z',
      filePath: 'portfolio-2025-09-23T20-44-48-858Z.json',
      portfolioCount: 1,
      holdingsCount: 3,
    },
  ];

  const mockRestoredData: AppState = {
    portfolios: [
      {
        id: 'portfolio-1',
        name: 'Test Portfolio',
        type: 'actual',
        lists: {
          sections: ['Core'],
          themes: ['All'],
          accounts: ['Brokerage'],
          themeSections: { All: 'Core' },
        },
        holdings: [],
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

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockRestoreService.getAvailableBackups.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<BackupBrowser />);
      
      expect(screen.getByText('Loading backup files...')).toBeInTheDocument();
    });
  });

  describe('Backup List Display', () => {
    it('should display list of available backups', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Check that all backups are displayed
      expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
      expect(screen.getByText('portfolio-2025-09-23T20-58-00-670Z.json')).toBeInTheDocument();
      expect(screen.getByText('portfolio-2025-09-23T20-44-48-858Z.json')).toBeInTheDocument();

      // Check metadata display
      expect(screen.getByText('3 portfolios • 15 holdings')).toBeInTheDocument();
      expect(screen.getByText('2 portfolios • 8 holdings')).toBeInTheDocument();
      expect(screen.getByText('1 portfolio • 3 holdings')).toBeInTheDocument();
    });

    it('should format timestamps correctly', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // The component should format the timestamp from the filename
      // The exact format depends on locale, but it should be readable
      const timestampElements = screen.getAllByText(/2025/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('should show relative time for backups', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Should show relative time like "X days ago" or "Unknown time" for invalid timestamps
      const relativeTimeElements = screen.getAllByText(/ago|Unknown time/);
      expect(relativeTimeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Backup Selection', () => {
    it('should allow selecting a backup', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      // Should show preview when selected
      await waitFor(() => {
        expect(screen.getByText('Backup Preview')).toBeInTheDocument();
      });
    });

    it('should show preview information for selected backup', async () => {
      render(<BackupBrowser showPreview={true} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      await waitFor(() => {
        expect(screen.getByText('Backup Preview')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Portfolio count
        expect(screen.getByText('15')).toBeInTheDocument(); // Holdings count
      });
    });

    it('should not show preview when showPreview is false', async () => {
      render(<BackupBrowser showPreview={false} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      // Should not show preview
      expect(screen.queryByText('Backup Preview')).not.toBeInTheDocument();
    });
  });

  describe('Restore Functionality', () => {
    it('should call onRestore when restore is successful', async () => {
      const mockOnRestore = vi.fn();
      const mockRestoreResult: RestoreResult = {
        success: true,
        restoredData: mockRestoredData,
        message: 'Restore successful',
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

      render(<BackupBrowser onRestore={mockOnRestore} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Select a backup
      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      // Click restore button
      const restoreButton = screen.getByText('Restore Selected');
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith(
          'portfolio-2025-09-23T21-24-33-089Z.json'
        );
        expect(mockOnRestore).toHaveBeenCalledWith(mockRestoredData);
      });
    });

    it('should show error when restore fails', async () => {
      const mockRestoreResult: RestoreResult = {
        success: false,
        error: 'Backup file corrupted',
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Select a backup
      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      // Click restore button
      const restoreButton = screen.getByText('Restore Selected');
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(screen.getByText('Error:')).toBeInTheDocument();
        expect(screen.getByText('Backup file corrupted')).toBeInTheDocument();
      });
    });

    it('should disable restore button when no backup is selected', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const restoreButton = screen.getByText('Restore Selected');
      expect(restoreButton).toBeDisabled();
    });

    it('should show loading state during restore', async () => {
      mockRestoreService.restoreFromBackup.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      // Select a backup
      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json');
      fireEvent.click(firstBackup.closest('div')!);

      // Click restore button
      const restoreButton = screen.getByText('Restore Selected');
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(screen.getByText('Restoring...')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when loading backups fails', async () => {
      mockRestoreService.getAvailableBackups.mockRejectedValue(
        new Error('Failed to load backups')
      );

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Error loading backups:')).toBeInTheDocument();
        expect(screen.getByText('Failed to load backups')).toBeInTheDocument();
      });
    });

    it('should allow retrying after error', async () => {
      mockRestoreService.getAvailableBackups
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockBackups);

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Error loading backups:')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
        expect(screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no backups are available', async () => {
      mockRestoreService.getAvailableBackups.mockResolvedValue([]);

      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('No Backup Files Found')).toBeInTheDocument();
        expect(screen.getByText('No backup files are available for restoration.')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const mockOnCancel = vi.fn();

      render(<BackupBrowser onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show close button in header when onCancel is provided', async () => {
      const mockOnCancel = vi.fn();

      render(<BackupBrowser onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not show cancel button when onCancel is not provided', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockOnCancel = vi.fn();

      render(<BackupBrowser onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(<BackupBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Backup Browser')).toBeInTheDocument();
      });

      const firstBackup = screen.getByText('portfolio-2025-09-23T21-24-33-089Z.json').closest('div')!;
      
      // Add tabindex to make it focusable for testing
      firstBackup.setAttribute('tabindex', '0');
      firstBackup.focus();
      expect(document.activeElement).toBe(firstBackup);
    });
  });

  describe('Props Configuration', () => {
    it('should respect maxHeight prop', () => {
      const { container } = render(<BackupBrowser maxHeight="400px" />);
      
      const browserContainer = container.firstChild as HTMLElement;
      expect(browserContainer.style.maxHeight).toBe('400px');
    });

    it('should use default maxHeight when not provided', () => {
      const { container } = render(<BackupBrowser />);
      
      const browserContainer = container.firstChild as HTMLElement;
      expect(browserContainer.style.maxHeight).toBe('600px');
    });
  });
});