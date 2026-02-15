import { describe, it, expect } from 'vitest';
import {
  calculateValue,
  calculateQtyFromValue,
  calculatePctOfTotal,
  calculateLiveDelta,
  calculateTargetDelta,
  roundToPennies,
  calculateValueForShare,
  calculateCashBufferQty,
  calculateProfitLoss,
  validatePercentage,
  safeDivide,
  getEffectivePrice,
} from './calculations';

describe('calculateValue', () => {
  it('returns price * qty', () => {
    expect(calculateValue({ price: 10, qty: 5 })).toBe(50);
  });

  it('returns 0 for negative price', () => {
    expect(calculateValue({ price: -10, qty: 5 })).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(calculateValue({ price: NaN, qty: 5 })).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(calculateValue({ price: Infinity, qty: 5 })).toBe(0);
  });
});

describe('calculateQtyFromValue', () => {
  it('calculates quantity from value and price', () => {
    expect(calculateQtyFromValue(100, 10)).toBe(10);
  });

  it('returns 0 for zero price', () => {
    expect(calculateQtyFromValue(100, 0)).toBe(0);
  });

  it('returns 0 for negative value', () => {
    expect(calculateQtyFromValue(-100, 10)).toBe(0);
  });
});

describe('calculatePctOfTotal', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePctOfTotal(25, 100)).toBe(25);
  });

  it('returns 0 for zero total', () => {
    expect(calculatePctOfTotal(25, 0)).toBe(0);
  });

  it('returns 0 for negative total', () => {
    expect(calculatePctOfTotal(25, -100)).toBe(0);
  });

  it('returns 0 for negative value', () => {
    expect(calculatePctOfTotal(-25, 100)).toBe(0);
  });
});

describe('calculateLiveDelta', () => {
  it('calculates value and percentage difference', () => {
    const result = calculateLiveDelta({ currentValue: 110, previousValue: 100 });
    expect(result.valueDiff).toBe(10);
    expect(result.pctDiff).toBe(10);
  });

  it('handles negative delta', () => {
    const result = calculateLiveDelta({ currentValue: 90, previousValue: 100 });
    expect(result.valueDiff).toBe(-10);
    expect(result.pctDiff).toBe(-10);
  });

  it('returns zeros for invalid inputs', () => {
    const result = calculateLiveDelta({ currentValue: -1, previousValue: 100 });
    expect(result.valueDiff).toBe(0);
    expect(result.pctDiff).toBe(0);
  });

  it('returns 0 pctDiff when previousValue is 0', () => {
    const result = calculateLiveDelta({ currentValue: 100, previousValue: 0 });
    expect(result.valueDiff).toBe(100);
    expect(result.pctDiff).toBe(0);
  });
});

describe('calculateTargetDelta', () => {
  it('calculates delta using value/total/targetPct', () => {
    const result = calculateTargetDelta({ value: 30, total: 100, targetPct: 25 });
    expect(result).toBeDefined();
    expect(result!.valueDiff).toBe(5);
    expect(result!.pctDiff).toBe(5);
  });

  it('returns undefined for invalid inputs', () => {
    expect(calculateTargetDelta({ value: -1, total: 100, targetPct: 25 })).toBeUndefined();
    expect(calculateTargetDelta({ value: 30, total: 0, targetPct: 25 })).toBeUndefined();
    expect(calculateTargetDelta({ value: 30, total: 100, targetPct: NaN })).toBeUndefined();
  });

  it('calculates delta using currentValue/targetValue/totalValue', () => {
    const result = calculateTargetDelta({
      currentValue: 30,
      targetValue: 25,
      totalValue: 100,
      targetPct: 25,
    });
    expect(result).toBeDefined();
    expect(result!.valueDiff).toBe(5);
    expect(result!.currentPct).toBe(30);
  });

  it('returns undefined for invalid new-style inputs', () => {
    expect(
      calculateTargetDelta({ currentValue: -1, targetValue: 25, totalValue: 100 }),
    ).toBeUndefined();
  });
});

describe('roundToPennies', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundToPennies(1.234)).toBe(1.23);
    expect(roundToPennies(1.235)).toBe(1.24);
    // Note: IEEE 754 floating point means some .5 values round unexpectedly
    // e.g. 1.005 * 100 = 100.49999..., 1.025 * 100 = 102.49999...
    expect(roundToPennies(1.005)).toBe(1);
    expect(roundToPennies(1.045)).toBe(1.05);
  });

  it('returns 0 for NaN', () => {
    expect(roundToPennies(NaN)).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(roundToPennies(Infinity)).toBe(0);
  });
});

