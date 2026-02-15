// ============================================
// Cloud Function Stub: calculatePortfolioMetrics
// Trigger: onWrite to portfolios/{portfolioId}/holdings/{holdingId}
// Purpose: Recalculate portfolio-level aggregates
// ============================================

// TODO: Deploy as Firebase Cloud Function (Gen 2)
// import { onDocumentWritten } from "firebase-functions/v2/firestore";

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdingCount: number;
  lastCalculated: Date;
}

/**
 * Stub: Recalculate portfolio metrics when holdings change.
 * Triggered on any write to the holdings subcollection.
 *
 * Steps:
 * 1. Read all holdings for the portfolio
 * 2. Calculate total value, cost basis, gains
 * 3. Calculate day change from live prices
 * 4. Update portfolio document with computed metrics
 */
export async function calculatePortfolioMetrics(
  _portfolioId: string
): Promise<PortfolioMetrics> {
  // TODO: Implement with Firebase Admin
  return {
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    totalGainPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    holdingCount: 0,
    lastCalculated: new Date(),
  };
}
