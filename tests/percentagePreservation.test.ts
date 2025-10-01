import { describe, it, expect } from 'vitest';
import {
  preserveChildPercentageRatios,
  getThemePercentagesInSection,
  getHoldingPercentagesInTheme,
  preserveThemeRatiosOnSectionChange,
  preserveHoldingRatiosOnThemeChange,
  calculateSectionCurrentPercent,
  calculateThemeCurrentPercent,
} from '../src/utils/percentagePreservation';
import { createEmptyPortfolio, createHolding } from '../src/state/types';
import type { Portfolio, BudgetLimit } from '../src/state/types';

describe('percentagePreservation', () => {
  describe('preserveChildPercentageRatios', () => {
    it('should preserve ratios when parent percentage changes', () => {
      const childPercentages = new Map([
        ['child1', 30],
        ['child2', 20],
        ['child3', 10],
      ]);

      const result = preserveChildPercentageRatios(childPercentages, 60, 80);

      expect(result.get('child1')).toBeCloseTo(40); // 30 * (80/60)
      expect(result.get('child2')).toBeCloseTo(26.67); // 20 * (80/60)
      expect(result.get('child3')).toBeCloseTo(13.33); // 10 * (80/60)
    });

    it('should return empty map when parent percentage is zero', () => {
      const childPercentages = new Map([
        ['child1', 30],
        ['child2', 20],
      ]);

      const result = preserveChildPercentageRatios(childPercentages, 0, 50);

      expect(result.size).toBe(0);
    });

    it('should handle zero child percentages', () => {
      const childPercentages = new Map([
        ['child1', 0],
        ['child2', 20],
      ]);

      const result = preserveChildPercentageRatios(childPercentages, 20, 40);

      expect(result.has('child1')).toBe(false);
      expect(result.get('child2')).toBeCloseTo(40);
    });
  });

  describe('getThemePercentagesInSection', () => {
    it('should return theme percentages for a specific section', () => {
      const portfolio: Portfolio = {
        ...createEmptyPortfolio('test', 'Test'),
        lists: {
          sections: ['Core', 'Satellite'],
          themes: ['Tech', 'Healthcare', 'Energy'],
          accounts: ['Brokerage'],
          themeSections: {
            'Tech': 'Core',
            'Healthcare': 'Core',
            'Energy': 'Satellite',
          },
        },
        budgets: {
          sections: {},
          accounts: {},
          themes: {
            'Tech': { percentOfSection: 60 },
            'Healthcare': { percentOfSection: 40 },
            'Energy': { percentOfSection: 100 },
          },
        },
      };

      const coreThemes = getThemePercentagesInSection(portfolio, 'Core');
      const satelliteThemes = getThemePercentagesInSection(portfolio, 'Satellite');

      expect(coreThemes.get('Tech')).toBe(60);
      expect(coreThemes.get('Healthcare')).toBe(40);
      expect(coreThemes.has('Energy')).toBe(false);

      expect(satelliteThemes.get('Energy')).toBe(100);
      expect(satelliteThemes.has('Tech')).toBe(false);
    });
  });

  describe('getHoldingPercentagesInTheme', () => {
    it('should return holding percentages for a specific theme', () => {
      const holding1 = createHolding({ theme: 'Tech', targetPct: 30 });
      const holding2 = createHolding({ theme: 'Tech', targetPct: 20 });
      const holding3 = createHolding({ theme: 'Healthcare', targetPct: 50 });

      const portfolio: Portfolio = {
        ...createEmptyPortfolio('test', 'Test'),
        holdings: [holding1, holding2, holding3],
      };

      const techHoldings = getHoldingPercentagesInTheme(portfolio, 'Tech');
      const healthcareHoldings = getHoldingPercentagesInTheme(portfolio, 'Healthcare');

      expect(techHoldings.get(holding1.id)).toBe(30);
      expect(techHoldings.get(holding2.id)).toBe(20);
      expect(techHoldings.has(holding3.id)).toBe(false);

      expect(healthcareHoldings.get(holding3.id)).toBe(50);
      expect(healthcareHoldings.has(holding1.id)).toBe(false);
    });
  });

  describe('preserveThemeRatiosOnSectionChange', () => {
    it('should preserve theme percentage ratios when section percentage changes', () => {
      const portfolio: Portfolio = {
        ...createEmptyPortfolio('test', 'Test'),
        lists: {
          sections: ['Core'],
          themes: ['Tech', 'Healthcare'],
          accounts: ['Brokerage'],
          themeSections: {
            'Tech': 'Core',
            'Healthcare': 'Core',
          },
        },
        budgets: {
          sections: {},
          accounts: {},
          themes: {
            'Tech': { percentOfSection: 60 },
            'Healthcare': { percentOfSection: 40 },
          },
        },
      };

      const result = preserveThemeRatiosOnSectionChange(portfolio, 'Core', 80, 100);

      expect(result.budgets.themes['Tech']?.percentOfSection).toBeCloseTo(75); // 60 * (100/80)
      expect(result.budgets.themes['Healthcare']?.percentOfSection).toBeCloseTo(50); // 40 * (100/80)
    });
  });

  describe('preserveHoldingRatiosOnThemeChange', () => {
    it('should preserve holding percentage ratios when theme percentage changes', () => {
      const holding1 = createHolding({ theme: 'Tech', targetPct: 30 });
      const holding2 = createHolding({ theme: 'Tech', targetPct: 20 });

      const portfolio: Portfolio = {
        ...createEmptyPortfolio('test', 'Test'),
        holdings: [holding1, holding2],
      };

      const result = preserveHoldingRatiosOnThemeChange(portfolio, 'Tech', 50, 75);

      const updatedHolding1 = result.holdings.find(h => h.id === holding1.id);
      const updatedHolding2 = result.holdings.find(h => h.id === holding2.id);

      expect(updatedHolding1?.targetPct).toBeCloseTo(45); // 30 * (75/50)
      expect(updatedHolding2?.targetPct).toBeCloseTo(30); // 20 * (75/50)
    });
  });

  describe('calculateSectionCurrentPercent', () => {
    it('should return percent when set directly', () => {
      const budget: BudgetLimit = { percent: 75 };
      const result = calculateSectionCurrentPercent(budget, 10000);
      expect(result).toBe(75);
    });

    it('should calculate percent from amount', () => {
      const budget: BudgetLimit = { amount: 2500 };
      const result = calculateSectionCurrentPercent(budget, 10000);
      expect(result).toBe(25);
    });

    it('should return 0 for undefined budget', () => {
      const result = calculateSectionCurrentPercent(undefined, 10000);
      expect(result).toBe(0);
    });
  });

  describe('calculateThemeCurrentPercent', () => {
    it('should return percentOfSection when set', () => {
      const budget: BudgetLimit = { percentOfSection: 60 };
      const result = calculateThemeCurrentPercent(budget);
      expect(result).toBe(60);
    });

    it('should return 0 for undefined budget', () => {
      const result = calculateThemeCurrentPercent(undefined);
      expect(result).toBe(0);
    });
  });
});