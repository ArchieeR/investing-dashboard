# Synthesis Part 4: Tech Stack, API Integrations, Architecture & Design System

**Source files synthesized:**
- `Invorm/.agent/skills/portfolio_context/SKILL.md`
- `Invorm/.agent/skills/tech_stack/SKILL.md`
- `Invorm/.agent/skills/fmp_api/SKILL.md`
- `Invorm/.agent/skills/component_architecture/SKILL.md`
- `Invorm/.agent/skills/ui_design_system/SKILL.md`
- `Invorm/.agent/skills/project_structure/SKILL.md`
- `Invorm/.agent/skills/research_hub_implementation/SKILL.md`
- `Invorm/.agent/skills/testing_observability/SKILL.md`
- `Invorm/.agent/rules.md`
- `Invorm/.claude/CLAUDE.md`
- `docs/FIREBASE_ARCHITECTURE.md`

---

## 1. Product Vision & Domain Language

The product is a "Second Brain" for investors, replacing complex Excel spreadsheets with a professional-grade workspace. It evolves from a passive tracker to an active "Agent" capable of managing the portfolio.

### Core Domain Concepts

| Concept | Definition |
|---------|------------|
| **Playground** | The main excel-style grid where users manage holdings. Supports "Drafting" (sandboxing) and "Live" modes. |
| **Look-Through** | Ability to see underlying assets of an ETF (e.g., "Buying S&P 500 means buying 7% Apple"). |
| **Drift** | The difference between Current Allocation and Target Allocation. Examples: "Underweight Tech", "Overweight Cash". |
| **The Analyst (Phase 1 Bot)** | A read-only AI that answers questions about the portfolio and market. |
| **The Agent (Phase 2 Bot)** | An active AI that can execute trades and rebalance portfolios (with permission). |

### User Personas
- **The Aggregator:** Wants to see all accounts (ISA, SIPP, GIA) in one place.
- **The Researcher:** Wants to know exactly what they own (Look-Through).
- **The Automator:** Wants the Agent to alert them when to rebalance.

### Architecture Rules
- Complex financial math (Drift Calculation, Waterfall Targets) stays on the Common Logic Layer (shared by functions and frontend) or in Cloud Functions. It must NOT be buried in UI components.
- Transactional Data: Firestore (`portfolios/{id}`)
- Analytics/Search: BigQuery (via Firebase Extensions)
- Market Data: Live APIs (Finance API) + Scraped Data (Firecrawl)

---

## 2. Tech Stack (Confirmed Decisions)

### Core Stack ("The Golden Path")

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 | App Router |
| **Language** | TypeScript | Strict Mode |
| **Styling** | Tailwind CSS v4 | With `clsx` and `tailwind-merge` for conditional classes |
| **UI Components** | Shadcn UI | Radix Primitives underneath |
| **State (Global)** | React Context | Global Providers |
| **State (Server)** | TanStack Query | Server state management |
| **Backend** | Firebase | Firestore, Auth, Functions Gen 2 |
| **Icons** | Lucide React | Only approved icon library |
| **Charts** | Recharts or Tremor | Either is acceptable |
| **AI** | Genkit (Google AI SDK) | Vertex AI integration |
| **Animations** | Framer Motion | Confirmed in project memory |

### Third Party Data Services

| Service | Purpose |
|---------|---------|
| **FMP (Financial Modeling Prep)** | ETF Holdings & US Market Data (backbone data provider) |
| **Apify** | Real-time LSE Pricing (Google Finance scraping) |
| **Stripe** | Payments - 2 tiers: Free / Pro at 12 GBP/month |
| **Sentry** | Error tracking and structured logging |
| **Genkit + Vertex AI** | AI chat functionality |

### Pricing Tiers
- **Free:** 1 portfolio, 10 holdings
- **Pro:** 12 GBP/month, unlimited portfolios and holdings

### Deployment
- Dashboard at `dashboard.invest.app`
- Landing page is separate (handled externally at `invest.app`)

### Coding Rules

**Styling:**
- Use `clsx` and `tailwind-merge` for conditional classes
- Avoid `style={{}}` unless dynamic

**Components:**
- Server Components: Use for initial data fetching where possible
- Client Components: Use for interactive elements (Grid, Drag-and-Drop)

**Firestore Patterns (CRITICAL):**
- Even Path Depth: All document references must have an even number of segments (e.g., `coll/doc/subcoll/doc`)
- Converters: Always use Firestore Data Converters to type-cast data at the boundary. Use Zod for validation.
- Timestamps: Store as `Timestamp` (Firestore), convert to `Date` (JS) at the Service layer

---

## 3. FMP API Integration (All Endpoints, Zod Schemas, Rate Limits)

### Authentication
- All requests require API key via query parameter: `?apikey={FMP_API_KEY}`
- Key stored in `.env.local` as `FMP_API_KEY`
- Never commit API keys
- Use `/stable` endpoints (not `/api/v3`) for new implementations
- Base URL: `https://financialmodelingprep.com/stable`
- Official docs: https://site.financialmodelingprep.com/developer/docs

### Currently Implemented Endpoints

| Endpoint | Method | Location |
|----------|--------|----------|
| `/search` | `search()` | `fmp_client.ts` |
| `/etf-holder/{symbol}` | `getETFHoldings()` | `fmp_client.ts` |
| `/quote/{symbol}` | `getQuote()` | `fmp_client.ts` |

### All Planned Endpoints by Feature Area

#### Dashboard & Portfolio (High Priority)

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Batch price refresh | `/stable/batch-quote-short?symbols=` | High |
| Price change tracking | `/stable/stock-price-change?symbol=` | High |
| Historical charts | `/stable/historical-price-eod/full?symbol=` | High |
| Intraday charts | `/stable/historical-chart/1hour?symbol=` | Medium |

