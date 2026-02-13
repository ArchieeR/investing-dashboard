---
name: ai-research
description: Research Hub (Macro/News/Earnings tabs), AI Chat ("The Analyst" via Genkit+Vertex AI), Intelligence Feed, Market Overview, and ETF Explorer with FMP API integration.
status: backlog
created: 2026-02-13T10:51:08Z
---

# PRD: AI & Research Features

## Executive Summary

This PRD covers the intelligence and research capabilities of the portfolio intelligence platform: the Research Hub (3-tab layout with Macro Calendar, News Feed, and Earnings Rail), the AI Chat system ("The Analyst" powered by Genkit + Vertex AI / Google Gemini), the Intelligence Feed (alerts for earnings, dividends, and market events), Market Overview (sector performance, top movers), and the ETF Explorer (discovery, look-through, overlap analysis). All features leverage the FMP API for data and Zod schemas for validation.

## Problem Statement

Retail investors spend hours across multiple sources (Bloomberg, Reuters, broker platforms, spreadsheets) to research investments. They lack a unified research workspace that connects market intelligence to their actual portfolio. The research features must: (1) aggregate macro-economic events, news, and earnings data in one view, (2) provide AI-powered portfolio analysis and Q&A, (3) surface relevant events based on portfolio holdings, and (4) enable deep ETF research with look-through and overlap analysis. The competitive differentiator is contextualising all research relative to the user's actual portfolio.

## User Stories

### Feature 1: Research Hub

#### US-1.1: Macro Calendar
**As a** macro-aware investor,
**I want to** see a timeline of high-impact economic events,
**So that** I can prepare for market-moving announcements.

**Acceptance Criteria:**
- Vertical timeline layout grouped by day
- Current time indicator: horizontal "Now" line
- Event nodes sized by impact: High (large, red/orange, pulse animation if live), Medium (smaller, neutral)
- Events sourced from FMP `/stable/economic-calendar`
- Styling: `bg-slate-900` background, `text-slate-50` primary text, `text-red-500` for high-impact
- Shows: event name, time, expected value, previous value, actual value (if released)
- Filterable by impact level (high/medium/low)

#### US-1.2: News Feed with Infinite Scroll
**As a** research-oriented investor,
**I want to** scroll through a curated stream of financial news,
**So that** I stay informed about market developments.

**Acceptance Criteria:**
- Infinite scroll using `IntersectionObserver` (or `react-intersection-observer`)
- Fetch next page when user reaches bottom 20%
- Each news item shows: source badge (pill, colour-coded by source), headline (`font-semibold text-sm`), AI impact summary (italic, `text-slate-400`, `text-xs`), relative timestamp
- News sourced from FMP `/stable/news/stock?symbols=` for portfolio-relevant news
- Filter by: category (market/economic/political/company), sentiment (positive/neutral/negative)
- Portfolio-contextualised: highlights news related to user's holdings
- Source badges: Bloomberg (blue), Reuters (orange), FT (salmon), etc.

#### US-1.3: Earnings Rail
**As a** investor tracking earnings season,
**I want to** see a horizontal strip of upcoming earnings reports,
**So that** I know when my holdings report.

**Acceptance Criteria:**
- Horizontal scroll container: `flex overflow-x-auto space-x-4 p-4 scrollbar-hide`
- Fixed-width cards (`w-48`): `bg-slate-800` with `border-slate-700`
- Each card shows: ticker (`font-mono text-lg font-bold`), date/time ("Today Aft-Mkt" or "Oct 24 Pre-Mkt"), estimated move ("Implied +/-5.2%")
- Data from FMP `/stable/earnings-calendar?symbol=`
- Highlights holdings from user's portfolio with accent border
- Sortable by date (default: soonest first)

#### US-1.4: Impact Card (AI Summary)
**As a** investor,
**I want** AI-generated summaries of major market events,
**So that** I can quickly understand the key takeaways.

