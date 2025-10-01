import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRestoreDetection } from '../src/hooks/useRestoreDetection';
import type { AppState } from '../src/state/types';
import { createInitialState, createEmptyPortfolio } from '../src/state/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useRestoreDetection', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createEmptyPortfolioData = (): AppState => ({
    portfolios: [
      createEmptyPortfolio('portfolio-1', 'Empty Portfolio'),
    ],
    activePortfolioId: 'portfolio-1',
    playground: { enabled: false },
    filters: {},
  });

  const createPortfolioWithHoldings = (): AppState => {
    const state = createInitialState();
    state.portfolios[0].holdings = [
      {
        id: 'holding-1',
        section: 'Core',
        theme: 'All',
        assetType: 'ETF',
        name: 'Test ETF',
        ticker: 'TEST',
        exchange: 'LSE',
        account: 'Brokerage',
        price: 100,
        qty: 10,
        include: true,
        avgCost: 100,
      },
    ];
    return state;
  };

  const createPortfolioWithOnlyCashBuffer = (): AppState => {
    const state = createInitialState();
    state.portfolios[0].holdings = [
      {
        id: 'cash-1',
        section: 'Cash',
        theme: 'Cash',
        assetType: 'Cash',
        name: 'Cash buffer',
        ticker: 'CASH',
        exchange: 'LSE',
        account: 'Brokerage',
        price: 1,
        qty: 1000,
        include: true,
        avgCost: 1,
      },
    ];
    return state;
  };

  const mockBackupsResponse = [
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
  ];

  describe('empty portfolio detection', () => {
    it('should detect empty portfolio with no holdings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/backups');
    });

    it('should detect empty portfolio with only cash buffer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      const cashOnlyData = createPortfolioWithOnlyCashBuffer();
      const { result } = renderHook(() => useRestoreDetection(cashOnlyData));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(true);
      });
    });

    it('should not show restore prompt for portfolio with holdings', async () => {
      const dataWithHoldings = createPortfolioWithHoldings();
      const { result } = renderHook(() => useRestoreDetection(dataWithHoldings));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(false);
      });

      // Should not fetch backups if portfolio is not empty
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty portfolios array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      const emptyPortfoliosData: AppState = {
        portfolios: [],
        activePortfolioId: '',
        playground: { enabled: false },
        filters: {},
      };

      const { result } = renderHook(() => useRestoreDetection(emptyPortfoliosData));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(true);
      });
    });
  });

  describe('backup fetching', () => {
    it('should fetch and sort available backups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.availableBackups).toHaveLength(2);
      });

      // Should be sorted by timestamp (newest first)
      expect(result.current.availableBackups[0].timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.current.availableBackups[1].timestamp).toBe('2025-09-23T20:58:00.670Z');
    });

    it('should handle backup fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.checkError).toBe('Network error');
      });

      expect(result.current.shouldShowRestorePrompt).toBe(false);
    });

    it('should handle HTTP errors when fetching backups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.checkError).toBe('Failed to fetch backups: 500 Internal Server Error');
      });
    });

    it('should not show restore prompt when no backups available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(false);
      });

      expect(result.current.availableBackups).toHaveLength(0);
    });
  });

  describe('restore functionality', () => {
    it('should restore from latest backup', async () => {
      const mockRestoredData = createPortfolioWithHoldings();
      
      // Mock backup fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      // Mock restore request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockRestoredData,
        }),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.availableBackups).toHaveLength(2);
      });

      const restoreResult = await result.current.restoreFromLatest();

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredData).toEqual(mockRestoredData);
      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: mockBackupsResponse[0].filePath }),
      });
    });

    it('should restore from specific backup', async () => {
      const mockRestoredData = createPortfolioWithHoldings();
      
      // Mock backup fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      // Mock restore request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockRestoredData,
        }),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.availableBackups).toHaveLength(2);
      });

      const specificFilePath = mockBackupsResponse[1].filePath;
      const restoreResult = await result.current.restoreFromBackup(specificFilePath);

      expect(restoreResult.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: specificFilePath }),
      });
    });

    it('should handle restore errors', async () => {
      // Mock backup fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      // Mock restore error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.availableBackups).toHaveLength(2);
      });

      const restoreResult = await result.current.restoreFromLatest();

      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toBe('Restore failed: 500 Internal Server Error');
    });

    it('should handle restore from latest when no backups available', async () => {
      // Mock backup fetch with empty array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.availableBackups).toHaveLength(0);
      });

      const restoreResult = await result.current.restoreFromLatest();

      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toBe('No backup files available');
    });
  });

  describe('user interactions', () => {
    it('should dismiss restore prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupsResponse),
      });

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(true);
      });

      result.current.dismissRestorePrompt();

      await waitFor(() => {
        expect(result.current.shouldShowRestorePrompt).toBe(false);
      });
    });
  });

  describe('loading states', () => {
    it('should show loading state while checking backups', () => {
      // Mock a slow response
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      const emptyData = createEmptyPortfolioData();
      const { result } = renderHook(() => useRestoreDetection(emptyData));

      expect(result.current.isCheckingBackups).toBe(true);
      expect(result.current.shouldShowRestorePrompt).toBe(false);
    });
  });
});