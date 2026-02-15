import { describe, it, expect } from 'vitest';
import {
  preserveChildPercentageRatios,
  getThemePercentagesInSection,
  getHoldingPercentagesInTheme,
  preserveThemeRatiosOnSectionChange,
  preserveHoldingRatiosOnThemeChange,
  calculateSectionCurrentPercent,
  calculateThemeCurrentPercent,
} from './budget-preservation';
import { createEmptyPortfolio, createHolding } from './factory';
import type { Portfolio } from '@/types/portfolio';

const makePortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  ...createEmptyPortfolio('p1', 'Test'),
  ...overrides,
});

describe('preserveChildPercentageRatios', () => {
  it('scales child percentages proportionally', () => {
    const children = new Map([
      ['a', 50],
      ['b', 30],
    ]);
    // Section goes from 60% to 80%
    const result = preserveChildPercentageRatios(children, 60, 80);
    const a = result.get('a')!;
    const b = result.get('b')!;
    expect(a).toBeCloseTo(66.67, 1);
    expect(b).toBe(40);
  });

  it('returns empty map for zero old percent', () => {
    const children = new Map([['a', 50]]);
    const result = preserveChildPercentageRatios(children, 0, 80);
    expect(result.size).toBe(0);
  });

  it('returns empty map for negative new percent', () => {
    const children = new Map([['a', 50]]);
    const result = preserveChildPercentageRatios(children, 60, -10);
    expect(result.size).toBe(0);
  });

  it('skips zero-percentage children', () => {
    const children = new Map([
      ['a', 50],
      ['b', 0],
    ]);
    const result = preserveChildPercentageRatios(children, 60, 80);
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(false);
  });
});

describe('getThemePercentagesInSection', () => {
  it('returns themes belonging to a section', () => {
    const portfolio = makePortfolio({
      lists: {
        sections: ['Core', 'Satellite', 'Cash'],
        themes: ['Tech', 'Health', 'Cash'],
        accounts: ['ISA'],
        themeSections: { Tech: 'Core', Health: 'Core', Cash: 'Cash' },
      },
      budgets: {
        sections: {},
        accounts: {},
        themes: {
          Tech: { percentOfSection: 60 },
          Health: { percentOfSection: 40 },
        },
      },
    });

    const result = getThemePercentagesInSection(portfolio, 'Core');
    expect(result.size).toBe(2);
    expect(result.get('Tech')).toBe(60);
    expect(result.get('Health')).toBe(40);
  });

  it('returns empty map for section with no themes', () => {
    const portfolio = makePortfolio();
    const result = getThemePercentagesInSection(portfolio, 'Nonexistent');
    expect(result.size).toBe(0);
  });
});

describe('getHoldingPercentagesInTheme', () => {
  it('returns holdings with targetPct in a theme', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ id: 'h1', theme: 'Tech', targetPct: 60 }),
        createHolding({ id: 'h2', theme: 'Tech', targetPct: 40 }),
        createHolding({ id: 'h3', theme: 'Health', targetPct: 100 }),
      ],
    });

    const result = getHoldingPercentagesInTheme(portfolio, 'Tech');
    expect(result.size).toBe(2);
    expect(result.get('h1')).toBe(60);
    expect(result.get('h2')).toBe(40);
  });

  it('skips holdings without targetPct', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ id: 'h1', theme: 'Tech', targetPct: 60 }),
        createHolding({ id: 'h2', theme: 'Tech' }), // no targetPct
      ],
    });

    const result = getHoldingPercentagesInTheme(portfolio, 'Tech');
    expect(result.size).toBe(1);
  });
});

describe('preserveThemeRatiosOnSectionChange', () => {
  it('scales theme percentOfSection when section changes', () => {
    const portfolio = makePortfolio({
      lists: {
        sections: ['Core', 'Cash'],
        themes: ['Tech', 'Health', 'Cash'],
        accounts: ['ISA'],
        themeSections: { Tech: 'Core', Health: 'Core', Cash: 'Cash' },
      },
      budgets: {
        sections: {},
        accounts: {},
        themes: {
          Tech: { percentOfSection: 60 },
          Health: { percentOfSection: 40 },
        },
      },
    });

    const result = preserveThemeRatiosOnSectionChange(portfolio, 'Core', 50, 80);
    expect(result.budgets.themes.Tech.percentOfSection).toBeCloseTo(96, 0);
    expect(result.budgets.themes.Health.percentOfSection).toBe(64);
  });

  it('returns portfolio unchanged when no themes in section', () => {
    const portfolio = makePortfolio();
    const result = preserveThemeRatiosOnSectionChange(portfolio, 'Satellite', 50, 80);
    expect(result).toBe(portfolio);
  });

  it('returns portfolio unchanged when old percent is 0', () => {
    const portfolio = makePortfolio({
      lists: {
        sections: ['Core', 'Cash'],
        themes: ['Tech', 'Cash'],
        accounts: ['ISA'],
        themeSections: { Tech: 'Core', Cash: 'Cash' },
      },
      budgets: {
        sections: {},
        accounts: {},
        themes: { Tech: { percentOfSection: 60 } },
      },
    });
    const result = preserveThemeRatiosOnSectionChange(portfolio, 'Core', 0, 80);
    expect(result).toBe(portfolio);
  });
});

describe('preserveHoldingRatiosOnThemeChange', () => {
  it('scales holding targetPcts when theme changes', () => {
    const portfolio = makePortfolio({
      holdings: [
        createHolding({ id: 'h1', theme: 'Tech', targetPct: 60 }),
        createHolding({ id: 'h2', theme: 'Tech', targetPct: 40 }),
      ],
    });

    const result = preserveHoldingRatiosOnThemeChange(portfolio, 'Tech', 50, 80);
    const h1 = result.holdings.find((h) => h.id === 'h1')!;
    const h2 = result.holdings.find((h) => h.id === 'h2')!;
    expect(h1.targetPct).toBe(96);
    expect(h2.targetPct).toBe(64);
  });

  it('returns portfolio unchanged when no holdings in theme', () => {
    const portfolio = makePortfolio();
    const result = preserveHoldingRatiosOnThemeChange(portfolio, 'Tech', 50, 80);
    expect(result).toBe(portfolio);
  });
});

describe('calculateSectionCurrentPercent', () => {
  it('returns percent when set', () => {
    expect(calculateSectionCurrentPercent({ percent: 60 }, 10000)).toBe(60);
  });

  it('calculates from amount and total', () => {
    expect(calculateSectionCurrentPercent({ amount: 5000 }, 10000)).toBe(50);
  });

  it('returns 0 when no budget', () => {
    expect(calculateSectionCurrentPercent(undefined, 10000)).toBe(0);
  });

  it('returns 0 when total is 0', () => {
    expect(calculateSectionCurrentPercent({ amount: 5000 }, 0)).toBe(0);
  });
});

describe('calculateThemeCurrentPercent', () => {
  it('returns percentOfSection when set', () => {
    expect(calculateThemeCurrentPercent({ percentOfSection: 40 })).toBe(40);
  });

  it('returns 0 when no budget', () => {
    expect(calculateThemeCurrentPercent(undefined)).toBe(0);
  });

  it('returns 0 when no percentOfSection', () => {
    expect(calculateThemeCurrentPercent({ amount: 5000 })).toBe(0);
  });
});
