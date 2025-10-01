import { describe, it, expect } from 'vitest';
import { portfolioReducer } from '../src/state/portfolioStore';
import { createInitialState, createHolding } from '../src/state/types';
import type { AppState, Portfolio } from '../src/state/types';

describe('Portfolio Store - Percentage Preservation', () => {
  const createTestState = (): AppState => {
    const state = createInitialState();
    const portfolio = state.portfolios[0];
    
    // Set up test data
    const updatedPortfolio: Portfolio = {
      ...portfolio,
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
        sections: {
          'Core': { percent: 80 },
          'Satellite': { percent: 20 },
        },
        accounts: {},
        themes: {
          'Tech': { percentOfSection: 60 },
          'Healthcare': { percentOfSection: 40 },
          'Energy': { percentOfSection: 100 },
        },
      },
      holdings: [
        createHolding({ theme: 'Tech', targetPct: 30 }),
        createHolding({ theme: 'Tech', targetPct: 20 }),
        createHolding({ theme: 'Healthcare', targetPct: 50 }),
        createHolding({ theme: 'Energy', targetPct: 100 }),
      ],
    };

    return {
      ...state,
      portfolios: [updatedPortfolio, ...state.portfolios.slice(1)],
    };
  };

  describe('set-budget action with percentage preservation', () => {
    it('should preserve theme ratios when section percentage changes', () => {
      const state = createTestState();
      
      const action = {
        type: 'set-budget' as const,
        domain: 'sections' as const,
        key: 'Core',
        limit: { percent: 90 }, // Changed from 80 to 90
      };

      const newState = portfolioReducer(state, action);
      const portfolio = newState.portfolios[0];

      // Section percentage should be updated
      expect(portfolio.budgets.sections['Core']?.percent).toBe(90);

      // Theme percentages should be preserved proportionally
      // Tech: 60 * (90/80) = 67.5
      // Healthcare: 40 * (90/80) = 45
      expect(portfolio.budgets.themes['Tech']?.percentOfSection).toBeCloseTo(67.5);
      expect(portfolio.budgets.themes['Healthcare']?.percentOfSection).toBeCloseTo(45);
      
      // Energy theme (in Satellite section) should be unchanged
      expect(portfolio.budgets.themes['Energy']?.percentOfSection).toBe(100);
    });

    it('should preserve holding ratios when theme percentage changes', () => {
      const state = createTestState();
      
      const action = {
        type: 'set-budget' as const,
        domain: 'themes' as const,
        key: 'Tech',
        limit: { percentOfSection: 75 }, // Changed from 60 to 75
      };

      const newState = portfolioReducer(state, action);
      const portfolio = newState.portfolios[0];

      // Theme percentage should be updated
      expect(portfolio.budgets.themes['Tech']?.percentOfSection).toBe(75);

      // Holding target percentages should be preserved proportionally
      // First holding: 30 * (75/60) = 37.5
      // Second holding: 20 * (75/60) = 25
      const techHoldings = portfolio.holdings.filter(h => h.theme === 'Tech');
      const holding1 = techHoldings.find(h => h.targetPct === 37.5);
      const holding2 = techHoldings.find(h => h.targetPct === 25);
      
      expect(holding1).toBeDefined();
      expect(holding2).toBeDefined();
      
      // Healthcare holdings should be unchanged
      const healthcareHolding = portfolio.holdings.find(h => h.theme === 'Healthcare');
      expect(healthcareHolding?.targetPct).toBe(50);
    });

    it('should not preserve ratios when old percentage is zero', () => {
      const state = createTestState();
      
      // Create a state where Core section has 0% initially
      const stateWithZeroCore = {
        ...state,
        portfolios: [
          {
            ...state.portfolios[0],
            budgets: {
              ...state.portfolios[0].budgets,
              sections: {
                ...state.portfolios[0].budgets.sections,
                'Core': { percent: 0 },
              },
            },
          },
          ...state.portfolios.slice(1),
        ],
      };
      
      // Then try to change it to a positive value
      const positiveAction = {
        type: 'set-budget' as const,
        domain: 'sections' as const,
        key: 'Core',
        limit: { percent: 50 },
      };
      
      const finalState = portfolioReducer(stateWithZeroCore, positiveAction);
      const portfolio = finalState.portfolios[0];

      // Section should be updated
      expect(portfolio.budgets.sections['Core']?.percent).toBe(50);
      
      // Theme percentages should remain unchanged (not scaled from zero)
      expect(portfolio.budgets.themes['Tech']?.percentOfSection).toBe(60);
      expect(portfolio.budgets.themes['Healthcare']?.percentOfSection).toBe(40);
    });
  });

  describe('set-holding-target-percent action', () => {
    it('should update holding target percentage', () => {
      const state = createTestState();
      const holdingId = state.portfolios[0].holdings[0].id;
      
      const action = {
        type: 'set-holding-target-percent' as const,
        holdingId,
        targetPct: 45,
      };

      const newState = portfolioReducer(state, action);
      const portfolio = newState.portfolios[0];
      const updatedHolding = portfolio.holdings.find(h => h.id === holdingId);

      expect(updatedHolding?.targetPct).toBe(45);
    });

    it('should remove target percentage when set to undefined', () => {
      const state = createTestState();
      const holdingId = state.portfolios[0].holdings[0].id;
      
      const action = {
        type: 'set-holding-target-percent' as const,
        holdingId,
        targetPct: undefined,
      };

      const newState = portfolioReducer(state, action);
      const portfolio = newState.portfolios[0];
      const updatedHolding = portfolio.holdings.find(h => h.id === holdingId);

      expect(updatedHolding?.targetPct).toBeUndefined();
    });

    it('should handle non-existent holding gracefully', () => {
      const state = createTestState();
      
      const action = {
        type: 'set-holding-target-percent' as const,
        holdingId: 'non-existent-id',
        targetPct: 45,
      };

      const newState = portfolioReducer(state, action);
      
      // Holdings should remain unchanged
      expect(newState.portfolios[0].holdings).toEqual(state.portfolios[0].holdings);
      
      // Portfolio should have the same number of holdings
      expect(newState.portfolios[0].holdings.length).toBe(state.portfolios[0].holdings.length);
    });
  });
});