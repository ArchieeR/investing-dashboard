import { describe, expect, it } from 'vitest';
import {
  selectBreakdownByAccount,
  selectBreakdownBySection,
  selectBreakdownByTheme,
  selectHoldingsWithDerived,
  selectTotalValue,
} from '../src/state/selectors';
import { createEmptyPortfolio, type Holding } from '../src/state/types';

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

const buildPortfolio = (holdings: Holding[]) => {
  const portfolio = createEmptyPortfolio('portfolio-test', 'Test');
  portfolio.holdings = holdings;
  return portfolio;
};

describe('portfolio selectors', () => {
  it('calculates total value from included holdings only', () => {
    const portfolio = buildPortfolio([
      createHolding({ id: '1', price: 100, qty: 2 }),
      createHolding({ id: '2', price: 50, qty: 1 }),
      createHolding({ id: '3', price: 10, qty: 10, include: false }),
    ]);

    expect(selectTotalValue(portfolio)).toBe(250);
  });

  it('derives holding percentages and target deltas', () => {
    const portfolio = buildPortfolio([
      createHolding({ id: '1', price: 100, qty: 2, targetPct: 60 }),
      createHolding({ id: '2', price: 50, qty: 1, targetPct: 40 }),
    ]);

    const derived = selectHoldingsWithDerived(portfolio);
    const first = derived.find((item) => item.holding.id === '1');
    const second = derived.find((item) => item.holding.id === '2');

    expect(first?.value).toBe(200);
    expect(first?.pctOfTotal).toBeCloseTo(80, 5);
    expect(first?.pctOfSection).toBeCloseTo(80, 5);
    expect(first?.sectionTotal).toBeCloseTo(250, 5);
    expect(first?.targetValueDiff).toBeCloseTo(200 - 0.6 * 250, 5);
    expect(first?.targetPctDiff).toBeCloseTo(80 - 60, 5);

    expect(second?.value).toBe(50);
    expect(second?.pctOfTotal).toBeCloseTo(20, 5);
    expect(second?.pctOfSection).toBeCloseTo(20, 5);
    expect(second?.sectionTotal).toBeCloseTo(250, 5);
    expect(second?.targetValueDiff).toBeCloseTo(50 - 0.4 * 250, 5);
    expect(second?.targetPctDiff).toBeCloseTo(20 - 40, 5);
  });

  it('ignores excluded holdings in breakdown aggregations', () => {
    const portfolio = buildPortfolio([
      createHolding({ id: '1', section: 'Core', account: 'ISA', theme: 'Equities', price: 100, qty: 1 }),
      createHolding({ id: '2', section: 'Satellite', account: 'GIA', theme: 'Bonds', price: 50, qty: 2 }),
      createHolding({ id: '3', section: 'Core', account: 'ISA', theme: 'Equities', price: 10, qty: 5, include: false }),
    ]);

    const sectionBreakdown = selectBreakdownBySection(portfolio);
    const accountBreakdown = selectBreakdownByAccount(portfolio);
    const themeBreakdown = selectBreakdownByTheme(portfolio);

    expect(sectionBreakdown).toHaveLength(2);
    const core = sectionBreakdown.find((row) => row.label === 'Core');
    const satellite = sectionBreakdown.find((row) => row.label === 'Satellite');
    expect(core?.value).toBe(100);
    expect(satellite?.value).toBe(100);
    expect((core?.percentage ?? 0) + (satellite?.percentage ?? 0)).toBeCloseTo(100, 5);

    expect(accountBreakdown).toHaveLength(2);
    expect(accountBreakdown.find((row) => row.label === 'ISA')?.value).toBe(100);
    expect(themeBreakdown.find((row) => row.label === 'Equities')?.value).toBe(100);
  });

  it('sets percentages to zero for excluded holdings', () => {
    const portfolio = buildPortfolio([
      createHolding({ id: '1', price: 100, qty: 1, include: false, targetPct: 50 }),
    ]);

    const [derived] = selectHoldingsWithDerived(portfolio);
    expect(derived.holding.include).toBe(false);
    expect(derived.pctOfTotal).toBe(0);
    expect(derived.pctOfSection).toBe(0);
    expect(derived.targetValueDiff).toBeUndefined();
    expect(derived.targetPctDiff).toBeUndefined();
  });

  it('omits target deltas when total is zero', () => {
    const portfolio = buildPortfolio([
      createHolding({ id: '1', price: 0, qty: 0, include: true, targetPct: 20 }),
    ]);

    const [derived] = selectHoldingsWithDerived(portfolio);
    expect(derived.value).toBe(0);
    expect(derived.targetValueDiff).toBeUndefined();
    expect(derived.targetPctDiff).toBeUndefined();
  });

  it('calculates profit/loss data when avgCost is available', () => {
    const portfolio = buildPortfolio([
      createHolding({ 
        id: '1', 
        price: 100, 
        livePrice: 120, 
        avgCost: 90, 
        qty: 10, 
        include: true,
        dayChange: 5,
        dayChangePercent: 4.35
      }),
    ]);

    const derived = selectHoldingsWithDerived(portfolio);
    const profitLoss = derived[0].profitLoss;
    
    expect(profitLoss).toBeDefined();
    expect(profitLoss!.costBasis).toBe(900); // 90 * 10
    expect(profitLoss!.marketValue).toBe(1200); // 120 * 10
    expect(profitLoss!.totalGain).toBe(300); // 1200 - 900
    expect(profitLoss!.totalGainPercent).toBe(33.33); // (300 / 900) * 100, rounded
    expect(profitLoss!.dayChangeValue).toBe(50); // 5 * 10
    expect(profitLoss!.dayChangePercent).toBe(4.35);
  });

  it('omits profit/loss data when avgCost is not available', () => {
    const portfolio = buildPortfolio([
      {
        id: '1',
        section: 'Core',
        theme: 'Equities',
        assetType: 'ETF',
        name: 'Test Asset',
        ticker: 'TEST',
        exchange: 'LSE',
        account: 'ISA',
        price: 100,
        livePrice: 120,
        qty: 10,
        include: true,
        // avgCost is explicitly undefined
        avgCost: undefined,
      },
    ]);

    const derived = selectHoldingsWithDerived(portfolio);
    expect(derived[0].profitLoss).toBeUndefined();
  });

  it('omits profit/loss data when quantity is zero', () => {
    const portfolio = buildPortfolio([
      createHolding({ 
        id: '1', 
        price: 100, 
        avgCost: 90, 
        qty: 0, 
        include: true
      }),
    ]);

    const derived = selectHoldingsWithDerived(portfolio);
    expect(derived[0].profitLoss).toBeUndefined();
  });
});