**Acceptance Criteria:**
- Premium card with gradient background: `bg-gradient-to-br from-slate-900 to-slate-800`
- Title as large `h3`
- Key points: bullet list of AI-generated takeaways
- Market reaction badge showing asset moves (e.g., "SPX +1.2%")
- Generated via Genkit + Vertex AI using event context + portfolio holdings
- Rendered at top of Research page for the day's most impactful event

### Feature 2: AI Chat ("The Analyst")

#### US-2.1: Portfolio Q&A
**As a** investor,
**I want to** ask natural language questions about my portfolio,
**So that** I can get instant analysis without manual spreadsheet work.

**Acceptance Criteria:**
- Chat interface with message history
- User can ask: "What is my allocation to tech?", "Am I overweight in any sector?", "What should I rebalance?", "How has VWRL performed this month?"
- AI has read-only access to portfolio data (holdings, allocations, budgets, trades, performance)
- Responses include specific numbers, percentages, and holding names from the portfolio
- Response time < 3 seconds
- Helpful responses rate target: 80%+

#### US-2.2: Market Research Q&A
**As a** researcher,
**I want to** ask about market conditions and specific instruments,
**So that** I can make informed investment decisions.

**Acceptance Criteria:**
- AI can answer: "What does MSFT's earnings report show?", "Compare VWRL and VUSA", "What sectors are outperforming?"
- Uses FMP API data for factual answers (profiles, financials, key metrics)
- Clearly distinguishes between factual data and AI analysis
- Includes disclaimer: "This is not financial advice"
- Can reference multiple FMP endpoints to compile comprehensive answers

#### US-2.3: AI Implementation
**As a** developer,
**I want** a clear AI architecture using Genkit + Vertex AI,
**So that** the AI features are maintainable and extensible.

**Acceptance Criteria:**
- Genkit SDK for orchestration and prompt management
- Vertex AI (Google Gemini) as the LLM provider
- Structured prompts with portfolio context injection
- Tool/function calling for FMP API data retrieval
- Conversation history maintained per session
- Rate limiting to prevent abuse (especially on free tier)
- Pro tier only (feature gated)

### Feature 3: Intelligence Feed

#### US-3.1: Earnings Alerts
**As a** investor,
**I want to** be alerted when companies in my portfolio report earnings,
**So that** I can review results promptly.

**Acceptance Criteria:**
- Earnings data from FMP `/stable/earnings-calendar?symbol=`
- Shows: date, symbol, EPS estimate vs actual, revenue estimate vs actual
- Beat/miss indicator with colour coding (green beat, red miss)
- Fiscal date ending and reporting period
- Filtered to user's portfolio holdings by default
- Optional: all upcoming earnings (not just portfolio holdings)

#### US-3.2: Dividend Alerts
**As a** income investor,
**I want to** see upcoming dividend events for my holdings,
**So that** I can plan around ex-dates and payment dates.

**Acceptance Criteria:**
- Dividend data from FMP `/stable/dividends-calendar?symbol=`
- Shows: symbol, dividend amount, ex-date, record date, payment date, declaration date
- Filtered to user's portfolio holdings
- Calendar view option showing dividend dates on a month grid

#### US-3.3: Portfolio-Contextualised Alerts
**As a** investor,
**I want** intelligence alerts ranked by relevance to my portfolio,
**So that** the most important information surfaces first.

**Acceptance Criteria:**
- Alerts ranked by: (1) holdings in portfolio, (2) sector overlap, (3) general market
- Each alert shows portfolio weight/exposure of the affected holding
- ETF membership: shows % weight within each relevant ETF
- Notification preferences configurable in settings (email, push, in-app)

### Feature 4: Market Overview

#### US-4.1: Sector Performance
**As a** investor monitoring the market,
**I want to** see sector performance at a glance,
**So that** I can identify market trends.

