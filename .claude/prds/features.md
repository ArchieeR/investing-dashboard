---
name: features
description: All user-facing features including Allocation Manager, Trade System, CSV Import/Export, Live Prices, Portfolio Breakdown, Settings, Portfolio Switcher, ETF Explorer, Watchlists, and Column Settings.
status: backlog
created: 2026-02-13T10:51:08Z
---

# PRD: Features

## Executive Summary

This PRD specifies all user-facing features of the portfolio intelligence platform. It covers the Allocation Manager (hierarchical budgets with drag-and-drop and percentage preservation), Trade System (buy/sell with cost basis tracking), CSV Import/Export (3 formats with auto-detection), Live Prices (multi-source chain with GBX handling), Portfolio Breakdown (pie charts across 4 dimensions), Settings Panel (configuration management), Portfolio Switcher (with draft system), ETF Explorer (discovery and filtering), Watchlists (themed stock lists with AI generation), and Column Settings (30+ configurable columns). Each feature includes user stories with detailed acceptance criteria.

## Problem Statement

Portfolio management requires a diverse set of tools: from basic holding tracking to sophisticated allocation planning, from manual CSV import to real-time pricing, from trade recording to visual breakdowns. These features must work together seamlessly within the hierarchical domain model (Portfolio > Section > Theme > Holding) while remaining accessible to both novice and advanced investors. The "simple by default, advanced when needed" principle drives feature design.

## User Stories

### Feature 1: Holdings Grid

#### US-1.1: Monitor Mode
**As a** passive investor,
**I want to** see a streamlined view of my holdings with live prices and day changes,
**So that** I can quickly check my portfolio's performance.

**Acceptance Criteria:**
- Monitor mode shows columns: ticker, name, livePrice, qty, dayChange, dayChangePercent, liveValue
- Day change is colour-coded: green for positive, red for negative
- Currency formatting respects GBP/GBX/USD/EUR conventions
- Click column header to sort ascending/descending
- Group by theme or account with collapsible headers showing group totals

#### US-1.2: Editor Mode
**As an** active portfolio manager,
**I want to** edit holdings inline with full column visibility,
**So that** I can manage my portfolio without navigating away.

**Acceptance Criteria:**
- Editor mode shows: section, theme, assetType, name, ticker, exchange, account, livePrice, qty, liveValue, pctOfTheme, targetPct, targetDelta, include, actions
- Click any editable cell to enter inline edit (text, dropdown, or number input)
- Tab/Enter confirms edit, Escape cancels
- Actions dropdown per row: Record Trade, Duplicate, Delete
- Include/exclude toggle (checkbox) affects all calculations
- Row hover: highlight with subtle background colour

#### US-1.3: Column Configuration
**As a** power user,
**I want to** choose which of the 30+ columns are visible,
**So that** I can customise the grid to my workflow.

**Acceptance Criteria:**
- Modal with checkbox grid organised by category (Basic Info, Pricing, Holdings, Daily Changes, Portfolio Metrics, Performance, Controls)
- 30+ toggle-able columns as defined in VisibleColumns interface
- Changes persist to portfolio settings via `updatePortfolioSettings`
- Categories: Basic Info (7), Pricing (3), Holdings (4), Daily Changes (2), Portfolio Metrics (5), Performance (9), Controls (2)

### Feature 2: Allocation Manager

#### US-2.1: Hierarchical Budget Management
**As a** strategic investor,
**I want to** set target allocations at section, theme, and holding levels,
**So that** I can plan my ideal portfolio structure.

**Acceptance Criteria:**
- Two tabs: "Portfolio Structure" (sections with nested themes) and "Accounts"
- Each row shows: drag handle, name, live value, target amount (currency input), target % (% input), progress bar
- Progress bars colour-coded: green (within 5% of target), yellow (5-15% deviation), red (>15% deviation)
- Section allocation overview with stacked bar charts
- Running total percentage displayed (should sum to 100% for sections)
- Cash section auto-calculates as remainder when `lockTotal=true`

#### US-2.2: Drag-and-Drop Reordering
**As a** user organising my portfolio structure,
**I want to** drag sections, themes, and accounts to reorder them,
**So that** I can arrange them by priority.

**Acceptance Criteria:**
- Drag handle visible on each row
- Drag-and-drop reorders items within their list (sections, themes, accounts)
- "Cash" section always stays at the end regardless of drag
- Reorder dispatches `reorder-list` action
- Visual feedback during drag (elevation, opacity change)

