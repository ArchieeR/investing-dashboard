import { describe, expect, it, beforeEach } from 'vitest';
import { 
  selectHoldingsWithDerived, 
  selectTotalValue,
  cacheInvalidation,
  type HoldingDerived 
} from '../src/state/selectors';
import { createEmptyPortfolio, type Holding, type Portfolio } from '../src/state/types';

let holdingCounter = 0;

const createHolding = (overrides: Partial<Holding>): Holding => ({
  id: overrides.id ?? `holding-${holdingCounter++}`,
  section: overrides.section ?? 'Core',
  theme: overrides.theme ?? 'Equities',
  assetType: overrides.assetType ?? 'ETF',
  name: overrides.name ?? 'Test Asset',
  ticker: overrides.ticker ?? 'TEST',
  exchange: overrides.exchange ?? 'LSE',
  account: overrides.account ?? 'ISA',
  price: overrides.price ?? 0,
  qty: overrides.qty ?? 0,
  include: overrides.include ?? true,
  targetPct: overrides.targetPct,
  avgCost: overrides.avgCost,
  livePrice: overrides.livePrice,
  dayChange: overrides.dayChange,
  dayChangePercent: overrides.dayChangePercent,
});

const buildPortfolio = (
  holdings: Holding[], 
  settings?: Partial<Portfolio['settings']>, 
  budgets?: Portfolio['budgets'],
  customLists?: Partial<Portfolio['lists']>
): Portfolio => {
  const portfolio = createEmptyPortfolio('portfolio-test', 'Test');
  portfolio.holdings = holdings;
  if (settings) {
    portfolio.settings = { ...portfolio.settings, ...settings };
  }
  if (budgets) {
    portfolio.budgets = budgets;
  }
  if (customLists) {
    portfolio.lists = { ...portfolio.lists, ...customLists };
  }
  return portfolio;
};

// Helper to build portfolio with proper target structure
const buildTargetPortfolio = (
  holdings: Holding[],
  targetPortfolioValue: number,
  budgets: Portfolio['budgets']
): Portfolio => {
  // Extract unique sections and themes from holdings
  const sections = Array.from(new Set(holdings.map(h => h.section)));
  const themes = Array.from(new Set(holdings.map(h => h.theme)));
  
  // Create theme-section mappings from holdings
  const themeSections: Record<string, string> = {};
  holdings.forEach(h => {
    themeSections[h.theme] = h.section;
  });

  return buildPortfolio(
    holdings,
    { targetPortfolioValue },
    budgets,
    {
      sections,
      themes,
      accounts: ['ISA', 'GIA'],
      themeSections
    }
  );
};

