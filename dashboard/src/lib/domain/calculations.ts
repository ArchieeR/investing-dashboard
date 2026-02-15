// =============================================================================
// Portfolio Calculations - Pure functions for financial math
// =============================================================================

export interface ValueInputs {
  price: number;
  qty: number;
}

export const calculateValue = ({ price, qty }: ValueInputs): number => {
  if (!Number.isFinite(price) || !Number.isFinite(qty) || price < 0 || qty < 0) {
    return 0;
  }
  return price * qty;
};

export const calculateQtyFromValue = (value: number, price: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(price) || value < 0 || price <= 0) {
    return 0;
  }
  return value / price;
};

export const calculatePctOfTotal = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0 || value < 0) {
    return 0;
  }
  return (value / total) * 100;
};

export interface LiveDeltaInput {
  currentValue: number;
  previousValue: number;
}

export interface LiveDeltaResult {
  valueDiff: number;
  pctDiff: number;
}

export const calculateLiveDelta = ({
  currentValue,
  previousValue,
}: LiveDeltaInput): LiveDeltaResult => {
  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue) ||
    currentValue < 0 ||
    previousValue < 0
  ) {
    return { valueDiff: 0, pctDiff: 0 };
  }

  const valueDiff = currentValue - previousValue;
  const pctDiff = previousValue > 0 ? (valueDiff / previousValue) * 100 : 0;

  return {
    valueDiff: roundToPennies(valueDiff),
    pctDiff: roundToPennies(pctDiff),
  };
};

export interface TargetDeltaInput {
  value?: number;
  total?: number;
  currentValue?: number;
  targetValue?: number;
  totalValue?: number;
  targetPct?: number;
}

export interface TargetDeltaResult {
  valueDiff: number;
  pctDiff: number;
  currentPct?: number;
}

export const calculateTargetDelta = (input: TargetDeltaInput): TargetDeltaResult | undefined => {
  if (input.value !== undefined && input.total !== undefined) {
    const { value, total, targetPct } = input;

    if (
      !Number.isFinite(value) ||
      !Number.isFinite(total) ||
      value < 0 ||
      total <= 0 ||
      typeof targetPct !== 'number' ||
      !Number.isFinite(targetPct) ||
      targetPct < 0
    ) {
      return undefined;
    }

    const targetValue = (targetPct / 100) * total;
    const currentPct = calculatePctOfTotal(value, total);

    return {
      valueDiff: roundToPennies(value - targetValue),
      pctDiff: roundToPennies(currentPct - targetPct),
    };
  }

  const { currentValue, targetValue, totalValue, targetPct } = input;

  if (
    currentValue === undefined ||
    targetValue === undefined ||
    totalValue === undefined ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(targetValue) ||
    !Number.isFinite(totalValue) ||
    currentValue < 0 ||
    targetValue < 0 ||
    totalValue <= 0 ||
    (targetPct !== undefined && (!Number.isFinite(targetPct) || targetPct < 0))
  ) {
    return undefined;
  }

  const valueDiff = currentValue - targetValue;
  const currentPct = calculatePctOfTotal(currentValue, totalValue);
  const pctDiff = targetPct !== undefined ? currentPct - targetPct : 0;

  return {
    valueDiff: roundToPennies(valueDiff),
    pctDiff: roundToPennies(pctDiff),
    currentPct: roundToPennies(currentPct),
  };
};

export const roundToPennies = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

export const calculateValueForShare = (others: number, share: number): number => {
  if (!Number.isFinite(others) || !Number.isFinite(share) || share <= 0 || others < 0) {
    return 0;
  }

  const boundedShare = Math.min(share, 0.999999);
  if (boundedShare === 0) {
    return 0;
  }

  const nonNegativeOthers = Math.max(others, 0);
  return (boundedShare * nonNegativeOthers) / (1 - boundedShare);
};

export const calculateCashBufferQty = ({
  lockedTotal,
  nonCashTotal,
}: {
  lockedTotal: number;
  nonCashTotal: number;
}): number => {
  if (
    !Number.isFinite(lockedTotal) ||
    !Number.isFinite(nonCashTotal) ||
    lockedTotal < 0 ||
    nonCashTotal < 0
  ) {
    return 0;
  }
  return roundToPennies(lockedTotal - nonCashTotal);
};

export interface ProfitLossInput {
  currentPrice: number;
  avgCost: number;
  quantity: number;
  dayChange?: number;
  dayChangePercent?: number;
}

export interface ProfitLossResult {
  totalGain: number;
  totalGainPercent: number;
  dayChangeValue: number;
  dayChangePercent: number;
  costBasis: number;
  marketValue: number;
}

export const calculateProfitLoss = ({
  currentPrice,
  avgCost,
  quantity,
  dayChange = 0,
  dayChangePercent = 0,
}: ProfitLossInput): ProfitLossResult => {
  const safeCurrentPrice = Number.isFinite(currentPrice) && currentPrice >= 0 ? currentPrice : 0;
  const safeAvgCost = Number.isFinite(avgCost) && avgCost >= 0 ? avgCost : 0;
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
  const safeDayChange = Number.isFinite(dayChange) ? dayChange : 0;
  const safeDayChangePercent = Number.isFinite(dayChangePercent) ? dayChangePercent : 0;

  const costBasis = safeAvgCost * safeQuantity;
  const marketValue = safeCurrentPrice * safeQuantity;
  const totalGain = marketValue - costBasis;
  const totalGainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;
  const dayChangeValue = safeDayChange * safeQuantity;

  return {
    totalGain: roundToPennies(totalGain),
    totalGainPercent: roundToPennies(totalGainPercent),
    dayChangeValue: roundToPennies(dayChangeValue),
    dayChangePercent: safeDayChangePercent,
    costBasis: roundToPennies(costBasis),
    marketValue: roundToPennies(marketValue),
  };
};

export const validatePercentage = (
  percentage: number,
  allowZero: boolean = true,
  maxPercent: number = 100,
): boolean => {
  if (!Number.isFinite(percentage)) {
    return false;
  }
  const minPercent = allowZero ? 0 : 0.01;
  return percentage >= minPercent && percentage <= maxPercent;
};

export const safeDivide = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return numerator / denominator;
};

export const getEffectivePrice = (
  livePrice: number | undefined,
  manualPrice: number,
): { price: number; usedLivePrice: boolean } => {
  const hasValidLivePrice =
    livePrice !== undefined && Number.isFinite(livePrice) && livePrice >= 0;
  const safeManualPrice = Number.isFinite(manualPrice) && manualPrice >= 0 ? manualPrice : 0;

  if (hasValidLivePrice) {
    return { price: livePrice, usedLivePrice: true };
  }

  return { price: safeManualPrice, usedLivePrice: false };
};
