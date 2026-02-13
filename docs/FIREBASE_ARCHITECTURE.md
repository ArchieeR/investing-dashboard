# Firebase Data Architecture

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** Planning Phase

---

## Overview

This document defines the Firebase/Firestore data structure for the Portfolio Manager application. We're using Firebase for:
- **Authentication** - User accounts and sessions
- **Firestore** - Primary database for portfolios, holdings, trades
- **Storage** - User uploads (CSV imports, documents)
- **Functions** - Background jobs (price updates, calculations)

---

## Why Firebase?

### Advantages
- **Real-time sync** - Multi-device support out of the box
- **Offline support** - Works without internet, syncs when online
- **Scalability** - Handles growth automatically
- **Security** - Built-in security rules
- **Cost-effective** - Free tier covers MVP, pay-as-you-grow
- **Fast development** - No backend server to manage

### Trade-offs
- **Query limitations** - Less flexible than SQL
- **Cost at scale** - Can get expensive with high usage
- **Vendor lock-in** - Harder to migrate away

---

## Data Structure

### Collections Overview

```
users/
  {userId}/
    profile/
    settings/
    
portfolios/
  {portfolioId}/
    metadata/
    holdings/
      {holdingId}/
    trades/
      {tradeId}/
    
watchlists/
  {watchlistId}/
    stocks/
      {stockId}/
      
instruments/
  {ticker}/
    prices/
      {date}/
    fundamentals/
    
news/
  {articleId}/
  
events/
  {eventId}/
```

---

## Detailed Schema

### 1. Users Collection

**Path:** `/users/{userId}`

```typescript
interface User {
  // Identity
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Profile
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  timezone: string;               // e.g., "Europe/London"
  locale: string;                 // e.g., "en-GB"
  currency: string;               // e.g., "GBP"
  
  // Preferences
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
  
  // Subscription
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Timestamp;
  };
  
  // Stats
  stats: {
    portfolioCount: number;
    holdingCount: number;
    tradeCount: number;
  };
}
```

---

### 2. Portfolios Collection

**Path:** `/portfolios/{portfolioId}`

```typescript
interface Portfolio {
  // Identity
  id: string;
  userId: string;                 // Owner
  
  // Metadata
  name: string;
  type: 'actual' | 'draft' | 'model';
  parentId?: string;              // For draft portfolios
  
  // Organization
  lists: {
    sections: string[];           // ['Core', 'Satellite', 'Cash']
    themes: string[];             // ['All', 'Tech', 'Healthcare']
    accounts: string[];           // ['ISA', 'SIPP', 'GIA']
    themeSections: Record<string, string>; // theme -> section mapping
  };
  
  // Settings
  settings: {
    currency: string;
    lockTotal: boolean;
    lockedTotal?: number;
    targetPortfolioValue?: number;
    enableLivePrices: boolean;
    livePriceUpdateInterval: number;
    visibleColumns: Record<string, boolean>;
  };
  
  // Budgets
  budgets: {
    sections: Record<string, BudgetLimit>;
    accounts: Record<string, BudgetLimit>;
    themes: Record<string, BudgetLimit>;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Computed (updated by Cloud Function)
  computed: {
    totalValue: number;
    totalCostBasis: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    holdingCount: number;
    lastPriceUpdate?: Timestamp;
  };
}

interface BudgetLimit {
  amount?: number;
  percent?: number;
  percentOfSection?: number;
}
```

---

### 3. Holdings Subcollection

**Path:** `/portfolios/{portfolioId}/holdings/{holdingId}`

```typescript
interface Holding {
  // Identity
  id: string;
  portfolioId: string;
  
  // Classification
  section: string;
  theme: string;
  assetType: 'ETF' | 'Stock' | 'Crypto' | 'Cash' | 'Bond' | 'Fund' | 'Other';
  
  // Asset Info
  name: string;
  ticker: string;
  exchange: 'LSE' | 'NYSE' | 'NASDAQ' | 'AMS' | 'XETRA' | 'Other';
  account: string;
  
  // Position
  qty: number;
  price: number;                  // Manual/last known price
  avgCost: number;                // Average cost basis
  
  // Live Data (updated by Cloud Function)
  livePrice?: number;
  livePriceUpdated?: Timestamp;
  dayChange?: number;
  dayChangePercent?: number;
  originalLivePrice?: number;     // In original currency
  originalCurrency?: string;
  conversionRate?: number;
  
  // Settings
  include: boolean;               // Include in calculations
  targetPct?: number;             // Target allocation %
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Computed (updated by Cloud Function)
  computed: {
    value: number;                // qty * price
    liveValue?: number;           // qty * livePrice
    costBasis: number;            // qty * avgCost
    gainLoss: number;
    gainLossPercent: number;
    pctOfPortfolio: number;
    pctOfSection: number;
    pctOfTheme: number;
    targetDelta?: number;
  };
}
```

