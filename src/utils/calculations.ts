export interface ValueInputs {
  price: number;
  qty: number;
}

export const calculateValue = ({ price, qty }: ValueInputs): number => price * qty;

export const calculateQtyFromValue = (value: number, price: number): number => {
  if (price <= 0) {
    return 0;
  }

  return value / price;
};

export const calculatePctOfTotal = (value: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return (value / total) * 100;
};

export interface TargetDeltaInput {
  value: number;
  total: number;
  targetPct?: number;
}

export interface TargetDeltaResult {
  valueDiff: number;
  pctDiff: number;
}

export const calculateTargetDelta = ({ value, total, targetPct }: TargetDeltaInput): TargetDeltaResult | undefined => {
  if (typeof targetPct !== 'number' || total <= 0) {
    return undefined;
  }

  const targetValue = (targetPct / 100) * total;
  const pctOfTotal = calculatePctOfTotal(value, total);

  return {
    valueDiff: value - targetValue,
    pctDiff: pctOfTotal - targetPct,
  };
};

export const roundToPennies = (value: number): number => Math.round(value * 100) / 100;

export const calculateValueForShare = (others: number, share: number): number => {
  if (!Number.isFinite(others) || !Number.isFinite(share) || share <= 0) {
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
  if (!Number.isFinite(lockedTotal) || !Number.isFinite(nonCashTotal)) {
    return 0;
  }

  return roundToPennies(lockedTotal - nonCashTotal);
};