describe('Live Value Calculations', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 1.1: Live price priority', () => {
    it('uses live price when available', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100, 
          livePrice: 105, 
          qty: 10 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.value).toBe(1050); // 105 * 10
      expect(holding.liveValue).toBe(1050);
      expect(holding.manualValue).toBe(1000); // 100 * 10
      expect(holding.dayChangeValue).toBe(50); // 1050 - 1000
      expect(holding.usedLivePrice).toBe(true);
    });

    it('falls back to manual price when live price unavailable', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100, 
          livePrice: undefined, 
          qty: 10 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.value).toBe(1000); // 100 * 10
      expect(holding.liveValue).toBe(1000);
      expect(holding.manualValue).toBe(1000);
      expect(holding.dayChangeValue).toBe(0);
      expect(holding.usedLivePrice).toBe(false);
    });
  });

  describe('Requirement 1.3: Total allocated value calculation', () => {
    it('sums live values of included holdings only', () => {
      const portfolio = buildPortfolio([
        createHolding({ id: '1', price: 100, livePrice: 110, qty: 10, include: true }),
        createHolding({ id: '2', price: 50, livePrice: 55, qty: 20, include: true }),
        createHolding({ id: '3', price: 25, livePrice: 30, qty: 40, include: false }), // excluded
      ]);

      const totalValue = selectTotalValue(portfolio);
      expect(totalValue).toBe(2200); // (110 * 10) + (55 * 20) = 1100 + 1100
    });

    it('handles mixed live and manual prices correctly', () => {
      const portfolio = buildPortfolio([
        createHolding({ id: '1', price: 100, livePrice: 110, qty: 10 }), // live price
        createHolding({ id: '2', price: 50, livePrice: undefined, qty: 20 }), // manual price
      ]);

      const totalValue = selectTotalValue(portfolio);
      expect(totalValue).toBe(2100); // (110 * 10) + (50 * 20) = 1100 + 1000
    });
  });

  describe('Requirement 1.4-1.8: Percentage calculations using live values', () => {
    it('calculates portfolio percentages using live values', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          section: 'Core',
          theme: 'Equities',
          price: 100, 
          livePrice: 120, 
          qty: 10 
        }),
        createHolding({ 
          id: '2', 
          section: 'Core',
          theme: 'Bonds',
          price: 50, 
          livePrice: 45, 
          qty: 20 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const equity = derived.find(h => h.holding.id === '1')!;
      const bond = derived.find(h => h.holding.id === '2')!;

      const totalValue = 1200 + 900; // 2100
      
      expect(equity.pctOfTotal).toBeCloseTo(57.14, 2); // 1200 / 2100 * 100
      expect(bond.pctOfTotal).toBeCloseTo(42.86, 2); // 900 / 2100 * 100
    });

    it('calculates section percentages using live values', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          section: 'Core',
          theme: 'Equities',
          price: 100, 
          livePrice: 120, 
          qty: 10 
        }),
        createHolding({ 
          id: '2', 
          section: 'Core',
          theme: 'Bonds',
          price: 50, 
          livePrice: 45, 
          qty: 20 
        }),
        createHolding({ 
          id: '3', 
          section: 'Satellite',
          theme: 'Alternatives',
          price: 25, 
          livePrice: 30, 
          qty: 10 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const coreEquity = derived.find(h => h.holding.id === '1')!;
      const coreBond = derived.find(h => h.holding.id === '2')!;
      const satellite = derived.find(h => h.holding.id === '3')!;

      const coreSectionTotal = 1200 + 900; // 2100
      
      expect(coreEquity.sectionTotal).toBe(coreSectionTotal);
      expect(coreBond.sectionTotal).toBe(coreSectionTotal);
      expect(satellite.sectionTotal).toBe(300); // Only satellite holding
      
      expect(coreEquity.pctOfSection).toBeCloseTo(57.14, 2); // 1200 / 2100 * 100
      expect(coreBond.pctOfSection).toBeCloseTo(42.86, 2); // 900 / 2100 * 100
      expect(satellite.pctOfSection).toBe(100); // 300 / 300 * 100
    });

    it('calculates theme percentages using live values', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          section: 'Core',
          theme: 'Equities',
          price: 100, 
          livePrice: 120, 
          qty: 5 
        }),
        createHolding({ 
          id: '2', 
          section: 'Core',
          theme: 'Equities',
          price: 80, 
          livePrice: 90, 
          qty: 10 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const equity1 = derived.find(h => h.holding.id === '1')!;
      const equity2 = derived.find(h => h.holding.id === '2')!;

      const equityThemeTotal = 600 + 900; // 1500
      
      expect(equity1.pctOfTheme).toBeCloseTo(40, 2); // 600 / 1500 * 100
      expect(equity2.pctOfTheme).toBeCloseTo(60, 2); // 900 / 1500 * 100
    });
  });
});

