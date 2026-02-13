---
name: infrastructure
description: Firebase setup (8 collections, security rules, indexes), Cloud Functions, FMP API (40+ endpoints, Zod schemas), Stripe billing, Auth, Deployment, Observability, and Migration strategy.
status: backlog
created: 2026-02-13T10:51:08Z
---

# PRD: Infrastructure

## Executive Summary

This PRD covers the backend infrastructure for the portfolio intelligence platform. It specifies the Firebase setup (8 Firestore collections with full schemas, security rules, composite indexes), 5 Cloud Functions (triggers and schedules), FMP API integration (40+ endpoints with Zod schemas, caching tiers, and rate limit management), Stripe billing (Free/Pro tiers), Authentication (Google + email), Deployment (Vercel + Firebase), Observability (Sentry structured logging), Security patterns, and a 4-phase migration strategy from localStorage to Firestore.

## Problem Statement

The existing frontend-only application uses localStorage for persistence and client-side CORS proxies for market data. This architecture cannot support: multi-device sync, user authentication, server-side price caching, reliable data backup, payment processing, or scale beyond a single browser. The infrastructure must enable real-time data sync, secure multi-tenant storage, efficient market data ingestion, and a monetisable SaaS model while remaining cost-effective for a solo developer.

## User Stories

### US-1: User Authentication
**As a** new user,
**I want to** sign up with Google or email/password,
**So that** my portfolio data is secure and accessible from any device.

**Acceptance Criteria:**
- Google Sign-In via Firebase Auth (one-click)
- Email/password registration with email verification
- Session persistence across browser tabs
- Automatic user profile creation in `/users/{userId}` on first login
- Redirect to dashboard after authentication
- Logout clears session and user context from Sentry logging

### US-2: Multi-Device Sync
**As a** user with multiple devices,
**I want** my portfolio changes to sync in real-time,
**So that** I always see the latest data regardless of which device I use.

**Acceptance Criteria:**
- Firestore real-time listeners on portfolio, holdings, and trades subcollections
- Offline support: changes queue locally and sync when connectivity returns
- Conflict resolution: last-write-wins with server timestamps
- Optimistic UI updates with rollback on conflict

### US-3: Reliable Market Data
**As a** user,
**I want** market prices to update server-side on a schedule,
**So that** I do not depend on my browser being open for data freshness.

**Acceptance Criteria:**
- Cloud Function `updateLivePrices` runs every 10 minutes during market hours
- Prices stored in holdings subcollection and instruments collection
- FMP API for US/international markets; Apify for LSE
- Rate limits respected: batch requests, aggressive caching
- Fallback chain: FMP -> Apify -> cached with timestamp

### US-4: Subscription Management
**As a** user,
**I want to** upgrade to Pro for unlimited portfolios and advanced features,
**So that** I can manage all my investments in one place.

**Acceptance Criteria:**
- Free tier: 1 portfolio, 10 holdings, basic analytics, CSV import
- Pro tier: 12 GBP/month, unlimited portfolios, unlimited holdings, ETF look-through, alerts, overlap analysis, research hub, AI chatbot
- Stripe Checkout for payment
- Subscription status stored in `/users/{userId}/subscription`
- Feature gating based on subscription tier
- Cancellation reverts to Free tier at billing period end

### US-5: Secure Data Access
**As a** user,
**I want** my portfolio data to be private and only accessible to me,
**So that** my financial information is protected.

**Acceptance Criteria:**
- Firestore security rules enforce owner-based access
- Users can only read/write their own portfolios, holdings, trades, watchlists
- Shared data (instruments, news, events) is read-only for authenticated users
- Cloud Functions have admin access for writes to shared collections
- No portfolio data sent to third-party APIs

### US-6: Observability
**As a** developer,
**I want** structured logging with feature/page context and severity levels,
**So that** I can diagnose issues quickly in production.

**Acceptance Criteria:**
- Sentry integration for error tracking
- Structured logging with Feature IDs and Page IDs
- Severity levels: debug, info, warning, error, fatal
- Log classifications: user-action, navigation, data-fetch, data-mutation, auth, error, performance, business, system
- User context associated with authenticated sessions
- Development: console-only; Production: Sentry with full context