**Acceptance Criteria:**
- Data from FMP `/stable/sector-performance-snapshot`
- Shows each sector with percentage change, colour-coded
- Ordered by performance (best to worst or vice versa)
- Cross-references with user's portfolio sector allocation

#### US-4.2: Top Movers
**As a** investor looking for opportunities,
**I want to** see today's top gainers, losers, and most active stocks,
**So that** I can identify potential trading opportunities.

**Acceptance Criteria:**
- Three panels: Top Gainers (`/stable/biggest-gainers`), Top Losers (`/stable/biggest-losers`), Most Active (`/stable/most-actives`)
- Each shows: symbol, name, price, change, change percent
- Colour-coded: green for gains, red for losses
- Uses `FMPMarketMoverSchema` for Zod validation
- Links to asset detail page for each stock

### Feature 5: ETF Explorer (Enhanced)

#### US-5.1: ETF Discovery with Real Data
**As a** investor researching ETFs,
**I want to** search and filter ETFs using real market data,
**So that** I can find suitable ETFs based on actual characteristics.

**Acceptance Criteria:**
- Data from FMP: `/stable/etf/info?symbol=` for ETF metadata, `/stable/profile?symbol=` for profile
- Filter by: region, category, expense ratio range, AUM range, dividend yield
- Text search by name, ticker, or ISIN
- Card grid showing: name, ticker, expense ratio, AUM, yield, sector focus
- Sort by: expense ratio, AUM, yield, performance
- Uses `FMPETFInfoSchema` and `FMPProfileSchema` for validation

#### US-5.2: ETF Look-Through
**As a** investor wanting to understand my true exposure,
**I want to** see the underlying holdings of my ETFs,
**So that** I know exactly what I own.

**Acceptance Criteria:**
- ETF holdings from FMP `/stable/etf-holder/{symbol}` (US) or custom scraper (UCITS)
- Shows: asset ticker, name, weight percentage, market value, shares
- Aggregated view: combined exposure across all portfolio ETFs
- Table: symbol, name, totalWeight, totalValue, exposures by ETF
- Uses `FMPETFHoldingSchema` for validation
- UCITS ETF handling: route to custom scrapers for Vanguard, iShares, VanEck, HANetF providers

#### US-5.3: ETF Overlap Analysis
**As a** investor with multiple ETFs,
**I want to** see overlap between my ETFs,
**So that** I can avoid unintentional concentration.

**Acceptance Criteria:**
- Heatmap matrix showing overlap percentage between all portfolio ETFs
- Grid layout: `120px + repeat(N, 80px)` columns
- Common holdings table: stocks that appear in multiple ETFs with combined weight
- Colour gradient: low overlap (green) to high overlap (red)
- Sector and country weighting comparison between ETFs
- Data from FMP `/stable/etf/sector-weightings?symbol=` and `/stable/etf/country-weightings?symbol=`

#### US-5.4: ETF Detail Page
**As a** investor researching a specific ETF,
**I want to** see comprehensive ETF data including holdings, sectors, and countries,
**So that** I can make an informed investment decision.

**Acceptance Criteria:**
- Modal overlay: `rgba(0, 0, 0, 0.8)` with `backdrop-filter: blur(10px)`
- Tabs: Overview, Holdings, Sectors, Countries, Performance
- Overview: expense ratio, AUM, inception date, provider, domicile, replication method
- Holdings: top 20 with full list expandable
- Sectors: pie/bar chart of sector weights
- Countries: pie/bar chart of country weights
- Performance: historical chart with multiple time periods

### Feature 6: Asset Research Hub

#### US-6.1: Universal Asset Search
**As a** researcher,
**I want to** search for any stock, ETF, or fund,
**So that** I can research any instrument.

**Acceptance Criteria:**
- Search via FMP `/search?query=`
- Results show: ticker, company name, exchange, type (stock/ETF/fund)
- Type-ahead with debounce (300ms)
- Quick actions: add to watchlist, add to portfolio, compare, view detail