#### US-2.3: Percentage Preservation
**As a** allocation planner,
**I want** child allocations to scale proportionally when I change a parent allocation,
**So that** I do not lose my carefully planned sub-allocations.

**Acceptance Criteria:**
- Changing a section's % triggers `preserveThemeRatiosOnSectionChange`
- Changing a theme's `percentOfSection` triggers `preserveHoldingRatiosOnThemeChange`
- Scale factor = newPct / oldPct applied to all children
- Only fires when old > 0 and old !== new
- User can see immediate updated values in nested items

#### US-2.4: Insights Panel (Alternative View)
**As a** user wanting a compact allocation overview,
**I want to** see sections, themes, and accounts as side-by-side cards,
**So that** I can manage allocations in a dashboard-style layout.

**Acceptance Criteria:**
- Three-card grid: Sections, Themes, Accounts
- Each card has draggable, reorderable list items
- Inline budget inputs (amount in currency, percentage)
- Rename-on-blur for item names
- Delete buttons with confirmation
- Theme budgets use `percentOfSection` for hierarchical calculations

### Feature 3: Trade System

#### US-3.1: Record a Trade
**As a** trader,
**I want to** record buy and sell trades with price, quantity, and date,
**So that** my cost basis and P/L are tracked accurately.

**Acceptance Criteria:**
- Modal form with fields: holding selector (existing or new ticker), trade type (buy/sell), date (defaults to today), price per unit, quantity
- Existing ticker quick-select dropdown from current holdings
- Manual ticker entry creates a new holding automatically
- Validation: qty > 0, price > 0, sell qty <= held qty
- Buy: updates avgCost = (oldAvgCost * oldQty + tradePrice * tradeQty) / newQty
- Sell: reduces qty, avgCost unchanged (unless qty hits 0)
- Trade appended to portfolio's `trades[]` with generated ID

#### US-3.2: Trade History
**As a** user reviewing past trades,
**I want to** see all trades in a filterable table with summary statistics,
**So that** I can analyse my trading activity.

**Acceptance Criteria:**
- Table columns: date, ticker, name, type (buy/sell), price, quantity, total value
- Sorted by date descending
- Buy rows styled green, sell rows styled red
- Filters: type (All/Buy/Sell), ticker (dropdown of all traded tickers)
- Summary stats: total trades count, total buys (count + value), total sells (count + value), net value

### Feature 4: CSV Import/Export

#### US-4.1: Import Holdings from CSV
**As a** user migrating from a brokerage,
**I want to** upload my CSV export and have holdings imported automatically,
**So that** I do not need to enter each holding manually.

**Acceptance Criteria:**
- Drag-and-drop + file picker for CSV upload
- Auto-detection of 3 formats: Spec (exact header match), Interactive Investor (symbol/name/qty columns), Hargreaves Lansdown (code,stock header)
- De-duplication by ticker::name (case-insensitive) -- existing holdings preserved
- Auto-creates sections, themes, accounts from CSV data
- II and HL imports assign "Imported" to section/theme
- HL prices treated as pence (divided by 100)
- Filters cleared after import
- Error message for unsupported format

#### US-4.2: Export Holdings to CSV
**As a** user,
**I want to** export my portfolio holdings as CSV,
**So that** I can back up or analyse my data externally.

**Acceptance Criteria:**
- Downloads CSV file with header: `section,theme,assetType,name,ticker,account,price,qty,include,targetPct`
- All values properly CSV-escaped (commas, quotes, newlines)
- targetPct blank if not set

#### US-4.3: Import/Export Trades
**As a** user,
**I want to** import and export trade history as CSV,
**So that** I can maintain comprehensive records.

**Acceptance Criteria:**
- Export header: `ticker,name,type,date,price,qty`
- Import: strict header match, type defaults to 'buy', date defaults to today's ISO string
- Import creates holdings if ticker not found in portfolio

### Feature 5: Live Prices

#### US-5.1: Automatic Price Updates
**As a** user monitoring my portfolio,
**I want** prices to update automatically at configurable intervals,
**So that** I see near-real-time portfolio values.

**Acceptance Criteria:**
- Configurable interval: 1, 2, 5, 10, 15, 30, 60 minutes
- Filters out Cash holdings and deduplicates tickers before fetching
- Processes in batches of 10 with 100ms inter-batch delay
- Uses `Promise.allSettled` per batch (partial failures do not block)
- Performance data fetched 10% of the time (max 5 tickers) to reduce API load
- All prices converted to GBP base currency
- GBX/GBp handling: divide by 100 for UK stocks

