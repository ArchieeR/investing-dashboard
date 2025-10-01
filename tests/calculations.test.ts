import { describe, expect, it } from 'vitest';
import {
  calculateCashBufferQty,
  calculateLiveDelta,
  calculatePctOfTotal,
  calculateProfitLoss,
  calculateQtyFromValue,
  calculateTargetDelta,
  calculateValue,
  calculateValueForShare,
  getEffectivePrice,
  roundToPennies,
  safeDivide,
  validatePercentage,
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

describe('profit/loss calculations', () => {
  it('calculates basic profit/loss with gain', () => {
    const result = calculateProfitLoss({
      currentPrice: 120,
      avgCost: 100,
      quantity: 10,
    });

    expect(result.costBasis).toBe(1000); // 100 * 10
    expect(result.marketValue).toBe(1200); // 120 * 10
    expect(result.totalGain).toBe(200); // 1200 - 1000
    expect(result.totalGainPercent).toBe(20); // (200 / 1000) * 100
    expect(result.dayChangeValue).toBe(0); // No day change provided
    expect(result.dayChangePercent).toBe(0);
  });

  it('calculates basic profit/loss with loss', () => {
    const result = calculateProfitLoss({
      currentPrice: 80,
      avgCost: 100,
      quantity: 5,
    });

    expect(result.costBasis).toBe(500); // 100 * 5
    expect(result.marketValue).toBe(400); // 80 * 5
    expect(result.totalGain).toBe(-100); // 400 - 500
    expect(result.totalGainPercent).toBe(-20); // (-100 / 500) * 100
  });

  it('includes day change calculations when provided', () => {
    const result = calculateProfitLoss({
      currentPrice: 105,
      avgCost: 100,
      quantity: 10,
      dayChange: 2.5, // Price increased by 2.5 per share today
      dayChangePercent: 2.44, // 2.44% increase
    });

    expect(result.dayChangeValue).toBe(25); // 2.5 * 10 shares
    expect(result.dayChangePercent).toBe(2.44);
    expect(result.totalGain).toBe(50); // (105 - 100) * 10
    expect(result.totalGainPercent).toBe(5); // (50 / 1000) * 100
  });

  it('handles zero cost basis gracefully', () => {
    const result = calculateProfitLoss({
      currentPrice: 50,
      avgCost: 0,
      quantity: 10,
    });

    expect(result.costBasis).toBe(0);
    expect(result.marketValue).toBe(500);
    expect(result.totalGain).toBe(500);
    expect(result.totalGainPercent).toBe(0); // Avoid division by zero
  });

  it('handles zero quantity gracefully', () => {
    const result = calculateProfitLoss({
      currentPrice: 100,
      avgCost: 90,
      quantity: 0,
    });

    expect(result.costBasis).toBe(0);
    expect(result.marketValue).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.totalGainPercent).toBe(0);
  });

  it('validates and sanitizes invalid inputs', () => {
    const result = calculateProfitLoss({
      currentPrice: -10, // Invalid negative price
      avgCost: Number.NaN, // Invalid NaN
      quantity: -5, // Invalid negative quantity
      dayChange: Number.POSITIVE_INFINITY, // Invalid infinity
    });

    expect(result.costBasis).toBe(0);
    expect(result.marketValue).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.totalGainPercent).toBe(0);
    expect(result.dayChangeValue).toBe(0);
    expect(result.dayChangePercent).toBe(0);
  });

  it('rounds results to pennies for currency precision', () => {
    const result = calculateProfitLoss({
      currentPrice: 33.333,
      avgCost: 30.666,
      quantity: 3,
      dayChange: 1.111,
    });

    expect(result.costBasis).toBe(92); // 30.666 * 3 = 91.998, rounded to 92
    expect(result.marketValue).toBe(100); // 33.333 * 3 = 99.999, rounded to 100
    expect(result.totalGain).toBe(8); // 100 - 92 = 8
    expect(result.dayChangeValue).toBe(3.33); // 1.111 * 3 = 3.333, rounded to 3.33
  });
});

describe('new calculation utilities', () => {
  it('calculates live deltas between current and previous values', () => {
    const result = calculateLiveDelta({ currentValue: 1050, previousValue: 1000 });
    expect(result.valueDiff).toBe(50);
    expect(result.pctDiff).toBe(5);

    // Test with loss
    const lossResult = calculateLiveDelta({ currentValue: 950, previousValue: 1000 });
    expect(lossResult.valueDiff).toBe(-50);
    expect(lossResult.pctDiff).toBe(-5);

    // Test division by zero
    const zeroResult = calculateLiveDelta({ currentValue: 100, previousValue: 0 });
    expect(zeroResult.valueDiff).toBe(100);
    expect(zeroResult.pctDiff).toBe(0);
  });

  it('validates percentages within reasonable bounds', () => {
    expect(validatePercentage(50)).toBe(true);
    expect(validatePercentage(0)).toBe(true);
    expect(validatePercentage(100)).toBe(true);
    expect(validatePercentage(-5)).toBe(false);
    expect(validatePercentage(150)).toBe(false);
    expect(validatePercentage(NaN)).toBe(false);
    expect(validatePercentage(Infinity)).toBe(false);

    // Test with custom bounds
    expect(validatePercentage(0, false)).toBe(false); // Don't allow zero
    expect(validatePercentage(50, true, 40)).toBe(false); // Max 40%
  });

  it('safely divides numbers with zero handling', () => {
    expect(safeDivide(100, 20)).toBe(5);
    expect(safeDivide(100, 0)).toBe(0);
    expect(safeDivide(100, NaN)).toBe(0);
    expect(safeDivide(NaN, 20)).toBe(0);
    expect(safeDivide(-100, 20)).toBe(-5);
  });

  it('determines effective price with live price priority', () => {
    // Live price available
    const liveResult = getEffectivePrice(105.50, 100);
    expect(liveResult.price).toBe(105.50);
    expect(liveResult.usedLivePrice).toBe(true);

    // No live price, use manual
    const manualResult = getEffectivePrice(undefined, 100);
    expect(manualResult.price).toBe(100);
    expect(manualResult.usedLivePrice).toBe(false);

    // Invalid live price, use manual
    const invalidResult = getEffectivePrice(NaN, 100);
    expect(invalidResult.price).toBe(100);
    expect(invalidResult.usedLivePrice).toBe(false);

    // Negative live price, use manual
    const negativeResult = getEffectivePrice(-5, 100);
    expect(negativeResult.price).toBe(100);
    expect(negativeResult.usedLivePrice).toBe(false);
  });

  it('supports both legacy and new target delta interfaces', () => {
    // Legacy interface
    const legacyResult = calculateTargetDelta({ value: 120, total: 200, targetPct: 50 });
    expect(legacyResult?.valueDiff).toBeCloseTo(20, 5);
    expect(legacyResult?.pctDiff).toBeCloseTo(10, 5); // 60% - 50%

    // New interface
    const newResult = calculateTargetDelta({ 
      currentValue: 1000, 
      targetValue: 1500, 
      totalValue: 10000, 
      targetPct: 15 
    });
    expect(newResult?.valueDiff).toBe(-500);
    expect(newResult?.pctDiff).toBe(-5); // 10% - 15%
    expect(newResult?.currentPct).toBe(10);
  });
});
