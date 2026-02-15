import { describe, it, expect } from 'vitest';
import { diffHoldings, summarizeDiff } from './diff';
import { createHolding } from './factory';
import type { ExtractedHolding } from '@/types/import';

function makeHolding(overrides: Partial<Parameters<typeof createHolding>[0]> = {}) {
  return createHolding({
    section: 'Core',
    theme: 'All',
    assetType: 'ETF',
    name: 'Test',
    ticker: 'TEST',
    account: 'ISA',
    price: 100,
    qty: 10,
    include: true,
    ...overrides,
  });
}

function makeExtracted(overrides: Partial<ExtractedHolding> = {}): ExtractedHolding {
  return {
    ticker: 'TEST',
    name: 'Test',
    qty: 10,
    price: 100,
    assetType: 'ETF',
    account: 'ISA',
    ...overrides,
  };
}

describe('diffHoldings', () => {
  it('identifies new holdings', () => {
    const current = [makeHolding({ ticker: 'AAPL', name: 'Apple' })];
    const extracted = [
      makeExtracted({ ticker: 'AAPL', name: 'Apple' }),
      makeExtracted({ ticker: 'MSFT', name: 'Microsoft', price: 400, qty: 5 }),
    ];

    const diffs = diffHoldings(current, extracted);
    const newDiffs = diffs.filter((d) => d.type === 'new');
    expect(newDiffs).toHaveLength(1);
    expect(newDiffs[0].extracted.ticker).toBe('MSFT');
    expect(newDiffs[0].accepted).toBe(true);
  });

  it('identifies changed holdings (qty)', () => {
    const current = [makeHolding({ ticker: 'VWRL', name: 'Vanguard', qty: 100 })];
    const extracted = [makeExtracted({ ticker: 'VWRL', name: 'Vanguard', qty: 120 })];

    const diffs = diffHoldings(current, extracted);
    const changed = diffs.filter((d) => d.type === 'changed');
    expect(changed).toHaveLength(1);
    expect(changed[0].changes?.qty).toEqual({ old: 100, new: 120 });
  });

  it('identifies changed holdings (price)', () => {
    const current = [makeHolding({ ticker: 'AAPL', name: 'Apple', price: 180 })];
    const extracted = [makeExtracted({ ticker: 'AAPL', name: 'Apple', price: 195 })];

    const diffs = diffHoldings(current, extracted);
    const changed = diffs.filter((d) => d.type === 'changed');
    expect(changed).toHaveLength(1);
    expect(changed[0].changes?.price).toEqual({ old: 180, new: 195 });
  });

  it('identifies unchanged holdings', () => {
    const current = [makeHolding({ ticker: 'VUSA', name: 'S&P 500', price: 65, qty: 50 })];
    const extracted = [makeExtracted({ ticker: 'VUSA', name: 'S&P 500', price: 65, qty: 50 })];

    const diffs = diffHoldings(current, extracted);
    expect(diffs[0].type).toBe('unchanged');
    expect(diffs[0].accepted).toBe(false);
  });

  it('matches tickers case-insensitively', () => {
    const current = [makeHolding({ ticker: 'vusa.l', name: 'Vanguard' })];
    const extracted = [makeExtracted({ ticker: 'VUSA.L', name: 'Vanguard', qty: 20 })];

    const diffs = diffHoldings(current, extracted);
    expect(diffs.filter((d) => d.type === 'new')).toHaveLength(0);
    expect(diffs.filter((d) => d.type === 'changed')).toHaveLength(1);
  });

  it('handles empty current portfolio', () => {
    const extracted = [
      makeExtracted({ ticker: 'AAPL', name: 'Apple' }),
      makeExtracted({ ticker: 'MSFT', name: 'Microsoft' }),
    ];

    const diffs = diffHoldings([], extracted);
    expect(diffs.filter((d) => d.type === 'new')).toHaveLength(2);
  });

  it('handles empty extracted list', () => {
    const current = [makeHolding({ ticker: 'AAPL', name: 'Apple' })];
    const diffs = diffHoldings(current, []);
    expect(diffs).toHaveLength(0);
  });

  it('sorts: new → changed → removed → unchanged', () => {
    const current = [
      makeHolding({ ticker: 'KEEP', name: 'Keep', price: 10, qty: 5 }),
      makeHolding({ ticker: 'CHANGE', name: 'Change', qty: 10 }),
    ];
    const extracted = [
      makeExtracted({ ticker: 'NEW', name: 'New' }),
      makeExtracted({ ticker: 'KEEP', name: 'Keep', price: 10, qty: 5 }),
      makeExtracted({ ticker: 'CHANGE', name: 'Change', qty: 20 }),
    ];

    const diffs = diffHoldings(current, extracted);
    const types = diffs.map((d) => d.type);
    expect(types).toEqual(['new', 'changed', 'unchanged']);
  });
});

describe('summarizeDiff', () => {
  it('calculates summary correctly', () => {
    const current = [
      makeHolding({ ticker: 'AAPL', name: 'Apple', price: 180, qty: 10 }),
      makeHolding({ ticker: 'MSFT', name: 'Microsoft', price: 400, qty: 5 }),
    ];
    const extracted = [
      makeExtracted({ ticker: 'AAPL', name: 'Apple', price: 190, qty: 10 }),
      makeExtracted({ ticker: 'NEW', name: 'New Fund', price: 50, qty: 100 }),
    ];

    const diffs = diffHoldings(current, extracted);
    const summary = summarizeDiff(diffs);

    expect(summary.newCount).toBe(1);
    expect(summary.changedCount).toBe(1);
    expect(summary.unchangedCount).toBe(0);
  });

  it('handles all-new portfolio', () => {
    const extracted = [
      makeExtracted({ ticker: 'A', name: 'A', price: 10, qty: 10 }),
      makeExtracted({ ticker: 'B', name: 'B', price: 20, qty: 5 }),
    ];
    const diffs = diffHoldings([], extracted);
    const summary = summarizeDiff(diffs);

    expect(summary.newCount).toBe(2);
    expect(summary.estimatedValueChange).toBe(200); // 10*10 + 20*5
  });
});
