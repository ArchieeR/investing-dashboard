export interface ValueInputs {
  price: number;
  qty: number;
}

/**
 * Calculates the total value of a holding based on price and quantity.
 * Used for both live and manual value calculations.
 * 
 * @param inputs Object containing price and quantity
 * @returns Total value (price × quantity), returns 0 if inputs are invalid
 * 
 * @example
 * // Calculate value for 100 shares at $50 each
 * calculateValue({ price: 50, qty: 100 }) // Returns 5000
 */
export const calculateValue = ({ price, qty }: ValueInputs): number => {
  // Validate inputs - return 0 for invalid or negative values
  if (!Number.isFinite(price) || !Number.isFinite(qty) || price < 0 || qty < 0) {
    return 0;
  }
  
  return price * qty;
};

/**
 * Calculates the quantity needed to achieve a target value at a given price.
 * Used for portfolio rebalancing and target allocation calculations.
 * 
 * @param value Target value to achieve
 * @param price Price per unit
 * @returns Quantity needed, returns 0 if price is invalid or zero
 * 
 * @example
 * // How many shares at $50 to get $5000 value?
 * calculateQtyFromValue(5000, 50) // Returns 100
 */
export const calculateQtyFromValue = (value: number, price: number): number => {
  // Validate inputs - return 0 for invalid, negative, or zero values
  if (!Number.isFinite(value) || !Number.isFinite(price) || value < 0 || price <= 0) {
    return 0;
  }

  return value / price;
};

/**
 * Calculates what percentage a value represents of a total.
 * Used for live portfolio percentage calculations (portfolio, section, theme percentages).
 * Handles division by zero gracefully by returning 0.
 * 
 * @param value The part value
 * @param total The total value
 * @returns Percentage (0-100), returns 0 if total is zero or invalid
 * 
 * @example
 * // What percentage is $1000 of $10000?
 * calculatePctOfTotal(1000, 10000) // Returns 10
 */
