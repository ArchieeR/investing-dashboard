
import { apify } from "./apify_client";
import { fmp } from "./fmp_client";

export interface AssetPrice {
    ticker: string;
    price: number;
    currency: string;
    changePercent?: number;
    source: "APIFY" | "FMP";
}

export class PriceFetcher {
    /**
     * Fetch live prices for a mix of assets using the Waterfall Strategy.
     * 1. LSE/UK Stocks -> Apify (Google Finance)
     * 2. US Stocks / Gold / ETCs -> FMP
     */
    async fetchPrices(tickers: string[]): Promise<AssetPrice[]> {
        const lseTickers = tickers.filter((t) => t.endsWith(".L") || t.includes(":LON"));
        const usTickers = tickers.filter((t) => !lseTickers.includes(t));

        const results: AssetPrice[] = [];

        // 1. Fetch LSE via Apify
        if (lseTickers.length > 0) {
            try {
                const apifyData = await apify.getLivePrices(lseTickers);
                apifyData.forEach((q) => {
                    results.push({
                        ticker: q.ticker,
                        price: q.price,
                        currency: q.currency,
                        changePercent: q.changePercent,
                        source: "APIFY",
                    });
                });
            } catch (e) {
                console.error("Failed to fetch from Apify, falling back to FMP if possible", e);
                // Fallback: Add failed LSE tickers to US list to try FMP (often delayed but better than nothing)
                usTickers.push(...lseTickers);
            }
        }

        // 2. Fetch US/Commodities via FMP
        // FMP does one-by-one or batch. For simplicity here, we map one-by-one or use their batch endpoint.
        // Using simple loop for clear logic in prototype.
        await Promise.all(
            usTickers.map(async (ticker) => {
                try {
                    const q = await fmp.getQuote(ticker);
                    if (q) {
                        results.push({
                            ticker: q.symbol,
                            price: q.price,
                            currency: "USD", // FMP usually USD for US stocks, need check for others
                            changePercent: q.changesPercentage,
                            source: "FMP",
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch ${ticker} from FMP`, e);
                }
            })
        );

        return results;
    }
}

export const priceFetcher = new PriceFetcher();