#### US-6.2: Asset Comparison
**As a** investor comparing options,
**I want to** compare up to 4 assets side-by-side,
**So that** I can make relative comparisons.

**Acceptance Criteria:**
- Side-by-side comparison (up to 4 assets)
- Tabs: Overview, Fundamentals, Performance, Risk
- Data from: `/stable/profile`, `/stable/key-metrics`, `/stable/ratios`, `/stable/historical-price-eod/full`
- Key metrics: P/E, P/S, P/B, EV/EBITDA, dividend yield, ROE, ROA, debt-to-equity
- Performance chart overlay with multiple time periods
- Highlight best/worst in each metric

#### US-6.3: Asset Detail Page
**As a** investor researching a specific stock,
**I want to** see comprehensive data including fundamentals, news, and analyst estimates,
**So that** I can make an informed decision.

**Acceptance Criteria:**
- Overview: profile, key stats, price chart
- Fundamentals from FMP: income statement (`/stable/income-statement`), balance sheet (`/stable/balance-sheet-statement`), cash flow (`/stable/cash-flow-statement`)
- Analyst data: estimates (`/stable/analyst-estimates`), price targets (`/stable/price-target-consensus`), grades consensus (`/stable/grades-consensus`)
- News: stock-specific news (`/stable/news/stock?symbols=`)
- Performance: historical price chart, multi-period returns
- Uses corresponding Zod schemas for all FMP data

## Functional Requirements

### FR-1: Research Hub Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
  {/* Left: Macro Context (1/3) */}
  <div className="lg:col-span-1 h-full overflow-y-auto border-r border-slate-800 pr-4">
    <h2 className="text-lg font-semibold mb-4">Macro Calendar</h2>
    <MacroCalendar events={events} />
  </div>
  {/* Right: News Stream (2/3) */}
  <div className="lg:col-span-2 h-full overflow-y-auto">
    <h2 className="text-lg font-semibold mb-4">Live Intelligence</h2>
    <EarningsRail earnings={earnings} />
    <NewsFeed initialNews={news} />
  </div>
