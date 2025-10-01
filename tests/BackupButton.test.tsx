import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackupButton from '../src/components/BackupButton';
import { useBackup } from '../src/hooks/useBackup';
import { usePortfolio } from '../src/state/portfolioStore';

// Mock the hooks
vi.mock('../src/hooks/useBackup');
vi.mock('../src/state/portfolioStore');

const mockUseBackup = vi.mocked(useBackup);
const mockUsePortfolio = vi.mocked(usePortfolio);

describe('BackupButton', () => {
  const mockCreateBackup = vi.fn();
  const mockClearError = vi.fn();
  
  const defaultBackupHook = {
    createBackup: mockCreateBackup,
    isBackingUp: false,
    lastBackupTime: null,
    backupError: null,
    clearError: mockClearError,
  };

  const defaultPortfolioContext = {
    portfolios: [{ id: 'portfolio-1', name: 'Test Portfolio', type: 'actual' as const, owner: 'user' }],
    portfolio: {
      id: 'portfolio-1',
      name: 'Test Portfolio',
      type: 'actual' as const,
      owner: 'user',
      holdings: [],
      lists: {
        sections: ['Core'],
        themes: ['All'],
        accounts: ['Brokerage'],
        themeSections: {},
      },
      budgets: {},
      settings: {
        visibleColumns: [],
        livePricesEnabled: false,
        livePricesApiKey: '',
        livePricesProvider: 'alphavantage' as const,
      },
    },
    filters: {},
    playground: { enabled: false },
    // Add other required context properties as needed
    derivedHoldings: [],
    totalValue: 0,
    targetPortfolioValue: 0,
    bySection: [],
    byAccount: [],
    byTheme: [],
    budgets: {},
    remaining: {},
    trades: [],
    setBudget: vi.fn(),
    setHoldingTargetPercent: vi.fn(),
    setThemeSection: vi.fn(),
    addListItem: vi.fn(),
    renameListItem: vi.fn(),
    removeListItem: vi.fn(),
    reorderList: vi.fn(),
    importHoldings: vi.fn(),
    setActivePortfolio: vi.fn(),
    renamePortfolio: vi.fn(),
    addPortfolio: vi.fn(),
    removePortfolio: vi.fn(),
    createDraftPortfolio: vi.fn(),
    promoteDraftToActual: vi.fn(),
    recordTrade: vi.fn(),
    importTrades: vi.fn(),
    setPlaygroundEnabled: vi.fn(),
    restorePlayground: vi.fn(),
    restorePortfolioBackup: vi.fn(),
    addHolding: vi.fn(),
    duplicateHolding: vi.fn(),
    updateHolding: vi.fn(),
    deleteHolding: vi.fn(),
    setTotal: vi.fn(),
    setTargetPortfolioValue: vi.fn(),
    setFilter: vi.fn(),
    updatePortfolioSettings: vi.fn(),
    updateLivePrices: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBackup.mockReturnValue(defaultBackupHook);
    mockUsePortfolio.mockReturnValue(defaultPortfolioContext);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders backup button with default props', () => {
      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('💾');
      expect(button).toHaveTextContent('Backup Now');
    });

    it('renders with custom variant and size', () => {
      render(<BackupButton variant="primary" size="lg" />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      expect(button).toBeInTheDocument();
    });

    it('shows last backup time when showLastBackupTime is true', () => {
      const lastBackupTime = '2024-01-15T10:30:00.000Z';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        lastBackupTime,
      });

      render(<BackupButton showLastBackupTime={true} />);
      
      expect(screen.getByText(/last backup:/i)).toBeInTheDocument();
    });

    it('does not show last backup time when showLastBackupTime is false', () => {
      const lastBackupTime = '2024-01-15T10:30:00.000Z';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        lastBackupTime,
      });

      render(<BackupButton showLastBackupTime={false} />);
      
      expect(screen.queryByText(/last backup:/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state when backup is in progress', () => {
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        isBackingUp: true,
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backing up/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('⏳');
      expect(button).toHaveTextContent('Backing up...');
    });

    it('disables button during backup operation', () => {
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        isBackingUp: true,
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls createBackup when button is clicked', async () => {
      mockCreateBackup.mockResolvedValue({
        success: true,
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledTimes(1);
      });
    });

    it('passes correct app state to createBackup', async () => {
      mockCreateBackup.mockResolvedValue({
        success: true,
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledWith(
          expect.objectContaining({
            portfolios: defaultPortfolioContext.portfolios,
            activePortfolioId: defaultPortfolioContext.portfolio.id,
            filters: defaultPortfolioContext.filters,
            playground: defaultPortfolioContext.playground,
          })
        );
      });
    });

    it('clears error when backup is initiated', async () => {
      mockCreateBackup.mockResolvedValue({
        success: true,
        timestamp: '2024-01-15T10:30:00.000Z',
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Success Feedback', () => {
    it('calls createBackup and handles success', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      mockCreateBackup.mockResolvedValue({
        success: true,
        timestamp,
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      fireEvent.click(button);

      // Verify the backup function was called
      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after successful backup', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      mockCreateBackup.mockImplementation(async () => {
        return {
          success: true,
          timestamp,
        };
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      // Use act to ensure state updates are processed
      await act(async () => {
        fireEvent.click(button);
      });

      // Wait for the backup to complete and message to show
      await waitFor(() => {
        expect(screen.getByText('Backup created successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('shows formatted timestamp in success message', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      mockCreateBackup.mockImplementation(async () => {
        return {
          success: true,
          timestamp,
        };
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup created successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Check that timestamp is formatted and displayed
      const timestampElement = screen.getByText(/1\/15\/2024/);
      expect(timestampElement).toBeInTheDocument();
    });

    it('allows manual dismissal of success message', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      mockCreateBackup.mockImplementation(async () => {
        return {
          success: true,
          timestamp,
        };
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup created successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });

      const dismissButton = screen.getByLabelText('Dismiss');
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Backup created successfully!')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when backup fails', async () => {
      const errorMessage = 'Network error occurred';
      mockCreateBackup.mockImplementation(async () => {
        return {
          success: false,
          timestamp: '2024-01-15T10:30:00.000Z',
          error: errorMessage,
        };
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup failed')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows error message when createBackup throws exception', async () => {
      const errorMessage = 'Unexpected error';
      mockCreateBackup.mockImplementation(async () => {
        throw new Error(errorMessage);
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup failed')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows persistent error from hook state', () => {
      const errorMessage = 'Persistent error from hook';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        backupError: errorMessage,
      });

      render(<BackupButton />);
      
      expect(screen.getByText('Backup Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('allows dismissal of persistent error', () => {
      const errorMessage = 'Persistent error from hook';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        backupError: errorMessage,
      });

      render(<BackupButton />);
      
      expect(screen.getByText('Backup Error')).toBeInTheDocument();

      const dismissButton = screen.getByLabelText('Dismiss');
      fireEvent.click(dismissButton);

      expect(mockClearError).toHaveBeenCalled();
    });

    it('does not show persistent error when feedback message is active', async () => {
      const persistentError = 'Persistent error';
      const newError = 'New backup error';
      
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        backupError: persistentError,
      });

      mockCreateBackup.mockImplementation(async () => {
        return {
          success: false,
          timestamp: '2024-01-15T10:30:00.000Z',
          error: newError,
        };
      });

      render(<BackupButton />);
      
      // Initially shows persistent error
      expect(screen.getByText('Backup Error')).toBeInTheDocument();
      expect(screen.getByText(persistentError)).toBeInTheDocument();

      // Click backup button to trigger new error
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup failed')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show new error, not persistent error
      expect(screen.getByText(newError)).toBeInTheDocument();
      expect(screen.queryByText('Backup Error')).not.toBeInTheDocument();
      expect(screen.queryByText(persistentError)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role and accessible name', () => {
      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      expect(button).toBeInTheDocument();
    });

    it('has tooltip with helpful description', () => {
      render(<BackupButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Create an immediate backup of your portfolio data');
    });

    it('dismiss buttons have accessible names', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      mockCreateBackup.mockImplementation(async () => {
        return {
          success: true,
          timestamp,
        };
      });

      render(<BackupButton />);
      
      const button = screen.getByRole('button', { name: /backup now/i });
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Backup created successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });

      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toHaveAttribute('title', 'Dismiss');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats valid timestamps correctly', () => {
      const lastBackupTime = '2024-01-15T10:30:00.000Z';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        lastBackupTime,
      });

      render(<BackupButton showLastBackupTime={true} />);
      
      // Should show formatted date
      expect(screen.getByText(/last backup:/i)).toBeInTheDocument();
    });

    it('handles invalid timestamps gracefully', () => {
      const lastBackupTime = 'invalid-timestamp';
      mockUseBackup.mockReturnValue({
        ...defaultBackupHook,
        lastBackupTime,
      });

      render(<BackupButton showLastBackupTime={true} />);
      
      // Should still show the timestamp text even if invalid
      expect(screen.getByText(/last backup:/i)).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent === `Last backup: ${lastBackupTime}`;
      })).toBeInTheDocument();
    });
  });
});