---

### 4. Trades Subcollection

**Path:** `/portfolios/{portfolioId}/trades/{tradeId}`

```typescript
interface Trade {
  // Identity
  id: string;
  portfolioId: string;
  holdingId: string;
  
  // Trade Details
  type: 'buy' | 'sell';
  date: Timestamp;
  price: number;
  qty: number;
  fees?: number;
  notes?: string;
  
  // Computed
  value: number;                  // price * qty
  
  // Timestamps
  createdAt: Timestamp;
  
  // Performance (updated by Cloud Function)
  performance?: {
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    daysHeld: number;
  };
}
```

---

### 5. Watchlists Collection

**Path:** `/watchlists/{watchlistId}`

```typescript
interface Watchlist {
  // Identity
  id: string;
  userId: string;
  
  // Metadata
  name: string;
  description?: string;
  icon: string;
  theme: string;
  
  // Settings
  marketCapFocus: ('large' | 'mid' | 'small')[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Stats
  stats: {
    stockCount: number;
    avgReturn: number;
    avgYield?: number;
  };
}
```

**Stocks Subcollection:** `/watchlists/{watchlistId}/stocks/{stockId}`

```typescript
interface WatchlistStock {
  ticker: string;
  company: string;
  addedAt: Timestamp;
  
  // Cached data (updated by Cloud Function)
  price: number;
  change: number;
  changePercent: number;
  marketCapCategory: 'large' | 'mid' | 'small' | 'micro';
  
  // Portfolio status
  inPortfolio: boolean;
  portfolioWeight?: number;
}
```

---

### 6. Instruments Collection (Shared)

**Path:** `/instruments/{ticker}`

```typescript
interface Instrument {
  // Identity
  ticker: string;
  isin?: string;
  name: string;
  type: 'stock' | 'etf' | 'fund' | 'crypto' | 'bond';
  
  // Market Info
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
  
  // ETF Specific
  etfData?: {
    aum: string;
    expenseRatio: number;
    holdings: number;
    dividendYield: number;
    inceptionDate: string;
    replication: 'Physical' | 'Synthetic';
  };
  
  // Stock Specific
  stockData?: {
    marketCap: string;
    pe?: number;
    eps?: number;
    dividendYield?: number;
    beta?: number;
    high52w?: number;
    low52w?: number;
  };
  
  // Timestamps
  lastUpdated: Timestamp;
}
```

**Prices Subcollection:** `/instruments/{ticker}/prices/{date}`

```typescript
interface Price {
  date: string;                   // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Timestamp;
}
```

---

### 7. News Collection (Shared)

**Path:** `/news/{articleId}`

```typescript
interface NewsArticle {
  id: string;
  
  // Content
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  
  // Metadata
  source: string;
  author?: string;
  publishedAt: Timestamp;
  category: 'market' | 'economic' | 'political' | 'company' | 'crypto';
  
  // Relations
  tickers: string[];              // Related tickers
  sectors: string[];              // Related sectors
  
  // Sentiment (optional)
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;        // -1 to 1
  
  // Timestamps
  createdAt: Timestamp;
}
```

---

### 8. Events Collection (Shared)

**Path:** `/events/{eventId}`

```typescript
interface Event {
  id: string;
  
  // Event Details
  type: 'earnings' | 'dividend' | 'economic' | 'political' | 'split' | 'merger';
  title: string;
  description?: string;
  date: Timestamp;
  time?: string;
  
  // Relations
  ticker?: string;                // For company events
  tickers?: string[];             // For multi-company events
  
  // Impact
  impact: 'high' | 'medium' | 'low';
  
  // Earnings Specific
  earningsData?: {
    quarter: string;
    fiscalYear: number;
    estimatedEPS?: number;
    actualEPS?: number;
    estimatedRevenue?: number;
    actualRevenue?: number;
  };
  
  // Dividend Specific
  dividendData?: {
    amount: number;
    currency: string;
    exDate: Timestamp;
    payDate: Timestamp;
  };
  
  // Timestamps
  createdAt: Timestamp;
}
```