#### US-5.2: Price Source Chain
**As a** user,
**I want** the system to try multiple data sources to get a price,
**So that** my portfolio always has the best available pricing.

**Acceptance Criteria:**
- Fallback chain: (1) FMP API / Yahoo Finance via CORS proxy, (2) Alpha Vantage, (3) Alpaca Markets (US only), (4) Cached price with +/-1% variation
- Each source has its own caching (1 minute for quotes, 5 minutes for exchange rates)
- LSE stocks route to Apify for Google Finance scraping
- Failed holdings retried via Alpaca batch fallback
- Status indicator: green (updated), amber (loading), red (error), gray (no data)

#### US-5.3: Price Display
**As a** user,
**I want to** see the price update status and refresh manually,
**So that** I know the data freshness.

**Acceptance Criteria:**
- LivePriceStatus shows: quote count, time since last update, detected currency info
- Status dot with colour and pulse animation
- Refresh button for manual trigger
- LivePriceSettings: checkbox to enable/disable, dropdown for interval

#### US-5.4: Performance Tracking
**As a** user,
**I want to** see multi-period performance for my holdings,
**So that** I can evaluate short-term and long-term trends.

**Acceptance Criteria:**
- Performance periods: 1d, 2d, 3d, 1w, 1m, 6m, ytd, 1y, 2y
- Available as optional visible columns in the holdings grid
- Fetched with 10% probability per update cycle to manage API load

### Feature 6: Portfolio Breakdown

#### US-6.1: Visual Portfolio Composition
**As a** user,
**I want to** see pie charts breaking down my portfolio by section, theme, account, and asset type,
**So that** I can visually understand my allocation.

**Acceptance Criteria:**
- 4 tabs: Sections, Themes, Accounts, Asset Types
- SVG pie charts rendered with `stroke-dasharray` technique
- 10-colour palette for chart segments
- Legend shows: colour swatch, label, formatted value (GBP), percentage
- Hover on pie segment highlights corresponding legend entry
- Only included holdings (`include=true`) shown
- Collapsible section in the portfolio page
- Percentages sum to 100%

### Feature 7: Settings Panel

#### US-7.1: Portfolio Configuration
**As a** user,
**I want to** configure currency, lock total, live prices, and manage my data,
**So that** the application works according to my preferences.

**Acceptance Criteria:**
- Navigation tabs: General, Exchanges, Asset Types, Data Management
- General: currency dropdown (GBP default), lock total toggle, live prices toggle, update interval dropdown
- Exchanges: enable/disable toggles for LSE, NYSE, NASDAQ, AMS, XETRA, XC, VI, Other
- Asset Types: enable/disable toggles for ETF, Stock, Crypto, Cash, Bond, Fund, Other
- Data Management: CSV import/export, backup/restore, JSON operations
- CSV file upload with drag-and-drop + file picker
- CSV export downloads .csv file
- JSON backup download and restore upload

### Feature 8: Portfolio Switcher

#### US-8.1: Multiple Portfolio Management
**As a** user with multiple investment accounts,
**I want to** switch between portfolios via tabs,
**So that** I can manage each account separately.

**Acceptance Criteria:**
- Horizontal tab bar with pill buttons per portfolio
- Click tab to switch active portfolio
- Active tab: primary colour background, white text, semibold
- Holdings count badge per portfolio
- "+" button to add new portfolio
- Context menu per tab: Rename, Create Draft, Promote Draft (draft only), Delete
- Delete requires confirmation dialog

#### US-8.2: Draft Portfolio System
**As a** investor exploring changes,
**I want to** create a draft copy of my portfolio to experiment with,
**So that** I can test allocation changes without affecting my real portfolio.

**Acceptance Criteria:**
- "Create Draft" clones the selected portfolio as a draft
- Draft indicator: dashed border + "Draft" label on tab
- Draft is set as active portfolio after creation
- "Promote Draft" replaces original portfolio data with draft data, keeps original ID/name
- Draft is removed after promotion
- Double-click tab name for inline rename (Enter to confirm, Escape to cancel)

### Feature 9: ETF Explorer

#### US-9.1: ETF Discovery
**As a** investor researching ETFs,
**I want to** browse and filter ETFs by region, category, and expense ratio,
**So that** I can find suitable ETFs for my portfolio.

