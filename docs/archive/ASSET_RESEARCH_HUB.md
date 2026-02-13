# Asset Research Hub

**Date:** November 11, 2025  
**Status:** ✅ Implemented

---

## Overview

The Asset Research Hub replaces the basic ETF Analysis tab with a comprehensive asset research and comparison system. Users can search, compare, and analyze stocks, ETFs, and funds with detailed metrics, news, and performance data.

---

## Features

### 1. Asset Search & Discovery
- **Universal Search**: Search across stocks, ETFs, and funds by ticker or name
- **Filter by Type**: Quick filters for All, Stock, ETF, or Fund
- **Rich Asset Cards**: Display key metrics at a glance
  - Current price and day change
  - ETF metrics: Expense ratio, holdings count, dividend yield
  - Stock metrics: P/E ratio, market cap, dividend yield
- **Add to Compare**: Select up to 4 assets for side-by-side comparison

### 2. Individual Asset Pages
Each asset has a dedicated detail page with multiple tabs:

#### Overview Tab
- **Key Metrics Card**
  - ETFs: AUM, expense ratio, holdings, yield, inception date, replication method
  - Stocks: Market cap, P/E, EPS, dividend yield, 52W high/low, beta
- **About Section**: Description, sector, and industry tags
- **Analyst Rating** (stocks only): Buy/sell rating with target price

#### News Tab
- Latest news articles related to the asset
- Source, timestamp, and summary
- Mock data currently - ready for API integration

#### Performance Tab
- Historical performance across multiple timeframes
- 1 Day, 1 Week, 1 Month, 3 Months, 6 Months, YTD, 1 Year, 3 Years
- Color-coded gains/losses

#### Holdings Tab (ETFs only)
- **Top 10 Holdings**: Ticker, name, and weight percentage
- **Sector Allocation**: Visual breakdown with progress bars
- **Geographic Allocation**: Country-level exposure with progress bars

#### Metrics Tab (Stocks only)
- **Valuation Metrics**: P/E, Forward P/E, PEG, Price/Sales, Price/Book
- **Profitability**: Profit margin, operating margin, ROE, ROA
- **Financial Health**: Debt/Equity, current ratio, quick ratio

#### Action Buttons
- **Add to Watchlist**: Select from existing watchlists
- **Add to Portfolio**: Quick add as blank holding

### 3. Asset Comparison
Side-by-side comparison of 2-4 assets:

#### Comparison Table
- **Basic Info**: Type, exchange, sector
- **Pricing**: Current price, day change
- **Type-Specific Metrics**:
  - ETFs: AUM, expense ratio, holdings, yield, replication, inception
  - Stocks: Market cap, P/E, EPS, dividend yield, beta, 52W range, analyst rating
- **Performance**: Historical returns across all timeframes
- **Best-in-class highlighting**: Automatically highlights best performers

#### ETF Overlap Analysis (2 ETFs only)
- **Overlap by Weight**: Percentage of portfolio overlap
- **Common Holdings**: Number of shared positions
- **Correlation**: Statistical correlation coefficient
- **Top Overlapping Holdings**: List of shared positions with weights

#### Comparison Insights
- AI-generated insights highlighting:
  - Lowest expense ratios
  - Best diversification
  - Highest yields
  - Best value (lowest P/E)
  - Investment recommendations based on comparison

---

## Integration Points

### Watchlist Integration
- Add assets to existing watchlists from detail page
- Modal selector shows all available watchlists
- Seamless flow between Assets and Watchlist tabs

### Portfolio Integration
- "Add to Portfolio" button on asset detail page
- Creates blank holding ready for user to add quantity
- Pre-fills ticker, name, exchange, and asset type

### Navigation
- Accessible from Research page → Assets tab
- Back navigation to search from detail/comparison views
- Breadcrumb-style navigation flow

---

## Data Structure

### Asset Interface
```typescript
interface Asset {
  ticker: string;
  name: string;
  type: 'stock' | 'etf' | 'fund';
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  currency: 'GBP' | 'USD' | 'EUR';
  sector?: string;
  description: string;
  etfData?: ETFData;
  stockData?: StockData;
}
```

### ETF Data
- AUM, expense ratio, holdings count
- Dividend yield, inception date, replication method
- Top holdings with weights
- Sector and geographic allocation

### Stock Data
- Market cap, P/E, EPS, dividend yield
- Beta, 52W high/low
- Industry, analyst rating, target price
- Valuation metrics (Forward P/E, PEG, Price/Sales, Price/Book)
- Profitability metrics (margins, ROE, ROA)
- Financial health (debt ratios, liquidity ratios)

---

## Mock Data