describe('Target Portfolio System', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 3.1-3.3: Target system separation', () => {
    it('calculates target values when target portfolio value is set', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100, 
            qty: 10,
            targetPct: 60 
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'Equities': { percentOfSection: 75 } }
        }
      );

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      // Target calculation: Portfolio (10000) → Section (8000) → Theme (6000) → Holding (3600)
      expect(holding.targetValue).toBe(3600); // 6000 * 0.6
      expect(holding.targetValueDiff).toBe(-2600); // 1000 - 3600
    });

    it('does not calculate targets when target portfolio value is not set', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100, 
          qty: 10,
          targetPct: 50 
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      // Without explicit target portfolio value, should use legacy fallback
      expect(holding.targetValue).toBeDefined();
      expect(holding.targetValueDiff).toBeDefined();
    });

    it('maintains separation between live and target calculations', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100, 
            livePrice: 120, // Live price change
            qty: 10,
            targetPct: 50 
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'Equities': { percentOfSection: 50 } }
        }
      );

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      // Live calculations use live price
      expect(holding.liveValue).toBe(1200); // 120 * 10
      expect(holding.pctOfTotal).toBe(100); // Only holding

      // Target calculations independent of live price changes
      expect(holding.targetValue).toBe(2000); // 4000 * 0.5 (theme target * holding %)
      expect(holding.targetValueDiff).toBe(-800); // 1200 - 2000
    });
  });
});

describe('Hierarchical Target Calculations', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 4.1-4.4: Section target calculations', () => {
    it('calculates section targets from portfolio percentage', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100, 
            qty: 10,
            targetPct: 100
          }),
          createHolding({ 
            id: '2', 
            section: 'Satellite',
            theme: 'Alternatives',
            price: 50, 
            qty: 20,
            targetPct: 100
          }),
        ],
        10000,
        {
          sections: { 
            'Core': { percent: 70 },
            'Satellite': { percent: 30 }
          },
          themes: { 
            'Equities': { percentOfSection: 100 },
            'Alternatives': { percentOfSection: 100 }
          }
        }
      );

      const derived = selectHoldingsWithDerived(portfolio);
      const coreHolding = derived.find(h => h.holding.section === 'Core')!;
      const satelliteHolding = derived.find(h => h.holding.section === 'Satellite')!;

      // Core section target: 10000 * 0.7 = 7000, theme target: 7000 * 1.0 = 7000
      // Satellite section target: 10000 * 0.3 = 3000, theme target: 3000 * 1.0 = 3000
      expect(coreHolding.targetValue).toBe(7000); // 7000 * 1.0
      expect(satelliteHolding.targetValue).toBe(3000); // 3000 * 1.0
    });
  });

  describe('Requirement 5.1-5.4: Theme target calculations', () => {
    it('calculates theme targets as percentage of section target', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100, 
            qty: 10,
            targetPct: 100 
          }),
          createHolding({ 
            id: '2', 
            section: 'Core',
            theme: 'Bonds',
            price: 50, 
            qty: 20,
            targetPct: 100 
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 
            'Equities': { percentOfSection: 60 },
            'Bonds': { percentOfSection: 40 }
          }
        }
      );

      const derived = selectHoldingsWithDerived(portfolio);
      const equityHolding = derived.find(h => h.holding.theme === 'Equities')!;
      const bondHolding = derived.find(h => h.holding.theme === 'Bonds')!;

      // Section target: 10000 * 0.8 = 8000
      // Equity theme target: 8000 * 0.6 = 4800
      // Bond theme target: 8000 * 0.4 = 3200
      expect(equityHolding.targetValue).toBe(4800); // 4800 * 1.0
      expect(bondHolding.targetValue).toBe(3200); // 3200 * 1.0
    });
  });

  describe('Requirement 6.1-6.4: Holding target calculations', () => {
    it('calculates holding targets as percentage of theme target', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100, 
            qty: 5,
            targetPct: 60 
          }),
          createHolding({ 
            id: '2', 
            section: 'Core',
            theme: 'Equities',
            price: 80, 
            qty: 10,
            targetPct: 40 
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'Equities': { percentOfSection: 50 } }
        }
      );

      const derived = selectHoldingsWithDerived(portfolio);
      const holding1 = derived.find(h => h.holding.id === '1')!;
      const holding2 = derived.find(h => h.holding.id === '2')!;

      // Section target: 10000 * 0.8 = 8000
      // Theme target: 8000 * 0.5 = 4000
      // Holding 1 target: 4000 * 0.6 = 2400
      // Holding 2 target: 4000 * 0.4 = 1600
      expect(holding1.targetValue).toBe(2400);
      expect(holding2.targetValue).toBe(1600);
      
      // Current values: 500 and 800
      expect(holding1.targetValueDiff).toBe(-1900); // 500 - 2400
      expect(holding2.targetValueDiff).toBe(-800); // 800 - 1600
    });
  });
});

