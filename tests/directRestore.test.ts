import { describe, it, expect } from 'vitest';
import { restoreYourBackupData, validateYourBackupData } from '../src/utils/directRestore';

describe('directRestore', () => {
  describe('validateYourBackupData', () => {
    it('should validate the embedded backup data', () => {
      const isValid = validateYourBackupData();
      expect(isValid).toBe(true);
    });
  });

  describe('restoreYourBackupData', () => {
    it('should return valid backup data structure', () => {
      const data = restoreYourBackupData();
      
      expect(data).toBeDefined();
      expect(data.portfolios).toBeDefined();
      expect(Array.isArray(data.portfolios)).toBe(true);
      expect(data.portfolios.length).toBe(3);
      expect(data.activePortfolioId).toBe('portfolio-1');
    });

    it('should have correct portfolio names', () => {
      const data = restoreYourBackupData();
      
      expect(data.portfolios[0].name).toBe('Main Portfolio');
      expect(data.portfolios[1].name).toBe('Family ISA');
      expect(data.portfolios[2].name).toBe('Play Portfolio');
    });

    it('should have holdings in main portfolio', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.holdings).toBeDefined();
      expect(Array.isArray(mainPortfolio.holdings)).toBe(true);
      expect(mainPortfolio.holdings.length).toBe(14);
    });

    it('should have correct budget allocations', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.budgets.sections.Core.percent).toBe(35);
      expect(mainPortfolio.budgets.sections.Satellite.percent).toBe(50);
      expect(mainPortfolio.budgets.sections.Gold.percent).toBe(15);
    });

    it('should have correct theme sections mapping', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.lists.themeSections['Index']).toBe('Core');
      expect(mainPortfolio.lists.themeSections['AI Infra']).toBe('Satellite');
      expect(mainPortfolio.lists.themeSections['Defense']).toBe('Satellite');
      expect(mainPortfolio.lists.themeSections['Gold']).toBe('Gold');
    });

    it('should have correct settings', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      expect(mainPortfolio.settings.currency).toBe('GBP');
      expect(mainPortfolio.settings.enableLivePrices).toBe(true);
      expect(mainPortfolio.settings.livePriceUpdateInterval).toBe(10);
    });

    it('should have sample holdings with correct structure', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      const firstHolding = mainPortfolio.holdings[0];
      
      expect(firstHolding.id).toBeDefined();
      expect(firstHolding.name).toBe('Amundi Ibex 35 ETF Acc GBP');
      expect(firstHolding.ticker).toBe('CS1');
      expect(firstHolding.exchange).toBe('LSE');
      expect(firstHolding.account).toBe('ii');
      expect(firstHolding.section).toBe('Core');
      expect(firstHolding.theme).toBe('Index');
      expect(typeof firstHolding.price).toBe('number');
      expect(typeof firstHolding.qty).toBe('number');
      expect(typeof firstHolding.include).toBe('boolean');
    });

    it('should have Oracle Power holdings with correct quantities', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      // Find Oracle Power holdings
      const oracleHoldings = mainPortfolio.holdings.filter(h => h.name.includes('Oracle Power'));
      expect(oracleHoldings.length).toBe(2);
      
      // Check quantities
      const totalOracleQty = oracleHoldings.reduce((sum, h) => sum + h.qty, 0);
      expect(totalOracleQty).toBe(32151 + 742820); // NYSE + LSE holdings
    });

    it('should have defense-themed holdings', () => {
      const data = restoreYourBackupData();
      const mainPortfolio = data.portfolios[0];
      
      const defenseHoldings = mainPortfolio.holdings.filter(h => h.theme === 'Defense');
      expect(defenseHoldings.length).toBeGreaterThan(0);
      
      const defenseNames = defenseHoldings.map(h => h.name);
      expect(defenseNames.some(name => name.includes('Defence'))).toBe(true);
    });
  });
});