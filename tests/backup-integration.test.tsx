import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { PortfolioProvider } from '../src/state/portfolioStore';

// Mock the backup service and hooks
vi.mock('../src/hooks/useBackup', () => ({
  useBackup: vi.fn(() => ({
    createBackup: vi.fn().mockResolvedValue({
      success: true,
      timestamp: '2025-09-24T10:00:00.000Z',
      filePath: './backups/portfolio-backup-2025-09-24T10-00-00-000Z.json'
    }),
    isBackingUp: false,
    lastBackupTime: '2025-09-24T09:30:00.000Z',
    backupError: null,
    clearError: vi.fn(),
  })),
}));

vi.mock('../src/hooks/useRestoreDetection', () => ({
  useRestoreDetection: vi.fn(() => ({
    shouldShowRestorePrompt: false,
    availableBackups: [
      {
        timestamp: '2025-09-24T09:30:00.000Z',
        filePath: './backups/portfolio-backup-2025-09-24T09-30-00-000Z.json',
        portfolioCount: 1,
        holdingsCount: 5,
      },
    ],
    isCheckingBackups: false,
    restoreFromLatest: vi.fn(),
    restoreFromBackup: vi.fn(),
    dismissRestorePrompt: vi.fn(),
    checkError: null,
  })),
}));

vi.mock('../src/services/restoreService', () => ({
  RestoreService: {
    getAvailableBackups: vi.fn().mockResolvedValue([
      {
        timestamp: '2025-09-24T09:30:00.000Z',
        filePath: './backups/portfolio-backup-2025-09-24T09-30-00-000Z.json',
        portfolioCount: 1,
        holdingsCount: 5,
      },
      {
        timestamp: '2025-09-24T08:30:00.000Z',
        filePath: './backups/portfolio-backup-2025-09-24T08-30-00-000Z.json',
        portfolioCount: 1,
        holdingsCount: 3,
      },
    ]),
    restoreFromBackup: vi.fn().mockResolvedValue({
      success: true,
      restoredData: {
        portfolios: [{
          id: 'test-portfolio',
          name: 'Test Portfolio',
          holdings: [],
          lists: { sections: [], themes: [], accounts: [] },
          settings: { currency: 'GBP', lockTotal: false, enableLivePrices: false, livePriceUpdateInterval: 5 },
        }],
      },
    }),
  },
}));

