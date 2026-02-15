import { describe, it, expect } from "vitest";
import {
  FMPQuoteSchema,
  FMPQuoteShortSchema,
  FMPPriceChangeSchema,
  FMPHistoricalPriceSchema,
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
} from "./schemas";

describe("FMP Zod Schemas", () => {
  describe("FMPQuoteSchema", () => {
    it("parses a valid full quote", () => {
      const data = {
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 185.92,
        changePercentage: 1.25,
        change: 2.3,
        dayLow: 183.5,
        dayHigh: 186.1,
        yearHigh: 199.62,
        yearLow: 124.17,
        marketCap: 2900000000000,
        priceAvg50: 180.5,
        priceAvg200: 175.2,
        volume: 54321000,
        exchange: "NASDAQ",
        open: 184.0,
        previousClose: 183.62,
        timestamp: 1706000000,
      };
      const result = FMPQuoteSchema.parse(data);
      expect(result.symbol).toBe("AAPL");
      expect(result.price).toBe(185.92);
    });

    it("parses minimal quote without optional fields", () => {
      const data = {
        symbol: "VUSA.L",
        name: "Vanguard S&P 500",
        price: 65.5,
        changePercentage: 0.5,
        change: 0.33,
        dayLow: 65.0,
        dayHigh: 66.0,
        yearHigh: 70.0,
        yearLow: 55.0,
        marketCap: 30000000000,
        volume: 500000,
        exchange: "LSE",
        open: 65.2,
        previousClose: 65.17,
        timestamp: 1706000000,
      };
      const result = FMPQuoteSchema.parse(data);
      expect(result.priceAvg50).toBeUndefined();
      expect(result.priceAvg200).toBeUndefined();
    });

    it("rejects missing required fields", () => {
      expect(() => FMPQuoteSchema.parse({ symbol: "AAPL" })).toThrow();
    });
  });

  describe("FMPQuoteShortSchema", () => {
    it("parses a batch quote short response", () => {
      const result = FMPQuoteShortSchema.parse({
        symbol: "AAPL",
        price: 185.92,
        volume: 54321000,
      });
      expect(result.symbol).toBe("AAPL");
    });
  });

  describe("FMPPriceChangeSchema", () => {
    it("parses with all optional periods", () => {
      const result = FMPPriceChangeSchema.parse({
        symbol: "AAPL",
        "1D": 1.25,
        "5D": 3.1,
        "1M": 5.2,
        ytd: 12.5,
        "1Y": 20.3,
      });
      expect(result["1D"]).toBe(1.25);
    });

    it("parses with only symbol", () => {
      const result = FMPPriceChangeSchema.parse({ symbol: "AAPL" });
      expect(result["1D"]).toBeUndefined();
    });
  });

  describe("FMPHistoricalPriceSchema", () => {
    it("parses a historical price entry", () => {
      const result = FMPHistoricalPriceSchema.parse({
        date: "2025-01-15",
        open: 183.5,
        high: 186.1,
        low: 182.9,
        close: 185.92,
        adjClose: 185.92,
        volume: 54321000,
        change: 2.42,
        changePercent: 1.32,
      });
      expect(result.date).toBe("2025-01-15");
    });
  });

  describe("FMPHistoricalResponseSchema", () => {
    it("parses a full historical response", () => {
      const result = FMPHistoricalResponseSchema.parse({
        symbol: "AAPL",
        historical: [
          {
            date: "2025-01-15",
            open: 183.5,
            high: 186.1,
            low: 182.9,
            close: 185.92,
            adjClose: 185.92,
            volume: 54321000,
            change: 2.42,
            changePercent: 1.32,
          },
        ],
      });
      expect(result.historical).toHaveLength(1);
    });
  });

  describe("FMPIntradayPriceSchema", () => {
    it("parses intraday price data", () => {
      const result = FMPIntradayPriceSchema.parse({
        date: "2025-01-15 10:00:00",
        open: 183.5,
        high: 184.0,
        low: 183.2,
        close: 183.8,
        volume: 1234567,
      });
      expect(result.volume).toBe(1234567);
    });
  });

  describe("FMPProfileSchema", () => {
    it("parses a company profile", () => {
      const result = FMPProfileSchema.parse({
        symbol: "AAPL",
        companyName: "Apple Inc.",
        currency: "USD",
        exchange: "NASDAQ Global Select",
        exchangeShortName: "NASDAQ",
        isEtf: false,
        isActivelyTrading: true,
        sector: "Technology",
        industry: "Consumer Electronics",
        country: "US",
      });
      expect(result.isEtf).toBe(false);
    });

    it("parses an ETF profile", () => {
      const result = FMPProfileSchema.parse({
        symbol: "VUSA.L",
        companyName: "Vanguard S&P 500 UCITS ETF",
        currency: "GBX",
        exchange: "London Stock Exchange",
        exchangeShortName: "LSE",
        isEtf: true,
        isActivelyTrading: true,
      });
      expect(result.isEtf).toBe(true);
    });
  });

  describe("FMPETFHoldingSchema", () => {
    it("parses ETF holding data", () => {
      const result = FMPETFHoldingSchema.parse({
        asset: "AAPL",
        name: "Apple Inc.",
        shares: 180000000,
        weightPercentage: 7.12,
        marketValue: 33465600000,
        updated: "2025-01-15",
      });
      expect(result.weightPercentage).toBe(7.12);
    });
  });

  describe("FMPETFInfoSchema", () => {
    it("parses ETF info", () => {
      const result = FMPETFInfoSchema.parse({
        symbol: "VUSA.L",
        name: "Vanguard S&P 500 UCITS ETF",
        expenseRatio: 0.07,
        aum: 30000000000,
      });
      expect(result.expenseRatio).toBe(0.07);
    });
  });

  describe("FMPSectorWeightingSchema", () => {
    it("parses sector weighting", () => {
      const result = FMPSectorWeightingSchema.parse({
        sector: "Technology",
        weightPercentage: "30.50%",
      });
      expect(result.sector).toBe("Technology");
    });
  });

  describe("FMPCountryWeightingSchema", () => {
    it("parses country weighting", () => {
      const result = FMPCountryWeightingSchema.parse({
        country: "United States",
        weightPercentage: "65.00%",
      });
      expect(result.country).toBe("United States");
    });
  });

  describe("FMPIncomeStatementSchema", () => {
    it("parses an income statement", () => {
      const result = FMPIncomeStatementSchema.parse({
        date: "2024-09-30",
        symbol: "AAPL",
        reportedCurrency: "USD",
        period: "Q4",
        revenue: 94930000000,
        costOfRevenue: 52680000000,
        grossProfit: 42250000000,
        grossProfitRatio: 0.445,
        operatingExpenses: 14570000000,
        operatingIncome: 27680000000,
        operatingIncomeRatio: 0.291,
        incomeBeforeTax: 27850000000,
        incomeTaxExpense: 4230000000,
        netIncome: 23620000000,
        netIncomeRatio: 0.248,
        eps: 1.52,
        epsdiluted: 1.5,
      });
      expect(result.revenue).toBe(94930000000);
    });
  });

  describe("FMPKeyMetricsSchema", () => {
    it("parses key metrics with nullable fields", () => {
      const result = FMPKeyMetricsSchema.parse({
        symbol: "AAPL",
        date: "2024-09-30",
        period: "Q4",
        peRatio: 30.33,
        debtToEquity: 1.87,
        dividendYield: 0.005,
      });
      expect(result.peRatio).toBe(30.33);
    });

    it("allows null peRatio", () => {
      const result = FMPKeyMetricsSchema.parse({
        symbol: "VUSA.L",
        date: "2024-09-30",
        period: "FY",
        peRatio: null,
        debtToEquity: null,
        dividendYield: null,
      });
      expect(result.peRatio).toBeNull();
    });
  });

  describe("FMPAnalystEstimatesSchema", () => {
    it("parses analyst estimates", () => {
      const result = FMPAnalystEstimatesSchema.parse({
        symbol: "AAPL",
        date: "2025-01-30",
        estimatedRevenueLow: 88000000000,
        estimatedRevenueHigh: 102000000000,
        estimatedRevenueAvg: 95000000000,
        estimatedEpsLow: 1.35,
        estimatedEpsHigh: 1.65,
        estimatedEpsAvg: 1.52,
      });
      expect(result.estimatedEpsAvg).toBe(1.52);
    });
  });

  describe("FMPPriceTargetConsensusSchema", () => {
    it("parses price target consensus", () => {
      const result = FMPPriceTargetConsensusSchema.parse({
        symbol: "AAPL",
        targetHigh: 250,
        targetLow: 160,
        targetConsensus: 210,
        targetMedian: 205,
      });
      expect(result.targetConsensus).toBe(210);
    });
  });

  describe("FMPGradesConsensusSchema", () => {
    it("parses grades consensus", () => {
      const result = FMPGradesConsensusSchema.parse({
        symbol: "AAPL",
        strongBuy: 15,
        buy: 20,
        hold: 8,
        sell: 2,
        strongSell: 0,
        consensus: "Buy",
      });
      expect(result.consensus).toBe("Buy");
    });
  });

  describe("FMPEarningsCalendarSchema", () => {
    it("parses earnings calendar entry", () => {
      const result = FMPEarningsCalendarSchema.parse({
        date: "2025-01-30",
        symbol: "AAPL",
        eps: 1.52,
        epsEstimated: 1.5,
        time: "amc",
        revenue: 94930000000,
        revenueEstimated: 95000000000,
      });
      expect(result.eps).toBe(1.52);
    });

    it("allows null eps and revenue", () => {
      const result = FMPEarningsCalendarSchema.parse({
        date: "2025-04-30",
        symbol: "AAPL",
        eps: null,
        epsEstimated: null,
        revenue: null,
        revenueEstimated: null,
      });
      expect(result.eps).toBeNull();
    });
  });

  describe("FMPDividendCalendarSchema", () => {
    it("parses dividend calendar entry", () => {
      const result = FMPDividendCalendarSchema.parse({
        date: "2025-02-14",
        symbol: "AAPL",
        dividend: 0.25,
        recordDate: "2025-02-10",
        paymentDate: "2025-02-20",
      });
      expect(result.dividend).toBe(0.25);
    });
  });

  describe("FMPStockNewsSchema", () => {
    it("parses a stock news entry", () => {
      const result = FMPStockNewsSchema.parse({
        symbol: "AAPL",
        publishedDate: "2025-01-15 10:00:00",
        title: "Apple Reports Record Quarter",
        image: "https://example.com/image.jpg",
        site: "Reuters",
        text: "Apple Inc reported a record quarter...",
        url: "https://example.com/article",
      });
      expect(result.title).toBe("Apple Reports Record Quarter");
    });

    it("allows null image", () => {
      const result = FMPStockNewsSchema.parse({
        symbol: "AAPL",
        publishedDate: "2025-01-15",
        title: "Test",
        image: null,
        site: "BBC",
        text: "Content",
        url: "https://example.com",
      });
      expect(result.image).toBeNull();
    });
  });

  describe("FMPSectorPerformanceSchema", () => {
    it("parses sector performance", () => {
      const result = FMPSectorPerformanceSchema.parse({
        sector: "Technology",
        changesPercentage: "1.25%",
      });
      expect(result.sector).toBe("Technology");
    });
  });

  describe("FMPMarketMoverSchema", () => {
    it("parses a market mover entry", () => {
      const result = FMPMarketMoverSchema.parse({
        symbol: "AAPL",
        name: "Apple Inc.",
        change: 2.3,
        price: 185.92,
        changesPercentage: 1.25,
      });
      expect(result.changesPercentage).toBe(1.25);
    });
  });

  describe("FMPTechnicalIndicatorSchema", () => {
    it("parses technical indicator data", () => {
      const result = FMPTechnicalIndicatorSchema.parse({
        date: "2025-01-15",
        open: 183.5,
        high: 186.1,
        low: 182.9,
        close: 185.92,
        volume: 54321000,
        sma: 180.5,
        ema: 181.2,
        rsi: 65.3,
      });
      expect(result.sma).toBe(180.5);
      expect(result.rsi).toBe(65.3);
    });

    it("parses with MACD fields", () => {
      const result = FMPTechnicalIndicatorSchema.parse({
        date: "2025-01-15",
        open: 183.5,
        high: 186.1,
        low: 182.9,
        close: 185.92,
        volume: 54321000,
        macd: 2.1,
        signal: 1.8,
        histogram: 0.3,
      });
      expect(result.macd).toBe(2.1);
    });
  });
});
