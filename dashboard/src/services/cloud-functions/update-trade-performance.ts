// ============================================
// Cloud Function Stub: updateTradePerformance
// Trigger: Scheduled - daily at 00:00 UTC
// Purpose: Calculate trade-level P&L using historical prices
// ============================================

// TODO: Deploy as Firebase Cloud Function (Gen 2)
// import { onSchedule } from "firebase-functions/v2/scheduler";

export interface TradePerformance {
  tradeId: string;
  holdingId: string;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  holdingPeriodDays: number;
}

/**
 * Stub: Calculate performance metrics for all trades daily.
 *
 * Steps:
 * 1. Query all trades across all portfolios
 * 2. For each trade, get current price of the holding
 * 3. Calculate P&L, holding period, annualised return
 * 4. Update trade documents with performance data
 */
export async function updateTradePerformance(): Promise<{
  processed: number;
  errors: number;
}> {
  // TODO: Implement with Firebase Admin + FMP historical prices
  return { processed: 0, errors: 0 };
}
