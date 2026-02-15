import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import type {
  AssetDocument,
  ETFHoldingRecord,
} from "@/types/asset";

// ============================================
// COLLECTION INTERFACES
// ============================================

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  plan: "free" | "pro";
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    currency: string;
    theme: "dark" | "light" | "system";
    notifications: boolean;
  };
}

export interface PortfolioDoc {
  uid: string;
  name: string;
  type: "actual" | "draft";
  parentId: string | null;
  accountType: "ISA" | "SIPP" | "GIA" | "other";
  currency: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HoldingDoc {
  section: string;
  theme: string;
  assetType: string;
  name: string;
  ticker: string;
  exchange: string;
  account: string;
  price: number;
  qty: number;
  avgCost: number;
  targetPct: number | null;
  include: boolean;
  livePrice: number | null;
  livePriceUpdated: Date | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeDoc {
  holdingId: string;
  type: "buy" | "sell";
  date: Date;
  price: number;
  qty: number;
  fees: number;
  notes: string;
  createdAt: Date;
}

export interface WatchlistDoc {
  uid: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InstrumentDoc {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  isEtf: boolean;
  sector: string | null;
  country: string | null;
  profile: Record<string, unknown> | null;
  lastUpdated: Date;
}

export interface NewsDoc {
  title: string;
  text: string;
  url: string;
  image: string | null;
  site: string;
  tickers: string[];
  category: string;
  publishedAt: Date;
  fetchedAt: Date;
}

export interface EventDoc {
  ticker: string;
  type: "earnings" | "dividend" | "split" | "ipo" | "other";
  date: Date;
  impact: "high" | "medium" | "low";
  title: string;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

// ============================================
// TIMESTAMP CONVERSION HELPERS
// ============================================

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

function toDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toDate(value);
}

// ============================================
// DATA CONVERTERS
// ============================================

export const userConverter: FirestoreDataConverter<UserDoc> = {
  toFirestore(user: UserDoc): DocumentData {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
      preferences: user.preferences,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): UserDoc {
    const d = snapshot.data(options);
    return {
      uid: d.uid,
      email: d.email,
      displayName: d.displayName,
      photoURL: d.photoURL ?? null,
      plan: d.plan ?? "free",
      stripeCustomerId: d.stripeCustomerId ?? null,
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
      preferences: d.preferences ?? {
        currency: "GBP",
        theme: "dark",
        notifications: true,
      },
    };
  },
};

export const portfolioConverter: FirestoreDataConverter<PortfolioDoc> = {
  toFirestore(portfolio: PortfolioDoc): DocumentData {
    return {
      uid: portfolio.uid,
      name: portfolio.name,
      type: portfolio.type,
      parentId: portfolio.parentId,
      accountType: portfolio.accountType,
      currency: portfolio.currency,
      settings: portfolio.settings,
      createdAt: Timestamp.fromDate(portfolio.createdAt),
      updatedAt: Timestamp.fromDate(portfolio.updatedAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): PortfolioDoc {
    const d = snapshot.data(options);
    return {
      uid: d.uid,
      name: d.name,
      type: d.type ?? "actual",
      parentId: d.parentId ?? null,
      accountType: d.accountType ?? "GIA",
      currency: d.currency ?? "GBP",
      settings: d.settings ?? {},
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  },
};

export const holdingConverter: FirestoreDataConverter<HoldingDoc> = {
  toFirestore(holding: HoldingDoc): DocumentData {
    return {
      section: holding.section,
      theme: holding.theme,
      assetType: holding.assetType,
      name: holding.name,
      ticker: holding.ticker,
      exchange: holding.exchange,
      account: holding.account,
      price: holding.price,
      qty: holding.qty,
      avgCost: holding.avgCost,
      targetPct: holding.targetPct,
      include: holding.include,
      livePrice: holding.livePrice,
      livePriceUpdated: holding.livePriceUpdated
        ? Timestamp.fromDate(holding.livePriceUpdated)
        : null,
      dayChange: holding.dayChange,
      dayChangePercent: holding.dayChangePercent,
      createdAt: Timestamp.fromDate(holding.createdAt),
      updatedAt: Timestamp.fromDate(holding.updatedAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): HoldingDoc {
    const d = snapshot.data(options);
    return {
      section: d.section,
      theme: d.theme,
      assetType: d.assetType,
      name: d.name,
      ticker: d.ticker,
      exchange: d.exchange,
      account: d.account,
      price: d.price,
      qty: d.qty,
      avgCost: d.avgCost ?? 0,
      targetPct: d.targetPct ?? null,
      include: d.include ?? true,
      livePrice: d.livePrice ?? null,
      livePriceUpdated: toDateOrNull(d.livePriceUpdated),
      dayChange: d.dayChange ?? null,
      dayChangePercent: d.dayChangePercent ?? null,
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  },
};

export const tradeConverter: FirestoreDataConverter<TradeDoc> = {
  toFirestore(trade: TradeDoc): DocumentData {
    return {
      holdingId: trade.holdingId,
      type: trade.type,
      date: Timestamp.fromDate(trade.date),
      price: trade.price,
      qty: trade.qty,
      fees: trade.fees,
      notes: trade.notes,
      createdAt: Timestamp.fromDate(trade.createdAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): TradeDoc {
    const d = snapshot.data(options);
    return {
      holdingId: d.holdingId,
      type: d.type,
      date: toDate(d.date),
      price: d.price,
      qty: d.qty,
      fees: d.fees ?? 0,
      notes: d.notes ?? "",
      createdAt: toDate(d.createdAt),
    };
  },
};

export const watchlistConverter: FirestoreDataConverter<WatchlistDoc> = {
  toFirestore(watchlist: WatchlistDoc): DocumentData {
    return {
      uid: watchlist.uid,
      name: watchlist.name,
      symbols: watchlist.symbols,
      createdAt: Timestamp.fromDate(watchlist.createdAt),
      updatedAt: Timestamp.fromDate(watchlist.updatedAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): WatchlistDoc {
    const d = snapshot.data(options);
    return {
      uid: d.uid,
      name: d.name,
      symbols: d.symbols ?? [],
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  },
};

export const instrumentConverter: FirestoreDataConverter<InstrumentDoc> = {
  toFirestore(instrument: InstrumentDoc): DocumentData {
    return {
      symbol: instrument.symbol,
      name: instrument.name,
      exchange: instrument.exchange,
      currency: instrument.currency,
      isEtf: instrument.isEtf,
      sector: instrument.sector,
      country: instrument.country,
      profile: instrument.profile,
      lastUpdated: Timestamp.fromDate(instrument.lastUpdated),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): InstrumentDoc {
    const d = snapshot.data(options);
    return {
      symbol: d.symbol,
      name: d.name,
      exchange: d.exchange,
      currency: d.currency,
      isEtf: d.isEtf ?? false,
      sector: d.sector ?? null,
      country: d.country ?? null,
      profile: d.profile ?? null,
      lastUpdated: toDate(d.lastUpdated),
    };
  },
};

export const newsConverter: FirestoreDataConverter<NewsDoc> = {
  toFirestore(news: NewsDoc): DocumentData {
    return {
      title: news.title,
      text: news.text,
      url: news.url,
      image: news.image,
      site: news.site,
      tickers: news.tickers,
      category: news.category,
      publishedAt: Timestamp.fromDate(news.publishedAt),
      fetchedAt: Timestamp.fromDate(news.fetchedAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): NewsDoc {
    const d = snapshot.data(options);
    return {
      title: d.title,
      text: d.text,
      url: d.url,
      image: d.image ?? null,
      site: d.site,
      tickers: d.tickers ?? [],
      category: d.category ?? "general",
      publishedAt: toDate(d.publishedAt),
      fetchedAt: toDate(d.fetchedAt),
    };
  },
};

export const eventConverter: FirestoreDataConverter<EventDoc> = {
  toFirestore(event: EventDoc): DocumentData {
    return {
      ticker: event.ticker,
      type: event.type,
      date: Timestamp.fromDate(event.date),
      impact: event.impact,
      title: event.title,
      details: event.details,
      createdAt: Timestamp.fromDate(event.createdAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): EventDoc {
    const d = snapshot.data(options);
    return {
      ticker: d.ticker,
      type: d.type,
      date: toDate(d.date),
      impact: d.impact ?? "medium",
      title: d.title,
      details: d.details ?? null,
      createdAt: toDate(d.createdAt),
    };
  },
};

export const assetConverter: FirestoreDataConverter<AssetDocument> = {
  toFirestore(asset: AssetDocument): DocumentData {
    return {
      symbol: asset.symbol,
      name: asset.name,
      isin: asset.isin,
      exchange: asset.exchange,
      currency: asset.currency,
      category: asset.category,
      subcategory: asset.subcategory,
      isEtf: asset.isEtf,
      isFund: asset.isFund,
      isActivelyTrading: asset.isActivelyTrading,
      description: asset.description,
      website: asset.website,
      logoUrl: asset.logoUrl,
      sector: asset.sector,
      industry: asset.industry,
      country: asset.country,
      ipoDate: asset.ipoDate,
      livePrice: asset.livePrice,
      dayChange: asset.dayChange,
      dayChangePercent: asset.dayChangePercent,
      yearHigh: asset.yearHigh,
      yearLow: asset.yearLow,
      fundamentals: asset.fundamentals,
      etfData: asset.etfData,
      sources: asset.sources,
      lastUpdated: Timestamp.fromDate(asset.lastUpdated),
      lastPriceUpdate: asset.lastPriceUpdate
        ? Timestamp.fromDate(asset.lastPriceUpdate)
        : null,
      lastHoldingsUpdate: asset.lastHoldingsUpdate
        ? Timestamp.fromDate(asset.lastHoldingsUpdate)
        : null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): AssetDocument {
    const d = snapshot.data(options);
    return {
      symbol: d.symbol,
      name: d.name,
      isin: d.isin,
      exchange: d.exchange,
      currency: d.currency,
      category: d.category,
      subcategory: d.subcategory ?? "",
      isEtf: d.isEtf ?? false,
      isFund: d.isFund ?? false,
      isActivelyTrading: d.isActivelyTrading ?? true,
      description: d.description,
      website: d.website,
      logoUrl: d.logoUrl,
      sector: d.sector,
      industry: d.industry,
      country: d.country,
      ipoDate: d.ipoDate,
      livePrice: d.livePrice,
      dayChange: d.dayChange,
      dayChangePercent: d.dayChangePercent,
      yearHigh: d.yearHigh,
      yearLow: d.yearLow,
      fundamentals: d.fundamentals ?? null,
      etfData: d.etfData ?? null,
      sources: d.sources ?? [],
      lastUpdated: toDate(d.lastUpdated),
      lastPriceUpdate: toDateOrNull(d.lastPriceUpdate) ?? undefined,
      lastHoldingsUpdate: toDateOrNull(d.lastHoldingsUpdate) ?? undefined,
    };
  },
};

export const etfHoldingConverter: FirestoreDataConverter<ETFHoldingRecord> = {
  toFirestore(holding: ETFHoldingRecord): DocumentData {
    return {
      ticker: holding.ticker,
      name: holding.name,
      isin: holding.isin,
      weight: holding.weight,
      shares: holding.shares,
      marketValue: holding.marketValue,
      sector: holding.sector,
      assetClass: holding.assetClass,
      currency: holding.currency,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): ETFHoldingRecord {
    const d = snapshot.data(options);
    return {
      ticker: d.ticker,
      name: d.name,
      isin: d.isin,
      weight: d.weight ?? 0,
      shares: d.shares,
      marketValue: d.marketValue,
      sector: d.sector,
      assetClass: d.assetClass,
      currency: d.currency,
    };
  },
};