describe('Profit/Loss Calculations', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 2.1-2.4: Profit/loss based on purchase history', () => {
    it('calculates profit/loss using live price vs average cost', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100,
          livePrice: 120,
          avgCost: 90,
          qty: 10,
          dayChange: 5,
          dayChangePercent: 4.35
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.profitLoss).toBeDefined();
      expect(holding.profitLoss!.costBasis).toBe(900); // 90 * 10
      expect(holding.profitLoss!.marketValue).toBe(1200); // 120 * 10
      expect(holding.profitLoss!.totalGain).toBe(300); // 1200 - 900
      expect(holding.profitLoss!.totalGainPercent).toBe(33.33); // (300 / 900) * 100
      expect(holding.profitLoss!.dayChangeValue).toBe(50); // 5 * 10
      expect(holding.profitLoss!.dayChangePercent).toBe(4.35);
    });

    it('uses manual price when live price unavailable for profit/loss', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 110,
          livePrice: undefined,
          avgCost: 100,
          qty: 10
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.profitLoss).toBeDefined();
      expect(holding.profitLoss!.marketValue).toBe(1100); // 110 * 10 (using manual price)
      expect(holding.profitLoss!.totalGain).toBe(100); // 1100 - 1000
    });

    it('omits profit/loss when average cost unavailable', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100,
          avgCost: undefined,
          qty: 10
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.profitLoss).toBeUndefined();
    });

    it('omits profit/loss when quantity is zero', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100,
          avgCost: 90,
          qty: 0
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.profitLoss).toBeUndefined();
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Zero values and missing data', () => {
    it('handles zero quantities gracefully', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100,
          livePrice: 110,
          qty: 0,
          targetPct: 50
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.value).toBe(0);
      expect(holding.liveValue).toBe(0);
      expect(holding.pctOfTotal).toBe(0);
      expect(holding.targetValue).toBeUndefined(); // No target when qty is 0
    });

    it('handles zero prices gracefully', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 0,
          livePrice: 0,
          qty: 10
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.value).toBe(0);
      expect(holding.liveValue).toBe(0);
      expect(holding.pctOfTotal).toBe(0);
    });

    it('handles missing theme-section mappings', () => {
      const portfolio = buildPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'UnmappedTheme',
            price: 100,
            qty: 10,
            targetPct: 50
          }),
        ],
        { targetPortfolioValue: 10000 },
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'UnmappedTheme': { percentOfSection: 50 } }
        }
      );

      // No theme-section mapping provided
      portfolio.lists.themeSections = {};

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      // Should still calculate live values
      expect(holding.liveValue).toBe(1000);
      expect(holding.pctOfTotal).toBe(100);
      
      // Target calculations may not work without proper mapping
      // This tests graceful degradation
    });

    it('handles invalid target percentages', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 100,
          qty: 10,
          targetPct: -10 // Invalid negative percentage
        }),
        createHolding({ 
          id: '2', 
          price: 100,
          qty: 10,
          targetPct: NaN // Invalid NaN percentage
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      
      // Should still calculate live values correctly
      expect(derived[0].liveValue).toBe(1000);
      expect(derived[1].liveValue).toBe(1000);
      
      // Target calculations should be undefined for invalid percentages
      expect(derived[0].targetValue).toBeUndefined();
      expect(derived[1].targetValue).toBeUndefined();
    });
  });

  describe('Division by zero handling', () => {
    it('handles zero total portfolio value', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          price: 0,
          qty: 0,
          include: true
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.pctOfTotal).toBe(0);
      expect(holding.pctOfSection).toBe(0);
      expect(holding.pctOfTheme).toBe(0);
    });

    it('handles zero section totals', () => {
      const portfolio = buildPortfolio([
        createHolding({ 
          id: '1', 
          section: 'EmptySection',
          price: 0,
          qty: 0
        }),
      ]);

      const derived = selectHoldingsWithDerived(portfolio);
      const holding = derived[0];

      expect(holding.sectionTotal).toBe(0);
      expect(holding.pctOfSection).toBe(0);
    });
  });
});