#### Asset Cards & Explorer

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Company profile | `/stable/profile?symbol=` | High |
| ETF info | `/stable/etf/info?symbol=` | High |
| Sector weightings | `/stable/etf/sector-weightings?symbol=` | Medium |
| Country weightings | `/stable/etf/country-weightings?symbol=` | Medium |
| Which ETFs hold this stock | `/stable/etf/asset-exposure?symbol=` | Low |

#### Research Hub

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Key metrics | `/stable/key-metrics?symbol=` | High |
| Financial ratios | `/stable/ratios?symbol=` | High |
| Income statement | `/stable/income-statement?symbol=` | Medium |
| Balance sheet | `/stable/balance-sheet-statement?symbol=` | Medium |
| Cash flow | `/stable/cash-flow-statement?symbol=` | Medium |
| Analyst estimates | `/stable/analyst-estimates?symbol=` | Medium |
| Price targets | `/stable/price-target-consensus?symbol=` | Medium |
| Grades consensus | `/stable/grades-consensus?symbol=` | Medium |

#### Intelligence Feed

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Stock news | `/stable/news/stock?symbols=` | Medium |
| Insider trading | `/stable/insider-trading/statistics?symbol=` | Low |
| Institutional holdings | `/stable/institutional-ownership/symbol-positions-summary?symbol=` | Low |
| SEC filings | `/stable/sec-filings-search/symbol?symbol=` | Low |

#### Calendars & Alerts

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Earnings calendar | `/stable/earnings-calendar?symbol=` | Medium |
| Dividend calendar | `/stable/dividends-calendar?symbol=` | Medium |
| IPO calendar | `/stable/ipos-calendar` | Low |
| Economic calendar | `/stable/economic-calendar` | Low |

#### Market Overview

| Feature | Endpoint | Priority |
|---------|----------|----------|
| Sector performance | `/stable/sector-performance-snapshot` | Medium |
| Top gainers | `/stable/biggest-gainers` | Low |
| Top losers | `/stable/biggest-losers` | Low |
| Most active | `/stable/most-actives` | Low |

### Complete Zod Schema Library

#### Core Schemas

```typescript
import { z } from "zod";

// Quote (Full)
export const FMPQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changesPercentage: z.number(),
  change: z.number(),
  dayLow: z.number(),
  dayHigh: z.number(),
  yearHigh: z.number(),
  yearLow: z.number(),
  marketCap: z.number(),
  priceAvg50: z.number().optional(),
  priceAvg200: z.number().optional(),
  volume: z.number(),
  avgVolume: z.number(),
  exchange: z.string(),
  open: z.number(),
  previousClose: z.number(),
  eps: z.number().nullable(),
  pe: z.number().nullable(),
  earningsAnnouncement: z.string().nullable(),
  sharesOutstanding: z.number(),
  timestamp: z.number(),
});
export type FMPQuote = z.infer<typeof FMPQuoteSchema>;

// Quote (Short)
export const FMPQuoteShortSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});
export type FMPQuoteShort = z.infer<typeof FMPQuoteShortSchema>;

// Price Change
export const FMPPriceChangeSchema = z.object({
  symbol: z.string(),
  "1D": z.number().optional(),
  "5D": z.number().optional(),
  "1M": z.number().optional(),
  "3M": z.number().optional(),
  "6M": z.number().optional(),
  ytd: z.number().optional(),
  "1Y": z.number().optional(),
  "3Y": z.number().optional(),
  "5Y": z.number().optional(),
  "10Y": z.number().optional(),
  max: z.number().optional(),
});
export type FMPPriceChange = z.infer<typeof FMPPriceChangeSchema>;
```

#### Historical Data Schemas

```typescript
// Historical Price (Single Day)
export const FMPHistoricalPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  adjClose: z.number(),
  volume: z.number(),
  unadjustedVolume: z.number().optional(),
  change: z.number(),
  changePercent: z.number(),
  vwap: z.number().optional(),
  label: z.string().optional(),
  changeOverTime: z.number().optional(),
});
export type FMPHistoricalPrice = z.infer<typeof FMPHistoricalPriceSchema>;

// Historical Price Response
export const FMPHistoricalResponseSchema = z.object({
  symbol: z.string(),
  historical: z.array(FMPHistoricalPriceSchema),
});
export type FMPHistoricalResponse = z.infer<typeof FMPHistoricalResponseSchema>;

// Intraday Price
export const FMPIntradayPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type FMPIntradayPrice = z.infer<typeof FMPIntradayPriceSchema>;
```

#### Company & ETF Schemas

```typescript
// Company Profile
export const FMPProfileSchema = z.object({
  symbol: z.string(),
  companyName: z.string(),
  currency: z.string(),
  cik: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  exchange: z.string(),
  exchangeShortName: z.string(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  country: z.string().optional(),
  fullTimeEmployees: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
  image: z.string().optional(),
  ipoDate: z.string().optional(),
  defaultImage: z.boolean().optional(),
  isEtf: z.boolean(),
  isActivelyTrading: z.boolean(),
  isFund: z.boolean().optional(),
  isAdr: z.boolean().optional(),
  description: z.string().optional(),
});
export type FMPProfile = z.infer<typeof FMPProfileSchema>;

// ETF Holdings
export const FMPETFHoldingSchema = z.object({
  asset: z.string(),
  name: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  shares: z.number(),
  weightPercentage: z.number(),
  marketValue: z.number().optional(),
  updated: z.string(),
});
export type FMPETFHolding = z.infer<typeof FMPETFHoldingSchema>;

// ETF Info
export const FMPETFInfoSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  expenseRatio: z.number().optional(),
  aum: z.number().optional(),
  avgVolume: z.number().optional(),
  domicile: z.string().optional(),
  inceptionDate: z.string().optional(),
  etfCompany: z.string().optional(),
});
export type FMPETFInfo = z.infer<typeof FMPETFInfoSchema>;

// ETF Sector Weighting
export const FMPSectorWeightingSchema = z.object({
  sector: z.string(),
  weightPercentage: z.string(),
});
export type FMPSectorWeighting = z.infer<typeof FMPSectorWeightingSchema>;

// ETF Country Weighting
export const FMPCountryWeightingSchema = z.object({
  country: z.string(),
  weightPercentage: z.string(),
});
export type FMPCountryWeighting = z.infer<typeof FMPCountryWeightingSchema>;
```