</div>
```

### FR-2: Research Hub Components

**MacroCalendar:**
- Props: `events: MacroEvent[]`
- Vertical timeline with day grouping
- "Now" line indicator
- Impact-based sizing and colouring

**NewsFeed:**
- Props: `initialNews: NewsItem[]`
- Infinite scroll with `IntersectionObserver`
- Fetch next page at bottom 20%
- Source badges, headlines, AI impact, relative time

**EarningsRail:**
- Props: `earnings: EarningEvent[]`
- Container: `flex overflow-x-auto space-x-4 p-4 scrollbar-hide`
- Cards: `w-48`, `bg-slate-800`, `border-slate-700`
- Content: ticker (mono, lg, bold), date, estimated move

**ImpactCard:**
- Props: `event: ImpactEvent`
- Gradient background: `from-slate-900 to-slate-800`
- AI-generated key points and market reaction badges

### FR-3: AI Chat Architecture

**Stack:** Genkit SDK + Vertex AI (Google Gemini)

**System Prompt Includes:**
- User's portfolio summary (holdings, allocations, budgets, total value)
- Current market context (sector performance, major indices)
- Conversation history

**Tool Calling Functions:**
- `getPortfolioHoldings()` -- returns user's holdings with current values
- `getHoldingDetail(ticker)` -- returns detailed holding info
- `getAssetProfile(ticker)` -- calls FMP `/stable/profile`
- `getKeyMetrics(ticker)` -- calls FMP `/stable/key-metrics`
- `getEarningsCalendar(ticker)` -- calls FMP `/stable/earnings-calendar`
- `getStockNews(ticker)` -- calls FMP `/stable/news/stock`
- `getSectorPerformance()` -- calls FMP `/stable/sector-performance-snapshot`

**Response Format:**
- Structured markdown with data tables
- Source attribution (which FMP endpoint provided the data)
- Confidence indicators where applicable
- Mandatory disclaimer: "This is not financial advice"

### FR-4: FMP API Endpoints Referenced

| Feature | Endpoint | Zod Schema |
|---------|----------|------------|
| Earnings calendar | `/stable/earnings-calendar?symbol=` | `FMPEarningsCalendarSchema` |
| Dividend calendar | `/stable/dividends-calendar?symbol=` | `FMPDividendCalendarSchema` |
| Stock news | `/stable/news/stock?symbols=` | `FMPStockNewsSchema` |
| Sector performance | `/stable/sector-performance-snapshot` | `FMPSectorPerformanceSchema` |
| Top gainers | `/stable/biggest-gainers` | `FMPMarketMoverSchema` |
| Top losers | `/stable/biggest-losers` | `FMPMarketMoverSchema` |
| Most active | `/stable/most-actives` | `FMPMarketMoverSchema` |
| Company profile | `/stable/profile?symbol=` | `FMPProfileSchema` |
| ETF info | `/stable/etf/info?symbol=` | `FMPETFInfoSchema` |
| ETF holdings | `/stable/etf-holder/{symbol}` | `FMPETFHoldingSchema` |
| ETF sector weights | `/stable/etf/sector-weightings?symbol=` | `FMPSectorWeightingSchema` |
| ETF country weights | `/stable/etf/country-weightings?symbol=` | `FMPCountryWeightingSchema` |
| Key metrics | `/stable/key-metrics?symbol=` | `FMPKeyMetricsSchema` |
| Financial ratios | `/stable/ratios?symbol=` | (ratios schema) |
| Income statement | `/stable/income-statement?symbol=` | `FMPIncomeStatementSchema` |
| Analyst estimates | `/stable/analyst-estimates?symbol=` | `FMPAnalystEstimatesSchema` |
| Price targets | `/stable/price-target-consensus?symbol=` | `FMPPriceTargetConsensusSchema` |
| Grades consensus | `/stable/grades-consensus?symbol=` | `FMPGradesConsensusSchema` |
| Historical prices | `/stable/historical-price-eod/full?symbol=` | `FMPHistoricalPriceSchema` |
| Search | `/search?query=` | (search schema) |
| Economic calendar | `/stable/economic-calendar` | (calendar schema) |

### FR-5: Component File Locations
All Research Hub components in: `src/components/features/intelligence/`
- `MacroCalendar.tsx`
- `NewsFeed.tsx`
- `EarningsRail.tsx`
- `ImpactCard.tsx`
- `AIChat.tsx`
- `IntelligenceFeed.tsx`
- `MarketOverview.tsx`

Types in: `src/types/intelligence.ts`

### FR-6: "Deep Ocean" Styling Variant
The Research Hub uses a darker variant of the design system:

| Element | Class |
|---------|-------|
| Main Background | `bg-slate-950` |
| Card Background | `bg-slate-900` |
| Borders | `border-slate-800` |
| Primary Text | `text-slate-50` |
| Secondary Text | `text-slate-400` |
| High Impact | `text-red-500` |

## Non-Functional Requirements

- **NFR-1:** AI chat response time < 3 seconds
- **NFR-2:** News feed loads initial 20 items in < 1 second
- **NFR-3:** Infinite scroll appends next page in < 500ms
- **NFR-4:** ETF look-through aggregation handles 10 ETFs with 500+ holdings each in < 2 seconds
- **NFR-5:** Overlap heatmap renders for up to 20 ETFs without performance issues
- **NFR-6:** AI helpful response rate > 80%
- **NFR-7:** All FMP data validated via Zod before rendering (fail gracefully on schema mismatch)
- **NFR-8:** Research Hub works with stale data when FMP is unavailable (shows last cached data)

## Technical Specification

### AI Architecture
- **Orchestration:** Genkit SDK manages prompts, tools, and conversation flow
- **LLM:** Vertex AI / Google Gemini (model selection configurable)
- **Context Window:** Portfolio data serialised into system prompt (holdings summary, not raw data)
- **Tools:** Function calling for FMP API data retrieval (keeps LLM focused on analysis, not data fetching)
- **Safety:** No write operations from AI; AI is read-only ("The Analyst" phase)
- **Future:** "The Agent" phase will add write capabilities (trade execution, rebalancing) with explicit user permission

### Data Flow
```
Research Page
  |
  +-> MacroCalendar <- Cloud Function (fetchEvents) -> Firestore (events collection)
  +-> NewsFeed <- Cloud Function (fetchNews) -> Firestore (news collection)
  +-> EarningsRail <- FMP /earnings-calendar (client-side, cached)
  +-> ImpactCard <- Genkit/Vertex AI (server-side)
  +-> AIChat <- Genkit/Vertex AI + FMP Tool Calling (server-side)