## Functional Requirements

### FR-1: Firestore Collections (8 Collections)

#### 1. Users (`/users/{userId}`)
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  timezone: string;               // "Europe/London"
  locale: string;                 // "en-GB"
  currency: string;               // "GBP"
  preferences: {
    theme: 'light' | 'dark';
    defaultPortfolioId?: string;
    notifications: {
      email: boolean;
      push: boolean;
      priceAlerts: boolean;
      newsAlerts: boolean;
    };
  };
  subscription: {
    tier: 'free' | 'pro';
    status: 'active' | 'cancelled' | 'expired';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    expiresAt?: Timestamp;
  };
  stats: {
    portfolioCount: number;
    holdingCount: number;
    tradeCount: number;
  };
}
```

#### 2. Portfolios (`/portfolios/{portfolioId}`)
```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  type: 'actual' | 'draft' | 'model';
  parentId?: string;
  lists: {
    sections: string[];
    themes: string[];
    accounts: string[];
    themeSections: Record<string, string>;
  };
  settings: {
    currency: string;
    lockTotal: boolean;
    lockedTotal?: number;
    targetPortfolioValue?: number;
    enableLivePrices: boolean;
    livePriceUpdateInterval: number;
    visibleColumns: Record<string, boolean>;
  };
  budgets: {
    sections: Record<string, BudgetLimit>;
    accounts: Record<string, BudgetLimit>;
    themes: Record<string, BudgetLimit>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  computed: {
    totalValue: number;
    totalCostBasis: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    holdingCount: number;
    lastPriceUpdate?: Timestamp;
  };
}
```

#### 3. Holdings Subcollection (`/portfolios/{portfolioId}/holdings/{holdingId}`)
```typescript
interface Holding {
  id: string;
  portfolioId: string;
  section: string;
  theme: string;
  assetType: 'ETF' | 'Stock' | 'Crypto' | 'Cash' | 'Bond' | 'Fund' | 'Other';
  name: string;
  ticker: string;
  exchange: 'LSE' | 'NYSE' | 'NASDAQ' | 'AMS' | 'XETRA' | 'Other';
  account: string;
  qty: number;
  price: number;
  avgCost: number;
  livePrice?: number;
  livePriceUpdated?: Timestamp;
  dayChange?: number;
  dayChangePercent?: number;
  originalLivePrice?: number;
  originalCurrency?: string;
  conversionRate?: number;
  include: boolean;
  targetPct?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  computed: {
    value: number;
    liveValue?: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercent: number;
    pctOfPortfolio: number;
    pctOfSection: number;
    pctOfTheme: number;
    targetDelta?: number;
  };
}
```

#### 4. Trades Subcollection (`/portfolios/{portfolioId}/trades/{tradeId}`)
```typescript
interface Trade {
  id: string;
  portfolioId: string;
  holdingId: string;
  type: 'buy' | 'sell';
  date: Timestamp;
  price: number;
  qty: number;
  fees?: number;
  notes?: string;
  value: number;
  createdAt: Timestamp;
  performance?: {
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    daysHeld: number;
  };
}
```

#### 5. Watchlists (`/watchlists/{watchlistId}`)
```typescript
interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  theme: string;
  marketCapFocus: ('large' | 'mid' | 'small')[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: {
    stockCount: number;
    avgReturn: number;
    avgYield?: number;
  };
}
```

With subcollection `/watchlists/{watchlistId}/stocks/{stockId}`:
```typescript
interface WatchlistStock {
  ticker: string;
  company: string;
  addedAt: Timestamp;
  price: number;
  change: number;
  changePercent: number;
  marketCapCategory: 'large' | 'mid' | 'small' | 'micro';
  inPortfolio: boolean;
  portfolioWeight?: number;
}
```

#### 6. Instruments (`/instruments/{ticker}`) -- Shared, Read-Only for Users
```typescript
interface Instrument {
  ticker: string;
  isin?: string;
  name: string;
  type: 'stock' | 'etf' | 'fund' | 'crypto' | 'bond';
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
  etfData?: {
    aum: string;
    expenseRatio: number;
    holdings: number;
    dividendYield: number;
    inceptionDate: string;
    replication: 'Physical' | 'Synthetic';
  };
  stockData?: {
    marketCap: string;
    pe?: number;
    eps?: number;
    dividendYield?: number;
    beta?: number;
    high52w?: number;
    low52w?: number;
  };
  lastUpdated: Timestamp;
}
```

With subcollection `/instruments/{ticker}/prices/{date}` for OHLCV data.

#### 7. News (`/news/{articleId}`) -- Shared, Read-Only for Users
```typescript
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  source: string;
  author?: string;
  publishedAt: Timestamp;
  category: 'market' | 'economic' | 'political' | 'company' | 'crypto';
  tickers: string[];
  sectors: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  createdAt: Timestamp;
}
```

#### 8. Events (`/events/{eventId}`) -- Shared, Read-Only for Users
```typescript
interface Event {
  id: string;
  type: 'earnings' | 'dividend' | 'economic' | 'political' | 'split' | 'merger';
  title: string;
  description?: string;
  date: Timestamp;
  time?: string;
  ticker?: string;
  tickers?: string[];
  impact: 'high' | 'medium' | 'low';
  earningsData?: {
    quarter: string;
    fiscalYear: number;
    estimatedEPS?: number;
    actualEPS?: number;
    estimatedRevenue?: number;
    actualRevenue?: number;
  };
  dividendData?: {
    amount: number;
    currency: string;
    exDate: Timestamp;
    payDate: Timestamp;
  };
  createdAt: Timestamp;
}
```

### FR-2: Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /portfolios/{portfolioId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
      match /holdings/{holdingId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/portfolios/$(portfolioId)).data.userId);
      }
      match /trades/{tradeId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/portfolios/$(portfolioId)).data.userId);
      }
    }
    match /watchlists/{watchlistId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
      match /stocks/{stockId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/watchlists/$(watchlistId)).data.userId);
      }
    }
    match /instruments/{ticker} {
      allow read: if isAuthenticated();
      allow write: if false;
      match /prices/{date} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }
    match /news/{articleId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

### FR-3: Composite Indexes
```
portfolios/{portfolioId}/holdings: section (Asc) + createdAt (Desc)
portfolios/{portfolioId}/holdings: theme (Asc) + createdAt (Desc)
portfolios/{portfolioId}/trades:   date (Desc) + createdAt (Desc)
news:                              category (Asc) + publishedAt (Desc)
news:                              tickers (Array) + publishedAt (Desc)
events:                            date (Asc) + impact (Desc)
events:                            ticker (Asc) + date (Asc)
```

### FR-4: Cloud Functions (5 Functions, Gen 2)

| Function | Trigger | Schedule | Purpose |
|----------|---------|----------|---------|
| `updateLivePrices` | Pub/Sub | Every 10 min (market hours) | Fetch prices from FMP/Apify, update holdings and portfolio computed values |
| `calculatePortfolioMetrics` | Firestore onWrite | On holding/trade change | Recalculate portfolio totals, percentages, and computed fields |
| `updateTradePerformance` | Pub/Sub | Daily at 00:00 | Calculate P/L for all trades using current prices |
| `fetchNews` | Pub/Sub | Hourly | Fetch from FMP news API, store in news collection |
| `fetchEvents` | Pub/Sub | Daily at 06:00 | Fetch earnings/economic calendars, store in events collection |

### FR-5: FMP API Integration (40+ Endpoints)

**Base URL:** `https://financialmodelingprep.com/stable`
**Auth:** API key via query parameter `?apikey={FMP_API_KEY}`

