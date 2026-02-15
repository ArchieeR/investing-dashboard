// ============================================
// Cloud Function Stub: fetchNews
// Trigger: Scheduled - every hour
// Purpose: Fetch news for tracked tickers from FMP
// ============================================

// TODO: Deploy as Firebase Cloud Function (Gen 2)
// import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Stub: Fetch and store stock news from FMP API hourly.
 *
 * Steps:
 * 1. Collect all unique tickers from active portfolios + watchlists
 * 2. Batch-fetch news from FMP (paginated)
 * 3. Deduplicate against existing news collection
 * 4. Store new articles in /news collection
 * 5. Categorise articles (market, company, sector, macro)
 */
export async function fetchNews(): Promise<{
  fetched: number;
  stored: number;
}> {
  // TODO: Implement with Firebase Admin + FMP client
  return { fetched: 0, stored: 0 };
}
