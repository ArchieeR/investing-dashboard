// ============================================
// Cloud Function Stub: fetchEvents
// Trigger: Scheduled - daily at 06:00 UTC
// Purpose: Fetch earnings/dividend calendar from FMP
// ============================================

// TODO: Deploy as Firebase Cloud Function (Gen 2)
// import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Stub: Fetch earnings and dividend calendar events daily.
 *
 * Steps:
 * 1. Collect all unique tickers from active portfolios
 * 2. Fetch earnings calendar from FMP for next 30 days
 * 3. Fetch dividend calendar from FMP for next 30 days
 * 4. Map to EventDoc format with impact classification
 * 5. Upsert into /events collection
 */
export async function fetchEvents(): Promise<{
  earnings: number;
  dividends: number;
}> {
  // TODO: Implement with Firebase Admin + FMP client
  return { earnings: 0, dividends: 0 };
}