#### High Priority Endpoints
| Feature | Endpoint |
|---------|----------|
| Batch price refresh | `/stable/batch-quote-short?symbols=` |
| Price change tracking | `/stable/stock-price-change?symbol=` |
| Historical charts | `/stable/historical-price-eod/full?symbol=` |
| Company profile | `/stable/profile?symbol=` |
| ETF info | `/stable/etf/info?symbol=` |
| ETF holdings | `/stable/etf-holder/{symbol}` |
| Key metrics | `/stable/key-metrics?symbol=` |
| Financial ratios | `/stable/ratios?symbol=` |
| Search | `/search?query=` |
| Quote | `/stable/quote?symbol=` |

#### Medium Priority Endpoints
Intraday charts, sector/country weightings, income statement, balance sheet, cash flow, analyst estimates, price targets, grades consensus, stock news, earnings calendar, dividend calendar, sector performance.

#### Low Priority Endpoints
ETF asset exposure, insider trading, institutional holdings, SEC filings, IPO calendar, economic calendar, top gainers/losers/most active, technical indicators.

#### Zod Schema Library
Complete Zod schemas defined for: `FMPQuoteSchema`, `FMPQuoteShortSchema`, `FMPPriceChangeSchema`, `FMPHistoricalPriceSchema`, `FMPHistoricalResponseSchema`, `FMPIntradayPriceSchema`, `FMPProfileSchema`, `FMPETFHoldingSchema`, `FMPETFInfoSchema`, `FMPSectorWeightingSchema`, `FMPCountryWeightingSchema`, `FMPIncomeStatementSchema`, `FMPKeyMetricsSchema`, `FMPAnalystEstimatesSchema`, `FMPPriceTargetConsensusSchema`, `FMPGradesConsensusSchema`, `FMPEarningsCalendarSchema`, `FMPDividendCalendarSchema`, `FMPStockNewsSchema`, `FMPSectorPerformanceSchema`, `FMPMarketMoverSchema`, `FMPTechnicalIndicatorSchema`.

