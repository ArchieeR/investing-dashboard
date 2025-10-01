import { describe, it, expect, beforeEach } from 'vitest';
import { selectHoldingsWithDerived, cacheInvalidation } from '../src/state/selectors';
import type { Portfolio } from '../src/state/types';

describe('Cache Invalidation', () => {
  let testPortfolio: Portfolio;

  beforeEach(() => {
    // Clear all caches before each test
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
        },
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

  it('should cache live calculations separately from target calculations', () => {
    // Initial calculation should populate caches
    const result1 = selectHoldingsWithDerived(testPortfolio);
    expect(result1).toHaveLength(2);
    
    const initialStats = cacheInvalidation.getCacheStats();
    expect(initialStats.liveCache.size).toBe(1);
    expect(initialStats.targetCache.size).toBe(1);
    expect(initialStats.derivedCache.size).toBe(1);
    
    // Same portfolio should use cached results
    const result2 = selectHoldingsWithDerived(testPortfolio);
    expect(result2).toBe(result1); // Should be exact same reference due to caching
  });

  it('should invalidate only live cache when live prices change', () => {
    // Initial calculation
    selectHoldingsWithDerived(testPortfolio);
    
    const initialStats = cacheInvalidation.getCacheStats();
    expect(initialStats.liveCache.size).toBe(1);
    expect(initialStats.targetCache.size).toBe(1);
    
    // Simulate live price update
    cacheInvalidation.invalidateLiveCalculations();
    
    const afterLiveInvalidation = cacheInvalidation.getCacheStats();
    expect(afterLiveInvalidation.liveCache.size).toBe(0);
    expect(afterLiveInvalidation.targetCache.size).toBe(1); // Target cache should remain
    expect(afterLiveInvalidation.derivedCache.size).toBe(0); // Derived cache should be cleared
  });

  it('should invalidate only target cache when target settings change', () => {
    // Initial calculation
    selectHoldingsWithDerived(testPortfolio);
    
    const initialStats = cacheInvalidation.getCacheStats();
    expect(initialStats.liveCache.size).toBe(1);
    expect(initialStats.targetCache.size).toBe(1);
    
    // Simulate target setting update
    cacheInvalidation.invalidateTargetCalculations();
    
    const afterTargetInvalidation = cacheInvalidation.getCacheStats();
    expect(afterTargetInvalidation.liveCache.size).toBe(1); // Live cache should remain
    expect(afterTargetInvalidation.targetCache.size).toBe(0);
    expect(afterTargetInvalidation.derivedCache.size).toBe(0); // Derived cache should be cleared
  });

  it('should generate different cache keys for live vs target data changes', () => {
    // Initial calculation
    selectHoldingsWithDerived(testPortfolio);
    
    // Change only live price (should affect live cache key but not target cache key)
    const portfolioWithNewLivePrice = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => 
        h.id === '1' ? { ...h, livePrice: 110 } : h
      )
    };
    
    // This should create new live cache entry but reuse target cache
    selectHoldingsWithDerived(portfolioWithNewLivePrice);
    
    const afterLivePriceChange = cacheInvalidation.getCacheStats();
    expect(afterLivePriceChange.liveCache.size).toBe(2); // New live cache entry
    expect(afterLivePriceChange.targetCache.size).toBe(1); // Same target cache
    
    // Change only target percentage (should affect target cache key but not live cache key)
    const portfolioWithNewTargetPct = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => 
        h.id === '1' ? { ...h, targetPct: 60 } : h
      )
    };
    
    selectHoldingsWithDerived(portfolioWithNewTargetPct);
    
    const afterTargetPctChange = cacheInvalidation.getCacheStats();
    expect(afterTargetPctChange.liveCache.size).toBe(2); // Same live cache entries
    expect(afterTargetPctChange.targetCache.size).toBe(2); // New target cache entry
  });

  it('should handle quantity changes that affect both live and target calculations', () => {
    // Initial calculation
    selectHoldingsWithDerived(testPortfolio);
    
    // Change quantity (affects live calculations but target cache key remains same since targetPct unchanged)
    const portfolioWithNewQty = {
      ...testPortfolio,
      holdings: testPortfolio.holdings.map(h => 
        h.id === '1' ? { ...h, qty: 15 } : h
      )
    };
    
    selectHoldingsWithDerived(portfolioWithNewQty);
    
    const afterQtyChange = cacheInvalidation.getCacheStats();
    expect(afterQtyChange.liveCache.size).toBe(2); // New live cache entry
    expect(afterQtyChange.targetCache.size).toBe(1); // Same target cache (targetPct unchanged)
    
    // The derived cache should have new entries since live data changed
    expect(afterQtyChange.derivedCache.size).toBe(2);
  });
});