import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useManualRestore } from '../src/hooks/useManualRestore';
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

describe('useManualRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
      portfolioCount: 2,
      holdingsCount: 12,
    },
  ];

  const mockAppState: AppState = {
    portfolios: [
      {
        id: 'portfolio-1',
        name: 'Test Portfolio',
        type: 'actual',
        lists: {
          sections: ['Core', 'Satellite', 'Cash'],
          themes: ['All', 'Cash'],
          accounts: ['Brokerage'],
          themeSections: { All: 'Core', Cash: 'Cash' },
        },
        holdings: [],
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    activePortfolioId: 'portfolio-1',
    playground: { enabled: false },
    filters: {},
  };

  describe('restoreFromBackup', () => {
    it('should successfully restore from backup', async () => {
      const mockResult = {
        success: true,
        restoredData: mockAppState,
        message: 'Successfully restored from backup',
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useManualRestore());

      expect(result.current.isRestoring).toBe(false);
      expect(result.current.restoreError).toBe(null);

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup('test-backup.json');
      });

      expect(mockRestoreService.restoreFromBackup).toHaveBeenCalledWith('test-backup.json');
      expect(restoreResult).toEqual({
        ...mockResult,
        preRestoreBackupCreated: true,
      });
      expect(result.current.isRestoring).toBe(false);
      expect(result.current.restoreError).toBe(null);
    });

    it('should handle restore failure', async () => {
      const mockError = 'Backup file not found';
      const mockResult = {
        success: false,
        error: mockError,
      };

      mockRestoreService.restoreFromBackup.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup('invalid-backup.json');
      });

      expect(restoreResult).toEqual({
        ...mockResult,
        preRestoreBackupCreated: false,
      });
      expect(result.current.restoreError).toBe(mockError);
      expect(result.current.isRestoring).toBe(false);
    });

    it('should handle invalid file path', async () => {
      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup('');
      });

      expect(mockRestoreService.restoreFromBackup).not.toHaveBeenCalled();
      expect(restoreResult).toEqual({
        success: false,
        error: 'Invalid file path provided',
      });
      expect(result.current.restoreError).toBe('Invalid file path provided');
    });

    it('should handle network/service errors', async () => {
      const networkError = new Error('Network error');
      mockRestoreService.restoreFromBackup.mockRejectedValue(networkError);

      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup('test-backup.json');
      });

      expect(restoreResult).toEqual({
        success: false,
        error: 'Network error',
        preRestoreBackupCreated: false,
      });
      expect(result.current.restoreError).toBe('Network error');
    });

    it('should set isRestoring state correctly during operation', async () => {
      let resolveRestore: (value: any) => void;
      const restorePromise = new Promise((resolve) => {
        resolveRestore = resolve;
      });

      mockRestoreService.restoreFromBackup.mockReturnValue(restorePromise);

      const { result } = renderHook(() => useManualRestore());

      expect(result.current.isRestoring).toBe(false);

      // Start restore operation
      act(() => {
        result.current.restoreFromBackup('test-backup.json');
      });

      expect(result.current.isRestoring).toBe(true);

      // Complete restore operation
      await act(async () => {
        resolveRestore!({
          success: true,
          restoredData: mockAppState,
        });
        await restorePromise;
      });

      expect(result.current.isRestoring).toBe(false);
    });
  });

  describe('getAvailableBackups', () => {
    it('should successfully fetch available backups', async () => {
      mockRestoreService.getAvailableBackups.mockResolvedValue(mockBackupMetadata);

      const { result } = renderHook(() => useManualRestore());

      let backups;
      await act(async () => {
        backups = await result.current.getAvailableBackups();
      });

      expect(mockRestoreService.getAvailableBackups).toHaveBeenCalled();
      expect(backups).toEqual(mockBackupMetadata);
      expect(result.current.restoreError).toBe(null);
    });

    it('should handle fetch backups failure', async () => {
      const fetchError = new Error('Failed to fetch backups');
      mockRestoreService.getAvailableBackups.mockRejectedValue(fetchError);

      const { result } = renderHook(() => useManualRestore());

      await act(async () => {
        try {
          await result.current.getAvailableBackups();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.restoreError).toBe('Failed to fetch backups');
    });
  });

  describe('clearError', () => {
    it('should clear restore error', async () => {
      mockRestoreService.restoreFromBackup.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      const { result } = renderHook(() => useManualRestore());

      // Set an error
      await act(async () => {
        await result.current.restoreFromBackup('invalid-backup.json');
      });

      expect(result.current.restoreError).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.restoreError).toBe(null);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error objects thrown', async () => {
      mockRestoreService.restoreFromBackup.mockRejectedValue('String error');

      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup('test-backup.json');
      });

      expect(restoreResult).toEqual({
        success: false,
        error: 'Unknown restore error',
        preRestoreBackupCreated: false,
      });
      expect(result.current.restoreError).toBe('Unknown restore error');
    });

    it('should handle null file path', async () => {
      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup(null as any);
      });

      expect(restoreResult).toEqual({
        success: false,
        error: 'Invalid file path provided',
      });
    });

    it('should handle undefined file path', async () => {
      const { result } = renderHook(() => useManualRestore());

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restoreFromBackup(undefined as any);
      });

      expect(restoreResult).toEqual({
        success: false,
        error: 'Invalid file path provided',
      });
    });
  });
});