#### Caching Tiers
| Data Type | Revalidate | Reason |
|-----------|-----------|--------|
| Live quotes | 0s | Real-time |
| Intraday charts | 60s | 1 min refresh |
| Daily prices | 3600s | After market close |
| Historical data | 86400s | Rarely changes |
| Profiles | 86400s | Static info |
| Holdings | 3600s | Monthly updates |
| Financials | 86400s | Quarterly updates |
| News | 300s | 5 min freshness |
| Calendars | 3600s | Daily updates |

#### Rate Limit Management
| Tier | Limit | Strategy |
|------|-------|----------|
| Free | 250/day | Aggressive caching, batch requests |
| Starter | 300/min | Standard caching |
| Professional | 750/min | Light caching |

Techniques: batch requests (`/batch-quote-short?symbols=A,B,C`), short endpoints, 24h profile caching, request queuing.

#### LSE Routing
```typescript
const isLSE = symbol.endsWith(".L") || symbol.includes(":LON");
if (isLSE) return apify.getLivePrices([symbol]);
return fmp.getQuote(symbol);
```

#### FMP Client Pattern
```typescript
class FMPClient {
  private apiKey: string;
  private BASE_URL = "https://financialmodelingprep.com/stable";
  
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
      `${this.BASE_URL}${endpoint}?${searchParams.toString()}`,
      { next: { revalidate: options.revalidate ?? 3600 } }
    );
    if (!res.ok) throw new Error(`FMP API Error: ${res.status}`);
    return res.json();
  }
}
```

### FR-6: Stripe Billing

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| Free | 0 GBP | 1 portfolio, 10 holdings | Basic analytics, CSV import |
| Pro | 12 GBP/month | Unlimited | ETF look-through, alerts, overlap analysis, research hub, AI chatbot |

- Stripe Checkout for payment flow
- Stripe webhooks for subscription lifecycle (created, updated, cancelled, expired)
- Subscription status stored in `/users/{userId}/subscription`
- Feature gating via middleware checking subscription tier

### FR-7: Authentication

- Firebase Auth providers: Google, Email/Password
- On first login: create user document in `/users/{userId}`
- Session management: Firebase Auth persistent session
- Sentry user context: set on login (`setUserContext`), clear on logout (`clearUserContext`)

### FR-8: Deployment

- **Frontend:** Vercel (Next.js optimised hosting) at `dashboard.invest.app`
- **Backend:** Firebase (Firestore, Auth, Functions, Storage)
- **Landing page:** Separate project at `invest.app`
- **Source maps:** Uploaded to Sentry via `SENTRY_AUTH_TOKEN`

### FR-9: Observability (Sentry Structured Logging)

