import { z } from "zod";
import {
  FMPQuoteSchema,
  FMPQuoteShortSchema,
  FMPPriceChangeSchema,
  FMPHistoricalResponseSchema,
  FMPIntradayPriceSchema,
  FMPProfileSchema,
  FMPETFHoldingSchema,
  FMPETFInfoSchema,
  FMPSectorWeightingSchema,
  FMPCountryWeightingSchema,
  FMPIncomeStatementSchema,
  FMPKeyMetricsSchema,
  FMPAnalystEstimatesSchema,
  FMPPriceTargetConsensusSchema,
  FMPGradesConsensusSchema,
  FMPEarningsCalendarSchema,
  FMPDividendCalendarSchema,
  FMPStockNewsSchema,
  FMPSectorPerformanceSchema,
  FMPMarketMoverSchema,
  FMPTechnicalIndicatorSchema,
  FMPSearchResultSchema,
  type FMPQuote,
  type FMPQuoteShort,
  type FMPPriceChange,
  type FMPHistoricalPrice,
  type FMPIntradayPrice,
  type FMPProfile,
  type FMPETFHolding,
  type FMPETFInfo,
  type FMPSectorWeighting,
  type FMPCountryWeighting,
  type FMPIncomeStatement,
  type FMPKeyMetrics,
  type FMPAnalystEstimates,
  type FMPPriceTargetConsensus,
  type FMPGradesConsensus,
  type FMPEarningsCalendar,
  type FMPDividendCalendar,
  type FMPStockNews,
  type FMPSectorPerformance,
  type FMPMarketMover,
  type FMPTechnicalIndicator,
  type FMPSearchResult,
} from "./schemas";

const BASE_URL = "https://financialmodelingprep.com/stable";

// Rate limits: Free = 250/day, Starter = 300/min, Growth+ = higher
// Batch endpoints are preferred to conserve quota

export class FMPClient {
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
      { next: { revalidate: options.revalidate ?? 3600 } }
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

