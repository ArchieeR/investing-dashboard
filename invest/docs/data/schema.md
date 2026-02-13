# Portfolio Database Schema

## Core Architecture
We use **Firestore** as our primary operational database ("Hot Cache") for user data and fast asset retrieval. This is a schema-on-read database, but we enforce strict types at the application boundary using repositories.

### Collections Overview
- `assets` (Global): The shared universe of all discovered financial instruments.
- `users` (Private): User-specific data (Portfolios, Watchlists, Settings).

---

## 1. Global Assets Collection
**Path:** `/assets/{symbol}`
**Ingestion Strategy:** On-Demand ("Ingestion on Discovery").
**Refresh Strategy:** Lazy (TTL-based). If accessed > 24h since `lastUpdated`, refresh metadata.

```typescript
// Path: /assets/{symbol} (e.g., /assets/AAPL)
interface AssetDocument {
  // --- Identity ---
  symbol: string;        // Primary Key (e.g., "AAPL")
  name: string;          // "Apple Inc."
  exchange: string;      // "NASDAQ"
  currency: string;      // "USD"
  type: "stock" | "etf" | "crypto";
  
  // --- Metadata ---
  isActive: boolean;
  description?: string;
  image?: string;        // Logo URL
  website?: string;
  
  // --- ETF Specifics (if type === 'etf') ---
  // Populated via FMP or Custom Scrapers
  etfProvider?: string;  // "Vanguard", "Blackrock"
  expenseRatio?: number;
  aum?: number;
  
  holdings?: {
    asset: string;       // Symbol or Name
    weight: number;      // Percentage (0-100)
    updatedAt: string;
  }[];
  
  sectorWeights?: {
    sector: string;
    weight: number;
  }[];
  
  countryWeights?: {
    country: string;
    weight: number;
  }[];

  // --- System ---
  lastUpdated: Timestamp; // When was this record last fetched from FMP/Scraper?
  discoveryCount: number; // Metric: Popularity of this asset
}
```

> **Note:** Live prices are **NOT** stored here. They are fetched ephemerally or cached in Redis/Memory for short durations (60s).

---

## 2. Users Collection
**Path:** `/users/{userId}`. Strict Row-Level Security (RLS) applies.

### 2.1 Portfolios
**Path:** `/users/{userId}/portfolios/{portfolioId}`

```typescript
interface PortfolioDocument {
  name: string;          // "Retirement ISA"
  currency: string;      // "GBP"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Cached Totals (Read Optimization)
  cache: {
    totalValue: number;
    totalCost: number;
    dayChangePercent: number;
    lastUpdated: Timestamp;
  }
}
```

### 2.2 Positions (Sub-collection)
**Path:** `/users/{userId}/portfolios/{portfolioId}/positions/{symbol}`

```typescript
interface PositionDocument {
  symbol: string;        // FK to assets collection
  shares: number;        // Quantity owned
  avgPrice: number;      // Average buy price (Cost Basis)
  
  // Note: We compute current value on the fly:
  // Value = Position.shares * LivePrice(FMP)
}
```

### 2.3 Watchlists
**Path:** `/users/{userId}/watchlists/{watchlistId}`

```typescript
interface WatchlistDocument {
  name: string;          // "Tech Moonshots"
  symbols: string[];     // Array of tickers: ["PLTR", "TSLA"]
  createdAt: Timestamp;
}
```

---

## 3. Data Flow Diagram

### Scenario: User Views "VUSA" (Vanguard S&P 500 ETF)

1.  **Check DB**: App requests `assets/VUSA`.
2.  **Evaluate**:
    *   **Case A (Exists & Fresh)**: Return JSON. cost: 1 Read.
    *   **Case B (Missing)**:
        *   Fetch Profile (FMP).
        *   Fetch Holdings (FMP/Scraper).
        *   Write to `assets/VUSA`.
        *   Return JSON. cost: 1 Write, 2 API Calls.
    *   **Case C (Stale > 24h)**:
        *   Fetch Fresh Data (FMP).
        *   Update `assets/VUSA`.
        *   Return JSON. cost: 1 Write, 2 API Calls.
