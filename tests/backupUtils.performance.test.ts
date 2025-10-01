import { describe, it, expect } from 'vitest';
import {
  parseBackupFilename,
  validateBackupData,
  extractBackupMetadata,
  sortBackupsByTimestamp,
  calculateBackupStats,
  determineBackupsToCleanup,
  BackupMetadata
} from '../src/utils/backupUtils';
import { createInitialState, createEmptyPortfolio, createHolding } from '../src/state/types';

describe('backupUtils Performance Tests', () => {
  // Helper to create large dataset
  const createLargePortfolioData = (portfolioCount: number, holdingsPerPortfolio: number) => {
    const state = createInitialState();
    state.portfolios = [];
    
    for (let i = 0; i < portfolioCount; i++) {
      const portfolio = createEmptyPortfolio(`portfolio-${i}`, `Portfolio ${i}`);
      
      for (let j = 0; j < holdingsPerPortfolio; j++) {
        portfolio.holdings.push(createHolding({
          id: `holding-${i}-${j}`,
          name: `Holding ${i}-${j}`,
          ticker: `TICK${i}${j}`,
          price: Math.random() * 1000,
          qty: Math.floor(Math.random() * 100) + 1,
          livePrice: Math.random() * 1000
        }));
      }
      
      state.portfolios.push(portfolio);
    }
    
    return state;
  };

  const createLargeBackupList = (count: number): BackupMetadata[] => {
    return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(), // 1 minute apart
      filePath: `portfolio-${new Date(Date.now() - i * 60000).toISOString().replace(/[:.]/g, '-')}.json`,
      portfolioCount: Math.floor(Math.random() * 5) + 1,
      holdingsCount: Math.floor(Math.random() * 100) + 1,
      totalValue: Math.random() * 100000,
      fileSize: Math.floor(Math.random() * 10000) + 1000,
      isValid: Math.random() > 0.1 // 90% valid
    }));
  };

  describe('parseBackupFilename performance', () => {
    it('should parse filenames efficiently at scale', () => {
      const filenames = Array.from({ length: 1000 }, (_, i) => 
        `portfolio-2025-09-${String(i % 30 + 1).padStart(2, '0')}T10-${String(i % 60).padStart(2, '0')}-00-000Z.json`
      );

      const startTime = performance.now();
      
      const results = filenames.map(filename => parseBackupFilename(filename));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(results.every(r => r.timestamp !== null)).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      
      console.log(`Parsed 1000 filenames in ${duration.toFixed(2)}ms (${(duration/1000).toFixed(4)}ms per filename)`);
    });
  });

  describe('validateBackupData performance', () => {
    it('should validate small portfolios quickly', () => {
      const data = createLargePortfolioData(3, 10); // 3 portfolios, 10 holdings each

      const startTime = performance.now();
      
      const result = validateBackupData(data);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(10); // Should complete in under 10ms
      
      console.log(`Validated small portfolio (3 portfolios, 30 holdings) in ${duration.toFixed(2)}ms`);
    });

    it('should validate large portfolios efficiently', () => {
      const data = createLargePortfolioData(10, 100); // 10 portfolios, 100 holdings each

      const startTime = performance.now();
      
      const result = validateBackupData(data);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      
      console.log(`Validated large portfolio (10 portfolios, 1000 holdings) in ${duration.toFixed(2)}ms`);
    });

    it('should validate very large portfolios within reasonable time', () => {
      const data = createLargePortfolioData(50, 200); // 50 portfolios, 200 holdings each

      const startTime = performance.now();
      
      const result = validateBackupData(data);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
      
      console.log(`Validated very large portfolio (50 portfolios, 10000 holdings) in ${duration.toFixed(2)}ms`);
    });
  });

  describe('extractBackupMetadata performance', () => {
    it('should extract metadata from large portfolios efficiently', () => {
      const data = createLargePortfolioData(10, 100);
      const filename = 'portfolio-2025-09-23T21-24-33-089Z.json';
      const fileSize = 1024 * 1024; // 1MB

      const startTime = performance.now();
      
      const metadata = extractBackupMetadata(filename, data, fileSize);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(metadata.isValid).toBe(true);
      expect(metadata.portfolioCount).toBe(10);
      expect(metadata.holdingsCount).toBe(1000);
      expect(metadata.totalValue).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      
      console.log(`Extracted metadata from large portfolio in ${duration.toFixed(2)}ms`);
    });

    it('should handle value calculations for portfolios with many holdings', () => {
      const data = createLargePortfolioData(5, 500); // 5 portfolios, 500 holdings each
      const filename = 'portfolio-test.json';

      const startTime = performance.now();
      
      const metadata = extractBackupMetadata(filename, data);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(metadata.holdingsCount).toBe(2500);
      expect(metadata.totalValue).toBeGreaterThan(0);
      expect(duration).toBeLessThan(150); // Should complete in under 150ms
      
      console.log(`Calculated total value for 2500 holdings in ${duration.toFixed(2)}ms`);
    });
  });

  describe('sortBackupsByTimestamp performance', () => {
    it('should sort large backup lists efficiently', () => {
      const backups = createLargeBackupList(1000);

      const startTime = performance.now();
      
      const sorted = sortBackupsByTimestamp(backups);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(sorted).toHaveLength(1000);
      // Verify sorting is correct (newest first)
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentTime = new Date(sorted[i].timestamp).getTime();
        const nextTime = new Date(sorted[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      
      console.log(`Sorted 1000 backups in ${duration.toFixed(2)}ms`);
    });

    it('should handle very large backup lists', () => {
      const backups = createLargeBackupList(10000);

      const startTime = performance.now();
      
      const sorted = sortBackupsByTimestamp(backups);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(sorted).toHaveLength(10000);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
      
      console.log(`Sorted 10000 backups in ${duration.toFixed(2)}ms`);
    });
  });

  describe('calculateBackupStats performance', () => {
    it('should calculate stats for large backup lists efficiently', () => {
      const backups = createLargeBackupList(5000);

      const startTime = performance.now();
      
      const stats = calculateBackupStats(backups);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(stats.totalBackups).toBe(5000);
      expect(stats.validBackups).toBeGreaterThan(0);
      expect(stats.invalidBackups).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageSize).toBeGreaterThan(0);
      expect(Object.keys(stats.typeBreakdown).length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
      
      console.log(`Calculated stats for 5000 backups in ${duration.toFixed(2)}ms`);
    });
  });

  describe('determineBackupsToCleanup performance', () => {
    it('should determine cleanup candidates efficiently for large lists', () => {
      const backups = createLargeBackupList(2000);

      const startTime = performance.now();
      
      const toCleanup = determineBackupsToCleanup(backups, {
        maxBackupFiles: 100,
        maxAgeInDays: 30,
        keepPatterns: ['recovery', 'migration']
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(toCleanup.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      
      console.log(`Determined cleanup for 2000 backups in ${duration.toFixed(2)}ms (${toCleanup.length} to cleanup)`);
    });

    it('should handle complex cleanup scenarios efficiently', () => {
      const backups = createLargeBackupList(5000);
      
      // Add some protected backups with specific names
      const protectedBackups = [
        {
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days old
          filePath: 'portfolio-recovery-2024-07-25T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 10,
          isValid: true
        },
        {
          timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days old
          filePath: 'portfolio-migration-2024-06-25T10-00-00-000Z.json',
          portfolioCount: 1,
          holdingsCount: 5,
          isValid: true
        }
      ];
      
      backups.push(...protectedBackups);

      const startTime = performance.now();
      
      const toCleanup = determineBackupsToCleanup(backups, {
        maxBackupFiles: 50,
        maxAgeInDays: 30,
        keepPatterns: ['recovery', 'migration', 'pre-restore']
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(toCleanup.length).toBeGreaterThan(0);
      // Verify specific protected backups are not in cleanup list
      expect(toCleanup.find(b => b.filePath === 'portfolio-recovery-2024-07-25T10-00-00-000Z.json')).toBeUndefined();
      expect(toCleanup.find(b => b.filePath === 'portfolio-migration-2024-06-25T10-00-00-000Z.json')).toBeUndefined();
      expect(duration).toBeLessThan(150); // Should complete in under 150ms
      
      console.log(`Complex cleanup analysis for ${backups.length} backups in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory usage tests', () => {
    it('should not cause memory issues with large datasets', () => {
      // Test with a very large portfolio
      const data = createLargePortfolioData(20, 500); // 20 portfolios, 500 holdings each = 10,000 holdings
      
      const startMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple operations
      const validation = validateBackupData(data);
      const metadata = extractBackupMetadata('test.json', data, 5 * 1024 * 1024);
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      expect(validation.isValid).toBe(true);
      expect(metadata.holdingsCount).toBe(10000);
      
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase for large dataset: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});