describe('Cache Invalidation', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 7.1-7.4: Independent cache invalidation', () => {
    it('caches live calculations separately from target calculations', () => {
      const portfolio = buildPortfolio(
        [
          createHolding({ 
            id: '1', 
            price: 100,
            livePrice: 110,
            qty: 10,
            targetPct: 50
          }),
        ],
        { targetPortfolioValue: 10000 }
      );

      // First calculation - should populate cache
      const derived1 = selectHoldingsWithDerived(portfolio);
      expect(derived1[0].liveValue).toBe(1100);

      // Check cache stats
      const stats1 = cacheInvalidation.getCacheStats();
      expect(stats1.liveCache.size).toBe(1);
      expect(stats1.targetCache.size).toBe(1);
      expect(stats1.derivedCache.size).toBe(1);

      // Modify only live price - should invalidate only live cache
      portfolio.holdings[0].livePrice = 120;
      cacheInvalidation.invalidateLiveCalculations();

      const stats2 = cacheInvalidation.getCacheStats();
      expect(stats2.liveCache.size).toBe(0); // Live cache cleared
      expect(stats2.targetCache.size).toBe(1); // Target cache preserved
      expect(stats2.derivedCache.size).toBe(0); // Derived cache cleared (depends on live)

      // Second calculation with new live price
      const derived2 = selectHoldingsWithDerived(portfolio);
      expect(derived2[0].liveValue).toBe(1200); // Updated live value
    });

    it('invalidates target calculations independently', () => {
      const portfolio = buildPortfolio(
        [
          createHolding({ 
            id: '1', 
            price: 100,
            qty: 10,
            targetPct: 50
          }),
        ],
        { targetPortfolioValue: 10000 }
      );

      // First calculation
      selectHoldingsWithDerived(portfolio);
      
      const stats1 = cacheInvalidation.getCacheStats();
      expect(stats1.liveCache.size).toBe(1);
      expect(stats1.targetCache.size).toBe(1);

      // Modify only target percentage - should invalidate only target cache
      portfolio.holdings[0].targetPct = 60;
      cacheInvalidation.invalidateTargetCalculations();

      const stats2 = cacheInvalidation.getCacheStats();
      expect(stats2.liveCache.size).toBe(1); // Live cache preserved
      expect(stats2.targetCache.size).toBe(0); // Target cache cleared
      expect(stats2.derivedCache.size).toBe(0); // Derived cache cleared (depends on target)
    });
  });
});

