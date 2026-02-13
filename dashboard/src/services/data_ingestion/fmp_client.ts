import { z } from "zod";
import {
    FMPQuote,
    FMPQuoteSchema,
    FMPQuoteShort,
    FMPQuoteShortSchema,
    FMPPriceChange,
    FMPPriceChangeSchema,
    FMPHistoricalPrice,
    FMPHistoricalResponseSchema,
    FMPIntradayPrice,
    FMPIntradayPriceSchema,
    FMPProfile,
    FMPProfileSchema,
    FMPETFHolding,
    FMPETFHoldingSchema,
    FMPETFInfo,
    FMPETFInfoSchema,
    FMPSectorWeighting,
    FMPSectorWeightingSchema,
    FMPCountryWeighting,
    FMPCountryWeightingSchema,
    FMPSearchResult,
    FMPSearchResultSchema,
    FMPKeyMetrics,
    FMPKeyMetricsSchema,
    FMPStockNews,
    FMPStockNewsSchema,
    FMPPriceTargetConsensus,
    FMPPriceTargetConsensusSchema,
    FMPGradesConsensus,
    FMPGradesConsensusSchema,
    FMPMarketMover,
    FMPMarketMoverSchema,
} from "./types/fmp.types";

const BASE_URL = "https://financialmodelingprep.com/stable";

class FMPClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async fetch<T>(
        endpoint: string,
        params: Record<string, string | number> = {},
        options: { revalidate?: number } = {}
    ): Promise<T> {
        const searchParams = new URLSearchParams({
            apikey: this.apiKey,
            ...Object.fromEntries(
                Object.entries(params).map(([k, v]) => [k, String(v)])
            ),
        });

        const res = await fetch(
            `${BASE_URL}${endpoint}?${searchParams.toString()}`,
            {
                next: { revalidate: options.revalidate ?? 3600 },
            }
        );

        if (res.status === 429) {
            throw new Error("FMP: Rate limit exceeded. Please try again later.");
        }

        if (res.status === 401) {
            throw new Error("FMP: Invalid API key. Check environment variables.");
        }

        if (!res.ok) {
            throw new Error(`FMP API Error: ${res.status} ${res.statusText}`);
        }

        return res.json();
    }

    // ============================================
    // SEARCH
    // ============================================

    async search(query: string, limit = 10): Promise<FMPSearchResult[]> {
        const data = await this.fetch<FMPSearchResult[]>("/search", {
            query,
            limit,
        });
        return z.array(FMPSearchResultSchema).parse(data);
    }

    // ============================================
    // QUOTES
    // ============================================

    async getQuote(symbol: string): Promise<FMPQuote | null> {
        try {
            const data = await this.fetch<FMPQuote[]>(
                "/quote",
                { symbol },
                { revalidate: 60 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPQuoteSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid response shape for ${symbol}`, error.issues);
                return null;
            }
            throw error;
        }
    }

    async fetchQuotes(symbols: string[]): Promise<FMPQuoteShort[]> {
        if (symbols.length === 0) return [];

        const data = await this.fetch<FMPQuoteShort[]>(
            "/batch-quote-short",
            { symbols: symbols.join(",") },
            { revalidate: 0 }
        );

        return z.array(FMPQuoteShortSchema).parse(data);
    }

    // ============================================
    // PRICE CHANGES
    // ============================================

    async getPriceChange(symbol: string): Promise<FMPPriceChange | null> {
        try {
            const data = await this.fetch<FMPPriceChange[]>(
                "/stock-price-change",
                { symbol },
                { revalidate: 3600 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPPriceChangeSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid price change response for ${symbol}`);
                return null;
            }
            throw error;
        }
    }

    // ============================================
    // HISTORICAL DATA
    // ============================================

    async getHistoricalPrices(
        symbol: string,
        from?: string,
        to?: string
    ): Promise<FMPHistoricalPrice[]> {
        const params: Record<string, string> = { symbol };
        if (from) params.from = from;
        if (to) params.to = to;

        const data = await this.fetch<unknown>(
            "/historical-price-eod/full",
            params,
            { revalidate: 86400 }
        );

        const parsed = FMPHistoricalResponseSchema.parse(data);
        return parsed.historical;
    }

    async fetchHistoricalPriceFull(symbol: string): Promise<FMPHistoricalPrice[]> {
        // defaults to 5 years (approx) or let API decide full history
        const data = await this.fetch<unknown>(
            "/historical-price-eod/full",
            { symbol },
            { revalidate: 86400 }
        );
        const parsed = FMPHistoricalResponseSchema.parse(data);
        return parsed.historical;
    }

    async getIntradayPrices(
        symbol: string,
        interval: "1min" | "5min" | "15min" | "30min" | "1hour" | "4hour" = "1hour"
    ): Promise<FMPIntradayPrice[]> {
        const data = await this.fetch<FMPIntradayPrice[]>(
            `/historical-chart/${interval}`,
            { symbol },
            { revalidate: 60 }
        );

        return z.array(FMPIntradayPriceSchema).parse(data);
    }

    // ============================================
    // PROFILES
    // ============================================

    async getProfile(symbol: string): Promise<FMPProfile | null> {
        try {
            const data = await this.fetch<FMPProfile[]>(
                "/profile",
                { symbol },
                { revalidate: 86400 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPProfileSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid profile response for ${symbol}`);
                return null;
            }
            throw error;
        }
    }

    // ============================================
    // ETF DATA
    // ============================================

    async getETFHoldings(symbol: string): Promise<FMPETFHolding[]> {
        const data = await this.fetch<FMPETFHolding[]>(
            "/etf/holdings",
            { symbol },
            { revalidate: 3600 }
        );

        return z.array(FMPETFHoldingSchema).parse(data);
    }

    async getETFInfo(symbol: string): Promise<FMPETFInfo | null> {
        try {
            const data = await this.fetch<FMPETFInfo[]>(
                "/etf/info",
                { symbol },
                { revalidate: 86400 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPETFInfoSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid ETF info response for ${symbol}`);
                return null;
            }
            throw error;
        }
    }

    async getETFSectorWeightings(symbol: string): Promise<FMPSectorWeighting[]> {
        const data = await this.fetch<FMPSectorWeighting[]>(
            "/etf/sector-weightings",
            { symbol },
            { revalidate: 3600 }
        );

        return z.array(FMPSectorWeightingSchema).parse(data);
    }

    async getETFCountryWeightings(symbol: string): Promise<FMPCountryWeighting[]> {
        const data = await this.fetch<FMPCountryWeighting[]>(
            "/etf/country-weightings",
            { symbol },
            { revalidate: 3600 }
        );

        return z.array(FMPCountryWeightingSchema).parse(data);
    }

    // ============================================
    // KEY METRICS
    // ============================================

    async getKeyMetrics(
        symbol: string,
        period: "annual" | "quarterly" = "annual",
        limit = 4
    ): Promise<FMPKeyMetrics[]> {
        const data = await this.fetch<FMPKeyMetrics[]>(
            "/key-metrics",
            { symbol, period, limit },
            { revalidate: 86400 }
        );

        return z.array(FMPKeyMetricsSchema).parse(data);
    }

    // ============================================
    // NEWS
    // ============================================

    async getNews(
        symbols: string[],
        page = 0,
        limit = 10
    ): Promise<FMPStockNews[]> {
        const data = await this.fetch<FMPStockNews[]>(
            "/news/stock",
            { symbols: symbols.join(","), page, limit },
            { revalidate: 300 }
        );

        return z.array(FMPStockNewsSchema).parse(data);
    }

    // ============================================
    // MARKET MOVERS
    // ============================================

    async getMostActives(): Promise<FMPMarketMover[]> {
        const data = await this.fetch<FMPMarketMover[]>("/most-actives", {
            revalidate: 60,
        });
        return z.array(FMPMarketMoverSchema).parse(data);
    }

    async getGainers(): Promise<FMPMarketMover[]> {
        const data = await this.fetch<FMPMarketMover[]>("/biggest-gainers", {
            revalidate: 60,
        });
        return z.array(FMPMarketMoverSchema).parse(data);
    }

    // ============================================
    // ANALYST DATA
    // ============================================

    async getPriceTargetConsensus(
        symbol: string
    ): Promise<FMPPriceTargetConsensus | null> {
        try {
            const data = await this.fetch<FMPPriceTargetConsensus[]>(
                "/price-target-consensus",
                { symbol },
                { revalidate: 3600 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPPriceTargetConsensusSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid price target response for ${symbol}`);
                return null;
            }
            throw error;
        }
    }

    async getGradesConsensus(symbol: string): Promise<FMPGradesConsensus | null> {
        try {
            const data = await this.fetch<FMPGradesConsensus[]>(
                "/grades-consensus",
                { symbol },
                { revalidate: 3600 }
            );

            if (!data || data.length === 0) {
                return null;
            }

            return FMPGradesConsensusSchema.parse(data[0]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(`FMP: Invalid grades consensus response for ${symbol}`);
                return null;
            }
            throw error;
        }
    }
}

// Singleton export
export const fmp = new FMPClient(process.env.FMP_API_KEY || "");

// Re-export types for convenience
export type {
    FMPQuote,
    FMPQuoteShort,
    FMPPriceChange,
    FMPHistoricalPrice,
    FMPIntradayPrice,
    FMPProfile,
    FMPETFHolding,
    FMPETFInfo,
    FMPSectorWeighting,
    FMPCountryWeighting,
    FMPSearchResult,
    FMPKeyMetrics,
    FMPStockNews,
    FMPPriceTargetConsensus,
    FMPGradesConsensus,
};
