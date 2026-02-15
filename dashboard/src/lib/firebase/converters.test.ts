import { describe, it, expect, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  userConverter,
  portfolioConverter,
  holdingConverter,
  tradeConverter,
  watchlistConverter,
  instrumentConverter,
  newsConverter,
  eventConverter,
  type UserDoc,
  type PortfolioDoc,
  type HoldingDoc,
  type TradeDoc,
  type WatchlistDoc,
  type InstrumentDoc,
  type NewsDoc,
  type EventDoc,
} from "./converters";

// Mock Firestore snapshot
function mockSnapshot(data: Record<string, unknown>) {
  return {
    data: () => data,
    id: "test-id",
    ref: {} as never,
    exists: () => true,
    metadata: {} as never,
    get: vi.fn(),
  } as never;
}

const now = new Date("2025-01-15T12:00:00Z");
const ts = Timestamp.fromDate(now);

describe("Firestore Converters", () => {
  describe("userConverter", () => {
    const user: UserDoc = {
      uid: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: null,
      plan: "free",
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
      preferences: { currency: "GBP", theme: "dark", notifications: true },
    };

    it("converts to Firestore with Timestamps", () => {
      const result = userConverter.toFirestore(user);
      expect(result.uid).toBe("user-1");
      expect(result.createdAt).toBeInstanceOf(Timestamp);
      expect(result.updatedAt).toBeInstanceOf(Timestamp);
    });

    it("converts from Firestore with Date objects", () => {
      const result = userConverter.fromFirestore(
        mockSnapshot({
          uid: "user-1",
          email: "test@example.com",
          displayName: "Test User",
          photoURL: null,
          plan: "pro",
          stripeCustomerId: "cus_123",
          createdAt: ts,
          updatedAt: ts,
          preferences: { currency: "GBP", theme: "dark", notifications: true },
        })
      );
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.plan).toBe("pro");
    });

    it("provides defaults for missing fields", () => {
      const result = userConverter.fromFirestore(
        mockSnapshot({
          uid: "user-1",
          email: "test@example.com",
          displayName: "Test",
          createdAt: ts,
          updatedAt: ts,
        })
      );
      expect(result.plan).toBe("free");
      expect(result.photoURL).toBeNull();
      expect(result.stripeCustomerId).toBeNull();
      expect(result.preferences).toEqual({
        currency: "GBP",
        theme: "dark",
        notifications: true,
      });
    });
  });

  describe("portfolioConverter", () => {
    const portfolio: PortfolioDoc = {
      uid: "user-1",
      name: "ISA Portfolio",
      type: "actual",
      parentId: null,
      accountType: "ISA",
      currency: "GBP",
      settings: {},
      createdAt: now,
      updatedAt: now,
    };

    it("converts to Firestore with Timestamps", () => {
      const result = portfolioConverter.toFirestore(portfolio);
      expect(result.name).toBe("ISA Portfolio");
      expect(result.createdAt).toBeInstanceOf(Timestamp);
    });

    it("converts from Firestore with defaults", () => {
      const result = portfolioConverter.fromFirestore(
        mockSnapshot({
          uid: "user-1",
          name: "Test",
          createdAt: ts,
          updatedAt: ts,
        })
      );
      expect(result.type).toBe("actual");
      expect(result.accountType).toBe("GIA");
      expect(result.currency).toBe("GBP");
    });
  });

  describe("holdingConverter", () => {
    const holding: HoldingDoc = {
      section: "Core",
      theme: "Growth",
      assetType: "ETF",
      name: "Vanguard S&P 500",
      ticker: "VUSA.L",
      exchange: "LSE",
      account: "ISA",
      price: 65.5,
      qty: 100,
      avgCost: 60.0,
      targetPct: 25,
      include: true,
      livePrice: 66.2,
      livePriceUpdated: now,
      dayChange: 0.7,
      dayChangePercent: 1.07,
      createdAt: now,
      updatedAt: now,
    };

    it("converts to Firestore preserving all fields", () => {
      const result = holdingConverter.toFirestore(holding);
      expect(result.ticker).toBe("VUSA.L");
      expect(result.livePriceUpdated).toBeInstanceOf(Timestamp);
      expect(result.createdAt).toBeInstanceOf(Timestamp);
    });

    it("converts from Firestore with null livePriceUpdated", () => {
      const result = holdingConverter.fromFirestore(
        mockSnapshot({
          section: "Core",
          theme: "Growth",
          assetType: "ETF",
          name: "VUSA",
          ticker: "VUSA.L",
          exchange: "LSE",
          account: "ISA",
          price: 65.5,
          qty: 100,
          createdAt: ts,
          updatedAt: ts,
        })
      );
      expect(result.livePrice).toBeNull();
      expect(result.livePriceUpdated).toBeNull();
      expect(result.include).toBe(true);
    });
  });

  describe("tradeConverter", () => {
    const trade: TradeDoc = {
      holdingId: "h-1",
      type: "buy",
      date: now,
      price: 65.5,
      qty: 10,
      fees: 1.5,
      notes: "Regular purchase",
      createdAt: now,
    };

    it("converts to Firestore", () => {
      const result = tradeConverter.toFirestore(trade);
      expect(result.date).toBeInstanceOf(Timestamp);
      expect(result.fees).toBe(1.5);
    });

    it("converts from Firestore with defaults", () => {
      const result = tradeConverter.fromFirestore(
        mockSnapshot({
          holdingId: "h-1",
          type: "sell",
          date: ts,
          price: 70,
          qty: 5,
          createdAt: ts,
        })
      );
      expect(result.fees).toBe(0);
      expect(result.notes).toBe("");
      expect(result.date).toBeInstanceOf(Date);
    });
  });

  describe("watchlistConverter", () => {
    it("converts to and from Firestore", () => {
      const watchlist: WatchlistDoc = {
        uid: "user-1",
        name: "Tech Stocks",
        symbols: ["AAPL", "MSFT"],
        createdAt: now,
        updatedAt: now,
      };
      const firestoreData = watchlistConverter.toFirestore(watchlist);
      expect(firestoreData.symbols).toEqual(["AAPL", "MSFT"]);

      const result = watchlistConverter.fromFirestore(
        mockSnapshot({
          uid: "user-1",
          name: "Tech",
          createdAt: ts,
          updatedAt: ts,
        })
      );
      expect(result.symbols).toEqual([]);
    });
  });

  describe("instrumentConverter", () => {
    it("converts from Firestore with defaults", () => {
      const result = instrumentConverter.fromFirestore(
        mockSnapshot({
          symbol: "VUSA.L",
          name: "Vanguard S&P 500",
          exchange: "LSE",
          currency: "GBX",
          lastUpdated: ts,
        })
      );
      expect(result.isEtf).toBe(false);
      expect(result.sector).toBeNull();
      expect(result.country).toBeNull();
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe("newsConverter", () => {
    it("converts to and from Firestore", () => {
      const news: NewsDoc = {
        title: "Market Rally",
        text: "Stocks surged today...",
        url: "https://example.com/news",
        image: null,
        site: "Reuters",
        tickers: ["AAPL", "MSFT"],
        category: "market",
        publishedAt: now,
        fetchedAt: now,
      };
      const firestoreData = newsConverter.toFirestore(news);
      expect(firestoreData.publishedAt).toBeInstanceOf(Timestamp);

      const result = newsConverter.fromFirestore(
        mockSnapshot({
          title: "Test",
          text: "Content",
          url: "https://example.com",
          site: "BBC",
          tickers: ["TSLA"],
          publishedAt: ts,
          fetchedAt: ts,
        })
      );
      expect(result.category).toBe("general");
      expect(result.image).toBeNull();
    });
  });

  describe("eventConverter", () => {
    it("converts to and from Firestore", () => {
      const event: EventDoc = {
        ticker: "AAPL",
        type: "earnings",
        date: now,
        impact: "high",
        title: "Q4 Earnings",
        details: { eps: 1.52 },
        createdAt: now,
      };
      const firestoreData = eventConverter.toFirestore(event);
      expect(firestoreData.date).toBeInstanceOf(Timestamp);

      const result = eventConverter.fromFirestore(
        mockSnapshot({
          ticker: "AAPL",
          type: "dividend",
          date: ts,
          title: "Dividend",
          createdAt: ts,
        })
      );
      expect(result.impact).toBe("medium");
      expect(result.details).toBeNull();
    });
  });
});