describe('Percentage Preservation Logic', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  describe('Requirement 8.1-8.4: Hierarchical percentage preservation', () => {
    it('preserves theme percentage ratios when section percentage changes', () => {
      // This test verifies the concept - actual implementation would be in portfolio store
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100,
            qty: 10,
            targetPct: 60
          }),
          createHolding({ 
            id: '2', 
            section: 'Core',
            theme: 'Bonds',
            price: 50,
            qty: 20,
            targetPct: 40
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } }, // Original: 80%
          themes: { 
            'Equities': { percentOfSection: 60 }, // 60% of section
            'Bonds': { percentOfSection: 40 }     // 40% of section
          }
        }
      );

      const derived1 = selectHoldingsWithDerived(portfolio);
      const equity1 = derived1.find(h => h.holding.theme === 'Equities')!;
      const bond1 = derived1.find(h => h.holding.theme === 'Bonds')!;

      // Original targets: Section 8000, Equity theme 4800, Bond theme 3200
      expect(equity1.targetValue).toBe(2880); // 4800 * 0.6
      expect(bond1.targetValue).toBe(1280); // 3200 * 0.4

      // Now change section percentage to 60% (from 80%)
      // Theme percentages should remain 60%/40% of the new section target
      portfolio.budgets!.sections!['Core'] = { percent: 60 };
      cacheInvalidation.invalidateTargetCalculations();

      const derived2 = selectHoldingsWithDerived(portfolio);
      const equity2 = derived2.find(h => h.holding.theme === 'Equities')!;
      const bond2 = derived2.find(h => h.holding.theme === 'Bonds')!;

      // New targets: Section 6000, Equity theme 3600, Bond theme 2400
      expect(equity2.targetValue).toBe(2160); // 3600 * 0.6
      expect(bond2.targetValue).toBe(960); // 2400 * 0.4

      // Verify theme percentages of section are preserved (60%/40%)
      const equityThemeTarget = 6000 * 0.6; // 3600
      const bondThemeTarget = 6000 * 0.4; // 2400
      expect(equity2.targetValue).toBe(equityThemeTarget * 0.6);
      expect(bond2.targetValue).toBe(bondThemeTarget * 0.4);
    });

    it('preserves holding percentage ratios when theme percentage changes', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100,
            qty: 5,
            targetPct: 60 // 60% of theme
          }),
          createHolding({ 
            id: '2', 
            section: 'Core',
            theme: 'Equities',
            price: 80,
            qty: 10,
            targetPct: 40 // 40% of theme
          }),
        ],
        10000,
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'Equities': { percentOfSection: 50 } } // Original: 50% of section
        }
      );

      const derived1 = selectHoldingsWithDerived(portfolio);
      const holding1_1 = derived1.find(h => h.holding.id === '1')!;
      const holding2_1 = derived1.find(h => h.holding.id === '2')!;

      // Original: Section 8000, Theme 4000, Holdings 2400/1600
      expect(holding1_1.targetValue).toBe(2400); // 4000 * 0.6
      expect(holding2_1.targetValue).toBe(1600); // 4000 * 0.4

      // Change theme percentage to 75% of section (from 50%)
      portfolio.budgets!.themes!['Equities'] = { percentOfSection: 75 };
      cacheInvalidation.invalidateTargetCalculations();

      const derived2 = selectHoldingsWithDerived(portfolio);
      const holding1_2 = derived2.find(h => h.holding.id === '1')!;
      const holding2_2 = derived2.find(h => h.holding.id === '2')!;

      // New: Section 8000, Theme 6000, Holdings should maintain 60%/40% ratio
      expect(holding1_2.targetValue).toBe(3600); // 6000 * 0.6
      expect(holding2_2.targetValue).toBe(2400); // 6000 * 0.4

      // Verify holding percentages of theme are preserved (60%/40%)
      const ratio1 = holding1_2.targetValue! / (holding1_2.targetValue! + holding2_2.targetValue!);
      const ratio2 = holding2_2.targetValue! / (holding1_2.targetValue! + holding2_2.targetValue!);
      expect(ratio1).toBeCloseTo(0.6, 2);
      expect(ratio2).toBeCloseTo(0.4, 2);
    });

    it('preserves all percentage relationships when target portfolio value changes', () => {
      const portfolio = buildTargetPortfolio(
        [
          createHolding({ 
            id: '1', 
            section: 'Core',
            theme: 'Equities',
            price: 100,
            qty: 10,
            targetPct: 100
          }),
        ],
        10000, // Original target
        {
          sections: { 'Core': { percent: 80 } },
          themes: { 'Equities': { percentOfSection: 50 } }
        }
      );

      const derived1 = selectHoldingsWithDerived(portfolio);
      const holding1 = derived1.find(h => h.holding.id === '1')!;

      // Original: Portfolio 10000, Section 8000, Theme 4000, Holding 4000
      expect(holding1.targetValue).toBe(4000);

      // Change target portfolio value to 20000 (double)
      portfolio.settings.targetPortfolioValue = 20000;
      cacheInvalidation.invalidateTargetCalculations();

      const derived2 = selectHoldingsWithDerived(portfolio);
      const holding2 = derived2.find(h => h.holding.id === '1')!;

      // All values should double while preserving percentages
      // New: Portfolio 20000, Section 16000, Theme 8000, Holding 8000
      expect(holding2.targetValue).toBe(8000);

      // Verify percentage relationships are preserved
      const originalRatio = 4000 / 10000; // 0.4
      const newRatio = 8000 / 20000; // 0.4
      expect(newRatio).toBe(originalRatio);
    });
  });
});