#### Financial Statement Schemas

```typescript
// Income Statement
export const FMPIncomeStatementSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string(),
  cik: z.string().optional(),
  fillingDate: z.string().optional(),
  acceptedDate: z.string().optional(),
  calendarYear: z.string(),
  period: z.string(),
  revenue: z.number(),
  costOfRevenue: z.number(),
  grossProfit: z.number(),
  grossProfitRatio: z.number(),
  researchAndDevelopmentExpenses: z.number().optional(),
  sellingGeneralAndAdministrativeExpenses: z.number().optional(),
  operatingExpenses: z.number(),
  operatingIncome: z.number(),
  operatingIncomeRatio: z.number(),
  interestIncome: z.number().optional(),
  interestExpense: z.number().optional(),
  incomeBeforeTax: z.number(),
  incomeTaxExpense: z.number(),
  netIncome: z.number(),
  netIncomeRatio: z.number(),
  eps: z.number(),
  epsdiluted: z.number(),
  weightedAverageShsOut: z.number(),
  weightedAverageShsOutDil: z.number(),
  link: z.string().optional(),
  finalLink: z.string().optional(),
});
export type FMPIncomeStatement = z.infer<typeof FMPIncomeStatementSchema>;

// Key Metrics
export const FMPKeyMetricsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  period: z.string(),
  revenuePerShare: z.number().optional(),
  netIncomePerShare: z.number().optional(),
  operatingCashFlowPerShare: z.number().optional(),
  freeCashFlowPerShare: z.number().optional(),
  cashPerShare: z.number().optional(),
  bookValuePerShare: z.number().optional(),
  marketCap: z.number().optional(),
  enterpriseValue: z.number().optional(),
  peRatio: z.number().nullable(),
  priceToSalesRatio: z.number().optional(),
  pbRatio: z.number().optional(),
  evToSales: z.number().optional(),
  enterpriseValueOverEBITDA: z.number().optional(),
  evToOperatingCashFlow: z.number().optional(),
  evToFreeCashFlow: z.number().optional(),
  earningsYield: z.number().optional(),
  freeCashFlowYield: z.number().optional(),
  debtToEquity: z.number().nullable(),
  debtToAssets: z.number().optional(),
  currentRatio: z.number().optional(),
  dividendYield: z.number().nullable(),
  payoutRatio: z.number().optional(),
  roic: z.number().optional(),
  roe: z.number().optional(),
  roa: z.number().optional(),
});
export type FMPKeyMetrics = z.infer<typeof FMPKeyMetricsSchema>;
```

#### Analyst Data Schemas

```typescript
// Analyst Estimates
export const FMPAnalystEstimatesSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  estimatedRevenueLow: z.number(),
  estimatedRevenueHigh: z.number(),
  estimatedRevenueAvg: z.number(),
  estimatedEbitdaLow: z.number().optional(),
  estimatedEbitdaHigh: z.number().optional(),
  estimatedEbitdaAvg: z.number().optional(),
  estimatedNetIncomeLow: z.number().optional(),
  estimatedNetIncomeHigh: z.number().optional(),
  estimatedNetIncomeAvg: z.number().optional(),
  estimatedEpsLow: z.number(),
  estimatedEpsHigh: z.number(),
  estimatedEpsAvg: z.number(),
  numberAnalystEstimatedRevenue: z.number(),
  numberAnalystsEstimatedEps: z.number(),
});
export type FMPAnalystEstimates = z.infer<typeof FMPAnalystEstimatesSchema>;

// Price Target Consensus
export const FMPPriceTargetConsensusSchema = z.object({
  symbol: z.string(),
  targetHigh: z.number(),
  targetLow: z.number(),
  targetConsensus: z.number(),
  targetMedian: z.number(),
});
export type FMPPriceTargetConsensus = z.infer<typeof FMPPriceTargetConsensusSchema>;

// Grades Consensus
export const FMPGradesConsensusSchema = z.object({
  symbol: z.string(),
  strongBuy: z.number(),
  buy: z.number(),
  hold: z.number(),
  sell: z.number(),
  strongSell: z.number(),
  consensus: z.string(),
});
export type FMPGradesConsensus = z.infer<typeof FMPGradesConsensusSchema>;
```

#### Calendar Schemas

```typescript
// Earnings Calendar
export const FMPEarningsCalendarSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  eps: z.number().nullable(),
  epsEstimated: z.number().nullable(),
  time: z.string().optional(),
  revenue: z.number().nullable(),
  revenueEstimated: z.number().nullable(),
  fiscalDateEnding: z.string().optional(),
  updatedFromDate: z.string().optional(),
});
export type FMPEarningsCalendar = z.infer<typeof FMPEarningsCalendarSchema>;

// Dividend Calendar
export const FMPDividendCalendarSchema = z.object({
  date: z.string(),
  label: z.string().optional(),
  symbol: z.string(),
  dividend: z.number(),
  recordDate: z.string().optional(),
  paymentDate: z.string().optional(),
  declarationDate: z.string().optional(),
});
export type FMPDividendCalendar = z.infer<typeof FMPDividendCalendarSchema>;
```

#### News & Market Schemas

