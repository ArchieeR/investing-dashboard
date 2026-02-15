import { describe, it, expect, vi, beforeEach } from "vitest";
import { FMPClient } from "./client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  };
}

describe("FMPClient", () => {
  let client: FMPClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new FMPClient("test-api-key");
  });

  describe("search", () => {
    it("fetches and validates search results", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
            symbol: "AAPL",
            name: "Apple Inc.",
            currency: "USD",
            exchangeFullName: "NASDAQ",
            exchange: "NASDAQ",
          },
        ])
      );

      const results = await client.search("AAPL");
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe("AAPL");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/search"),
        expect.any(Object)
      );
    });
  });

  describe("getQuote", () => {
    it("returns parsed quote data", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
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
            volume: 54321000,
            exchange: "NASDAQ",
            open: 184.0,
            previousClose: 183.62,
            timestamp: 1706000000,
          },
        ])
      );

      const quote = await client.getQuote("AAPL");
      expect(quote).not.toBeNull();
      expect(quote?.price).toBe(185.92);
    });

    it("returns null for empty response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([]));
      const quote = await client.getQuote("INVALID");
      expect(quote).toBeNull();
    });
  });

  describe("getBatchQuotes", () => {
    it("returns parsed batch quotes", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          { symbol: "AAPL", price: 185.92, volume: 54321000 },
          { symbol: "MSFT", price: 405.12, volume: 23456000 },
        ])
      );

      const quotes = await client.getBatchQuotes(["AAPL", "MSFT"]);
      expect(quotes).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("symbols=AAPL%2CMSFT"),
        expect.any(Object)
      );
    });

    it("returns empty array for empty input", async () => {
      const quotes = await client.getBatchQuotes([]);
      expect(quotes).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("getHistoricalPrices", () => {
    it("parses historical response structure", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
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
        })
      );

      const prices = await client.getHistoricalPrices("AAPL", "2025-01-01");
      expect(prices).toHaveLength(1);
      expect(prices[0].close).toBe(185.92);
    });
  });

  describe("getProfile", () => {
    it("returns parsed profile", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
            symbol: "AAPL",
            companyName: "Apple Inc.",
            currency: "USD",
            exchange: "NASDAQ",
            exchangeShortName: "NASDAQ",
            isEtf: false,
            isActivelyTrading: true,
          },
        ])
      );

      const profile = await client.getProfile("AAPL");
      expect(profile?.companyName).toBe("Apple Inc.");
    });
  });

  describe("getETFHoldings", () => {
    it("returns parsed holdings array", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
            asset: "AAPL",
            name: "Apple Inc.",
            shares: 180000000,
            weightPercentage: 7.12,
            updated: "2025-01-15",
          },
        ])
      );

      const holdings = await client.getETFHoldings("VOO");
      expect(holdings).toHaveLength(1);
      expect(holdings[0].weightPercentage).toBe(7.12);
    });
  });

  describe("error handling", () => {
    it("throws on rate limit (429)", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, 429));
      await expect(client.getQuote("AAPL")).rejects.toThrow("Rate limit");
    });

    it("throws on invalid API key (401)", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, 401));
      await expect(client.getQuote("AAPL")).rejects.toThrow("Invalid API key");
    });

    it("throws on server error", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, 500));
      await expect(client.getQuote("AAPL")).rejects.toThrow("FMP API Error");
    });

    it("returns null for malformed data (Zod validation)", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([{ symbol: "AAPL", invalid: true }])
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const quote = await client.getQuote("AAPL");
      expect(quote).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("getSectorPerformance", () => {
    it("returns parsed sector performance", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          { sector: "Technology", averageChange: 1.25 },
          { sector: "Healthcare", averageChange: -0.5 },
        ])
      );

      const sectors = await client.getSectorPerformance();
      expect(sectors).toHaveLength(2);
      expect(sectors[0].changesPercentage).toBe("1.2500");
      expect(sectors[1].changesPercentage).toBe("-0.5000");
    });
  });

  describe("calendar endpoints", () => {
    it("getEarningsCalendar returns parsed data", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
            date: "2025-01-30",
            symbol: "AAPL",
            eps: 1.52,
            epsEstimated: 1.5,
            revenue: 94930000000,
            revenueEstimated: 95000000000,
          },
        ])
      );

      const earnings = await client.getEarningsCalendar("2025-01-01", "2025-02-01");
      expect(earnings).toHaveLength(1);
    });

    it("getDividendCalendar returns parsed data", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse([
          {
            date: "2025-02-14",
            symbol: "AAPL",
            dividend: 0.25,
          },
        ])
      );

      const dividends = await client.getDividendCalendar();
      expect(dividends).toHaveLength(1);
    });
  });
});
