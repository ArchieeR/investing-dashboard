# Asset Research Hub - Complete Specification

## Overview
Comprehensive asset research and comparison tool for stocks, ETFs, and funds. Enables side-by-side comparison of multiple assets and detailed individual asset analysis.

---

## Core Features

### 1. Asset Comparison Tool
Compare multiple assets side-by-side (like Google Finance):
- Add unlimited assets to comparison
- Side-by-side view of key metrics
- Holdings comparison (for ETFs/funds)
- Fee comparison
- Performance comparison
- Interactive charts

### 2. Individual Asset Page
Detailed view for any stock, ETF, or fund:
- Overview & key metrics
- News feed
- Research & analysis
- Performance charts
- Buy/sell ratings
- Fundamental metrics (P/E, P/B, etc.)
- Add to watchlist
- Add to portfolio

### 3. Quick Actions
- Add to watchlist (general or specific)
- Add to portfolio as blank holding
- Compare with other assets
- Share analysis
- Export data

---

## User Interface

### Main View - Asset Search & Compare

```
┌─────────────────────────────────────────────────────────────┐
│ Asset Research Hub                                          │
├─────────────────────────────────────────────────────────────┤
│ [Search assets...                              ] [+ Add]    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AAPL          MSFT          GOOGL         [+ Add More] │ │
│ │ Apple Inc.    Microsoft     Alphabet                   │ │
│ │ [×]           [×]            [×]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Overview] [Holdings] [Performance] [Fees] [Metrics]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐│
│ │              │ AAPL         │ MSFT         │ GOOGL      ││
│ ├──────────────┼──────────────┼──────────────┼────────────┤│
│ │ Price        │ $178.50      │ $380.25      │ $142.80    ││
│ │ Market Cap   │ $2.8T        │ $2.8T        │ $1.8T      ││
│ │ P/E Ratio    │ 29.5         │ 35.2         │ 26.8       ││
│ │ Dividend     │ 0.52%        │ 0.78%        │ —          ││
│ │ 52W High     │ $199.62      │ $420.82      │ $155.33    ││
│ │ 52W Low      │ $164.08      │ $309.45      │ $121.46    ││
│ │ YTD Return   │ +45.2%       │ +52.8%       │ +38.5%     ││
│ └──────────────┴──────────────┴──────────────┴────────────┘│
│                                                             │
│ [Add to Watchlist] [Add to Portfolio] [Export]             │
└─────────────────────────────────────────────────────────────┘
```

---

## Individual Asset Page

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Research                                          │
├─────────────────────────────────────────────────────────────┤
│ Apple Inc. (AAPL)                                           │
│ $178.50  +4.10 (+2.35%)  ↑                                 │
│                                                             │
│ [Add to Watchlist ▼] [Add to Portfolio] [Compare]          │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [News] [Performance] [Metrics] [Research]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Key Metrics                                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Market Cap:    $2.8T        │ P/E Ratio:     29.5      │ │
│ │ Revenue:       $383.3B      │ EPS:           $6.05     │ │
│ │ Profit Margin: 25.3%        │ ROE:           147.2%    │ │
│ │ Dividend:      0.52%        │ Payout Ratio:  15.2%     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Analyst Ratings                                         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Strong Buy: ████████████ 12                            │ │
│ │ Buy:        ████████ 8                                 │ │
│ │ Hold:       ████ 4                                     │ │
│ │ Sell:       ██ 2                                       │ │
│ │ Strong Sell: █ 1                                       │ │
│ │                                                         │ │
│ │ Consensus: BUY  Target: $195.00 (+9.2%)               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Latest News                                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ • Apple Reports Record Q4 Earnings (2h ago)            │ │
│ │ • iPhone 15 Sales Exceed Expectations (5h ago)         │ │
│ │ • Apple Announces New AI Features (1d ago)             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ETF/Fund Comparison

