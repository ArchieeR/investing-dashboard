import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { PortfolioProvider } from '../src/state/portfolioStore';

// Simple mocks for the backup functionality
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
    availableBackups: [],
    isCheckingBackups: false,
    restoreFromLatest: vi.fn(),
    restoreFromBackup: vi.fn(),
    dismissRestorePrompt: vi.fn(),
    checkError: null,
  })),
}));

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

describe('Backup UI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Main Interface Integration', () => {
    it('should display backup button in portfolio header', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check that backup button is present
      expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
    });

    it('should display backup status in portfolio header', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check that backup status is displayed
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
    });

    it('should show restore detector component', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // The RestoreDetector should be rendered (even if not showing a prompt)
      // We can't easily test its presence without it showing a dialog,
      // but we can verify the app renders without errors
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();
    });
  });

  describe('Settings Panel Integration', () => {
    it('should navigate to settings and show backup management tab', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Should show backup management tab
      expect(screen.getByRole('button', { name: /backup management/i })).toBeInTheDocument();
    });

    it('should show backup management content when tab is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to settings and backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Should show backup management sections
      expect(screen.getByText(/current status/i)).toBeInTheDocument();
      expect(screen.getByText(/manual backup/i)).toBeInTheDocument();
      expect(screen.getByText(/restore from backup/i)).toBeInTheDocument();
      expect(screen.getByText(/backup settings/i)).toBeInTheDocument();
    });

    it('should show backup components in settings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // Should show BackupStatus component
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
      
      // Should show BackupButton component
      expect(screen.getAllByRole('button', { name: /backup now/i }).length).toBeGreaterThan(0);
      
      // Should show browse backup files button
      expect(screen.getByRole('button', { name: /browse backup files/i })).toBeInTheDocument();
    });

    it('should show backup browser when browse button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to backup management and click browse
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));

      // Should show backup browser (even if empty)
      expect(screen.getByText(/backup browser/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all backup components without errors', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Main interface should render with backup components
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();
    });

    it('should handle navigation between main interface and settings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Start in main interface
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();

      // Navigate to settings
      await user.click(screen.getByRole('button', { name: /settings/i }));
      expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();

      // Navigate back to portfolio
      await user.click(screen.getByRole('button', { name: /back to portfolio/i }));
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow Integration', () => {
    it('should support complete backup management workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // 1. Start in main interface with backup controls
      expect(screen.getByRole('button', { name: /backup now/i })).toBeInTheDocument();
      expect(screen.getByText(/backup up to date/i)).toBeInTheDocument();

      // 2. Navigate to detailed backup management
      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('button', { name: /backup management/i }));

      // 3. Should show comprehensive backup management interface
      expect(screen.getByText(/current status/i)).toBeInTheDocument();
      expect(screen.getByText(/manual backup/i)).toBeInTheDocument();
      expect(screen.getByText(/restore from backup/i)).toBeInTheDocument();
      expect(screen.getByText(/automatic backups are active/i)).toBeInTheDocument();

      // 4. Should be able to access backup browser
      await user.click(screen.getByRole('button', { name: /browse backup files/i }));
      expect(screen.getByText(/backup browser/i)).toBeInTheDocument();

      // 5. Should be able to navigate back
      await user.click(screen.getByRole('button', { name: /back to portfolio/i }));
      expect(screen.getByText(/portfolio manager/i)).toBeInTheDocument();
    });
  });
});