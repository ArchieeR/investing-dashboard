import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestoreDetector } from '../src/components/RestoreDetector';
import { useRestoreDetection } from '../src/hooks/useRestoreDetection';
import type { AppState } from '../src/state/types';
import { createInitialState } from '../src/state/types';

// Mock the useRestoreDetection hook
vi.mock('../src/hooks/useRestoreDetection');

const mockUseRestoreDetection = vi.mocked(useRestoreDetection);

describe('RestoreDetector', () => {
  const mockPortfolioData: AppState = createInitialState();
  const mockOnRestore = vi.fn();

  const defaultHookReturn = {
    shouldShowRestorePrompt: false,
    availableBackups: [],
    isCheckingBackups: false,
    restoreFromLatest: vi.fn(),
    restoreFromBackup: vi.fn(),
    dismissRestorePrompt: vi.fn(),
    checkError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRestoreDetection.mockReturnValue(defaultHookReturn);
  });

  it('should render nothing when not checking backups and no restore prompt', () => {
    const { container } = render(
      <RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when checking backups', () => {
    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      isCheckingBackups: true,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    expect(screen.getByText('Checking for backups...')).toBeInTheDocument();
    // Check for the loading spinner by class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show error state when backup check fails', () => {
    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      checkError: 'Network connection failed',
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    expect(screen.getByText('Backup Check Failed')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('should dismiss error when close button is clicked', () => {
    const mockDismiss = vi.fn();
    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      checkError: 'Network connection failed',
      dismissRestorePrompt: mockDismiss,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should show restore dialog when restore prompt is needed', () => {
    const mockBackups = [
      {
        timestamp: '2025-09-23T21:24:33.089Z',
        filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
        portfolioCount: 3,
        holdingsCount: 15,
      },
    ];

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: mockBackups,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    expect(screen.getByText('Restore Portfolio Data')).toBeInTheDocument();
  });

  it('should handle restore from latest backup', async () => {
    const mockRestoreFromLatest = vi.fn().mockResolvedValue({
      success: true,
      restoredData: mockPortfolioData,
    });
    const mockDismiss = vi.fn();

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      restoreFromLatest: mockRestoreFromLatest,
      dismissRestorePrompt: mockDismiss,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(mockRestoreFromLatest).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockDismiss).toHaveBeenCalled();
      expect(mockOnRestore).toHaveBeenCalledWith(mockPortfolioData);
    });
  });

  it('should handle restore from specific backup', async () => {
    const mockRestoreFromBackup = vi.fn().mockResolvedValue({
      success: true,
      restoredData: mockPortfolioData,
    });
    const mockDismiss = vi.fn();

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
        {
          timestamp: '2025-09-23T20:58:00.670Z',
          filePath: 'backups/portfolio-2025-09-23T20-58-00-670Z.json',
          portfolioCount: 3,
          holdingsCount: 12,
        },
      ],
      restoreFromBackup: mockRestoreFromBackup,
      dismissRestorePrompt: mockDismiss,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    // Select the second backup
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[0]);
    
    const restoreButton = screen.getByText('Restore Selected Backup');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(mockRestoreFromBackup).toHaveBeenCalledWith('backups/portfolio-2025-09-23T20-58-00-670Z.json');
    });

    await waitFor(() => {
      expect(mockDismiss).toHaveBeenCalled();
      expect(mockOnRestore).toHaveBeenCalledWith(mockPortfolioData);
    });
  });

  it('should handle restore failure', async () => {
    const mockRestoreFromLatest = vi.fn().mockResolvedValue({
      success: false,
      error: 'Backup file corrupted',
    });

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      restoreFromLatest: mockRestoreFromLatest,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(mockRestoreFromLatest).toHaveBeenCalled();
    });

    // Should not call onRestore or dismiss on failure
    expect(mockOnRestore).not.toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    const mockDismiss = vi.fn();

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      dismissRestorePrompt: mockDismiss,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should show success message after successful restore', async () => {
    const mockRestoreFromLatest = vi.fn().mockResolvedValue({
      success: true,
      restoredData: mockPortfolioData,
    });
    const mockDismiss = vi.fn();

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      restoreFromLatest: mockRestoreFromLatest,
      dismissRestorePrompt: mockDismiss,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(screen.getByText('Portfolio data restored successfully!')).toBeInTheDocument();
    });
  });

  it('should show loading state during restore operation', async () => {
    let resolveRestore: (value: any) => void;
    const restorePromise = new Promise(resolve => {
      resolveRestore = resolve;
    });
    
    const mockRestoreFromLatest = vi.fn().mockReturnValue(restorePromise);

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      restoreFromLatest: mockRestoreFromLatest,
    });

    render(<RestoreDetector portfolioData={mockPortfolioData} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);

    // Should show loading state
    expect(screen.getByText('Restoring...')).toBeInTheDocument();

    // Resolve the promise
    resolveRestore!({ success: true, restoredData: mockPortfolioData });

    await waitFor(() => {
      expect(screen.queryByText('Restoring...')).not.toBeInTheDocument();
    });
  });

  it('should work without onRestore callback', async () => {
    const mockRestoreFromLatest = vi.fn().mockResolvedValue({
      success: true,
      restoredData: mockPortfolioData,
    });
    const mockDismiss = vi.fn();

    mockUseRestoreDetection.mockReturnValue({
      ...defaultHookReturn,
      shouldShowRestorePrompt: true,
      availableBackups: [
        {
          timestamp: '2025-09-23T21:24:33.089Z',
          filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
          portfolioCount: 3,
          holdingsCount: 15,
        },
      ],
      restoreFromLatest: mockRestoreFromLatest,
      dismissRestorePrompt: mockDismiss,
    });

    // Render without onRestore callback
    render(<RestoreDetector portfolioData={mockPortfolioData} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(mockRestoreFromLatest).toHaveBeenCalled();
      expect(mockDismiss).toHaveBeenCalled();
    });

    // Should not throw error when onRestore is not provided
  });
});