describe('calculateValueForShare', () => {
  it('calculates value for a given share', () => {
    const result = calculateValueForShare(100, 0.5);
    expect(result).toBe(100);
  });

  it('returns 0 for zero share', () => {
    expect(calculateValueForShare(100, 0)).toBe(0);
  });

  it('returns 0 for negative share', () => {
    expect(calculateValueForShare(100, -0.5)).toBe(0);
  });

  it('caps share at 0.999999', () => {
    const result = calculateValueForShare(100, 1.5);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateCashBufferQty', () => {
  it('calculates cash buffer as difference', () => {
    expect(calculateCashBufferQty({ lockedTotal: 10000, nonCashTotal: 8000 })).toBe(2000);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calculateCashBufferQty({ lockedTotal: -1, nonCashTotal: 0 })).toBe(0);
    expect(calculateCashBufferQty({ lockedTotal: 1000, nonCashTotal: -1 })).toBe(0);
  });
});

describe('calculateProfitLoss', () => {
  it('calculates profit/loss correctly', () => {
    const result = calculateProfitLoss({
      currentPrice: 110,
      avgCost: 100,
      quantity: 10,
    });
    expect(result.totalGain).toBe(100);
    expect(result.totalGainPercent).toBe(10);
    expect(result.costBasis).toBe(1000);
    expect(result.marketValue).toBe(1100);
    expect(result.dayChangeValue).toBe(0);
  });

  it('calculates day change', () => {
    const result = calculateProfitLoss({
      currentPrice: 110,
      avgCost: 100,
      quantity: 10,
      dayChange: 2,
      dayChangePercent: 1.85,
    });
    expect(result.dayChangeValue).toBe(20);
    expect(result.dayChangePercent).toBe(1.85);
  });

  it('handles zero quantity', () => {
    const result = calculateProfitLoss({
      currentPrice: 110,
      avgCost: 100,
      quantity: 0,
    });
    expect(result.totalGain).toBe(0);
    expect(result.totalGainPercent).toBe(0);
  });

  it('handles invalid inputs safely', () => {
    const result = calculateProfitLoss({
      currentPrice: NaN,
      avgCost: -1,
      quantity: Infinity,
    });
    expect(result.totalGain).toBe(0);
    expect(result.costBasis).toBe(0);
  });
});

describe('validatePercentage', () => {
  it('validates valid percentages', () => {
    expect(validatePercentage(0)).toBe(true);
    expect(validatePercentage(50)).toBe(true);
    expect(validatePercentage(100)).toBe(true);
  });

  it('rejects out-of-range percentages', () => {
    expect(validatePercentage(-1)).toBe(false);
    expect(validatePercentage(101)).toBe(false);
    expect(validatePercentage(NaN)).toBe(false);
  });

  it('disallows zero when allowZero is false', () => {
    expect(validatePercentage(0, false)).toBe(false);
    expect(validatePercentage(0.01, false)).toBe(true);
  });

  it('uses custom maxPercent', () => {
    expect(validatePercentage(150, true, 200)).toBe(true);
    expect(validatePercentage(201, true, 200)).toBe(false);
  });
});

describe('safeDivide', () => {
  it('divides correctly', () => {
    expect(safeDivide(10, 2)).toBe(5);
  });

  it('returns 0 for zero denominator', () => {
    expect(safeDivide(10, 0)).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(safeDivide(NaN, 2)).toBe(0);
    expect(safeDivide(10, NaN)).toBe(0);
  });
});

describe('getEffectivePrice', () => {
  it('uses live price when available', () => {
    const result = getEffectivePrice(105, 100);
    expect(result.price).toBe(105);
    expect(result.usedLivePrice).toBe(true);
  });

  it('falls back to manual price', () => {
    const result = getEffectivePrice(undefined, 100);
    expect(result.price).toBe(100);
    expect(result.usedLivePrice).toBe(false);
  });

  it('falls back to 0 for invalid manual price', () => {
    const result = getEffectivePrice(undefined, -10);
    expect(result.price).toBe(0);
    expect(result.usedLivePrice).toBe(false);
  });
});