```typescript
// Stock News
export const FMPStockNewsSchema = z.object({
  symbol: z.string(),
  publishedDate: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  site: z.string(),
  text: z.string(),
  url: z.string(),
});
export type FMPStockNews = z.infer<typeof FMPStockNewsSchema>;

// Sector Performance
export const FMPSectorPerformanceSchema = z.object({
  sector: z.string(),
  changesPercentage: z.string(),
});
export type FMPSectorPerformance = z.infer<typeof FMPSectorPerformanceSchema>;

// Market Mover
export const FMPMarketMoverSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  change: z.number(),
  price: z.number(),
  changesPercentage: z.number(),
});
export type FMPMarketMover = z.infer<typeof FMPMarketMoverSchema>;
```

#### Technical Indicator Schemas

```typescript
// Technical Indicator (Generic)
export const FMPTechnicalIndicatorSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  sma: z.number().optional(),
  ema: z.number().optional(),
  wma: z.number().optional(),
  dema: z.number().optional(),
  tema: z.number().optional(),
  rsi: z.number().optional(),
  standardDeviation: z.number().optional(),
  williams: z.number().optional(),
  adx: z.number().optional(),
});
export type FMPTechnicalIndicator = z.infer<typeof FMPTechnicalIndicatorSchema>;
```

### FMP Client Implementation Pattern

```typescript
class FMPClient {
  private apiKey: string;
  private BASE_URL = "https://financialmodelingprep.com/stable";

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
      `${this.BASE_URL}${endpoint}?${searchParams.toString()}`,
      {
        next: { revalidate: options.revalidate ?? 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`FMP API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }
}
```

### Method Naming Conventions

| Prefix | Usage | Example |
|--------|-------|---------|
| `get` | Single resource fetch | `getQuote(symbol)` |
| `list` | Multiple resources | `listHoldings(symbol)` |
| `search` | Query-based lookup | `search(query)` |
| `fetch` | Batch operations | `fetchQuotes(symbols)` |

### Caching Strategy (Cache Tiers)

| Data Type | Revalidate (seconds) | Reason |
|-----------|---------------------|--------|
| Live quotes | `0` | Real-time pricing |
| Intraday charts | `60` | 1 min refresh |
| Daily prices | `3600` | Updates after market close |
| Historical data | `86400` | Rarely changes |
| Profiles | `86400` | Static company info |
| Holdings | `3600` | Updates monthly, cache hourly |
| Financials | `86400` | Quarterly updates |
| News | `300` | 5 min freshness |
| Calendars | `3600` | Daily updates |

### Rate Limit Management

| Tier | Limit | Strategy |
|------|-------|----------|
| Free | 250/day | Aggressive caching, batch requests |
| Starter | 300/min | Standard caching |
| Professional | 750/min | Light caching |

**Optimization Techniques:**
1. **Batch Requests:** Use `/batch-quote-short?symbols=A,B,C` instead of individual calls
2. **Use Short Endpoints:** `/stable/quote-short` for minimal payload
3. **Cache Static Data:** Profile (24h), Holdings (1h)
4. **Request Queuing:** For heavy operations, implement a queue with rate-limited processing

### Error Handling Patterns

- FMP returns empty arrays `[]` for invalid symbols instead of HTTP errors
- Always check for empty response before Zod validation
- Handle 429 (rate limit), 401 (auth error), 500+ (server error) explicitly
- Implement graceful fallbacks (full quote -> short quote -> null)
- Use Zod to catch FMP API schema changes automatically

### When NOT to Use FMP

**Route to Apify for LSE prices:**
```typescript
const isLSE = symbol.endsWith(".L") || symbol.includes(":LON");
if (isLSE) return apify.getLivePrices([symbol]);
return fmp.getQuote(symbol);
```

**Route to Custom Scrapers for UCITS ETF holdings:**
```typescript
const ucitsProviders = ["VANGUARD", "ISHARES", "VANECK", "HANETF"];
if (ucitsProviders.some(p => etf.provider === p)) {
  return customScraper.getHoldings(etf);
}
return fmp.getETFHoldings(etf.symbol);
```

**Use Firestore for user data:** User portfolio data must NEVER go to third-party APIs.

### FMP File Locations

| File | Purpose |
|------|---------|
| `src/services/data_ingestion/fmp_client.ts` | Main FMP client |
| `src/services/data_ingestion/types/fmp.types.ts` | Zod schemas |
| `src/services/data_ingestion/price_fetcher.ts` | Waterfall routing (FMP vs Apify vs custom) |

### FMP Quick Reference (Endpoint Cheatsheet)

```
# Quotes
/stable/quote?symbol=AAPL
/stable/batch-quote-short?symbols=AAPL,MSFT

# Historical
/stable/historical-price-eod/full?symbol=AAPL&from=2024-01-01
/stable/historical-chart/1hour?symbol=AAPL

# Profile & ETF
/stable/profile?symbol=AAPL
/stable/etf/holdings?symbol=SPY
/stable/etf/sector-weightings?symbol=SPY

# Financials
/stable/income-statement?symbol=AAPL&period=quarterly&limit=4
/stable/key-metrics?symbol=AAPL
/stable/ratios-ttm?symbol=AAPL

# Analyst
/stable/analyst-estimates?symbol=AAPL
/stable/price-target-consensus?symbol=AAPL
/stable/grades-consensus?symbol=AAPL

# News & Calendar
/stable/news/stock?symbols=AAPL&limit=10
/stable/earnings-calendar?from=2024-01-01&to=2024-01-31
/stable/dividends-calendar?symbol=AAPL

# Market
/stable/biggest-gainers
/stable/biggest-losers
/stable/most-actives
/stable/sector-performance-snapshot

# Technical Indicators
/stable/technical-indicators/sma?symbol=AAPL&periodLength=20&timeframe=daily
# Timeframes: 1min, 5min, 15min, 30min, 1hour, 4hour, daily

