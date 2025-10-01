import { describe, it, expect } from 'vitest';
import { restoreFromLocalFile } from '../src/utils/restoreFromFile';
import { createInitialState } from '../src/state/types';

// Mock File API for testing
class MockFile {
  name: string;
  size: number;
  type: string;
  content: string;

  constructor(content: string, name: string, options: { type?: string } = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'application/json';
  }
}

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  readAsText(file: MockFile) {
    setTimeout(() => {
      this.result = file.content;
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
}

// Mock global FileReader
global.FileReader = MockFileReader as any;

describe('restoreFromFile', () => {
  describe('restoreFromLocalFile', () => {
    it('should successfully restore valid backup data', async () => {
      const validBackupData = createInitialState();
      const backupContent = JSON.stringify(validBackupData);
      const mockFile = new MockFile(backupContent, 'test-backup.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.portfolios).toHaveLength(3);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.isValid).toBe(true);
    });

    it('should handle invalid JSON format', async () => {
      const invalidContent = '{ invalid json }';
      const mockFile = new MockFile(invalidContent, 'invalid.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON format in backup file');
    });

    it('should handle invalid backup structure', async () => {
      const invalidBackup = { invalid: 'structure' };
      const backupContent = JSON.stringify(invalidBackup);
      const mockFile = new MockFile(backupContent, 'invalid-backup.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid backup data');
    });

    it('should handle backup with missing portfolios', async () => {
      const invalidBackup = {
        activePortfolioId: 'test',
        playground: { enabled: false },
        filters: {}
      };
      const backupContent = JSON.stringify(invalidBackup);
      const mockFile = new MockFile(backupContent, 'no-portfolios.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing or invalid portfolios array');
    });

    it('should extract metadata from valid backup', async () => {
      const validBackupData = createInitialState();
      // Add some holdings to test metadata extraction
      validBackupData.portfolios[0].holdings = [
        {
          id: '1',
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
          livePrice: 105
        }
      ];

      const backupContent = JSON.stringify(validBackupData);
      const mockFile = new MockFile(backupContent, 'test-backup.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.portfolioCount).toBe(3);
      expect(result.metadata?.holdingsCount).toBe(1);
      expect(result.metadata?.totalValue).toBe(1050); // 105 * 10
      expect(result.metadata?.isValid).toBe(true);
    });

    it('should handle backup with warnings but still succeed', async () => {
      const backupWithWarnings = {
        portfolios: [
          {
            id: 'test',
            name: 'Test Portfolio',
            type: 'actual',
            lists: { sections: [], themes: [], accounts: [], themeSections: {} },
            holdings: [],
            settings: { currency: 'GBP' },
            budgets: { sections: {}, accounts: {}, themes: {} },
            trades: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        activePortfolioId: 'test',
        playground: 'invalid', // This should cause a warning
        filters: {}
      };

      const backupContent = JSON.stringify(backupWithWarnings);
      const mockFile = new MockFile(backupContent, 'warnings-backup.json') as any;

      const result = await restoreFromLocalFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata?.isValid).toBe(true);
    });
  });
});