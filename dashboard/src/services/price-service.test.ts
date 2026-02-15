import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatExchangeTicker,
  convertGbxToGbp,
  isGbxTicker,
  fetchPrices,
  fetchPrice,
  clearPriceCache,
} from "./price-service";

// Mock FMP client
vi.mock("@/lib/fmp", () => ({
  fmpClient: {
    getBatchQuotes: vi.fn(),
  },
}));

vi.mock("@/services/logging", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { fmpClient } from "@/lib/fmp";

describe("Price Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPriceCache();
  });

  describe("formatExchangeTicker", () => {
    it("appends .L for LSE tickers", () => {
      expect(formatExchangeTicker("VUSA", "LSE")).toBe("VUSA.L");
    });

    it("appends .AS for Amsterdam tickers", () => {
      expect(formatExchangeTicker("VWRL", "AMS")).toBe("VWRL.AS");
    });

    it("appends .DE for XETRA tickers", () => {
      expect(formatExchangeTicker("SAP", "XETRA")).toBe("SAP.DE");
    });

    it("returns ticker as-is if already has suffix", () => {
      expect(formatExchangeTicker("VUSA.L", "LSE")).toBe("VUSA.L");
    });

    it("returns ticker as-is for unknown exchanges", () => {
      expect(formatExchangeTicker("AAPL", "NYSE")).toBe("AAPL");
    });
  });

  describe("convertGbxToGbp", () => {
    it("converts GBX pence to GBP pounds", () => {
      expect(convertGbxToGbp(6550, "GBX")).toBe(65.5);
    });

    it("converts GBp to GBP", () => {
      expect(convertGbxToGbp(6550, "GBp")).toBe(65.5);
    });

    it("returns price unchanged for other currencies", () => {
      expect(convertGbxToGbp(185.92, "USD")).toBe(185.92);
    });

    it("returns price unchanged for GBP", () => {
      expect(convertGbxToGbp(65.5, "GBP")).toBe(65.5);
    });
  });

  describe("isGbxTicker", () => {
    it("returns true for GBX currency", () => {
      expect(isGbxTicker("VUSA", "GBX")).toBe(true);
    });

    it("returns true for GBp currency", () => {
      expect(isGbxTicker("VUSA", "GBp")).toBe(true);
    });

    it("returns true for .L suffix tickers", () => {
      expect(isGbxTicker("VUSA.L")).toBe(true);
    });

    it("returns false for US tickers", () => {
      expect(isGbxTicker("AAPL", "USD")).toBe(false);
    });
  });

  describe("fetchPrices", () => {
    it("fetches batch quotes from FMP", async () => {
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValueOnce([
        { symbol: "AAPL", price: 185.92, volume: 54321000 },
        { symbol: "MSFT", price: 405.12, volume: 23456000 },
      ]);

      const results = await fetchPrices(["AAPL", "MSFT"]);
      expect(results.size).toBe(2);
      expect(results.get("AAPL")?.price).toBe(185.92);
      expect(results.get("AAPL")?.source).toBe("fmp");
    });

    it("returns empty map for empty input", async () => {
      const results = await fetchPrices([]);
      expect(results.size).toBe(0);
    });

    it("falls back to cache on FMP failure", async () => {
      // Prime the cache
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValueOnce([
        { symbol: "AAPL", price: 185.0, volume: 50000000 },
      ]);
      await fetchPrices(["AAPL"]);

      // Now fail FMP
      vi.mocked(fmpClient.getBatchQuotes).mockRejectedValueOnce(
        new Error("Rate limit")
      );
      const results = await fetchPrices(["AAPL"]);
      expect(results.get("AAPL")?.price).toBe(185.0);
    });

    it("batches requests by configured batch size", async () => {
      vi.mocked(fmpClient.getBatchQuotes)
        .mockResolvedValueOnce([
          { symbol: "A", price: 100, volume: 1000 },
          { symbol: "B", price: 200, volume: 2000 },
        ])
        .mockResolvedValueOnce([
          { symbol: "C", price: 300, volume: 3000 },
        ]);

      const results = await fetchPrices(["A", "B", "C"], {
        batchSize: 2,
        delayBetweenBatches: 0,
      });
      expect(results.size).toBe(3);
      expect(fmpClient.getBatchQuotes).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchPrice", () => {
    it("fetches a single price", async () => {
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValueOnce([
        { symbol: "AAPL", price: 185.92, volume: 54321000 },
      ]);

      const result = await fetchPrice("AAPL");
      expect(result?.price).toBe(185.92);
    });

    it("returns null when not found", async () => {
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValueOnce([]);
      const result = await fetchPrice("INVALID");
      expect(result).toBeNull();
    });
  });
});
