import { describe, it, expect } from 'vitest';
import {
  parseBackupFilename,
  validateBackupData,
  extractBackupMetadata,
  sortBackupsByTimestamp,
  filterBackupsByType,
  groupBackupsByDate,
  calculateBackupStats,
  determineBackupsToCleanup,
  formatFileSize,
  formatBackupTimestamp,
  createBackupSummary,
  BackupMetadata,
  BackupCleanupConfig
} from '../src/utils/backupUtils';
import { createInitialState, createEmptyPortfolio } from '../src/state/types';

describe('backupUtils', () => {
  describe('parseBackupFilename', () => {
    it('should parse standard backup filename', () => {
      const result = parseBackupFilename('portfolio-2025-09-23T21-24-33-089Z.json');
      expect(result.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.type).toBe('auto');
    });

    it('should parse backup filename with backup prefix', () => {
      const result = parseBackupFilename('portfolio-backup-2025-09-23T21-24-33-089Z.json');
      expect(result.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.type).toBe('backup');
    });

    it('should parse recovery backup filename', () => {
      const result = parseBackupFilename('portfolio-recovery-2025-09-23T21-24-33-089Z.json');
      expect(result.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.type).toBe('recovery');
    });

    it('should parse migration backup filename', () => {
      const result = parseBackupFilename('portfolio-migration-2025-09-23T21-24-33-089Z.json');
      expect(result.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.type).toBe('migration');
    });

    it('should parse pre-restore backup filename', () => {
      const result = parseBackupFilename('portfolio-pre-restore-2025-09-23T21-24-33-089Z.json');
      expect(result.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(result.type).toBe('pre-restore');
    });

    it('should handle invalid filename', () => {
      const result = parseBackupFilename('invalid-filename.json');
      expect(result.timestamp).toBeNull();
      expect(result.type).toBe('unknown');
    });
  });

  describe('validateBackupData', () => {
    it('should validate correct backup data', () => {
      const validData = createInitialState();
      const result = validateBackupData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null data', () => {
      const result = validateBackupData(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Backup data is not a valid object');
    });

    it('should reject data without portfolios', () => {
      const invalidData = { activePortfolioId: 'test' };
      const result = validateBackupData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid portfolios array');
    });

    it('should reject data without activePortfolioId', () => {
      const invalidData = { portfolios: [] };
      const result = validateBackupData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid activePortfolioId');
    });

    it('should validate portfolio structure', () => {
      const invalidData = {
        portfolios: [{ id: 'test' }], // Missing required fields
        activePortfolioId: 'test'
      };
      const result = validateBackupData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('missing required field'))).toBe(true);
    });

    it('should handle warnings for optional fields', () => {
      const dataWithInvalidOptionals = {
        portfolios: [createEmptyPortfolio('test', 'Test')],
        activePortfolioId: 'test',
        playground: 'invalid',
        filters: 'invalid'
      };
      const result = validateBackupData(dataWithInvalidOptionals);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Invalid playground state structure');
      expect(result.warnings).toContain('Invalid filters structure');
    });
  });

  describe('extractBackupMetadata', () => {
    it('should extract metadata from valid backup', () => {
      const state = createInitialState();
      // Add some holdings to test calculations
      state.portfolios[0].holdings = [
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

      const metadata = extractBackupMetadata(
        'portfolio-2025-09-23T21-24-33-089Z.json',
        state,
        1024
      );

      expect(metadata.timestamp).toBe('2025-09-23T21:24:33.089Z');
      expect(metadata.filePath).toBe('portfolio-2025-09-23T21-24-33-089Z.json');
      expect(metadata.portfolioCount).toBe(3);
      expect(metadata.holdingsCount).toBe(1);
      expect(metadata.totalValue).toBe(1050); // 105 * 10
      expect(metadata.fileSize).toBe(1024);
      expect(metadata.isValid).toBe(true);
      expect(metadata.error).toBeUndefined();
    });

    it('should handle invalid backup data', () => {
      const metadata = extractBackupMetadata(
        'invalid-backup.json',
        null,
        512
      );

      expect(metadata.portfolioCount).toBe(0);
      expect(metadata.holdingsCount).toBe(0);
      expect(metadata.totalValue).toBeUndefined();
      expect(metadata.isValid).toBe(false);
      expect(metadata.error).toBeDefined();
    });

    it('should handle excluded holdings in value calculation', () => {
      const state = createInitialState();
      state.portfolios[0].holdings = [
        {
          id: '1',
          section: 'Core',
          theme: 'All',
          assetType: 'ETF',
          name: 'Included',
          ticker: 'INC',
          exchange: 'LSE',
          account: 'Brokerage',
          price: 100,
          qty: 10,
          include: true,
          livePrice: 105
        },
        {
          id: '2',
          section: 'Core',
          theme: 'All',
          assetType: 'ETF',
          name: 'Excluded',
          ticker: 'EXC',
          exchange: 'LSE',
          account: 'Brokerage',
          price: 200,
          qty: 5,
          include: false,
          livePrice: 210
        }
      ];

      const metadata = extractBackupMetadata(
        'portfolio-test.json',
        state
      );

      expect(metadata.holdingsCount).toBe(2);
      expect(metadata.totalValue).toBe(1050); // Only included holding: 105 * 10
    });
  });

  describe('sortBackupsByTimestamp', () => {
    it('should sort backups by timestamp (newest first)', () => {
      const backups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T10:00:00.000Z',
          filePath: 'old.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-23T12:00:00.000Z',
          filePath: 'new.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-23T11:00:00.000Z',
          filePath: 'middle.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        }
      ];

      const sorted = sortBackupsByTimestamp(backups);

      expect(sorted[0].filePath).toBe('new.json');
      expect(sorted[1].filePath).toBe('middle.json');
      expect(sorted[2].filePath).toBe('old.json');
    });
  });

  describe('filterBackupsByType', () => {
    it('should filter backups by type', () => {
      const backups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T10:00:00.000Z',
          filePath: 'portfolio-2025-09-23T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-23T11:00:00.000Z',
          filePath: 'portfolio-recovery-2025-09-23T11-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-23T12:00:00.000Z',
          filePath: 'portfolio-backup-2025-09-23T12-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        }
      ];

      const recoveryBackups = filterBackupsByType(backups, ['recovery']);
      expect(recoveryBackups).toHaveLength(1);
      expect(recoveryBackups[0].filePath).toContain('recovery');

      const autoAndBackup = filterBackupsByType(backups, ['auto', 'backup']);
      expect(autoAndBackup).toHaveLength(2);
    });
  });

  describe('groupBackupsByDate', () => {
    it('should group backups by date', () => {
      const backups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T10:00:00.000Z',
          filePath: 'backup1.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-23T15:00:00.000Z',
          filePath: 'backup2.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-24T10:00:00.000Z',
          filePath: 'backup3.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        }
      ];

      const grouped = groupBackupsByDate(backups);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2025-09-23']).toHaveLength(2);
      expect(grouped['2025-09-24']).toHaveLength(1);
    });
  });

  describe('calculateBackupStats', () => {
    it('should calculate comprehensive backup statistics', () => {
      const backups: BackupMetadata[] = [
        {
          timestamp: '2025-09-23T10:00:00.000Z',
          filePath: 'portfolio-2025-09-23T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 5,
          fileSize: 1024,
          isValid: true
        },
        {
          timestamp: '2025-09-23T11:00:00.000Z',
          filePath: 'portfolio-recovery-2025-09-23T11-00-00-000Z.json',
          portfolioCount: 2,
          holdingsCount: 10,
          fileSize: 2048,
          isValid: true
        },
        {
          timestamp: '2025-09-23T12:00:00.000Z',
          filePath: 'invalid-backup.json',
          portfolioCount: 0,
          holdingsCount: 0,
          fileSize: 512,
          isValid: false
        }
      ];

      const stats = calculateBackupStats(backups);

      expect(stats.totalBackups).toBe(3);
      expect(stats.validBackups).toBe(2);
      expect(stats.invalidBackups).toBe(1);
      expect(stats.totalSize).toBe(3584); // 1024 + 2048 + 512
      expect(stats.averageSize).toBeCloseTo(1194.67, 2); // 3584 / 3 (rounded)
      expect(stats.oldestBackup).toBe('2025-09-23T10:00:00.000Z');
      expect(stats.newestBackup).toBe('2025-09-23T12:00:00.000Z');
      expect(stats.typeBreakdown.auto).toBe(1);
      expect(stats.typeBreakdown.recovery).toBe(1);
      expect(stats.typeBreakdown.unknown).toBe(1);
    });

    it('should handle empty backup list', () => {
      const stats = calculateBackupStats([]);

      expect(stats.totalBackups).toBe(0);
      expect(stats.validBackups).toBe(0);
      expect(stats.invalidBackups).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.oldestBackup).toBeUndefined();
      expect(stats.newestBackup).toBeUndefined();
      expect(Object.keys(stats.typeBreakdown)).toHaveLength(0);
    });
  });

  describe('determineBackupsToCleanup', () => {
    it('should identify backups exceeding max count', () => {
      const backups: BackupMetadata[] = Array.from({ length: 25 }, (_, i) => ({
        timestamp: `2025-09-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
        filePath: `portfolio-2025-09-${String(i + 1).padStart(2, '0')}T10-00-00-000Z.json`,
        portfolioCount: 1,
        holdingsCount: 0,
        isValid: true
      }));

      const config: BackupCleanupConfig = { maxBackupFiles: 20 };
      const toCleanup = determineBackupsToCleanup(backups, config);

      expect(toCleanup).toHaveLength(5); // 25 - 20 = 5
      // Should keep the newest 20
      expect(toCleanup.every(backup => {
        const day = parseInt(backup.filePath.match(/09-(\d{2})T/)?.[1] || '0');
        return day <= 5; // Oldest 5 days
      })).toBe(true);
    });

    it('should identify backups exceeding max age', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const backups: BackupMetadata[] = [
        {
          timestamp: oldDate.toISOString(),
          filePath: 'old-backup.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: recentDate.toISOString(),
          filePath: 'recent-backup.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        }
      ];

      const config: BackupCleanupConfig = { maxAgeInDays: 30 };
      const toCleanup = determineBackupsToCleanup(backups, config);

      expect(toCleanup).toHaveLength(1);
      expect(toCleanup[0].filePath).toBe('old-backup.json');
    });

    it('should protect backups matching keep patterns', () => {
      const backups: BackupMetadata[] = [
        {
          timestamp: '2025-09-01T10:00:00.000Z',
          filePath: 'portfolio-recovery-2025-09-01T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-02T10:00:00.000Z',
          filePath: 'portfolio-2025-09-02T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        },
        {
          timestamp: '2025-09-03T10:00:00.000Z',
          filePath: 'portfolio-2025-09-03T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 0,
          isValid: true
        }
      ];

      const config: BackupCleanupConfig = { 
        maxBackupFiles: 1,
        keepPatterns: ['recovery'] 
      };
      const toCleanup = determineBackupsToCleanup(backups, config);

      expect(toCleanup).toHaveLength(1);
      // Should cleanup the older regular backup, keeping the newer one and the recovery backup
      expect(toCleanup[0].filePath).toBe('portfolio-2025-09-02T10-00-00-000Z.json');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatBackupTimestamp', () => {
    it('should format valid timestamps', () => {
      const timestamp = '2025-09-23T21:24:33.089Z';
      const formatted = formatBackupTimestamp(timestamp);
      
      // Should return a localized string (exact format depends on locale)
      expect(formatted).toContain('2025');
      expect(formatted).toContain('23');
    });

    it('should handle invalid timestamps', () => {
      const invalid = 'invalid-timestamp';
      const formatted = formatBackupTimestamp(invalid);
      
      expect(formatted).toBe(invalid);
    });
  });

  describe('createBackupSummary', () => {
    it('should create comprehensive summary', () => {
      const metadata: BackupMetadata = {
        timestamp: '2025-09-23T21:24:33.089Z',
        filePath: 'test.json',
        portfolioCount: 3,
        holdingsCount: 15,
        totalValue: 12345.67,
        fileSize: 2048,
        isValid: true
      };

      const summary = createBackupSummary(metadata);
      
      expect(summary).toContain('3 portfolios');
      expect(summary).toContain('15 holdings');
      expect(summary).toContain('£12,345.67');
      expect(summary).toContain('2 KB');
    });

    it('should handle singular forms', () => {
      const metadata: BackupMetadata = {
        timestamp: '2025-09-23T21:24:33.089Z',
        filePath: 'test.json',
        portfolioCount: 1,
        holdingsCount: 1,
        isValid: true
      };

      const summary = createBackupSummary(metadata);
      
      expect(summary).toContain('1 portfolio');
      expect(summary).toContain('1 holding');
    });

    it('should handle empty backup', () => {
      const metadata: BackupMetadata = {
        timestamp: '2025-09-23T21:24:33.089Z',
        filePath: 'test.json',
        portfolioCount: 0,
        holdingsCount: 0,
        isValid: true
      };

      const summary = createBackupSummary(metadata);
      
      expect(summary).toBe('Empty backup');
    });
  });
});