**Acceptance Criteria:**
- Card grid layout: `repeat(auto-fill, minmax(320px, 1fr))`
- Each card shows: name, ticker (monospace), expense ratio, AUM, yield, region, category, tags
- Filter options: Region (All/Global/US/UK/Europe), Category (All/Equity/Bond/Technology/Growth), Expense Ratio (Any/Low <0.15%/Medium 0.15-0.50%/High >0.50%)
- Text search by name or ticker
- Card hover: `translateY(-4px)` with shadow elevation
- External FilterBar component with glassmorphism styling
- Currently uses mock data; production will use FMP API `/stable/etf/info` and `/stable/etf/holdings`

### Feature 10: Watchlists

#### US-10.1: Themed Watchlists
**As a** investor tracking potential investments,
**I want to** create themed watchlists (Growth, Dividend, Tech, etc.),
**So that** I can organise and monitor stocks I am interested in.

**Acceptance Criteria:**
- Multiple themed watchlists: Growth, Dividend Aristocrats, Tech Leaders, Value Plays, ESG, Emerging Markets, Small Cap, Blue Chips, Momentum, Custom
- Market cap categories: Large (>$10B), Mid ($2B-$10B), Small (<$2B)
- View modes: overview (card grid), detail (stock table), AI generator
- Card grid layout: `repeat(auto-fill, minmax(350px, 1fr))`
- Each watchlist shows: name, description, icon, theme, stock count, avg return, avg yield
- Detail view: sortable stock table with price, change, market cap, in-portfolio indicator

#### US-10.2: AI Watchlist Generator
**As a** investor seeking recommendations,
**I want** AI-generated watchlist suggestions based on my portfolio,
**So that** I can discover new investment opportunities.

**Acceptance Criteria:**
- AI recommendations based on portfolio analysis, risk tolerance, sector preferences
- Suggestions appear in dedicated "AI Generator" view
- Each suggestion includes: ticker, company name, rationale, alignment score
- User can add suggested stocks to existing watchlists or create new ones

### Feature 11: Backup/Restore System

#### US-11.1: Auto-Restore on Empty Portfolio
**As a** user loading the app after data loss,
**I want** the system to detect an empty portfolio and offer to restore from backup,
**So that** I do not lose my data.

**Acceptance Criteria:**
- On mount, checks if portfolio is empty (no holdings or only Cash buffer)
- If empty, fetches available backups from server
- Shows restore prompt with backup metadata (timestamp, portfolio count, holdings count)
- Auto-restore from latest backup if available
- Confirmation dialog before restore

#### US-11.2: Manual Backup and Restore
**As a** cautious user,
**I want to** manually trigger backups and browse/restore from previous backups,
**So that** I have control over my data safety.

**Acceptance Criteria:**
- Manual backup button with loading spinner and success/error status
- Backup browser: lists available server backups sortable by timestamp
- Metadata per backup: portfolios, holdings count
- Select a backup to restore (with confirmation)
- File upload restore: accepts `.json`, validates structure, loads into store
- One-click restore from embedded backup data
- Error boundary prevents backup errors from crashing the app
- Retry with exponential backoff (1s, 2s, 4s base delays, max 10s)

## Functional Requirements

### FR-1: HoldingsGrid Props Interface
```typescript
interface HoldingsGridProps {
  holdings: DerivedHolding[];
  displayMode: 'monitor' | 'editor';
  visibleColumns: VisibleColumns;
  groupBy: 'theme' | 'account' | 'none';
  filterSection?: string;
  filterTheme?: string;
  filterAccount?: string;
  livePriceData?: LivePriceData;
  onUpdateHolding: (id: string, field: string, value: any) => void;
  onDeleteHolding: (id: string) => void;
  onRecordTrade: (holdingId: string) => void;
  onDuplicateHolding: (holdingId: string) => void;
}
```

### FR-2: TradeForm Props Interface
```typescript
interface TradeFormProps {
  holdingId?: string;
  onClose: () => void;
  onSubmit: (holdingId: string, trade: TradeInput) => void;
}

interface TradeInput {
  type: 'buy' | 'sell';
  date: string;
  price: number;
  qty: number;
}
```

### FR-3: PortfolioBreakdown Tabs
Sections breakdown, Themes breakdown, Accounts breakdown, Asset Types breakdown. Each produces `BreakdownEntry[]` with `{ label, value, percentage }`.

### FR-4: useLivePrices Hook
```typescript
useLivePrices(
  holdings: Holding[],
  enabled: boolean = true,
  updateInterval: number = 5
): {
  quotes: Map<string, QuoteData>;
  performance: Map<string, PerformanceData>;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refreshPrices: () => void;
  refreshSinglePrice: (ticker: string) => Promise<void>;
}
```