```
┌─────────────────────────────────────────────────────────────┐
│ ETF Comparison: VOO vs VTI vs QQQ                          │
├─────────────────────────────────────────────────────────────┤
│ [Holdings] [Fees] [Performance] [Info]                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐│
│ │              │ VOO          │ VTI          │ QQQ        ││
│ ├──────────────┼──────────────┼──────────────┼────────────┤│
│ │ Name         │ Vanguard S&P │ Vanguard     │ Invesco    ││
│ │              │ 500 ETF      │ Total Market │ QQQ        ││
│ │ Expense      │ 0.03%        │ 0.03%        │ 0.20%      ││
│ │ AUM          │ $350B        │ $320B        │ $220B      ││
│ │ Holdings     │ 503          │ 3,963        │ 101        ││
│ │ Dividend     │ 1.45%        │ 1.38%        │ 0.58%      ││
│ │ YTD Return   │ +18.5%       │ +16.2%       │ +42.8%     ││
│ │ 5Y Return    │ +15.2%       │ +14.8%       │ +22.5%     ││
│ └──────────────┴──────────────┴──────────────┴────────────┘│
│                                                             │
│ Top Holdings Overlap:                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AAPL: VOO (7.1%), VTI (5.8%), QQQ (12.1%)              │ │
│ │ MSFT: VOO (6.8%), VTI (5.5%), QQQ (9.8%)               │ │
│ │ GOOGL: VOO (3.9%), VTI (3.2%), QQQ (5.2%)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Add to Watchlist Flow

### Dropdown Menu
```
┌─────────────────────────────────────────┐
│ Add to Watchlist                   [×]  │
├─────────────────────────────────────────┤
│ Quick Add:                              │
│ [+ Add to General Watchlist]            │
│                                         │
│ Or select specific watchlist:           │
│ ○ 📊 Tech Leaders                       │
│ ○ 💎 Small Cap Gems                     │
│ ○ 💰 Dividend Aristocrats               │
│                                         │
│ [+ Create New Watchlist]                │
│                                         │
│ [Add]  [Cancel]                         │
└─────────────────────────────────────────┘
```

---

## Add to Portfolio Flow

### Modal
```
┌─────────────────────────────────────────┐
│ Add to Portfolio                   [×]  │
├─────────────────────────────────────────┤
│ Asset: AAPL - Apple Inc.                │
│ Current Price: $178.50                  │
│                                         │
│ Add as:                                 │
│ ● Blank Holding (no purchase details)  │
│ ○ With Purchase Details                │
│                                         │
│ Portfolio:                              │
│ [Main Portfolio ▼]                      │
│                                         │
│ [Add to Portfolio]  [Cancel]            │
└─────────────────────────────────────────┘
```

---

## Data Model

### Asset Interface
```typescript
interface Asset {
  ticker: string;
  name: string;
  type: 'stock' | 'etf' | 'fund';
  
  // Price Data
  price: number;
  change: number;
  changePercent: number;
  
  // Key Metrics
  marketCap: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  eps?: number;
  revenue?: number;
  profitMargin?: number;
  roe?: number;
  
  // Performance
  week52High: number;
  week52Low: number;
  ytdReturn: number;
  oneYearReturn: number;
  fiveYearReturn: number;
  
  // ETF/Fund Specific
  expenseRatio?: number;
  aum?: number;
  holdings?: number;
  topHoldings?: Array<{
    ticker: string;
    name: string;
    weight: number;
  }>;
  