# Common Query Parameters
# Dates: YYYY-MM-DD format (&from=2024-01-01&to=2024-12-31)
# Period: &period=annual or &period=quarterly
# Pagination: &page=0&limit=10
```

### Environment Variables

```
FMP_API_KEY=your_api_key_here
```

---

## 4. Component Architecture (Rules & Patterns)

### Directory Structure

```
src/
├── components/
│   ├── ui/               # [SYSTEM] Generic Radix/Shadcn primitives (Buttons, Inputs)
│   │                     # NEVER put business logic here.
│   ├── modules/          # [FEATURE] Domain-specific component bundles
│   │   ├── intelligence/ # e.g., ETF Search, Poller Status
│   │   ├── dashboard/    # e.g., Allocation Chart, Holdings Table
│   │   └── navigation/   # e.g., Sidebar, Topbar
│   └── layouts/          # [SHELL] Global wrappers and page shells
```

### Decision Logic: "Where Does It Go?"

**Question 1: Is it a generic UI element?**
- Can I use this in a totally different project?
- Does it rely ONLY on props (no API calls)?
- YES -> `src/components/ui/`
- NO -> Go to Question 2

**Question 2: Is it specific to a feature?**
- Does it fetch data about ETFs?
- Does it display User Portfolio data?
- YES -> `src/components/modules/[FeatureName]/`
- Example: `src/components/modules/intelligence/EtfSearchCard.tsx`

**Question 3: Is it specific to ONE page?**
- Is it a specialized header for the Settings page?
- YES -> `src/app/[page]/_components/`

### The "Legos vs. Castles" Rule
- **System Components (`src/components/ui/`):** Dumb, reusable primitives (Buttons, Cards). No business logic. A "Dropdown" goes here.
- **Feature Components (`src/components/features/`):** Smart, domain-aware components. Connect to data and APIs. A "Stock Ticker" goes here.
- **Strict Separation:** A "Stock Ticker" NEVER goes in `ui/`. A "Dropdown" NEVER goes in `features/`.

### Usage with Shadcn & Radix
- ALWAYS check `src/components/ui` first. Do not rebuild a Modal if `Dialog` exists.
- Import strategy:
```typescript
// Correct
import { Button } from "@/components/ui/button";
import { EtfCard } from "@/components/modules/intelligence/EtfCard";
```

---

## 5. Design System (Tokens, Theme, Responsive Rules)

### Theme: "Electric Blue"
- The immutable standard (Slate-950 / Slate-50)
- `globals.css` must define `--primary` as Electric Blue (`221.2 83.2% 53.3%` / `#2563EB`)
- NEVER use hardcoded hex values. ALWAYS use semantic Tailwind classes.

### Color Usage (Dark Mode Compatible)

| Element | Tailwind Class | Context |
|---------|---------------|---------|
| **Background** | `bg-background` | Main page background (Dark Slate / White) |
| **Card Surface** | `bg-card` | Panels, Modals, Popovers |
| **Primary Accent** | `bg-primary` | Main CTA Buttons (Electric Blue) |
| **Text Main** | `text-foreground` | Primary reading text |
| **Text Muted** | `text-muted-foreground` | Secondary labels, descriptions |
| **Borders** | `border-border` | Dividers, Inputs |

### Research Hub "Deep Ocean" Variant (Dark Mode Default)

| Element | Tailwind Class |
|---------|---------------|
| Main Background | `bg-slate-950` |
| Card Background | `bg-slate-900` |
| Borders | `border-slate-800` |
| Primary Text | `text-slate-50` |
| Secondary Text | `text-slate-400` |
| High Impact Accent | `text-red-500` |

### Mobile First Layouts (MANDATORY)
- NEVER design for desktop first
- Start with mobile view (`w-full`, `flex-col`) and use breakpoints to expand