```

### UCITS ETF Handling
```typescript
const ucitsProviders = ["VANGUARD", "ISHARES", "VANECK", "HANETF"];
if (ucitsProviders.some(p => etf.provider === p)) {
  return customScraper.getHoldings(etf);
}
return fmp.getETFHoldings(etf.symbol);
```

### Rate Limit Considerations for Research Features
- News: cached for 5 minutes (`revalidate: 300`)
- Calendars: cached for 1 hour (`revalidate: 3600`)
- Profiles: cached for 24 hours (`revalidate: 86400`)
- AI chat: rate-limited per user (10 requests/hour free, 100/hour pro)
- Batch requests used wherever possible

## Success Criteria

1. Research Hub renders all 3 tabs (Macro Calendar, News Feed, Earnings Rail) with real FMP data
2. AI Chat answers portfolio questions with specific data points from user's holdings
3. ETF look-through correctly aggregates underlying holdings across multiple ETFs
4. Overlap heatmap accurately calculates shared holdings between ETFs
5. Intelligence Feed surfaces relevant earnings/dividend alerts for portfolio holdings
6. Market Overview shows real-time sector performance with portfolio cross-reference
7. All FMP API responses validate against Zod schemas with graceful degradation on mismatch

## Constraints & Assumptions

- AI Chat is Pro tier only (12 GBP/month)
- Vertex AI costs are managed server-side; budget alerts set for unexpected spikes
- FMP free tier (250/day) requires aggressive caching for research features
- UCITS ETF holdings may not be available via FMP; custom scrapers needed
- News sentiment analysis depends on FMP data quality (may add custom NLP later)
- "The Analyst" is read-only (Phase 1); "The Agent" with write capabilities is Phase 2+
- Economic calendar events may have limited coverage outside US/UK

## Out of Scope

- "The Agent" (Phase 2) -- AI that executes trades and rebalances portfolios
- Custom NLP sentiment analysis beyond FMP-provided sentiment
- Full financial modelling (DCF, Monte Carlo simulations)
- Social/community features (sharing research, following analysts)
- Education academy and quiz system
- Push notifications for mobile (in-app alerts only for MVP)
- Factor analysis (Fama-French) and advanced quantitative research

## Dependencies

- **Genkit SDK** -- AI orchestration framework
- **Vertex AI / Google Gemini** -- LLM provider
- **FMP API** (PRD: infrastructure) -- all market data endpoints
- **Firebase Firestore** (PRD: infrastructure) -- news and events collections
- **Cloud Functions** (PRD: infrastructure) -- `fetchNews` and `fetchEvents` scheduled functions
- **Core Domain** (PRD: core-domain) -- portfolio data for AI context injection
- **UI Design System** (PRD: ui-design-system) -- Deep Ocean variant styling
- **Apify** -- for UCITS ETF holdings scraping where FMP lacks coverage