#### Logger API
```typescript
logger.debug(featureId, message, data?);
logger.info(featureId, message, data?);
logger.warn(featureId, message, data?);
logger.error(featureId, error, data?);
logger.fatal(featureId, error, data?);
logger.userAction(featureId, action, data?);
logger.pageView(featureId, pageId);
logger.dataFetch(featureId, resource, data?);
logger.dataMutation(featureId, operation, data?);
```

#### Feature IDs
`auth`, `dashboard`, `portfolio`, `etf-search`, `etf-detail`, `research-hub`, `settings`, `onboarding`

#### Environment Behaviour
| Environment | Behaviour |
|-------------|-----------|
| Development | Console only, Sentry disabled |
| Production | Sentry with full context |

#### Configuration Files
`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`

### FR-10: Migration Strategy (4 Phases)

| Phase | Timeline | Tasks |
|-------|----------|-------|
| Phase 1: Setup | Week 1 | Create Firebase project, set up Auth, create Firestore, deploy security rules, create indexes |
| Phase 2: User Migration | Week 2 | Implement auth flow, migrate user profiles, test authentication |
| Phase 3: Data Migration | Weeks 3-4 | Migrate portfolios from localStorage, migrate holdings/trades, test data sync, implement offline support |
| Phase 4: Real-time Features | Weeks 5-6 | Deploy Cloud Functions, implement live price updates, implement news/events sync, test multi-device sync |

## Non-Functional Requirements

- **NFR-1:** Zero data loss during migration from localStorage to Firestore
- **NFR-2:** Initial page load < 2 seconds (with skeleton loading)
- **NFR-3:** Firestore operations < 200ms latency
- **NFR-4:** Market data freshness < 1 hour
- **NFR-5:** 99.9% uptime (Firebase SLA)
- **NFR-6:** GDPR compliant: data minimization, export/delete, clear non-advice disclaimers
- **NFR-7:** Free tier covers 100 users (50K reads/day, 20K writes/day, 1GB storage)
- **NFR-8:** FMP API rate limits never exceeded (monitoring + backoff)

## Technical Specification

### Firestore Patterns
- **Even Path Depth:** All document references must have even segment count
- **Data Converters:** Firestore Data Converters for type-casting at boundary, Zod for validation
- **Timestamps:** Store as `Timestamp` (Firestore), convert to `Date` (JS) at service layer
- **Computed Fields:** Updated by Cloud Functions, not client-side writes

### Architecture Rules
- Complex financial math stays in Common Logic Layer or Cloud Functions, NOT in UI components
- Transactional data: Firestore
- Analytics/Search: BigQuery (via Firebase Extensions, future)
- Market data: Live APIs + Scraped Data
- User portfolio data NEVER sent to third-party APIs

### Environment Variables
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# FMP
FMP_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

## Success Criteria

1. User can sign up, sign in, and access their data from multiple devices
2. Portfolio data syncs in real-time with < 500ms propagation
3. Market prices update every 10 minutes via Cloud Function without client intervention
4. Free/Pro tier gating enforces limits correctly
5. Security rules prevent any cross-user data access
6. Migration from localStorage preserves 100% of data
7. Sentry captures all production errors with feature context

## Constraints & Assumptions

- Solo developer: Firebase chosen over custom backend for development speed
- Free tier must cover MVP and early growth (up to 100 users)
- FMP API free tier (250/day) requires aggressive caching and batching
- Apify required for LSE pricing (FMP coverage insufficient for UK stocks)
- Stripe handles all payment complexity; no custom billing logic
- Landing page is a separate project (not covered here)

## Out of Scope

- BigQuery analytics integration
- Custom email service (Firebase handles transactional emails)
- CDN configuration (Vercel handles this automatically)
- Database migrations (Firestore is schemaless)
- Load testing / capacity planning (premature for MVP)
- Multi-region deployment

## Dependencies

- **Firebase** (Auth, Firestore, Functions Gen 2, Storage, Hosting)
- **FMP API** (Financial Modeling Prep) for market data
- **Apify** for LSE pricing via Google Finance scraping
- **Stripe** for payment processing
- **Sentry** for error tracking and observability
- **Vercel** for frontend deployment
- **Core Domain** (PRD: core-domain) -- types and business logic shared by Functions and frontend
