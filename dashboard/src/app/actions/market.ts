"use server";

import { fmpClient } from "@/lib/fmp";

/**
 * Search for assets via FMP
 */
export async function searchAssets(query: string) {
  if (!query) return [];
  try {
    const results = await fmpClient.search(query, 10);
    return results.map((r) => ({
      ticker: r.symbol,
      name: r.name,
      issuer: r.currency ?? "Unknown",
      region: r.exchange ?? "Unknown",
      sector: "Unknown",
    }));
  } catch (error) {
    console.error("FMP Search Error:", error);
    return [];
  }
}

/**
 * Get detailed quote data for multiple tickers
 */
export async function getAssetQuotes(tickers: string[]) {
  if (!tickers.length) return [];
  try {
    const quotes = await fmpClient.getBatchQuotes(tickers);
    return quotes;
  } catch (error) {
    console.error("FMP Quote Error:", error);
    return [];
  }
}

/**
 * Get 1Y Historical Data for a ticker
 */
export async function getAssetHistory(ticker: string) {
  try {
    const history = await fmpClient.getHistoricalPrices(ticker);
    return history.reverse().map((h) => ({
      date: h.date,
      value: h.close,
    }));
  } catch (error) {
    console.error("FMP History Error:", error);
    return [];
  }
}
