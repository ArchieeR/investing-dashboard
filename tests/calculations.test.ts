import { describe, expect, it } from 'vitest';
import {
  calculateCashBufferQty,
  calculatePctOfTotal,
  calculateQtyFromValue,
  calculateTargetDelta,
  calculateValue,
  calculateValueForShare,
  roundToPennies,
} from '../src/utils/calculations';

describe('calculations utilities', () => {
  it('computes value as price multiplied by quantity', () => {
    expect(calculateValue({ price: 12.5, qty: 3 })).toBeCloseTo(37.5, 5);
  });

  it('back-solves quantity from value and price, returning 0 when price is non-positive', () => {
    expect(calculateQtyFromValue(200, 50)).toBe(4);
    expect(calculateQtyFromValue(200, 0)).toBe(0);
  });

  it('calculates percentage of total and guards against zero totals', () => {
    expect(calculatePctOfTotal(50, 200)).toBeCloseTo(25, 5);
    expect(calculatePctOfTotal(50, 0)).toBe(0);
  });

  it('derives target deltas only when inputs are valid', () => {
    const result = calculateTargetDelta({ value: 120, total: 200, targetPct: 50 });
    expect(result?.valueDiff).toBeCloseTo(20, 5);
    expect(result?.pctDiff).toBeCloseTo(60 - 50, 5);

    expect(calculateTargetDelta({ value: 100, total: 0, targetPct: 50 })).toBeUndefined();
    expect(calculateTargetDelta({ value: 100, total: 200 })).toBeUndefined();
  });

  it('computes value required to hit a desired share of a pool', () => {
    expect(calculateValueForShare(400, 0.25)).toBeCloseTo(133.33, 2);
    expect(calculateValueForShare(0, 0.5)).toBe(0);
    expect(calculateValueForShare(400, 0)).toBe(0);
  });

  it('rounds values to pennies for cash buffer management', () => {
    expect(roundToPennies(12.345)).toBe(12.35);
    expect(roundToPennies(12.344)).toBe(12.34);
  });

  it('calculates cash buffer quantity clamped to pennies and handles invalid numbers', () => {
    expect(calculateCashBufferQty({ lockedTotal: 1000, nonCashTotal: 750.125 })).toBe(249.88);
    expect(calculateCashBufferQty({ lockedTotal: Number.NaN, nonCashTotal: 10 })).toBe(0);
  });
});
