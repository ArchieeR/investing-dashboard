import { describe, it, expect } from 'vitest';
import { fixBackupData, getFixedBackupData, RAW_BACKUP_DATA } from '../src/utils/fixBackupData';
import { validateBackupData } from '../src/utils/backupUtils';

describe('fixBackupData', () => {
  describe('fixBackupData', () => {
    it('should fix raw backup data to include required fields', () => {
      const fixedData = fixBackupData(RAW_BACKUP_DATA);
      
      expect(fixedData).toBeDefined();
      expect(fixedData.portfolios).toBeDefined();
      expect(Array.isArray(fixedData.portfolios)).toBe(true);
      expect(fixedData.portfolios.length).toBe(3);
    });

    it('should add missing type field to portfolios', () => {
      const fixedData = fixBackupData(RAW_BACKUP_DATA);
      
      fixedData.portfolios.forEach(portfolio => {
        expect(portfolio.type).toBeDefined();
        expect(portfolio.type).toBe('actual');
      });
    });

    it('should add missing timestamp fields to portfolios', () => {
      const fixedData = fixBackupData(RAW_BACKUP_DATA);
      
      fixedData.portfolios.forEach(portfolio => {
        expect(portfolio.createdAt).toBeDefined();
        expect(portfolio.updatedAt).toBeDefined();
        expect(typeof portfolio.createdAt).toBe('string');
        expect(typeof portfolio.updatedAt).toBe('string');
      });
    });

    it('should preserve existing data', () => {
      const fixedData = fixBackupData(RAW_BACKUP_DATA);
      
      expect(fixedData.portfolios[0].name).toBe('Main Portfolio');
      expect(fixedData.portfolios[1].name).toBe('Family ISA');
      expect(fixedData.portfolios[2].name).toBe('Play Portfolio');
      expect(fixedData.portfolios[0].holdings.length).toBe(14);
    });

    it('should ensure all required nested objects exist', () => {
      const fixedData = fixBackupData(RAW_BACKUP_DATA);
      
      fixedData.portfolios.forEach(portfolio => {
        expect(portfolio.lists).toBeDefined();
        expect(portfolio.holdings).toBeDefined();
        expect(portfolio.settings).toBeDefined();
        expect(portfolio.budgets).toBeDefined();
        expect(portfolio.trades).toBeDefined();
        
        expect(Array.isArray(portfolio.holdings)).toBe(true);
        expect(Array.isArray(portfolio.trades)).toBe(true);
      });
    });
  });

  describe('getFixedBackupData', () => {
    it('should return valid backup data', () => {
      const data = getFixedBackupData();
      
      expect(data).toBeDefined();
      expect(data.portfolios).toBeDefined();
      expect(data.portfolios.length).toBe(3);
      expect(data.activePortfolioId).toBe('portfolio-1');
    });

    it('should pass validation', () => {
      const data = getFixedBackupData();
      const validation = validateBackupData(data);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should have correct portfolio structure', () => {
      const data = getFixedBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.id).toBe('portfolio-1');
      expect(mainPortfolio.name).toBe('Main Portfolio');
      expect(mainPortfolio.type).toBe('actual');
      expect(mainPortfolio.holdings.length).toBe(14);
      expect(mainPortfolio.createdAt).toBeDefined();
      expect(mainPortfolio.updatedAt).toBeDefined();
    });

    it('should preserve budget allocations', () => {
      const data = getFixedBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.budgets.sections.Core.percent).toBe(35);
      expect(mainPortfolio.budgets.sections.Satellite.percent).toBe(50);
      expect(mainPortfolio.budgets.sections.Gold.percent).toBe(15);
    });

    it('should preserve holdings data', () => {
      const data = getFixedBackupData();
      const mainPortfolio = data.portfolios[0];
      const firstHolding = mainPortfolio.holdings[0];
      
      expect(firstHolding.name).toBe('Amundi Ibex 35 ETF Acc GBP');
      expect(firstHolding.ticker).toBe('CS1');
      expect(firstHolding.section).toBe('Core');
      expect(firstHolding.theme).toBe('Index');
      expect(firstHolding.qty).toBe(1);
    });
  });

  describe('RAW_BACKUP_DATA', () => {
    it('should contain the original backup structure', () => {
      expect(RAW_BACKUP_DATA.portfolios).toBeDefined();
      expect(RAW_BACKUP_DATA.portfolios.length).toBe(3);
      expect(RAW_BACKUP_DATA.activePortfolioId).toBe('portfolio-1');
    });

    it('should be missing required fields (before fixing)', () => {
      const validation = validateBackupData(RAW_BACKUP_DATA);
      
      // Should fail validation because of missing fields
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('missing required field: type'))).toBe(true);
    });
  });
});