"use server";

import { fmp } from "@/services/data_ingestion/fmp_client";

/**
 * Search for assets via FMP
 */
export async function searchAssets(query: string) {
    if (!query) return [];
    try {
        const results = await fmp.search(query, 10);
        return results.map(r => ({
            ticker: r.symbol,
            type: r.type || 'Stock', // Fallback type
            name: r.name,
            issuer: r.currency, // FMP search doesn't give issuer, using currency as placeholder or fetch profile
            region: r.exchangeShortName,
            sector: "Unknown" // Search endpoint is lightweight
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
        const quotes = await fmp.fetchQuotes(tickers);
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
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);

        const history = await fmp.getHistoricalPrices(
            ticker,
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
        );

        // FMP returns newest first, reverse to oldest first for charts
        return history.reverse().map(h => ({
            date: h.date,
            value: h.close
        }));
    } catch (error) {
        console.error("FMP History Error:", error);
        // Fallback or empty
        return [];
    }
}