```tsx
// BAD: Hardcoded desktop thinking
<div className="grid grid-cols-3 gap-4">

// GOOD: Responsive expansion
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Top Navbar
- Primary navigation element
- On mobile: navigation items hidden behind a `Sheet` (Drawer) or `DropdownMenu`
- Height: Always `h-16` (64px) to ensure consistent page padding (`pt-16`)

### Spacing & Touch Targets
- Mobile touch: All interactive elements must be at least `h-10` (40px) or `h-12` (48px) on mobile
- Padding: Use `px-4` as minimum container padding on mobile

### Typography
- All text uses the **Inter** font family
- `font-sans` Tailwind utility maps to Inter
- Use `tracking-tight` for Headings (`h1`, `h2`, `h3`) for the "professional dashboard" look
- Headings: `font-semibold tracking-tight`
- Tickers/Data: `font-mono`

### Radius & Borders
- "Premium Slick Constraint": Use small radius (`rounded-md` or `rounded-sm`)
- BANNED: `rounded-xl`, `rounded-2xl`, `rounded-3xl` for main containers
- `globals.css` sets `--radius` to `0.3rem`
- Border style: Subtle 1px borders (`border-border`) to define space, not heavy drop shadows

### Iconography
- Strategic use only -- NOT for decoration
- Library: Always `lucide-react`
- Consistency: Default stroke width (`stroke-2` or `stroke-[1.5]`)

---

## 6. Project Structure (File Layout)

### Top-Level File Structure

```
src/
├── app/                    # Routes and Pages
│   ├── (auth)/...          # Login / Register
│   ├── (dashboard)/
│   │   ├── page.tsx        # Dashboard / Home
│   │   ├── analytics/
│   │   │   └── page.tsx    # Analytics / Risk
│   │   ├── explorer/
│   │   │   └── page.tsx    # ETF Explorer
│   │   ├── research/
│   │   │   └── page.tsx    # News / Research
│   │   └── layout.tsx      # Main shell layout (providers, navbar)
│   └── globals.css         # Tailwind config and global styles
├── components/
│   ├── ui/                 # Dumb, style-only components (Buttons, Inputs)
│   ├── layout/             # Structural elements (Navbar, Sidebar)
│   ├── shared/             # Reusable business elements (e.g., TickerBadge)
│   └── features/
│       ├── dashboard/      # Excel-grid and allocation logic
│       ├── analytics/      # Charts, Matrixes, Risk calculations
│       ├── explorer/       # Search bar and ETF look-through visualization
│       └── research/       # News/Calendar feeds
├── features/               # Feature-based modules (Redux-style slice org if complex)
├── lib/                    # Utilities and Configurations (Firebase init)
└── services/               # Data fetching abstraction (NO direct DB calls in Grid components)
```

### The "Golden Rule" of Locations
**Feature-First:** Code related to a specific feature stays with that feature.
- BAD: Putting `PlaygroundGrid.tsx` in `src/components/tables/`
- GOOD: Putting `PlaygroundGrid.tsx` in `src/components/features/dashboard/`

### Pages-to-Files Map

| User Sees | You Edit |
|-----------|----------|
| **Login / Register** | `src/app/(auth)/...` |
| **Dashboard / Home** | `src/app/(dashboard)/page.tsx` |
| **Analytics / Risk** | `src/app/(dashboard)/analytics/page.tsx` |
| **ETF Explorer** | `src/app/(dashboard)/explorer/page.tsx` |
| **News / Research** | `src/app/(dashboard)/research/page.tsx` |

### Key Files

| File | Purpose |
|------|---------|
| `docs/architecture/project_structure.md` | Detailed canonical documentation |
| `src/app/globals.css` | Tailwind configuration and global styles |
| `src/app/(dashboard)/layout.tsx` | Main shell layout (providers, navbar) |

---

## 7. Research Hub Spec

### Architecture & Location
All implementation in: `src/components/features/intelligence/`

### Required Files
- `MacroCalendar.tsx`
- `NewsFeed.tsx`
- `EarningsRail.tsx`
- `ImpactCard.tsx`

### Component Specifications

#### MacroCalendar (Timeline)
A visualization of high-impact economic events.
- **Props:** `events: MacroEvent[]` (Interface in `src/types/intelligence.ts`)
- **UI Structure:**
  - Vertical timeline layout
  - Current Time Indicator: A horizontal "Now" line
  - Event Nodes:
    - High Impact: Large, Red/Orange indicator. Pulse animation if live.
    - Medium Impact: Smaller, neutral indicator.
  - Grouping: Group events by Day
- **Styling:**
  - Background: `bg-slate-900` (Surface)
  - Text: `text-slate-50` (Primary)
  - Accents: `text-red-500` for "High Impact"

#### NewsFeed (Infinite Scroll)
A curated stream of financial news.
- **Props:** `initialNews: NewsItem[]`
- **Logic:**
  - Infinite Scroll using `IntersectionObserver` (or `react-intersection-observer`)
  - Fetch next page when user reaches bottom 20%
- **Item Layout:**
  - Source Badge: Tiny pill (e.g., "Bloomberg" - Blue, "Reuters" - Orange)
  - Headline: `font-semibold text-sm hover:text-blue-400 cursor-pointer`
  - AI Impact: (Optional) Single sentence explaining why it matters, in `text-slate-400 italic text-xs`
  - Timestamp: Relative time (e.g., "2m ago")

#### EarningsRail (Horizontal Scroll)
A horizontal strip of upcoming earnings reports.
- **Props:** `earnings: EarningEvent[]`
- **UI Structure:**
  - Container: `flex overflow-x-auto space-x-4 p-4 scrollbar-hide`
  - Card: Fixed width (`w-48`), `bg-slate-800` border `border-slate-700`
- **Content:**
  - Ticker: `font-mono text-lg font-bold`
  - Date: "Today Aft-Mkt" or "Oct 24 Pre-Mkt"
  - Est. Move: "Implied +/-5.2%"

#### ImpactCard (AI Summary)
A premium card summarizing a major event (e.g., "Fed Rate Decision").
- **Props:** `event: ImpactEvent`
- **Visuals:**
  - Hero Style: Subtle gradient background (`bg-gradient-to-br from-slate-900 to-slate-800`)
  - Title: Large `h3`
  - Key Points: Bullet list of AI-generated takeaways
  - Market Reaction: Badge showing asset moves (e.g., "SPX +1.2%")

### Research Page Layout

```tsx
// src/app/(dashboard)/research/page.tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
    {/* Left: Macro Context */}
    <div className="lg:col-span-1 h-full overflow-y-auto border-r border-slate-800 pr-4">
        <h2 className="text-lg font-semibold mb-4">Macro Calendar</h2>
        <MacroCalendar events={events} />
    </div>

    {/* Right: News Stream */}
    <div className="lg:col-span-2 h-full overflow-y-auto">
         <h2 className="text-lg font-semibold mb-4">Live Intelligence</h2>
         <NewsFeed initialNews={news} />
    </div>
</div>
```

---

## 8. Testing & Observability Patterns

### Unit Testing Stack

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner (fast, ESM-native) |
| `@testing-library/react` | Component testing |
| `@testing-library/jest-dom` | DOM matchers |
| `jsdom` | Browser environment simulation |

### Test File Convention
Test files live next to source files with `.test.ts` or `.test.tsx` suffix (co-located).

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx
├── services/
│   └── logging/
│       ├── logger.ts
│       └── logger.test.ts
```

### Test Priority

| Priority | What | Example |
|----------|------|---------|
| HIGH | Utility functions | `cn()`, formatters, validators |
| HIGH | Custom hooks | `usePortfolio`, `useAuth` |
| HIGH | Business logic | Calculations, transformations |
| MEDIUM | Component behavior | Button clicks, form submissions |
| MEDIUM | Error states | Error boundaries, fallbacks |
| LOW | Pure UI components | Shadcn primitives (already tested) |

