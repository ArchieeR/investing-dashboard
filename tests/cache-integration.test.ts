import { describe, it, expect, beforeEach } from 'vitest';
import { selectHoldingsWithDerived, cacheInvalidation } from '../src/state/selectors';
import type { Portfolio } from '../src/state/types';

describe('Cache Integration', () => {
  let testPortfolio: Portfolio;

  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    
    testPortfolio = {
      id: 'test',
      name: 'Test Portfolio',
      holdings: [
        {
          id: '1',
          ticker: 'AAPL',
          section: 'Core',
          theme: 'Tech',
          account: 'Taxable',
          qty: 10,
          price: 100,
          livePrice: 105,
          avgCost: 95,
          dayChange: 5,
          dayChangePercent: 5,
          include: true,
          targetPct: 50,
        }
      ],
      lists: {
        sections: ['Core'],
        themes: ['Tech'],
        accounts: ['Taxable'],
        themeSections: { 'Tech': 'Core' }
      },
      settings: {
        targetPortfolioValue: 10000
      },
      budgets: {
        sections: { 'Core': { percent: 100 } },
        themes: { 'Tech': { percentOfSection: 100 } }
      }
    };
  });

  it('should demonstrate requirement 7.1: live price updates only affect live calculations', () => {
    // Initial calculation
    const result1 = selectHoldingsWithDerived(testPortfolio);
    expect(result1[0].liveValue).toBe(1050); // 105 * 10
    // Target calculation: Portfolio(10000) → Section(100% = 10000) → Theme(100% = 10000) → Holding(50% = 5000)
    expect(result1[0].targetValue).toBe(5000); // 50% of 10000 theme target
    
    const initialStats = cacheInvalidation.getCacheStats();
    expect(initialStats.liveCache.size).toBe(1);
    expect(initialStats.targetCache.size).toBe(1);
    
    // Update live price only
    const portfolioWithNewLivePrice = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => ({ ...h, livePrice: 110 }))
    };
    
    const result2 = selectHoldingsWithDerived(portfolioWithNewLivePrice);
    expect(result2[0].liveValue).toBe(1100); // 110 * 10 - live value changed
    expect(result2[0].targetValue).toBe(5000); // Target unchanged
    
    const afterLivePriceChange = cacheInvalidation.getCacheStats();
    expect(afterLivePriceChange.liveCache.size).toBe(2); // New live cache entry
    expect(afterLivePriceChange.targetCache.size).toBe(1); // Target cache reused
  });

  it('should demonstrate requirement 7.2: target percentage changes only affect target calculations', () => {
    // Initial calculation
    const result1 = selectHoldingsWithDerived(testPortfolio);
    expect(result1[0].liveValue).toBe(1050); // 105 * 10
    expect(result1[0].targetValue).toBe(5000); // 50% of 10000 theme target
    
    const initialStats = cacheInvalidation.getCacheStats();
    expect(initialStats.liveCache.size).toBe(1);
    expect(initialStats.targetCache.size).toBe(1);
    
    // Update target percentage only
    const portfolioWithNewTargetPct = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => ({ ...h, targetPct: 25 }))
    };
    
    const result2 = selectHoldingsWithDerived(portfolioWithNewTargetPct);
    expect(result2[0].liveValue).toBe(1050); // Live value unchanged
    expect(result2[0].targetValue).toBe(2500); // 25% of 10000 theme target - target changed
    
    const afterTargetPctChange = cacheInvalidation.getCacheStats();
    expect(afterTargetPctChange.liveCache.size).toBe(1); // Live cache reused
    expect(afterTargetPctChange.targetCache.size).toBe(2); // New target cache entry
  });

  it('should demonstrate requirement 7.3: quantity changes update both systems independently', () => {
    // Initial calculation
    const result1 = selectHoldingsWithDerived(testPortfolio);
    expect(result1[0].liveValue).toBe(1050); // 105 * 10
    expect(result1[0].targetValue).toBe(5000); // 50% of 10000 theme target
    
    // Update quantity (affects live calculations, target percentages remain same)
    const portfolioWithNewQty = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => ({ ...h, qty: 20 }))
    };
    
    const result2 = selectHoldingsWithDerived(portfolioWithNewQty);
    expect(result2[0].liveValue).toBe(2100); // 105 * 20 - live value changed
    expect(result2[0].targetValue).toBe(5000); // Target unchanged (same percentage)
    
    const afterQtyChange = cacheInvalidation.getCacheStats();
    expect(afterQtyChange.liveCache.size).toBe(2); // New live cache entry
    expect(afterQtyChange.targetCache.size).toBe(1); // Target cache reused (same target structure)
  });

  it('should demonstrate requirement 7.4: holdings changes update both systems separately', () => {
    // Initial calculation with one holding
    const result1 = selectHoldingsWithDerived(testPortfolio);
    expect(result1).toHaveLength(1);
    
    // Add a new holding
    const portfolioWithNewHolding = {
      ...testPortfolio,
      holdings: [
        ...testPortfolio.holdings,
        {
          id: '2',
          ticker: 'GOOGL',
          section: 'Core',
          theme: 'Tech',
          account: 'Taxable',
          qty: 5,
          price: 200,
          livePrice: 210,
          avgCost: 190,
          dayChange: 10,
          dayChangePercent: 5,
          include: true,
          targetPct: 25,
        }
      ]
    };
    
    const result2 = selectHoldingsWithDerived(portfolioWithNewHolding);
    expect(result2).toHaveLength(2);
    
    // Both live and target calculations should be affected by structural changes
    const afterHoldingAdded = cacheInvalidation.getCacheStats();
    expect(afterHoldingAdded.liveCache.size).toBe(2); // New live cache entry
    expect(afterHoldingAdded.targetCache.size).toBe(2); // New target cache entry
  });
});