### FR-5: Exchange Ticker Formatting for Price Fetch
| Exchange | Format | Example |
|----------|--------|---------|
| LSE | `{TICKER}.L` | `LLOY.L` |
| AMS | `{TICKER}.AS` | `ASML.AS` |
| XETRA | `{TICKER}.DE` | `SAP.DE` |
| VI | `{TICKER}.VI` | `OMV.VI` |
| XC | `{TICKER}` (strip suffix) | `BTC` |
| NASDAQ/NYSE | `{TICKER}` (strip suffix) | `AAPL` |

### FR-6: Error Handling Service
- Error categorisation: network, validation, permission, storage, unknown
- Severity levels: low, medium, high
- Retry with exponential backoff: base 1000ms, multiplier 2, max 10000ms, max 3 attempts
- Error notifications with: title, message, severity colour, recovery suggestions, action buttons (Retry, Check Connection, View Details, Dismiss)

### FR-7: Backup/Restore Validation
Errors (blocking): missing portfolios array, portfolio missing id/name/holdings.
Warnings (non-blocking): holding missing id, invalid price/qty, missing settings/lists, invalid activePortfolioId.

## Non-Functional Requirements

- **NFR-1:** Holdings Grid renders 500 rows at 60fps with virtual scrolling
- **NFR-2:** CSV import of 1000 rows completes in < 2 seconds
- **NFR-3:** Live price batch of 50 tickers completes in < 10 seconds
- **NFR-4:** Trade recording latency < 100ms (UI feedback)
- **NFR-5:** Allocation changes cascade within < 50ms
- **NFR-6:** All features work offline with cached data (sync when online)
- **NFR-7:** Backup/restore retry handles intermittent network with exponential backoff

## Technical Specification

### Component Architecture
- Feature components live in `src/components/features/{feature}/`
- Each feature connects to domain via `usePortfolio()` context hook
- Local state for UI concerns (sorting, editing, tabs) stays in component
- Business logic delegated to reducer actions via dispatch

### Data Flow
```
User Interaction -> Component -> usePortfolio() Action -> Reducer -> Updated State -> Derived Selectors -> Re-render
```

### File Organization
| Feature | Primary File(s) | Lines |
|---------|----------------|-------|
| Holdings Grid | HoldingsGrid.tsx, ColumnSettings.tsx | ~1846 |
| Allocation Manager | AllocationManager.tsx, InsightsPanel.tsx | ~2133 |
| Trade System | TradeForm.tsx, TradeHistory.tsx | ~624 |
| Portfolio Breakdown | PortfolioBreakdown.tsx | ~325 |
| Settings Panel | SettingsPanel.tsx, LivePriceSettings.tsx, LivePriceStatus.tsx | ~1347 |
| Backup/Restore | 12 components | ~3000+ |
| Live Prices | useLivePrices.ts + 3 services | ~1074 |
| CSV Import/Export | csv.ts | ~373 |
| Portfolio Switcher | PortfolioSwitcher.tsx | ~261 |
| ETF Explorer | ETFExplorer.tsx | ~292 |

## Success Criteria

1. All features from the reference implementation are functionally replicated
2. Holdings Grid handles 500+ rows without performance degradation
3. CSV auto-detection correctly identifies all 3 formats
4. Live prices update within configured interval with < 5% failure rate
5. Allocation manager correctly cascades percentage changes through the hierarchy
6. Draft portfolio system round-trips data without loss
7. Backup/restore handles network failures gracefully with retry

## Constraints & Assumptions

- ETF Explorer currently uses mock data; real data integration is Phase 2
- Watchlists and AI Generator are Phase 2+ features (UI scaffold exists)
- News Page is a placeholder (empty module)
- Google Finance service is a placeholder (empty module)
- Backup/restore system designed for localStorage + file API; will migrate to Firebase
- Live price sources require CORS proxies for browser-based fetching (will move to Cloud Functions)

## Out of Scope

- Broker API integration for automatic trade import
- Real-time WebSocket price streaming
- Advanced charting (candlestick, technical indicators)
- Social features (sharing portfolios, following users)
- Automated rebalancing execution
- Tax lot tracking and tax-loss harvesting

## Dependencies

- **Core Domain** (PRD: core-domain) -- all reducer actions, types, selectors
- **UI Design System** (PRD: ui-design-system) -- component styling, tokens, animations
- **Infrastructure** (PRD: infrastructure) -- Firebase for persistence, FMP API for market data
- **AI Research** (PRD: ai-research) -- for AI-powered watchlist generation