export const calculatePctOfTotal = (value: number, total: number): number => {
  // Validate inputs and handle division by zero
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

/**
 * Calculates the difference between current and previous live values.
 * Used for tracking changes in live portfolio values (day change, etc.).
 * This is independent of target calculations and only deals with actual market values.
 * 
 * @param input Object containing current and previous live values
 * @returns Delta calculations, returns zero values if inputs are invalid
 * 
 * @example
 * // Stock went from $100 to $105
 * calculateLiveDelta({ currentValue: 1050, previousValue: 1000 })
 * // Returns { valueDiff: 50, pctDiff: 5 }
 */
export const calculateLiveDelta = ({ currentValue, previousValue }: LiveDeltaInput): LiveDeltaResult => {
  // Validate inputs
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || 
      currentValue < 0 || previousValue < 0) {
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
  // Support both old and new interfaces for backward compatibility
  value?: number;          // Legacy: current value (deprecated, use currentValue)
  total?: number;          // Legacy: total portfolio value (deprecated, use totalValue)
  currentValue?: number;   // New: current value of holding
  targetValue?: number;    // New: calculated target value
  totalValue?: number;     // New: total portfolio value
  targetPct?: number;      // Target percentage (0-100)
}

export interface TargetDeltaResult {
  valueDiff: number;
  pctDiff: number;
  currentPct?: number;     // Only available in new interface
}

/**
 * Calculates the difference between current live value and target allocation.
 * Used for target portfolio planning and rebalancing calculations.
 * This is independent of live price changes and only deals with allocation targets.
 * 
 * Supports both legacy interface (value, total, targetPct) and new interface 
 * (currentValue, targetValue, totalValue, targetPct) for backward compatibility.
 * 
 * @param input Object containing target delta calculation parameters
 * @returns Target delta calculations, returns undefined if target data is invalid
 * 
 * @example
 * // Legacy interface: value and total with target percentage
 * calculateTargetDelta({ value: 120, total: 200, targetPct: 50 })
 * 
 * @example  
 * // New interface: explicit current and target values
 * calculateTargetDelta({ 
 *   currentValue: 1000, 
 *   targetValue: 1500, 
 *   totalValue: 10000, 
 *   targetPct: 15 
 * })
 */
export const calculateTargetDelta = (input: TargetDeltaInput): TargetDeltaResult | undefined => {
  // Handle legacy interface (value, total, targetPct)
  if (input.value !== undefined && input.total !== undefined) {
    const { value, total, targetPct } = input;
    
    // Validate legacy inputs
    if (!Number.isFinite(value) || !Number.isFinite(total) || value < 0 || total <= 0 ||
        typeof targetPct !== 'number' || !Number.isFinite(targetPct) || targetPct < 0) {
      return undefined;
    }

    const targetValue = (targetPct / 100) * total;
    const currentPct = calculatePctOfTotal(value, total);

    return {
      valueDiff: roundToPennies(value - targetValue),
      pctDiff: roundToPennies(currentPct - targetPct),
    };
  }

  // Handle new interface (currentValue, targetValue, totalValue, targetPct)
  const { currentValue, targetValue, totalValue, targetPct } = input;
  
  // Validate new interface inputs
  if (currentValue === undefined || targetValue === undefined || totalValue === undefined ||
      !Number.isFinite(currentValue) || !Number.isFinite(targetValue) || !Number.isFinite(totalValue) ||
      currentValue < 0 || targetValue < 0 || totalValue <= 0 ||
      (targetPct !== undefined && (!Number.isFinite(targetPct) || targetPct < 0))) {
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

/**
 * Rounds a number to two decimal places (pennies).
 * Used throughout the application to ensure consistent currency formatting.
 * 
 * @param value Number to round
 * @returns Number rounded to 2 decimal places, returns 0 if input is invalid
 * 
 * @example
 * roundToPennies(123.456) // Returns 123.46
 */
export const roundToPennies = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

/**
 * Calculates the value needed for a specific share/percentage of a total.
 * Used for allocation calculations where you want to achieve a certain percentage.
 * Handles edge cases like 100% share and negative values gracefully.
 * 
 * @param others The value of all other holdings
 * @param share The desired share as a decimal (0.1 for 10%)
 * @returns Value needed to achieve the desired share, returns 0 for invalid inputs
 * 
 * @example
 * // To get 20% of portfolio when others total $8000
 * calculateValueForShare(8000, 0.2) // Returns 2000
 */
export const calculateValueForShare = (others: number, share: number): number => {
  // Validate inputs
  if (!Number.isFinite(others) || !Number.isFinite(share) || share <= 0 || others < 0) {
    return 0;
  }

  // Prevent division by zero by capping share just under 100%
  const boundedShare = Math.min(share, 0.999999);
  if (boundedShare === 0) {
    return 0;
  }

  const nonNegativeOthers = Math.max(others, 0);
  return (boundedShare * nonNegativeOthers) / (1 - boundedShare);
};

/**
 * Calculates the cash buffer quantity needed to balance locked and non-cash totals.
 * Used for portfolio cash management and allocation balancing.
 * 
 * @param params Object containing locked total and non-cash total values
 * @returns Cash buffer quantity needed, returns 0 if inputs are invalid
 * 
 * @example
 * // Need $2000 cash buffer when locked total is $10000 and non-cash is $8000
 * calculateCashBufferQty({ lockedTotal: 10000, nonCashTotal: 8000 }) // Returns 2000
 */
export const calculateCashBufferQty = ({
  lockedTotal,
  nonCashTotal,
}: {
  lockedTotal: number;
  nonCashTotal: number;
}): number => {
  // Validate inputs
  if (!Number.isFinite(lockedTotal) || !Number.isFinite(nonCashTotal) || 
      lockedTotal < 0 || nonCashTotal < 0) {
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
  /** Total gain/loss in absolute currency terms */
  totalGain: number;
  /** Total gain/loss as percentage of cost basis */
  totalGainPercent: number;
  /** Day change in absolute currency terms */
  dayChangeValue: number;
  /** Day change as percentage */
  dayChangePercent: number;
  /** Cost basis (avgCost × quantity) */
  costBasis: number;
  /** Current market value (currentPrice × quantity) */
  marketValue: number;
}

/**
 * Calculates profit/loss for a holding based on current price vs average cost.
 * This is a live calculation that uses current market prices.
 * Independent of target calculations - only deals with actual performance.
 * 
 * @param input Object containing current price, average cost, quantity, and optional day change data
 * @returns Profit/loss calculations including total gain, percentage gain, and day change
 * 
 * @example
 * // Stock bought at $100, now at $110, holding 50 shares
 * calculateProfitLoss({ 
 *   currentPrice: 110, 
 *   avgCost: 100, 
 *   quantity: 50 
 * })
 * // Returns profit calculations
 */
export const calculateProfitLoss = ({
  currentPrice,
  avgCost,
  quantity,
  dayChange = 0,
  dayChangePercent = 0,
}: ProfitLossInput): ProfitLossResult => {
  // Validate inputs - return zero values for invalid inputs
  const safeCurrentPrice = Number.isFinite(currentPrice) && currentPrice >= 0 ? currentPrice : 0;
  const safeAvgCost = Number.isFinite(avgCost) && avgCost >= 0 ? avgCost : 0;
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
  const safeDayChange = Number.isFinite(dayChange) ? dayChange : 0;
  const safeDayChangePercent = Number.isFinite(dayChangePercent) ? dayChangePercent : 0;

  // Calculate cost basis and market value
  const costBasis = safeAvgCost * safeQuantity;
  const marketValue = safeCurrentPrice * safeQuantity;

  // Calculate total gain/loss - handle division by zero
  const totalGain = marketValue - costBasis;
  const totalGainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

  // Calculate day change value (if dayChange per share is provided, multiply by quantity)
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

/**
 * Validates that a percentage value is within reasonable bounds.
 * Used for target allocation validation to prevent invalid percentage combinations.
 * 
 * @param percentage Percentage value to validate
 * @param allowZero Whether zero is considered valid
 * @param maxPercent Maximum allowed percentage (default 100)
 * @returns True if percentage is valid, false otherwise
 * 
 * @example
 * validatePercentage(15.5) // Returns true
 * validatePercentage(-5) // Returns false
 * validatePercentage(150) // Returns false
 */
export const validatePercentage = (
  percentage: number, 
  allowZero: boolean = true, 
  maxPercent: number = 100
): boolean => {
  if (!Number.isFinite(percentage)) {
    return false;
  }
  
  const minPercent = allowZero ? 0 : 0.01;
  return percentage >= minPercent && percentage <= maxPercent;
};

/**
 * Safely divides two numbers, returning zero if the divisor is zero or invalid.
 * Used throughout calculations to prevent division by zero errors.
 * 
 * @param numerator The number to divide
 * @param denominator The number to divide by
 * @returns Result of division, or 0 if denominator is zero/invalid
 * 
 * @example
 * safeDivide(100, 20) // Returns 5
 * safeDivide(100, 0) // Returns 0
 * safeDivide(100, NaN) // Returns 0
 */
export const safeDivide = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  
  return numerator / denominator;
};

/**
 * Calculates the effective price to use for a holding (live price with manual fallback).
 * This is a live calculation helper that determines which price to use.
 * 
 * @param livePrice Current market price (may be undefined)
 * @param manualPrice User-entered fallback price
 * @returns The price to use for calculations and whether live price was used
 * 
 * @example
 * getEffectivePrice(105.50, 100) // Returns { price: 105.50, usedLivePrice: true }
 * getEffectivePrice(undefined, 100) // Returns { price: 100, usedLivePrice: false }
 */
export const getEffectivePrice = (
  livePrice: number | undefined, 
  manualPrice: number
): { price: number; usedLivePrice: boolean } => {
  // Validate live price
  const hasValidLivePrice = livePrice !== undefined && Number.isFinite(livePrice) && livePrice >= 0;
  
  // Validate manual price as fallback
  const safeManualPrice = Number.isFinite(manualPrice) && manualPrice >= 0 ? manualPrice : 0;
  
  if (hasValidLivePrice) {
    return { price: livePrice, usedLivePrice: true };
  }
  
  return { price: safeManualPrice, usedLivePrice: false };
};