---

## Security Rules

### Basic Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Portfolios
    match /portfolios/{portfolioId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
      
      // Holdings
      match /holdings/{holdingId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/portfolios/$(portfolioId)).data.userId);
      }
      
      // Trades
      match /trades/{tradeId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/portfolios/$(portfolioId)).data.userId);
      }
    }
    
    // Watchlists
    match /watchlists/{watchlistId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
      
      match /stocks/{stockId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/watchlists/$(watchlistId)).data.userId);
      }
    }
    
    // Instruments (read-only for users)
    match /instruments/{ticker} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
      
      match /prices/{date} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }
    
    // News (read-only for users)
    match /news/{articleId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Events (read-only for users)
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

---

## Indexes

### Required Composite Indexes

```javascript
// Holdings by portfolio and section
portfolios/{portfolioId}/holdings
  - section (Ascending)
  - createdAt (Descending)

// Holdings by portfolio and theme
portfolios/{portfolioId}/holdings
  - theme (Ascending)
  - createdAt (Descending)

// Trades by portfolio and date
portfolios/{portfolioId}/trades
  - date (Descending)
  - createdAt (Descending)

// News by category and date
news
  - category (Ascending)
  - publishedAt (Descending)

// News by ticker and date
news
  - tickers (Array)
  - publishedAt (Descending)

// Events by date
events
  - date (Ascending)
  - impact (Descending)

// Events by ticker and date
events
  - ticker (Ascending)
  - date (Ascending)
```

---

## Cloud Functions

### Background Jobs

```typescript
// 1. Update Live Prices (every 5-10 minutes during market hours)
export const updateLivePrices = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    // Fetch prices from Yahoo Finance API
    // Update holdings with live prices
    // Update portfolio computed values
  });

// 2. Calculate Portfolio Metrics (on holding/trade change)
export const calculatePortfolioMetrics = functions.firestore
  .document('portfolios/{portfolioId}/holdings/{holdingId}')
  .onWrite(async (change, context) => {
    // Recalculate portfolio totals
    // Update computed fields
  });

// 3. Update Trade Performance (daily)
export const updateTradePerformance = functions.pubsub
  .schedule('every day 00:00')
  .onRun(async (context) => {
    // Calculate P/L for all trades
    // Update performance metrics
  });

// 4. Fetch News (hourly)
export const fetchNews = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    // Fetch from news APIs
    // Store in news collection
  });

// 5. Fetch Events (daily)
export const fetchEvents = functions.pubsub
  .schedule('every day 06:00')
  .onRun(async (context) => {
    // Fetch earnings calendar
    // Fetch economic calendar
    // Store in events collection
  });
```

---

## Migration Strategy

### Phase 1: Setup (Week 1)
1. Create Firebase project
2. Set up Authentication
3. Create Firestore database
4. Deploy security rules
5. Create indexes

### Phase 2: User Migration (Week 2)
1. Implement auth flow
2. Migrate user profiles
3. Test authentication

### Phase 3: Data Migration (Week 3-4)
1. Migrate portfolios from localStorage
2. Migrate holdings and trades
3. Test data sync
4. Implement offline support

### Phase 4: Real-time Features (Week 5-6)
1. Deploy Cloud Functions
2. Implement live price updates
3. Implement news/events sync
4. Test multi-device sync

---

## Cost Estimation

### Free Tier Limits
- **Firestore:** 1GB storage, 50K reads/day, 20K writes/day
- **Auth:** Unlimited
- **Functions:** 2M invocations/month
- **Storage:** 5GB

### Estimated Usage (100 users)
- **Reads:** ~10K/day (well within free tier)
- **Writes:** ~5K/day (well within free tier)
- **Storage:** ~100MB (well within free tier)
- **Functions:** ~500K/month (well within free tier)

**Conclusion:** Free tier covers MVP and early growth.

---

## Next Steps

1. **Create Firebase project**
2. **Set up development environment**
3. **Implement authentication**
4. **Migrate data structure**
5. **Deploy Cloud Functions**
6. **Test and iterate**

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
