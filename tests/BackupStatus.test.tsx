import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BackupStatus from '../src/components/BackupStatus';
import { useBackup } from '../src/hooks/useBackup';
import { usePortfolio } from '../src/state/portfolioStore';

// Mock the hooks
vi.mock('../src/hooks/useBackup');
vi.mock('../src/state/portfolioStore');

const mockUseBackup = vi.mocked(useBackup);
const mockUsePortfolio = vi.mocked(usePortfolio);

// Mock portfolio context data
const mockPortfolioContext = {
  portfolios: [
    {
      id: 'portfolio-1',
      name: 'Test Portfolio',
      type: 'actual' as const,
      holdings: [],
      settings: { currency: 'USD' },
      lists: { sections: [], themes: [], accounts: [], themeSections: {} },
      budgets: { sections: {}, accounts: {}, themes: {} },
      trades: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  portfolio: {
    id: 'portfolio-1',
    name: 'Test Portfolio',
    type: 'actual' as const,
    holdings: [],
    settings: { currency: 'USD' },
    lists: { sections: [], themes: [], accounts: [], themeSections: {} },
    budgets: { sections: {}, accounts: {}, themes: {} },
    trades: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  filters: {},
  playground: { enabled: false },
};

describe('BackupStatus', () => {
  const mockCreateBackup = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUsePortfolio.mockReturnValue(mockPortfolioContext);
    
    mockUseBackup.mockReturnValue({
      createBackup: mockCreateBackup,
      isBackingUp: false,
      lastBackupTime: null,
      backupError: null,
      clearError: mockClearError,
    });

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Status Display', () => {
    it('should show "No backup information" when no backup data is available', () => {
      render(<BackupStatus />);
      
      expect(screen.getByText('No backup information')).toBeInTheDocument();
      expect(screen.getByText('Status unknown')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show loading state when backup is in progress', () => {
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: true,
        lastBackupTime: null,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('Backing up...')).toBeInTheDocument();
      // Check for spinner element
      const spinner = document.querySelector('[style*="animation"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should show success state with timestamp when backup exists', () => {
      // Use a recent timestamp to ensure "Just now" or "ago" appears
      const mockTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: mockTimestamp,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('Backup up to date')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      // Should show relative time
      expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
    });

    it('should show error state with retry button when backup fails', () => {
      const mockError = 'Network connection failed';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('Backup failed')).toBeInTheDocument();
      expect(screen.getByText(mockError)).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should show "Just now" for very recent backups', () => {
      const recentTimestamp = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: recentTimestamp,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should show minutes for recent backups', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: timestamp,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('should show hours for older backups', () => {
      const timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: timestamp,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should handle invalid timestamps gracefully', () => {
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: 'invalid-date',
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should call createBackup when retry button is clicked', async () => {
      const mockError = 'Backup failed';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });
      
      expect(mockClearError).toHaveBeenCalled();
      expect(mockCreateBackup).toHaveBeenCalledWith(expect.objectContaining({
        portfolios: expect.any(Array),
        activePortfolioId: 'portfolio-1',
        filters: {},
        playground: { enabled: false },
      }));
    });

    it('should not show retry button when showRetryButton is false', () => {
      const mockError = 'Backup failed';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus showRetryButton={false} />);
      
      expect(screen.getAllByText('Backup failed')[0]).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should handle retry failures gracefully', async () => {
      const mockError = 'Backup failed';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCreateBackup.mockRejectedValue(new Error('Retry failed'));
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Retry backup failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Variant Styles', () => {
    it('should apply compact styles when variant is compact', () => {
      const { container } = render(<BackupStatus variant="compact" />);
      
      const backupContainer = container.firstChild as HTMLElement;
      expect(backupContainer).toHaveStyle({ padding: '0.5rem', fontSize: '0.75rem' });
    });

    it('should apply detailed styles by default', () => {
      const { container } = render(<BackupStatus />);
      
      const backupContainer = container.firstChild as HTMLElement;
      expect(backupContainer).toHaveStyle({ padding: '0.75rem', fontSize: '0.875rem' });
    });

    it('should show full timestamp in detailed mode', () => {
      const mockTimestamp = '2024-01-15T10:30:00.000Z';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: mockTimestamp,
        backupError: null,
        clearError: mockClearError,
      });

      render(<BackupStatus variant="detailed" />);
      
      // Should show both relative and absolute timestamps in detailed mode
      expect(screen.getByText(/\(/)).toBeInTheDocument(); // Parentheses around full timestamp
    });

    it('should hide error details in compact mode', () => {
      const mockError = 'Very long detailed error message that should be hidden';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus variant="compact" />);
      
      expect(screen.getByText('Backup failed')).toBeInTheDocument();
      expect(screen.queryByText(mockError)).not.toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    it('should show auto-refresh indicator when enabled in detailed mode', () => {
      render(<BackupStatus autoRefresh={true} variant="detailed" />);
      
      expect(screen.getByText('Auto-refresh enabled')).toBeInTheDocument();
    });

    it('should not show auto-refresh indicator in compact mode', () => {
      render(<BackupStatus autoRefresh={true} variant="compact" />);
      
      expect(screen.queryByText('Auto-refresh enabled')).not.toBeInTheDocument();
    });

    it('should refresh at specified intervals', async () => {
      const { rerender } = render(<BackupStatus autoRefresh={true} refreshInterval={1000} />);
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Component should still be rendered (internal state updated)
      expect(screen.getByText('No backup information')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels and titles', () => {
      const mockError = 'Backup failed';
      mockUseBackup.mockReturnValue({
        createBackup: mockCreateBackup,
        isBackingUp: false,
        lastBackupTime: null,
        backupError: mockError,
        clearError: mockClearError,
      });

      render(<BackupStatus />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAttribute('title', 'Retry backup operation');
    });

    it('should have title attribute in compact mode', () => {
      const { container } = render(<BackupStatus variant="compact" />);
      
      const backupContainer = container.firstChild as HTMLElement;
      expect(backupContainer).toHaveAttribute('title', 'Backup status - click for details');
    });
  });

  describe('CSS Animation', () => {
    it('should add spinner keyframes to document head', () => {
      render(<BackupStatus />);
      
      // Check if keyframes were added to document head
      const styleElements = document.head.querySelectorAll('style');
      const hasSpinnerKeyframes = Array.from(styleElements).some(
        style => style.textContent?.includes('@keyframes spin')
      );
      
      expect(hasSpinnerKeyframes).toBe(true);
    });

    it('should clean up keyframes on unmount', () => {
      const { unmount } = render(<BackupStatus />);
      
      const initialStyleCount = document.head.querySelectorAll('style').length;
      
      unmount();
      
      const finalStyleCount = document.head.querySelectorAll('style').length;
      expect(finalStyleCount).toBe(initialStyleCount - 1);
    });
  });
});