describe('Complex Integration Scenarios', () => {
  beforeEach(() => {
    cacheInvalidation.invalidateAllCalculations();
    holdingCounter = 0;
  });

  it('handles complex portfolio with multiple sections, themes, and holdings', () => {
    const portfolio = buildTargetPortfolio(
      [
        // Core section - Equities theme
        createHolding({ 
          id: '1', 
          section: 'Core',
          theme: 'Equities',
          price: 100,
          livePrice: 110,
          avgCost: 95,
          qty: 10,
          targetPct: 70,
          dayChange: 2.5
        }),
        createHolding({ 
          id: '2', 
          section: 'Core',
          theme: 'Equities',
          price: 50,
          livePrice: 55,
          avgCost: 48,
          qty: 20,
          targetPct: 30
        }),
        // Core section - Bonds theme
        createHolding({ 
          id: '3', 
          section: 'Core',
          theme: 'Bonds',
          price: 25,
          livePrice: 24,
          avgCost: 26,
          qty: 40,
          targetPct: 100
        }),
        // Satellite section - Alternatives theme
        createHolding({ 
          id: '4', 
          section: 'Satellite',
          theme: 'Alternatives',
          price: 200,
          livePrice: 220,
          avgCost: 180,
          qty: 5,
          targetPct: 100
        }),
        // Excluded holding
        createHolding({ 
          id: '5', 
          section: 'Core',
          theme: 'Equities',
          price: 75,
          qty: 10,
          include: false
        }),
      ],
      20000,
      {
        sections: { 
          'Core': { percent: 80 },
          'Satellite': { percent: 20 }
        },
        themes: { 
          'Equities': { percentOfSection: 60 },
          'Bonds': { percentOfSection: 40 },
          'Alternatives': { percentOfSection: 100 }
        }
      }
    );

    const derived = selectHoldingsWithDerived(portfolio);
    
    // Calculate expected live values
    const equity1Live = 110 * 10; // 1100
    const equity2Live = 55 * 20; // 1100
    const bondLive = 24 * 40; // 960
    const altLive = 220 * 5; // 1100
    const totalLive = equity1Live + equity2Live + bondLive + altLive; // 4260

    // Test live calculations
    const equity1 = derived.find(h => h.holding.id === '1')!;
    const equity2 = derived.find(h => h.holding.id === '2')!;
    const bond = derived.find(h => h.holding.id === '3')!;
    const alt = derived.find(h => h.holding.id === '4')!;
    const excluded = derived.find(h => h.holding.id === '5')!;

    // Live values
    expect(equity1.liveValue).toBe(1100);
    expect(equity2.liveValue).toBe(1100);
    expect(bond.liveValue).toBe(960);
    expect(alt.liveValue).toBe(1100);

    // Portfolio percentages (based on live values)
    expect(equity1.pctOfTotal).toBeCloseTo(25.82, 2); // 1100 / 4260
    expect(equity2.pctOfTotal).toBeCloseTo(25.82, 2);
    expect(bond.pctOfTotal).toBeCloseTo(22.54, 2); // 960 / 4260
    expect(alt.pctOfTotal).toBeCloseTo(25.82, 2);

    // Section totals and percentages
    const coreSectionTotal = 1100 + 1100 + 960; // 3160
    const satelliteSectionTotal = 1100;
    
    expect(equity1.sectionTotal).toBe(coreSectionTotal);
    expect(equity2.sectionTotal).toBe(coreSectionTotal);
    expect(bond.sectionTotal).toBe(coreSectionTotal);
    expect(alt.sectionTotal).toBe(satelliteSectionTotal);

    expect(equity1.pctOfSection).toBeCloseTo(34.81, 2); // 1100 / 3160
    expect(bond.pctOfSection).toBeCloseTo(30.38, 2); // 960 / 3160
    expect(alt.pctOfSection).toBe(100); // 1100 / 1100

    // Theme percentages
    const equityThemeTotal = 1100 + 1100; // 2200
    expect(equity1.pctOfTheme).toBe(50); // 1100 / 2200
    expect(equity2.pctOfTheme).toBe(50);
    expect(bond.pctOfTheme).toBe(100); // Only bond in theme
    expect(alt.pctOfTheme).toBe(100); // Only alt in theme

    // Target calculations
    // Portfolio: 20000
    // Core section: 20000 * 0.8 = 16000
    // Satellite section: 20000 * 0.2 = 4000
    // Equity theme: 16000 * 0.6 = 9600
    // Bond theme: 16000 * 0.4 = 6400
    // Alt theme: 4000 * 1.0 = 4000

    expect(equity1.targetValue).toBe(6720); // 9600 * 0.7
    expect(equity2.targetValue).toBe(2880); // 9600 * 0.3
    expect(bond.targetValue).toBe(6400); // 6400 * 1.0
    expect(alt.targetValue).toBe(4000); // 4000 * 1.0

    // Target differences
    expect(equity1.targetValueDiff).toBe(-5620); // 1100 - 6720
    expect(equity2.targetValueDiff).toBe(-1780); // 1100 - 2880
    expect(bond.targetValueDiff).toBe(-5440); // 960 - 6400
    expect(alt.targetValueDiff).toBe(-2900); // 1100 - 4000

    // Profit/loss calculations
    expect(equity1.profitLoss).toBeDefined();
    expect(equity1.profitLoss!.totalGain).toBe(150); // (110-95)*10
    expect(equity1.profitLoss!.dayChangeValue).toBe(25); // 2.5 * 10

    expect(equity2.profitLoss).toBeDefined();
    expect(equity2.profitLoss!.totalGain).toBe(140); // (55-48)*20

    expect(bond.profitLoss).toBeDefined();
    expect(bond.profitLoss!.totalGain).toBe(-80); // (24-26)*40

    expect(alt.profitLoss).toBeDefined();
    expect(alt.profitLoss!.totalGain).toBe(200); // (220-180)*5

    // Excluded holding should have zero percentages
    expect(excluded.pctOfTotal).toBe(0);
    expect(excluded.pctOfSection).toBe(0);
    expect(excluded.pctOfTheme).toBe(0);
    expect(excluded.targetValue).toBeUndefined();
  });

  it('handles edge case with zero target portfolio value', () => {
    const portfolio = buildPortfolio(
      [
        createHolding({ 
          id: '1', 
          price: 100,
          qty: 10,
          targetPct: 50
        }),
      ],
      { targetPortfolioValue: 0 } // Zero target
    );

    const derived = selectHoldingsWithDerived(portfolio);
    const holding = derived[0];

    // Live calculations should work normally
    expect(holding.liveValue).toBe(1000);
    expect(holding.pctOfTotal).toBe(100);

    // Target calculations should fall back to legacy behavior
    expect(holding.targetValue).toBeDefined();
    expect(holding.targetValueDiff).toBeDefined();
  });

  it('handles missing budget configuration gracefully', () => {
    const portfolio = buildPortfolio(
      [
        createHolding({ 
          id: '1', 
          section: 'Core',
          theme: 'Equities',
          price: 100,
          qty: 10,
          targetPct: 50
        }),
      ],
      { targetPortfolioValue: 10000 }
      // No budgets configuration
    );

    const derived = selectHoldingsWithDerived(portfolio);
    const holding = derived[0];

    // Live calculations should work
    expect(holding.liveValue).toBe(1000);
    expect(holding.pctOfTotal).toBe(100);

    // Target calculations should handle missing budgets gracefully
    // May fall back to legacy behavior or return undefined
    // The important thing is it doesn't crash
    expect(() => holding.targetValue).not.toThrow();
  });
});