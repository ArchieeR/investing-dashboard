import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoRestore } from '../src/hooks/useAutoRestore';
import { RestoreService } from '../src/services/restoreService';
import { createInitialState, type AppState } from '../src/state/types';

// Mock the RestoreService
vi.mock('../src/services/restoreService');

const mockRestoreService = vi.mocked(RestoreService);

describe('useAutoRestore', () => {
  const mockOnRestoreComplete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', async () => {
    const portfolioData = createInitialState();
    
    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);
    
    const { result } = renderHook(() => 
      useAutoRestore(portfolioData, mockOnRestoreComplete)
    );

    // Initially checking
    expect(result.current.isCheckingRestore).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    expect(result.current.restoreResult).toBeNull();
    expect(result.current.availableBackups).toEqual([]);
    expect(result.current.checkError).toBeNull();
  });

  it('should check for auto-restore on mount with empty portfolio', async () => {
    const emptyPortfolio: AppState = {
      portfolios: [],
      activePortfolioId: '',
      playground: { enabled: false },
      filters: {},
    };

    const mockBackups = [
      {
        timestamp: '2025-09-23T11:00:00-000Z',
        filePath: 'latest.json',
        portfolioCount: 3,
        holdingsCount: 8,
      },
    ];

    const mockRestoreResult = {
      success: true,
      restoredData: createInitialState(),
      message: 'Restored successfully',
    };

    mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackups);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(true);
    mockRestoreService.performAutoRestore.mockResolvedValue(mockRestoreResult);

    const { result } = renderHook(() => 
      useAutoRestore(emptyPortfolio, mockOnRestoreComplete)
    );

    // Should start checking
    expect(result.current.isCheckingRestore).toBe(true);

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    expect(mockRestoreService.getAvailableBackups).toHaveBeenCalled();
    expect(mockRestoreService.performAutoRestore).toHaveBeenCalledWith(emptyPortfolio);
    expect(result.current.availableBackups).toEqual(mockBackups);
    expect(result.current.restoreResult).toEqual(mockRestoreResult);
    expect(mockOnRestoreComplete).toHaveBeenCalledWith(mockRestoreResult.restoredData);
  });

  it('should not auto-restore if portfolio is not empty', async () => {
    const nonEmptyPortfolio = createInitialState();
    nonEmptyPortfolio.portfolios[0].holdings = [
      {
        id: 'stock1',
        assetType: 'Stock',
        name: 'Apple Inc',
        section: 'Core',
        theme: 'Tech',
        ticker: 'AAPL',
        exchange: 'NASDAQ',
        account: 'Brokerage',
        price: 150,
        qty: 10,
        include: true,
        avgCost: 145,
      },
    ];

    const mockBackups = [
      {
        timestamp: '2025-09-23T11:00:00-000Z',
        filePath: 'latest.json',
        portfolioCount: 3,
        holdingsCount: 8,
      },
    ];

    mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackups);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);

    const { result } = renderHook(() => 
      useAutoRestore(nonEmptyPortfolio, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    expect(mockRestoreService.getAvailableBackups).toHaveBeenCalled();
    expect(mockRestoreService.performAutoRestore).not.toHaveBeenCalled();
    expect(result.current.availableBackups).toEqual(mockBackups);
    expect(result.current.restoreResult).toBeNull();
    expect(mockOnRestoreComplete).not.toHaveBeenCalled();
  });

  it('should handle errors during auto-restore check', async () => {
    const emptyPortfolio: AppState = {
      portfolios: [],
      activePortfolioId: '',
      playground: { enabled: false },
      filters: {},
    };

    const errorMessage = 'Failed to fetch backups';
    mockRestoreService.getAvailableBackups.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => 
      useAutoRestore(emptyPortfolio, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    expect(result.current.checkError).toBe(errorMessage);
    expect(result.current.restoreResult).toBeNull();
    expect(mockOnRestoreComplete).not.toHaveBeenCalled();
  });

  it('should perform manual restore', async () => {
    const portfolioData = createInitialState();
    const mockRestoreResult = {
      success: true,
      restoredData: createInitialState(),
      message: 'Manual restore successful',
    };

    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);
    mockRestoreService.restoreFromBackup.mockResolvedValue(mockRestoreResult);

    const { result } = renderHook(() => 
      useAutoRestore(portfolioData, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    let restorePromise: Promise<any>;
    act(() => {
      restorePromise = result.current.performRestore('specific-backup.json');
    });

    expect(result.current.isCheckingRestore).toBe(true);

    await act(async () => {
      const restoreResult = await restorePromise;
      expect(restoreResult).toEqual(mockRestoreResult);
    });

    expect(result.current.isCheckingRestore).toBe(false);
    expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith('specific-backup.json');
    expect(result.current.restoreResult).toEqual(mockRestoreResult);
    expect(mockOnRestoreComplete).toHaveBeenCalledWith(mockRestoreResult.restoredData);
  });

  it('should perform restore from latest when no filePath provided', async () => {
    const portfolioData = createInitialState();
    const mockRestoreResult = {
      success: true,
      restoredData: createInitialState(),
      message: 'Latest restore successful',
    };

    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);
    mockRestoreService.restoreFromLatest.mockResolvedValue(mockRestoreResult);

    const { result } = renderHook(() => 
      useAutoRestore(portfolioData, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    let restorePromise: Promise<any>;
    act(() => {
      restorePromise = result.current.performRestore();
    });

    await act(async () => {
      const restoreResult = await restorePromise;
      expect(restoreResult).toEqual(mockRestoreResult);
    });

    expect(mockRestoreService.restoreFromLatest).toHaveBeenCalled();
    expect(result.current.restoreResult).toEqual(mockRestoreResult);
  });

  it('should handle restore errors', async () => {
    const portfolioData = createInitialState();
    const errorMessage = 'Restore failed';
    const mockRestoreResult = {
      success: false,
      error: errorMessage,
    };

    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);
    mockRestoreService.restoreFromLatest.mockResolvedValue(mockRestoreResult);

    const { result } = renderHook(() => 
      useAutoRestore(portfolioData, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    let restorePromise: Promise<any>;
    act(() => {
      restorePromise = result.current.performRestore();
    });

    await act(async () => {
      const restoreResult = await restorePromise;
      expect(restoreResult).toEqual(mockRestoreResult);
    });

    expect(result.current.restoreResult).toEqual(mockRestoreResult);
    expect(mockOnRestoreComplete).not.toHaveBeenCalled();
  });

  it('should clear restore result', async () => {
    const portfolioData = createInitialState();
    
    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(false);

    const { result } = renderHook(() => 
      useAutoRestore(portfolioData, mockOnRestoreComplete)
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    // Manually trigger a restore to set some state
    const mockRestoreResult = {
      success: true,
      restoredData: createInitialState(),
      message: 'Test restore',
    };

    mockRestoreService.restoreFromLatest.mockResolvedValue(mockRestoreResult);

    let restorePromise: Promise<any>;
    act(() => {
      restorePromise = result.current.performRestore();
    });

    await act(async () => {
      await restorePromise;
    });

    // Verify state is set
    expect(result.current.restoreResult).toEqual(mockRestoreResult);

    // Now clear it
    act(() => {
      result.current.clearRestoreResult();
    });

    expect(result.current.restoreResult).toBeNull();
    expect(result.current.checkError).toBeNull();
  });

  it('should not run auto-restore check if already restored successfully', async () => {
    const portfolioData = createInitialState();
    
    mockRestoreService.getAvailableBackups.mockResolvedValue([]);
    mockRestoreService.isPortfolioEmpty.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoRestore(data, mockOnRestoreComplete),
      { initialProps: { data: portfolioData } }
    );

    await waitFor(() => {
      expect(result.current.isCheckingRestore).toBe(false);
    });

    // Perform a successful restore first
    const mockRestoreResult = {
      success: true,
      restoredData: createInitialState(),
      message: 'Test restore',
    };

    mockRestoreService.restoreFromLatest.mockResolvedValue(mockRestoreResult);

    let restorePromise: Promise<any>;
    act(() => {
      restorePromise = result.current.performRestore();
    });

    await act(async () => {
      await restorePromise;
    });

    // Clear the mock calls after successful restore
    mockRestoreService.getAvailableBackups.mockClear();

    // Trigger re-render with new data
    const newPortfolioData = { ...portfolioData };
    rerender({ data: newPortfolioData });

    // Wait a bit to ensure no new calls are made
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should not call getAvailableBackups again since restore was successful
    expect(mockRestoreService.getAvailableBackups).not.toHaveBeenCalled();
  });
});