  private parseSingleOrNull<T>(
    data: unknown[],
    schema: z.ZodType<T>,
    label: string
  ): T | null {
    if (!data || data.length === 0) return null;
    try {
      return schema.parse(data[0]);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error(`FMP: Invalid ${label} response`, err.issues);
        return null;
      }
      throw err;
    }
  }

  // ============================================
  // SEARCH
  // ============================================

  async search(query: string, limit = 10): Promise<FMPSearchResult[]> {
    const data = await this.fetch<FMPSearchResult[]>("/search-name", {
      query,
      limit,
    });
    return z.array(FMPSearchResultSchema).parse(data);
  }

  // ============================================
  // QUOTES
  // ============================================

  async getQuote(symbol: string): Promise<FMPQuote | null> {
    // LSE tickers ending in .L: stub for Apify routing
    if (symbol.endsWith(".L")) {
      // TODO: Route to Apify for LSE pricing
    }
    const data = await this.fetch<FMPQuote[]>(
      "/quote",
      { symbol },
      { revalidate: 60 }
    );
    return this.parseSingleOrNull(data, FMPQuoteSchema, "quote");
  }

  async getBatchQuotes(symbols: string[]): Promise<FMPQuoteShort[]> {
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
    const data = await this.fetch<FMPPriceChange[]>(
      "/stock-price-change",
      { symbol },
      { revalidate: 3600 }
    );
    return this.parseSingleOrNull(data, FMPPriceChangeSchema, "price change");
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

  async getIntradayPrices(
    symbol: string,
    interval:
      | "1min"
      | "5min"
      | "15min"
      | "30min"
      | "1hour"
      | "4hour" = "1hour"
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
    const data = await this.fetch<FMPProfile[]>(
      "/profile",
      { symbol },
      { revalidate: 86400 }
    );
    return this.parseSingleOrNull(data, FMPProfileSchema, "profile");
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
    const data = await this.fetch<FMPETFInfo[]>(
      "/etf/info",
      { symbol },
      { revalidate: 86400 }
    );
    return this.parseSingleOrNull(data, FMPETFInfoSchema, "ETF info");
  }

  async getETFSectorWeightings(symbol: string): Promise<FMPSectorWeighting[]> {
    const data = await this.fetch<FMPSectorWeighting[]>(
      "/etf/sector-weightings",
      { symbol },
      { revalidate: 3600 }
    );
    return z.array(FMPSectorWeightingSchema).parse(data);
  }

  async getETFCountryWeightings(
    symbol: string
  ): Promise<FMPCountryWeighting[]> {
    const data = await this.fetch<FMPCountryWeighting[]>(
      "/etf/country-weightings",
      { symbol },
      { revalidate: 3600 }
    );
    return z.array(FMPCountryWeightingSchema).parse(data);
  }

  // ============================================
  // FINANCIAL STATEMENTS
  // ============================================

  async getIncomeStatement(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit = 4
  ): Promise<FMPIncomeStatement[]> {
    const data = await this.fetch<FMPIncomeStatement[]>(
      "/income-statement",
      { symbol, period, limit },
      { revalidate: 86400 }
    );
    return z.array(FMPIncomeStatementSchema).parse(data);
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
  // ANALYST DATA
  // ============================================

  async getAnalystEstimates(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
    limit = 4
  ): Promise<FMPAnalystEstimates[]> {
    const data = await this.fetch<FMPAnalystEstimates[]>(
      "/analyst-estimates",
      { symbol, period, limit },
      { revalidate: 86400 }
    );
    return z.array(FMPAnalystEstimatesSchema).parse(data);
  }

  async getPriceTargetConsensus(
    symbol: string
  ): Promise<FMPPriceTargetConsensus | null> {
    const data = await this.fetch<FMPPriceTargetConsensus[]>(
      "/price-target-consensus",
      { symbol },
      { revalidate: 3600 }
    );
    return this.parseSingleOrNull(
      data,
      FMPPriceTargetConsensusSchema,
      "price target"
    );
  }

  async getGradesConsensus(symbol: string): Promise<FMPGradesConsensus | null> {
    const data = await this.fetch<FMPGradesConsensus[]>(
      "/grades-consensus",
      { symbol },
      { revalidate: 3600 }
    );
    return this.parseSingleOrNull(
      data,
      FMPGradesConsensusSchema,
      "grades consensus"
    );
  }

  // ============================================
  // CALENDAR
  // ============================================

  async getEarningsCalendar(
    from?: string,
    to?: string
  ): Promise<FMPEarningsCalendar[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const data = await this.fetch<FMPEarningsCalendar[]>(
      "/earning-calendar",
      params,
      { revalidate: 3600 }
    );
    return z.array(FMPEarningsCalendarSchema).parse(data);
  }

  async getDividendCalendar(
    from?: string,
    to?: string
  ): Promise<FMPDividendCalendar[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const data = await this.fetch<FMPDividendCalendar[]>(
      "/dividend-calendar",
      params,
      { revalidate: 3600 }
    );
    return z.array(FMPDividendCalendarSchema).parse(data);
  }

  // ============================================
  // NEWS
  // ============================================

  async getStockNews(
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
  // MARKET OVERVIEW
  // ============================================

  async getSectorPerformance(): Promise<FMPSectorPerformance[]> {
    const today = new Date().toISOString().slice(0, 10);
    const data = await this.fetch<{ sector: string; averageChange: number }[]>(
      "/sector-performance-snapshot",
      { date: today },
      { revalidate: 300 }
    );
    // Transform to legacy shape for backward compat
    return data.map((d) => ({
      sector: d.sector,
      changesPercentage: d.averageChange.toFixed(4),
    }));
  }

  async getMostActives(): Promise<FMPMarketMover[]> {
    const data = await this.fetch<FMPMarketMover[]>(
      "/most-actives",
      {},
      { revalidate: 60 }
    );
    return z.array(FMPMarketMoverSchema).parse(data);
  }

  async getBiggestGainers(): Promise<FMPMarketMover[]> {
    const data = await this.fetch<FMPMarketMover[]>(
      "/biggest-gainers",
      {},
      { revalidate: 60 }
    );
    return z.array(FMPMarketMoverSchema).parse(data);
  }

  async getBiggestLosers(): Promise<FMPMarketMover[]> {
    const data = await this.fetch<FMPMarketMover[]>(
      "/biggest-losers",
      {},
      { revalidate: 60 }
    );
    return z.array(FMPMarketMoverSchema).parse(data);
  }

  // ============================================
  // TECHNICAL INDICATORS
  // ============================================

  async getTechnicalIndicator(
    symbol: string,
    indicator: "sma" | "ema" | "rsi" | "adx" | "macd",
    period = 14,
    timeframe: "daily" | "1hour" | "15min" = "daily"
  ): Promise<FMPTechnicalIndicator[]> {
    const data = await this.fetch<FMPTechnicalIndicator[]>(
      `/technical_indicator/${timeframe}/${indicator}`,
      { symbol, period },
      { revalidate: 300 }
    );
    return z.array(FMPTechnicalIndicatorSchema).parse(data);
  }
}

// Singleton export
export const fmpClient = new FMPClient(process.env.FMP_API_KEY ?? "");
