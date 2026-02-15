// ============================================
// Cloud Function Stub: updateLivePrices
// Trigger: Scheduled - every 10 minutes
// Purpose: Fetch latest prices for all active holdings
// ============================================

// TODO: Deploy as Firebase Cloud Function (Gen 2)
// import { onSchedule } from "firebase-functions/v2/scheduler";

export interface UpdateLivePricesConfig {
  batchSize: number;
  delayBetweenBatches: number; // ms
}

const DEFAULT_CONFIG: UpdateLivePricesConfig = {
  batchSize: 10,
  delayBetweenBatches: 100,
};

/**
 * Stub: Fetch live prices for all active holdings across all users.
 * In production, this runs as a scheduled Cloud Function every 10 minutes.
 *
 * Steps:
 * 1. Query all portfolios with enableLivePrices = true
 * 2. Collect unique tickers from their holdings
 * 3. Batch-fetch prices from FMP (and Apify for LSE)
 * 4. Update each holding's livePrice, dayChange, dayChangePercent
 * 5. Update livePriceUpdated timestamp
 */
export async function updateLivePrices(
  _config: UpdateLivePricesConfig = DEFAULT_CONFIG
): Promise<{ updated: number; errors: number }> {
  // TODO: Implement with Firebase Admin + FMP client
  return { updated: 0, errors: 0 };
}