// Mock live prices hook
vi.mock('../src/hooks/useLivePrices', () => ({
  useLivePrices: vi.fn(() => ({
    quotes: new Map(),
    lastUpdated: null,
    refreshPrices: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PortfolioProvider>{children}</PortfolioProvider>
);

describe('Backup Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Main Portfolio Interface Integration', () => {
    it('should display backup button and status in header', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check that backup button is present in header
      expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
      
      // Check that backup status is displayed
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
    });

    it('should allow manual backup from header', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const backupButton = screen.getByRole('button', { name: /backup now/i });
      
      await user.click(backupButton);
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/backup created successfully/i)).toBeInTheDocument();
      });
    });

    it('should show backup status with last backup time', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should display the backup status
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
      
      // Should show relative time (look for "minutes ago" specifically)
      expect(screen.getByText(/minutes ago/i)).toBeInTheDocument();
    });
  });

  describe('Settings Panel Backup Management', () => {
    it('should navigate to backup management section', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Should be in settings panel - look for the header specifically
      expect(screen.getByRole('heading', { name: /general settings/i })).toBeInTheDocument();
      
      // Navigate to backup management
      const backupTab = screen.getByRole('button', { name: /backup management/i });
      await user.click(backupTab);

      // Should show backup management content
      expect(screen.getByText(/current status/i)).toBeInTheDocument();
      expect(screen.getByText(/manual backup/i)).toBeInTheDocument();
      expect(screen.getByText(/restore from backup/i)).toBeInTheDocument();
    });

    it('should display detailed backup status in settings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Should show detailed backup status
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
      expect(screen.getByText(/automatic backups are active/i)).toBeInTheDocument();
    });

    it('should allow browsing backup files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Click browse backup files
      const browseButton = screen.getByRole('button', { name: /browse backup files/i });
      await user.click(browseButton);

      // Should show backup browser
      await waitFor(() => {
        expect(screen.getByText(/backup browser/i)).toBeInTheDocument();
      });
    });

    it('should allow manual backup from settings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Find and click the manual backup button in settings
      const backupButtons = screen.getAllByRole('button', { name: /backup now/i });
      const settingsBackupButton = backupButtons.find(button => 
        button.closest('[style*="primary"]') !== null
      );
      
      if (settingsBackupButton) {
        await user.click(settingsBackupButton);
        
        // Should show success message
        await waitFor(() => {
          expect(screen.getByText(/backup created successfully/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Backup Browser Integration', () => {
    it('should display available backups', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup browser
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      // Should show backup files
      await waitFor(() => {
        expect(screen.getByText(/1 portfolio • 5 holdings/i)).toBeInTheDocument();
        expect(screen.getByText(/1 portfolio • 3 holdings/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting and restoring a backup', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup browser
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      // Wait for backup files to load
      await waitFor(() => {
        expect(screen.getByText(/1 portfolio • 5 holdings/i)).toBeInTheDocument();
      });

      // Select a backup
      const backupItem = screen.getByText(/1 portfolio • 5 holdings/i).closest('[role="button"]');
      if (backupItem) {
        await user.click(backupItem);
        
        // Should show restore button enabled
        const restoreButton = screen.getByRole('button', { name: /restore selected/i });
        expect(restoreButton).toBeEnabled();
        
        // Click restore
        await user.click(restoreButton);
        
        // Should handle restore (mocked)
        await waitFor(() => {
          expect(screen.queryByText(/backup browser/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should show backup preview when selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup browser
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      // Wait for backup files and select one
      await waitFor(() => {
        expect(screen.getByText(/1 portfolio • 5 holdings/i)).toBeInTheDocument();
      });

      const backupItem = screen.getByText(/1 portfolio • 5 holdings/i).closest('[role="button"]');
      if (backupItem) {
        await user.click(backupItem);
        
        // Should show backup preview
        await waitFor(() => {
          expect(screen.getByText(/backup preview/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle backup errors gracefully', async () => {
      // Mock backup failure
      vi.mocked(vi.importMock('../src/hooks/useBackup')).useBackup.mockReturnValue({
        createBackup: vi.fn().mockRejectedValue(new Error('Backup failed')),
        isBackingUp: false,
        lastBackupTime: null,
        backupError: 'Backup failed',
        clearError: vi.fn(),
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show error in backup status
      expect(screen.getByText(/backup failed/i)).toBeInTheDocument();
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle restore errors gracefully', async () => {
      // Mock restore failure
      vi.mocked(vi.importMock('../src/services/restoreService')).RestoreService.restoreFromBackup.mockRejectedValue(
        new Error('Restore failed')
      );

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup browser and attempt restore
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      await waitFor(() => {
        expect(screen.getByText(/1 portfolio • 5 holdings/i)).toBeInTheDocument();
      });

      const backupItem = screen.getByText(/1 portfolio • 5 holdings/i).closest('[role="button"]');
      if (backupItem) {
        await user.click(backupItem);
        await user.click(screen.getByRole('button', { name: /restore selected/i }));
        
        // Should show error message
        await waitFor(() => {
          expect(screen.getByText(/restore failed/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Restore Detection Integration', () => {
    it('should show restore prompt when portfolio is empty', async () => {
      // Mock empty portfolio detection
      vi.mocked(vi.importMock('../src/hooks/useRestoreDetection')).useRestoreDetection.mockReturnValue({
        shouldShowRestorePrompt: true,
        availableBackups: [
          {
            timestamp: '2025-09-24T09:30:00.000Z',
            filePath: './backups/portfolio-backup-2025-09-24T09-30-00-000Z.json',
            portfolioCount: 1,
            holdingsCount: 5,
          },
        ],
        isCheckingBackups: false,
        restoreFromLatest: vi.fn(),
        restoreFromBackup: vi.fn(),
        dismissRestorePrompt: vi.fn(),
        checkError: null,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show restore dialog
      await waitFor(() => {
        expect(screen.getByText(/restore portfolio/i)).toBeInTheDocument();
      });
    });

    it('should handle automatic restore from latest backup', async () => {
      const mockRestoreFromLatest = vi.fn().mockResolvedValue({
        success: true,
        restoredData: { portfolios: [{ id: 'test' }] },
      });

      vi.mocked(vi.importMock('../src/hooks/useRestoreDetection')).useRestoreDetection.mockReturnValue({
        shouldShowRestorePrompt: true,
        availableBackups: [
          {
            timestamp: '2025-09-24T09:30:00.000Z',
            filePath: './backups/portfolio-backup-2025-09-24T09-30-00-000Z.json',
            portfolioCount: 1,
            holdingsCount: 5,
          },
        ],
        isCheckingBackups: false,
        restoreFromLatest: mockRestoreFromLatest,
        restoreFromBackup: vi.fn(),
        dismissRestorePrompt: vi.fn(),
        checkError: null,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Click restore from latest
      await waitFor(() => {
        expect(screen.getByText(/restore portfolio/i)).toBeInTheDocument();
      });

      const restoreButton = screen.getByRole('button', { name: /restore from latest/i });
      await user.click(restoreButton);

      // Should call restore function
      expect(mockRestoreFromLatest).toHaveBeenCalled();
    });
  });

  describe('Complete User Workflows', () => {
    it('should complete full backup and restore workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // 1. Create manual backup from header
      await user.click(screen.getByRole('button', { name: /backup now/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/backup created successfully/i)).toBeInTheDocument();
      });

      // 2. Navigate to settings and backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // 3. Browse backups
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      // 4. Select and restore a backup
      await waitFor(() => {
        expect(screen.getByText(/1 portfolio • 5 holdings/i)).toBeInTheDocument();
      });

      const backupItem = screen.getByText(/1 portfolio • 5 holdings/i).closest('[role="button"]');
      if (backupItem) {
        await user.click(backupItem);
        await user.click(screen.getByRole('button', { name: /restore selected/i }));
        
        // Should complete restore workflow
        await waitFor(() => {
          expect(screen.queryByText(/backup browser/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should handle settings navigation and backup status monitoring', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check initial backup status in header
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();

      // Navigate to detailed backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Should show detailed status and controls
      expect(screen.getByText(/current status/i)).toBeInTheDocument();
      expect(screen.getByText(/manual backup/i)).toBeInTheDocument();
      expect(screen.getByText(/automatic backups are active/i)).toBeInTheDocument();

      // Navigate back to portfolio
      await user.click(screen.getByRole('button', { name: /back to portfolio/i }));

      // Should be back to main interface with backup controls
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
    });
  });
});