### Test Structure Pattern

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Test Scripts

```bash
npm test              # Watch mode (development)
npm run test:run      # Single run (CI)
npm run test:coverage # With coverage report
```

### Structured Logging with Sentry

#### Overview
The logging service (`src/services/logging/`) provides:
- Feature & Page IDs to track which part of the app generated the log
- Classifications to categorize events
- Severity levels: debug, info, warning, error, fatal
- User context associated with authenticated users

#### Import

```typescript
import { logger, setUserContext } from "@/services/logging";
```

#### Feature IDs (must update when adding features)

```typescript
// src/services/logging/types.ts
export type FeatureId =
  | "auth"
  | "dashboard"
  | "portfolio"
  | "etf-search"
  | "etf-detail"
  | "research-hub"
  | "settings"
  | "onboarding"
  | "YOUR_NEW_FEATURE";
```

#### Page IDs (must update when adding routes)

```typescript
export type PageId =
  | "home"
  | "dashboard"
  | "your-new-page";
```

#### Logger API

```typescript
// Basic Logging
logger.debug("dashboard", "Component mounted", { props });
logger.info("portfolio", "Portfolio synced successfully");
logger.warn("etf-search", "API rate limit approaching", { remaining: 10 });
logger.error("etf-detail", error as Error, { etfSymbol: "VOO" });
logger.fatal("auth", error as Error, { userId });

// Semantic Logging
logger.userAction("etf-search", "Searched for ETF", { query: "VOO" });
logger.pageView("dashboard", "dashboard");
logger.dataFetch("etf-detail", "ETF holdings", { symbol: "VOO" });
logger.dataMutation("portfolio", "Added holding", { symbol: "VOO", shares: 10 });
```

#### User Context

```typescript
import { setUserContext, clearUserContext } from "@/services/logging";

// On login
setUserContext({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  plan: "pro",
});

// On logout
clearUserContext();
```

#### Log Classifications

| Classification | When to Use |
|----------------|-------------|
| `user-action` | User-initiated events (clicks, form submits, gestures) |
| `navigation` | Route changes, page views |
| `data-fetch` | API calls, data loading |
| `data-mutation` | Create, update, delete operations |
| `auth` | Login, logout, session events |
| `error` | Caught exceptions, failures |
| `performance` | Timing metrics, performance data |
| `business` | Business logic events (trade executed, alert triggered) |
| `system` | System-level events (init, config changes) |

#### Environment Behavior

| Environment | Behavior |
|-------------|----------|
| Development | Logs to console only, Sentry disabled |
| Production | Logs to Sentry with full context |

### Feature Development Checklist

**Before Starting:**
- Add Feature ID to `src/services/logging/types.ts`
- Add Page IDs for each route

**During Development:**
- Add `logger.pageView()` to page components
- Add `logger.userAction()` for interactive elements
- Add `logger.dataFetch()` and `logger.dataMutation()` to service calls
- Wrap risky operations with try/catch and `logger.error()`

**Before Merge:**
- Write unit tests for service layer functions
- Write unit tests for custom hooks
- Write component tests for key user interactions
- Run `npm run test:run` - all tests pass
- Run `npm run lint` - no errors

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test runner config with React, jsdom, path aliases |
| `vitest.setup.ts` | Global test setup (jest-dom matchers) |
| `sentry.client.config.ts` | Client-side Sentry init |
| `sentry.server.config.ts` | Server-side Sentry init |
| `sentry.edge.config.ts` | Edge runtime Sentry init |
| `src/instrumentation.ts` | Next.js instrumentation hook |

### Production Sentry Environment Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source map uploads
```

---

## 9. Firebase Architecture

### Services Used
- **Authentication:** User accounts and sessions
- **Firestore:** Primary database for portfolios, holdings, trades
- **Storage:** User uploads (CSV imports, documents)
- **Functions (Gen 2):** Background jobs (price updates, calculations)

### Why Firebase
**Advantages:** Real-time sync, offline support, scalability, built-in security rules, cost-effective (free tier covers MVP), fast development (no backend server).
**Trade-offs:** Query limitations (less flexible than SQL), cost at scale, vendor lock-in.

### Collections Overview

```
users/{userId}                                    # User profile, preferences, subscription
portfolios/{portfolioId}                          # Portfolio metadata, settings, budgets
  holdings/{holdingId}                            # Individual holdings with position data
  trades/{tradeId}                                # Trade history
watchlists/{watchlistId}                          # User watchlists
  stocks/{stockId}                                # Watchlist items
instruments/{ticker}                              # Shared instrument data (read-only for users)
  prices/{date}                                   # Historical prices
news/{articleId}                                  # News articles (read-only for users)
events/{eventId}                                  # Calendar events (read-only for users)
```

### Detailed Schemas

#### Users Collection (`/users/{userId}`)

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
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Timestamp;
  };
  stats: {
    portfolioCount: number;
    holdingCount: number;
    tradeCount: number;
  };
}
```

#### Portfolios Collection (`/portfolios/{portfolioId}`)

```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  type: 'actual' | 'draft' | 'model';
  parentId?: string;              // For draft portfolios
  lists: {
    sections: string[];           // ['Core', 'Satellite', 'Cash']
    themes: string[];             // ['All', 'Tech', 'Healthcare']
    accounts: string[];           // ['ISA', 'SIPP', 'GIA']
    themeSections: Record<string, string>; // theme -> section mapping
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
  computed: {                     // Updated by Cloud Function
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

#### Holdings Subcollection (`/portfolios/{portfolioId}/holdings/{holdingId}`)

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
  price: number;                  // Manual/last known price
  avgCost: number;                // Average cost basis
  livePrice?: number;
  livePriceUpdated?: Timestamp;
  dayChange?: number;
  dayChangePercent?: number;
  originalLivePrice?: number;     // In original currency
  originalCurrency?: string;
  conversionRate?: number;
  include: boolean;               // Include in calculations
  targetPct?: number;             // Target allocation %
  createdAt: Timestamp;
  updatedAt: Timestamp;
  computed: {                     // Updated by Cloud Function
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

#### Trades Subcollection (`/portfolios/{portfolioId}/trades/{tradeId}`)

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
  value: number;                  // price * qty
  createdAt: Timestamp;
  performance?: {                 // Updated by Cloud Function
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    daysHeld: number;
  };
}
```

