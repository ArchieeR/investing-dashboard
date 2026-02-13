
import { z } from "zod";

const APIFY_API_URL = "https://api.apify.com/v2/acts/google-finance-scraper/run-sync-get-dataset-items";

// --- Types ---
export const GoogleFinanceQuoteSchema = z.object({
    ticker: z.string(),
    price: z.number(),
    currency: z.string(),
    changePercent: z.number().optional(),
    lastUpdate: z.string().optional(),
});

export type GoogleFinanceQuote = z.infer<typeof GoogleFinanceQuoteSchema>;

// --- Client ---
class ApifyClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    /**
     * Fetch live prices for a list of tickers (LSE format: "VUSA:LON")
     * This runs a specific Actor task.
     */
    async getLivePrices(tickers: string[]): Promise<GoogleFinanceQuote[]> {
        if (!this.token) return [];

        const response = await fetch(`${APIFY_API_URL}?token=${this.token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                queries: tickers,
                maxItems: tickers.length,
            }),
            next: { revalidate: 0 }, // No cache for live prices
        });

        if (!response.ok) {
            console.error("Apify Error", await response.text());
            return [];
        }

        const data = await response.json();
        return data.map((item: any) => ({
            ticker: item.searchQuery, // or parsed from title
            price: item.price,
            currency: item.currency,
            changePercent: item.changesPercentage,
        }));
    }
}

export const apify = new ApifyClient(process.env.APIFY_API_TOKEN || "");