Currently includes 12 sample assets:
- **4 ETFs**: VWRL, EQQQ, VMID, VUSA
- **8 Stocks**: AAPL, MSFT, GOOGL, TSLA, NVDA, AMZN, BP.L, LLOY.L

Mock data includes:
- Realistic prices and metrics
- Top holdings for ETFs
- Sector/geographic allocations
- Comprehensive stock fundamentals

---

## Future Enhancements

### Phase 1: Real Data Integration
- [ ] Integrate Finnhub/Alpha Vantage for live prices
- [ ] Fetch real ETF holdings data
- [ ] Pull actual news articles
- [ ] Historical price charts
- [ ] Real analyst ratings

### Phase 2: Advanced Features
- [ ] ETF overlap calculator with real holdings
- [ ] Correlation matrix for multiple assets
- [ ] Factor analysis (Fama-French)
- [ ] Dividend calendar
- [ ] Earnings calendar integration
- [ ] Price alerts

### Phase 3: AI Features
- [ ] AI-powered asset recommendations
- [ ] Natural language search ("best tech ETFs")
- [ ] Portfolio fit analysis
- [ ] Risk assessment
- [ ] Automated rebalancing suggestions

### Phase 4: Social Features
- [ ] Share comparisons
- [ ] Community ratings
- [ ] Discussion threads
- [ ] Expert analysis

---

## User Flows

### Flow 1: Research and Add to Watchlist
1. Navigate to Research → Assets
2. Search for asset (e.g., "AAPL")
3. Click asset card to view details
4. Review metrics, news, performance
5. Click "Add to Watchlist"
6. Select target watchlist
7. Asset added to watchlist

### Flow 2: Compare Multiple Assets
1. Navigate to Research → Assets
2. Search and click "Add to Compare" on 2-4 assets
3. Click "Compare (X)" button
4. Review side-by-side comparison
5. Analyze overlap (for ETFs)
6. Read AI insights
7. Make informed decision

### Flow 3: Add to Portfolio
1. Navigate to Research → Assets
2. Find desired asset
3. Click asset to view details
4. Click "Add to Portfolio"
5. System creates blank holding
6. User navigates to portfolio to add quantity

---

## Technical Implementation

### Components
- `AssetResearchHub.tsx`: Main search and listing page
- `AssetDetailPage.tsx`: Individual asset detail view
- `AssetComparison.tsx`: Side-by-side comparison view

### Data
- `mockAssetsData.ts`: Mock asset data with full metrics

### State Management
- Local component state for view modes
- Selected assets for comparison
- Search and filter state

### Styling
- Consistent with existing dark theme
- Card-based layouts
- Responsive grid systems
- Hover effects and transitions
- Color-coded performance indicators

---

## API Integration Readiness

The component structure is ready for API integration:

```typescript
// Example API service structure
export const assetService = {
  search: async (query: string, type?: string) => {
    // Replace mockAssets with API call
    return await api.get('/assets/search', { query, type });
  },
  
  getDetails: async (ticker: string) => {
    return await api.get(`/assets/${ticker}`);
  },
  
  getNews: async (ticker: string) => {
    return await api.get(`/assets/${ticker}/news`);
  },
  
  getHoldings: async (ticker: string) => {
    return await api.get(`/assets/${ticker}/holdings`);
  },
  
  compare: async (tickers: string[]) => {
    return await api.post('/assets/compare', { tickers });
  },
};
```

---

## Performance Considerations

### Current Implementation
- Client-side filtering (fast for <100 assets)
- No pagination (not needed with current dataset)
- Minimal re-renders with proper React patterns

### Future Optimizations
- Server-side search for large datasets
- Pagination for search results
- Virtual scrolling for long lists
- Debounced search input
- Cached API responses
- Lazy loading of detail tabs

---

## Accessibility

- Keyboard navigation support
- Semantic HTML structure
- ARIA labels for interactive elements
- Color contrast compliance
- Screen reader friendly

---

## Testing Checklist

- [ ] Search functionality
- [ ] Filter by asset type
- [ ] Add/remove from comparison
- [ ] Navigate to detail page
- [ ] Tab navigation on detail page
- [ ] Add to watchlist modal
- [ ] Add to portfolio action
- [ ] Comparison table rendering
- [ ] ETF overlap calculation
- [ ] Responsive layout on mobile
- [ ] Back navigation
- [ ] Empty states

---

## Success Metrics

### User Engagement
- Time spent on asset pages
- Number of comparisons performed
- Assets added to watchlists
- Assets added to portfolios

### Feature Adoption
- % of users using asset search
- % of users comparing assets
- Average assets per comparison
- Watchlist additions from research

### User Satisfaction
- Ease of finding assets
- Usefulness of comparison tool
- Quality of metrics displayed
- Overall research experience

---

**Status**: ✅ Core functionality complete, ready for real data integration