#### Watchlists Collection (`/watchlists/{watchlistId}`)

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

// Subcollection: /watchlists/{watchlistId}/stocks/{stockId}
interface WatchlistStock {
  ticker: string;
  company: string;
  addedAt: Timestamp;
  price: number;                  // Cached, updated by Cloud Function
  change: number;
  changePercent: number;
  marketCapCategory: 'large' | 'mid' | 'small' | 'micro';
  inPortfolio: boolean;
  portfolioWeight?: number;
}
```

#### Instruments Collection - Shared (`/instruments/{ticker}`)

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

// Subcollection: /instruments/{ticker}/prices/{date}
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

#### News Collection - Shared (`/news/{articleId}`)

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
  sentimentScore?: number;        // -1 to 1
  createdAt: Timestamp;
}
```

#### Events Collection - Shared (`/events/{eventId}`)

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

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    // Users: owner-only read/write
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Portfolios: owner-only with nested holdings/trades
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

    // Watchlists: owner-only with nested stocks
    match /watchlists/{watchlistId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);

      match /stocks/{stockId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/watchlists/$(watchlistId)).data.userId);
      }
    }

    // Instruments, News, Events: read-only for authenticated users, write by Cloud Functions only
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

### Required Composite Indexes

```
portfolios/{portfolioId}/holdings: section (Asc) + createdAt (Desc)
portfolios/{portfolioId}/holdings: theme (Asc) + createdAt (Desc)
portfolios/{portfolioId}/trades:   date (Desc) + createdAt (Desc)
news:                              category (Asc) + publishedAt (Desc)
news:                              tickers (Array) + publishedAt (Desc)
events:                            date (Asc) + impact (Desc)
events:                            ticker (Asc) + date (Asc)
```

### Cloud Functions (Background Jobs)

| Function | Trigger | Schedule | Purpose |
|----------|---------|----------|---------|
| `updateLivePrices` | Pub/Sub scheduled | Every 10 minutes (market hours) | Fetch prices, update holdings and portfolio computed values |
| `calculatePortfolioMetrics` | Firestore onWrite | On holding/trade change | Recalculate portfolio totals and computed fields |
| `updateTradePerformance` | Pub/Sub scheduled | Daily at 00:00 | Calculate P/L for all trades |
| `fetchNews` | Pub/Sub scheduled | Hourly | Fetch from news APIs, store in news collection |
| `fetchEvents` | Pub/Sub scheduled | Daily at 06:00 | Fetch earnings/economic calendar |

### Cost Estimation

**Free Tier Limits:**
- Firestore: 1GB storage, 50K reads/day, 20K writes/day
- Auth: Unlimited
- Functions: 2M invocations/month
- Storage: 5GB

**Estimated Usage (100 users):**
- Reads: ~10K/day, Writes: ~5K/day, Storage: ~100MB, Functions: ~500K/month
- Conclusion: Free tier covers MVP and early growth

### Migration Strategy

| Phase | Timeline | Tasks |
|-------|----------|-------|
| Phase 1: Setup | Week 1 | Create Firebase project, set up Auth, create Firestore, deploy security rules, create indexes |
| Phase 2: User Migration | Week 2 | Implement auth flow, migrate user profiles, test authentication |
| Phase 3: Data Migration | Week 3-4 | Migrate portfolios from localStorage, migrate holdings/trades, test data sync, implement offline support |
| Phase 4: Real-time Features | Week 5-6 | Deploy Cloud Functions, implement live price updates, implement news/events sync, test multi-device sync |

---

## 10. Agent & Workspace Rules

### Multi-Agent Protocol
- **Skill First:** Before implementing any feature, ALWAYS check `.agent/skills/` for a relevant `SKILL.md`
- **Respect the Spec:** If a `SKILL.md` exists, you MUST follow its interface definitions, logic patterns, and architecture
- **No Conflicts:** Do not refactor existing logic without verifying it does not break a pattern defined in `.agent/skills/`

### Shared Skills Architecture
Skills are symlinked: `.claude/skills/` -> `.agent/skills/` (shared between Claude Code and Antigravity agents).

| Skill | File | Purpose |
|-------|------|---------|
| Portfolio Context | `portfolio_context/SKILL.md` | Domain knowledge |
| Tech Stack | `tech_stack/SKILL.md` | Approved technologies |
| Component Architecture | `component_architecture/SKILL.md` | Component patterns |
| UI Design System | `ui_design_system/SKILL.md` | Design tokens, Electric Blue theme |
| FMP API | `fmp_api/SKILL.md` | FMP API integration |
| Project Structure | `project_structure/SKILL.md` | Directory layout |
| Research Hub | `research_hub_implementation/SKILL.md` | Research Hub feature spec |
| Testing & Observability | `testing_observability/SKILL.md` | Vitest + Sentry patterns |

### Documentation Synergy
- When modifying feature logic in `src/`, you MUST immediately update the corresponding spec in `docs/features/`
- Documentation must truthfully reflect the codebase state

### Workflow
1. **Read:** Check `docs/` and `.claude/skills/` first
2. **Plan:** Propose changes
3. **Build:** Implement using TypeScript/Next.js best practices as defined in `docs/architecture/`
4. **Sync:** If you change how a feature works, update its doc in `docs/features/`
