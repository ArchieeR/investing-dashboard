import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RestoreService, type BackupMetadata, type RestoreResult } from '../src/services/restoreService';
import { createInitialState, type AppState } from '../src/state/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateBackupData', () => {
    it('should validate correct backup data structure', () => {
      const validData: AppState = createInitialState();
      const result = RestoreService.validateBackupData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined data', () => {
      const result1 = RestoreService.validateBackupData(null);
      const result2 = RestoreService.validateBackupData(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Backup data is not a valid object');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Backup data is not a valid object');
    });

    it('should reject data without portfolios array', () => {
      const invalidData = { activePortfolioId: 'test' };
      const result = RestoreService.validateBackupData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Backup data missing portfolios array');
    });

    it('should validate portfolio structure', () => {
      const invalidData = {
        portfolios: [
          { id: 'test', name: 'Test', holdings: [] },
          { name: 'Invalid' }, // Missing id
        ],
        activePortfolioId: 'test',
      };
      
      const result = RestoreService.validateBackupData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Portfolio 1 missing valid id');
    });

    it('should warn about invalid holdings', () => {
      const dataWithInvalidHoldings = {
        portfolios: [{
          id: 'test',
          name: 'Test',
          holdings: [
            { id: 'h1', price: -10, qty: 5 }, // Invalid price
            { id: 'h2', price: 10, qty: -5 }, // Invalid quantity
          ],
          settings: {},
          lists: {},
        }],
        activePortfolioId: 'test',
      };
      
      const result = RestoreService.validateBackupData(dataWithInvalidHoldings);
      
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings).toContain('Portfolio 0, holding 0 has invalid price');
      expect(result.warnings).toContain('Portfolio 0, holding 1 has invalid quantity');
    });
  });

  describe('getAvailableBackups', () => {
    it('should fetch and sort backups by timestamp', async () => {
      const mockBackups = [
        {
          timestamp: '2025-09-23T11:00:00-000Z',
          filePath: 'portfolio-2025-09-23T11-00-00-000Z.json',
          portfolioCount: 3,
          holdingsCount: 8,
        },
        {
          timestamp: '2025-09-23T10:00:00-000Z',
          filePath: 'portfolio-2025-09-23T10-00-00-000Z.json',
          portfolioCount: 2,
          holdingsCount: 5,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackups),
      });

      const result = await RestoreService.getAvailableBackups();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/backups');
      expect(result).toHaveLength(2);
      // Should be sorted with most recent first (the service sorts them)
      expect(result[0].timestamp).toBe('2025-09-23T11:00:00-000Z');
      expect(result[1].timestamp).toBe('2025-09-23T10:00:00-000Z');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(RestoreService.getAvailableBackups()).rejects.toThrow(
        'Failed to fetch backups: 500 Internal Server Error'
      );
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('invalid'),
      });

      await expect(RestoreService.getAvailableBackups()).rejects.toThrow(
        'Invalid backup list format'
      );
    });
  });

  describe('restoreFromBackup', () => {
    it('should successfully restore from valid backup', async () => {
      const mockRestoredData = createInitialState();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockRestoredData,
          message: 'Restored successfully',
        }),
      });

      const result = await RestoreService.restoreFromBackup('test-backup.json');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'test-backup.json' }),
      });
      
      expect(result.success).toBe(true);
      expect(result.restoredData).toEqual(mockRestoredData);
      expect(result.message).toBe('Restored successfully');
    });

    it('should handle invalid file path', async () => {
      const result = await RestoreService.restoreFromBackup('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file path provided');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Backup file not found' }),
      });

      const result = await RestoreService.restoreFromBackup('missing.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup file not found');
    });

    it('should handle corrupted backup data', async () => {
      const corruptedData = { invalid: 'data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: corruptedData,
        }),
      });

      const result = await RestoreService.restoreFromBackup('corrupted.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Restored data validation failed');
    });
  });

  describe('restoreFromLatest', () => {
    it('should restore from the most recent backup', async () => {
      const mockBackups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T11:00:00-000Z',
          filePath: 'latest.json',
          portfolioCount: 3,
          holdingsCount: 8,
        },
        {
          timestamp: '2025-09-23T10:00:00-000Z',
          filePath: 'older.json',
          portfolioCount: 2,
          holdingsCount: 5,
        },
      ];

      const mockRestoredData = createInitialState();

      // Mock getAvailableBackups
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBackups),
        })
        // Mock restoreFromBackup
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockRestoredData,
          }),
        });

      const result = await RestoreService.restoreFromLatest();
      
      expect(result.success).toBe(true);
      expect(result.restoredData).toEqual(mockRestoredData);
      
      // Should have called restore with the latest backup
      expect(mockFetch).toHaveBeenCalledWith('/api/portfolio/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'latest.json' }),
      });
    });

    it('should handle no available backups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await RestoreService.restoreFromLatest();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup files available for restoration');
    });
  });

  describe('isPortfolioEmpty', () => {
    it('should detect empty portfolio with no portfolios', () => {
      const emptyData: AppState = {
        portfolios: [],
        activePortfolioId: '',
        playground: { enabled: false },
        filters: {},
      };
      
      expect(RestoreService.isPortfolioEmpty(emptyData)).toBe(true);
    });

    it('should detect empty portfolio with only cash buffer', () => {
      const dataWithOnlyCash = createInitialState();
      dataWithOnlyCash.portfolios[0].holdings = [
        {
          id: 'cash1',
          assetType: 'Cash',
          name: 'Cash buffer',
          section: 'Cash',
          theme: 'Cash',
          ticker: '',
          exchange: 'LSE',
          account: 'Brokerage',
          price: 1,
          qty: 1000,
          include: true,
          avgCost: 1,
        },
      ];
      
      expect(RestoreService.isPortfolioEmpty(dataWithOnlyCash)).toBe(true);
    });

    it('should detect non-empty portfolio with real holdings', () => {
      const dataWithHoldings = createInitialState();
      dataWithHoldings.portfolios[0].holdings = [
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
      
      expect(RestoreService.isPortfolioEmpty(dataWithHoldings)).toBe(false);
    });
  });

  describe('performAutoRestore', () => {
    it('should not restore if portfolio is not empty', async () => {
      const nonEmptyData = createInitialState();
      nonEmptyData.portfolios[0].holdings = [
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

      const result = await RestoreService.performAutoRestore(nonEmptyData);
      
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not restore if no backups available', async () => {
      const emptyData: AppState = {
        portfolios: [],
        activePortfolioId: '',
        playground: { enabled: false },
        filters: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await RestoreService.performAutoRestore(emptyData);
      
      expect(result).toBeNull();
    });

    it('should perform auto-restore when conditions are met', async () => {
      const emptyData: AppState = {
        portfolios: [],
        activePortfolioId: '',
        playground: { enabled: false },
        filters: {},
      };

      const mockBackups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T11:00:00-000Z',
          filePath: 'latest.json',
          portfolioCount: 3,
          holdingsCount: 8,
        },
      ];

      const mockRestoredData = createInitialState();
      const mockRestoreResult = {
        success: true,
        restoredData: mockRestoredData,
        message: 'Restored successfully',
      };

      // Mock the static methods directly
      const getAvailableBackupsSpy = vi.spyOn(RestoreService, 'getAvailableBackups')
        .mockResolvedValue(mockBackups);
      const restoreFromLatestSpy = vi.spyOn(RestoreService, 'restoreFromLatest')
        .mockResolvedValue(mockRestoreResult);

      const result = await RestoreService.performAutoRestore(emptyData);
      
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.restoredData).toEqual(mockRestoredData);
      
      expect(getAvailableBackupsSpy).toHaveBeenCalled();
      expect(restoreFromLatestSpy).toHaveBeenCalled();
      
      getAvailableBackupsSpy.mockRestore();
      restoreFromLatestSpy.mockRestore();
    });
  });
});