  // Ratings
  analystRatings?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    consensus: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    targetPrice: number;
  };
  
  // News
  recentNews?: Array<{
    title: string;
    source: string;
    time: string;
    url: string;
  }>;
}
```

---

## Features by Tab

### Overview Tab
- Key metrics grid
- Price chart
- Quick stats
- Analyst consensus
- Recent news headlines

### Holdings Tab (ETF/Fund only)
- Top 10 holdings
- Sector allocation
- Geographic allocation
- Holdings overlap (when comparing)

### Performance Tab
- Interactive price chart
- Returns table (1D, 1W, 1M, 3M, 6M, YTD, 1Y, 5Y)
- Comparison chart (when multiple assets)
- Volatility metrics
- Risk-adjusted returns

### Fees Tab (ETF/Fund only)
- Expense ratio
- Management fees
- Trading costs
- Total cost of ownership
- Fee comparison

### Metrics Tab
- Valuation metrics (P/E, P/B, P/S, PEG)
- Profitability (Margins, ROE, ROA)
- Growth (Revenue, Earnings, EPS)
- Dividends (Yield, Payout, History)
- Balance sheet (Debt, Cash, Assets)

### Research Tab
- Analyst reports
- Price targets
- Upgrades/downgrades
- Institutional ownership
- Insider trading
- SEC filings

---

## Implementation Phases

### Phase 1: Basic Comparison (MVP)
- [ ] Asset search
- [ ] Add/remove assets to comparison
- [ ] Basic metrics table
- [ ] Overview tab
- [ ] Add to watchlist (general)
- [ ] Add to portfolio (blank)

### Phase 2: Individual Asset Page
- [ ] Detailed asset view
- [ ] Key metrics display
- [ ] Recent news integration
- [ ] Performance chart
- [ ] Add to specific watchlist
- [ ] Add with purchase details

### Phase 3: ETF/Fund Features
- [ ] Holdings comparison
- [ ] Fee comparison
- [ ] Overlap analysis
- [ ] Sector allocation
- [ ] Geographic breakdown

### Phase 4: Advanced Analysis
- [ ] Analyst ratings
- [ ] Price targets
- [ ] Research reports
- [ ] Institutional ownership
- [ ] Insider trading data
- [ ] Technical indicators

### Phase 5: Enhanced Features
- [ ] Custom metrics
- [ ] Saved comparisons
- [ ] Alerts on metrics
- [ ] Export to PDF
- [ ] Share analysis
- [ ] Historical comparisons

---

## Technical Requirements

### Data Sources
- **Price Data:** Yahoo Finance, Alpha Vantage, IEX Cloud
- **Fundamentals:** Financial Modeling Prep, Alpha Vantage
- **ETF Holdings:** ETF Database, Vanguard/iShares APIs
- **News:** NewsAPI, Finnhub, Benzinga
- **Analyst Ratings:** TipRanks, Benzinga, Yahoo Finance

### Performance
- Cache asset data (15-minute refresh)
- Real-time price updates via WebSocket
- Lazy load detailed data
- Optimize comparison calculations
- Background data fetching

---

## UI Components

1. **AssetSearchBar** - Search and add assets
2. **ComparisonGrid** - Side-by-side comparison table
3. **AssetCard** - Individual asset summary
4. **MetricsTable** - Detailed metrics display
5. **HoldingsComparison** - ETF holdings overlap
6. **PerformanceChart** - Interactive price chart
7. **AnalystRatings** - Ratings visualization
8. **NewsF feed** - Recent news list
9. **AddToWatchlistModal** - Watchlist selection
10. **AddToPortfolioModal** - Portfolio addition

---

## User Flows

### Compare Assets
1. Search for first asset
2. Click "Add" to comparison
3. Search and add more assets
4. View side-by-side comparison
5. Switch between tabs
6. Add to watchlist or portfolio

### View Individual Asset
1. Click asset from comparison
2. See detailed view
3. Browse tabs (Overview, News, etc.)
4. Check analyst ratings
5. Add to watchlist or portfolio

### Add to Watchlist
1. Click "Add to Watchlist" dropdown
2. Choose "General" or specific watchlist
3. Or create new watchlist
4. Confirm addition

### Add to Portfolio
1. Click "Add to Portfolio"
2. Choose blank or with details
3. Select portfolio
4. Confirm addition

---

## Future Enhancements

- AI-powered buy/sell recommendations
- Custom screening criteria
- Peer comparison (auto-suggest similar assets)
- Correlation analysis
- Portfolio impact simulation
- What-if scenarios
- Backtesting
- Social sentiment integration
- Community ratings
- Expert analysis integration

---

**Status:** 📋 Specification Complete - Ready for Implementation
**Priority:** High - Core research feature
**Estimated Effort:** 8-12 weeks (full implementation)

**Last Updated:** November 11, 2025
