import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateHoldingValue,
  calculateLivePortfolioTotals,
  selectIncludedHoldings,
  selectTotalValue,
  selectTargetPortfolioValue,
  selectHoldingsWithDerived,
  selectBreakdownBySection,
  selectBreakdownByAccount,
  selectBreakdownByTheme,
  selectBudgetRemaining,
} from './selectors';
import { cacheInvalidation } from './cache';
import { createEmptyPortfolio, createHolding } from './factory';
import type { Holding, Portfolio } from '@/types/portfolio';

beforeEach(() => {
  cacheInvalidation.invalidateAllCalculations();
});

const makePortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  ...createEmptyPortfolio('p1', 'Test'),
  ...overrides,
});

describe('calculateHoldingValue', () => {
  it('uses manual price when no live price', () => {
    const h = createHolding({ price: 10, qty: 5 });
    const result = calculateHoldingValue(h);
    expect(result.value).toBe(50);
    expect(result.liveValue).toBe(50);
    expect(result.manualValue).toBe(50);
    expect(result.usedLivePrice).toBe(false);
    expect(result.dayChangeValue).toBe(0);
  });

  it('uses live price when available', () => {
    const h: Holding = { ...createHolding({ price: 10, qty: 5 }), livePrice: 12 };
    const result = calculateHoldingValue(h);
    expect(result.value).toBe(60);
    expect(result.liveValue).toBe(60);
    expect(result.manualValue).toBe(50);
    expect(result.usedLivePrice).toBe(true);
    expect(result.dayChangeValue).toBe(10);
  });
});

describe('calculateLivePortfolioTotals', () => {
  it('sums included holdings', () => {
    const holdings = [
      createHolding({ price: 100, qty: 10, section: 'Core', theme: 'All', include: true }),
      createHolding({ price: 50, qty: 20, section: 'Satellite', theme: 'Tech', include: true }),
      createHolding({ price: 200, qty: 5, section: 'Core', theme: 'All', include: false }),
    ];
    const totals = calculateLivePortfolioTotals(holdings);
    expect(totals.totalAllocatedValue).toBe(2000); // 1000 + 1000
    expect(totals.sectionTotals.get('Core')).toBe(1000);
    expect(totals.sectionTotals.get('Satellite')).toBe(1000);
    expect(totals.themeTotals.get('All')).toBe(1000);
    expect(totals.themeTotals.get('Tech')).toBe(1000);
  });

  it('returns 0 for empty holdings', () => {
    const totals = calculateLivePortfolioTotals([]);
    expect(totals.totalAllocatedValue).toBe(0);
  });
});

describe('selectIncludedHoldings', () => {
  it('filters out excluded holdings', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ include: true }),
        createHolding({ include: false }),
        createHolding({ include: true }),
      ],
    });
    const result = selectIncludedHoldings(portfolio);
    expect(result).toHaveLength(2);
  });
});

describe('selectTotalValue', () => {
  it('sums included holding values', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ price: 100, qty: 10, include: true }),
        createHolding({ price: 50, qty: 20, include: true }),
      ],
    });
    expect(selectTotalValue(portfolio)).toBe(2000);
  });

  it('returns 0 for empty portfolio', () => {
    expect(selectTotalValue(makePortfolio())).toBe(0);
  });
});

describe('selectTargetPortfolioValue', () => {
  it('returns target portfolio value from settings', () => {
    const portfolio = makePortfolio({
      settings: {
        ...makePortfolio().settings,
        targetPortfolioValue: 50000,
      },
    });
    expect(selectTargetPortfolioValue(portfolio)).toBe(50000);
  });

  it('returns 0 when not set', () => {
    expect(selectTargetPortfolioValue(makePortfolio())).toBe(0);
  });
});

describe('selectHoldingsWithDerived', () => {
  it('calculates derived fields', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({
          id: 'h1',
          price: 100,
          qty: 10,
          section: 'Core',
          theme: 'All',
          include: true,
          avgCost: 90,
        }),
      ],
    });
    const derived = selectHoldingsWithDerived(portfolio);
    expect(derived).toHaveLength(1);
    expect(derived[0].holding.id).toBe('h1');
    expect(derived[0].value).toBe(1000);
    expect(derived[0].liveValue).toBe(1000);
    expect(derived[0].pctOfTotal).toBe(100);
    expect(derived[0].pctOfSection).toBe(100);
    expect(derived[0].profitLoss).toBeDefined();
    expect(derived[0].profitLoss!.totalGain).toBeGreaterThan(0);
  });

  it('returns cached results on second call', () => {
    const portfolio = makePortfolio({
      holdings: [createHolding({ price: 100, qty: 10, include: true })],
    });
    const result1 = selectHoldingsWithDerived(portfolio);
    const result2 = selectHoldingsWithDerived(portfolio);
    expect(result1).toBe(result2); // Same reference = cached
  });

  it('handles portfolio with no holdings', () => {
    const result = selectHoldingsWithDerived(makePortfolio());
    expect(result).toEqual([]);
  });
});

describe('selectBreakdownBySection', () => {
  it('groups holdings by section', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ price: 100, qty: 10, section: 'Core', include: true }),
        createHolding({ price: 50, qty: 10, section: 'Core', include: true }),
        createHolding({ price: 200, qty: 5, section: 'Satellite', include: true }),
      ],
    });
    const breakdown = selectBreakdownBySection(portfolio);
    expect(breakdown).toHaveLength(2);
    const core = breakdown.find((b) => b.label === 'Core');
    const satellite = breakdown.find((b) => b.label === 'Satellite');
    expect(core!.value).toBe(1500);
    expect(satellite!.value).toBe(1000);
  });

  it('returns empty for empty portfolio', () => {
    expect(selectBreakdownBySection(makePortfolio())).toEqual([]);
  });
});

describe('selectBreakdownByAccount', () => {
  it('groups holdings by account', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ price: 100, qty: 10, account: 'ISA', include: true }),
        createHolding({ price: 50, qty: 10, account: 'SIPP', include: true }),
      ],
    });
    const breakdown = selectBreakdownByAccount(portfolio);
    expect(breakdown).toHaveLength(2);
  });
});

describe('selectBreakdownByTheme', () => {
  it('groups holdings by theme', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ price: 100, qty: 10, theme: 'Tech', include: true }),
        createHolding({ price: 100, qty: 10, theme: 'Energy', include: true }),
      ],
    });
    const breakdown = selectBreakdownByTheme(portfolio);
    expect(breakdown).toHaveLength(2);
  });
});

describe('selectBudgetRemaining', () => {
  it('returns budget info for sections/accounts/themes', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ price: 100, qty: 10, section: 'Core', theme: 'All', include: true }),
      ],
      budgets: {
        sections: { Core: { percent: 60 } },
        accounts: {},
        themes: {},
      },
    });
    const remaining = selectBudgetRemaining(portfolio);
    expect(remaining.sections).toBeDefined();
    expect(remaining.accounts).toBeDefined();
    expect(remaining.themes).toBeDefined();

    const coreBudget = remaining.sections.find((s) => s.label === 'Core');
    expect(coreBudget).toBeDefined();
    expect(coreBudget!.used).toBe(1000);
    expect(coreBudget!.percentLimit).toBe(60);
  });

  it('handles empty budgets', () => {
    const remaining = selectBudgetRemaining(makePortfolio());
    expect(remaining.sections).toBeDefined();
  });
});
