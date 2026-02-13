# Synthesis Part 2: Features, Components, Hooks & Services

> Source: `_portfolio-reference/src/` (components, hooks, services, pages, utils)
> Total files analysed: 39 (24 components, 5 hooks, 8 services, 2 pages) + csv utility

---

## Features

### Holdings Grid

**File:** `src/components/HoldingsGrid.tsx` (~1573 lines)

The core data table for viewing and editing portfolio holdings. Supports two display modes, grouping, filtering, inline editing, and multi-currency formatting.

#### Display Modes

| Mode | Columns Shown |
|------|---------------|
| `monitor` | ticker, name, livePrice, qty, dayChange, dayChangePercent, liveValue |
| `editor` | section, theme, assetType, name, ticker, exchange, account, livePrice, qty, liveValue, pctOfTheme, targetPct, targetDelta, include, actions |

#### Props Interface

```ts
interface HoldingsGridProps {
  holdings: DerivedHolding[];          // Computed holdings with live/target values
  displayMode: 'monitor' | 'editor';  // Toggle between view/edit
  visibleColumns: VisibleColumns;      // Column visibility config (30+ columns)
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

#### Key State / Hooks
- Uses `usePortfolio()` for `derivedHoldings`, `updateHolding`, `deleteHolding`, `recordTrade`
- Local state for sorting (`sortField`, `sortDirection`), inline edit tracking
- `ActionsDropdown` sub-component renders per-row context menu: Record Trade, Duplicate, Delete

#### User Interactions
- Click column header to sort (asc/desc toggle)
- Click cell to enter inline edit mode (text input, dropdown, or number input depending on field)
- Tab/Enter to confirm edit, Escape to cancel
- Actions dropdown for trade recording, duplication, deletion
- Group headers are collapsible
- Filter dropdowns for section, theme, account

#### Data Displayed
- Currency-aware formatting: GBP (pounds), GBX/GBp (pence), USD ($), EUR (euro)
- Day change with colour coding (green positive, red negative)
- Percentage of theme, target percentage, target delta with colour-coded deviation
- Include/exclude toggle (checkbox) for allocation calculations

#### Column Settings Component

**File:** `src/components/ColumnSettings.tsx` (~273 lines)

Modal with checkbox grid for toggling column visibility. Columns organized by section:

| Section | Columns |
|---------|---------|
| Basic Info | section, theme, assetType, name, ticker, exchange, account |
| Pricing | price, livePrice, avgCost |
| Holdings | qty, value, liveValue |
| Daily Changes | dayChange, dayChangePercent |
| Portfolio Metrics | pctOfTheme, pctOfSection, pctOfPortfolio, targetPct, targetDelta |
| Performance | gain, gainPercent, 1d, 2d, 3d, 1w, 1m, 6m, ytd, 1y, 2y |
| Controls | include, actions |

Props: `visibleColumns: VisibleColumns`, `onUpdate: (columns: VisibleColumns) => void`, `onClose: () => void`

---

### Allocation Manager

**File:** `src/components/AllocationManager.tsx` (~1228 lines)

Budget allocation UI with tab navigation for Portfolio Structure (sections and nested themes) and Accounts.

#### Props Interface

```ts
// No external props - uses usePortfolio() context internally
type AllocationTab = 'sections' | 'themes' | 'accounts';
```

#### Key State / Hooks
- `usePortfolio()` for: `setBudget`, `budgets`, `remaining`, `addListItem`, `removeListItem`, `reorderList`, `lists` (sections, themes, accounts)
- Local state: `activeTab`, `editingId`, `dragState`
- Budget data structure: `{ amount: number, percentage: number }` per item

#### User Interactions
- Tab switching between Portfolio Structure and Accounts
- Inline editing of budget amount (currency input) and percentage (% input)
- Drag-and-drop reordering of sections, themes, and accounts
- Add new section/theme/account via text input
- Delete section/theme/account with confirmation
- Rename items on blur

#### Data Displayed
- Progress bars showing live value vs. budget amount per item
- Percentage allocation with running total
- Remaining budget (total minus allocated)
- Nested themes under parent sections
- Cash section auto-calculates as remainder when `lockTotal` is true

#### Insights Panel Component

**File:** `src/components/InsightsPanel.tsx` (~905 lines)

Three-card grid layout providing another view of allocation data with inline management capabilities.

Cards: **Sections**, **Themes**, **Accounts**

Each card shows:
- Draggable, reorderable list items
- Budget inputs (amount in currency, percentage)
- Rename-on-blur for item names
- Delete buttons
- Cash section auto-calculates remainder
- Theme budgets use `percentOfSection` for hierarchical calculations
- Section target total percentage tracking against 100%

---

### Trade System

#### Trade Form

**File:** `src/components/TradeForm.tsx` (~361 lines)

Modal form for recording buy/sell trades against holdings.

**Props:**
```ts
interface TradeFormProps {
  holdingId?: string;      // Pre-selected holding (optional)
  onClose: () => void;
  onSubmit: (holdingId: string, trade: TradeInput) => void;
}

interface TradeInput {
  type: 'buy' | 'sell';
  date: string;            // ISO date string
  price: number;
  qty: number;
}
```

**Key Logic:**
- Existing ticker quick-select dropdown for choosing from current holdings
- Manual ticker entry field for new holdings
- Auto-creates holding if ticker does not exist in the portfolio
- Calls `recordTrade(holdingId, { type, date, price, qty })` on the store
- Date defaults to today
- Validates: qty > 0, price > 0, sell qty <= held qty

**User Interactions:**
- Select existing holding or type new ticker
- Choose buy/sell type
- Enter date, price per unit, quantity
- Submit creates trade record and updates holding's avg cost

#### Trade History

**File:** `src/components/TradeHistory.tsx` (~263 lines)

Table displaying all recorded trades with filtering and summary statistics.

**Props:**
```ts
interface TradeHistoryProps {
  trades: Trade[];
  holdings: Holding[];
  onDeleteTrade?: (tradeId: string) => void;
}
```

**Data Displayed:**
- Trades sorted by date descending
- Columns: date, ticker, name, type (buy/sell), price, quantity, total value
- Buy rows styled green, sell rows styled red

**Filters:**
- Type filter: All / Buy / Sell
- Ticker filter: dropdown of all tickers with trades

**Summary Stats:**
- Total trades count
- Total buys count + total buy value
- Total sells count + total sell value
- Net value (buys - sells)

---

### Portfolio Breakdown / Insights

**File:** `src/components/PortfolioBreakdown.tsx` (~325 lines)

SVG pie chart visualizations of portfolio composition with tabbed views.

**Props:**
```ts
interface PortfolioBreakdownProps {
  holdings: DerivedHolding[];
}
```

**Tabs:**
- Sections breakdown
- Themes breakdown
- Accounts breakdown
- Asset Types breakdown

**Key Logic:**
- Filters holdings where `include === true`
- Calculates percentage of total live value per group
- Renders SVG pie chart with `stroke-dasharray` technique
- Legend shows: colour swatch, label, formatted value (GBP), percentage

**User Interactions:**
- Tab switching between breakdown types
- Hover on pie segment highlights corresponding legend entry

---

### Settings Panel

**File:** `src/components/SettingsPanel.tsx` (~1161 lines)

Full-page settings with sidebar navigation and multiple configuration tabs.

**Navigation Tabs:**
1. **General** - Currency (GBP default), lock total toggle, live prices toggle, update interval dropdown
2. **Exchanges** - Enable/disable exchanges: LSE, NYSE, NASDAQ, AMS, XETRA, XC, VI, Other
3. **Asset Types** - Enable/disable asset types: ETF, Stock, Crypto, Cash, Bond, Fund, Other
4. **Data Management** - CSV import/export, backup/restore, JSON operations

**Key State / Hooks:**
- `usePortfolio()` for `settings`, `updatePortfolioSettings`
- Integrates: `BackupButton`, `BackupStatus`, `DirectRestoreButton`, `RestoreFromFileButton`, `BackupBrowser`

**User Interactions:**
- Toggle switches for boolean settings
- Dropdown for currency and update interval
- CSV file upload (drag-and-drop + file picker)
- CSV export (downloads .csv file)
- JSON backup download
- JSON restore upload
- Backup to server button
- Browse server backups

**Sub-Components (Live Price Settings):**

**LivePriceSettings** (`src/components/LivePriceSettings.tsx`, ~94 lines):
- Checkbox to enable/disable live prices
- Dropdown for update interval: 1, 2, 5, 10, 15, 30, 60 minutes
- Calls `updatePortfolioSettings({ livePrices, updateInterval })`

**LivePriceStatus** (`src/components/LivePriceStatus.tsx`, ~92 lines):
- Props: `data: LivePriceData`, `onRefresh: () => void`
- Status dot: red=error, amber=loading, green=updated, gray=no data
- Shows: quote count, time since last update, detected currency info
- Refresh button

---

### Backup/Restore System

A comprehensive multi-path backup and restore system with automatic detection, manual controls, file upload, and server-side operations.

#### Architecture Overview

```
AutoRestoreHandler (on load)
  -> RestoreDetector (detects empty portfolio)
    -> RestoreDialog (asks user to confirm)
      -> RestoreService (executes restore)

Manual paths:
  BackupButton -> POST /api/portfolio/save
  BackupBrowser -> GET /api/portfolio/backups -> select -> POST /api/portfolio/restore
  DirectRestoreButton -> fixed backup data from portfolio-backup-restore.json
  RestoreFromFileButton -> file upload -> JSON parse -> validate -> load into store
```

#### Components

**AutoRestoreHandler** (`src/components/AutoRestoreHandler.tsx`):
- Wrapper component that runs on app load
- Uses `useAutoRestore` hook to detect empty portfolio
- Shows notification if auto-restore was performed
- Props: `children`, `portfolioData: AppState`, `onRestoreComplete: (data: AppState) => void`

**RestoreDetector** (`src/components/RestoreDetector.tsx`):
- Detects empty portfolio state and prompts user
- Uses `useRestoreDetection` hook
- Shows banner with "Restore from backup?" message
- Lists available backups with timestamps

**RestoreDialog** (`src/components/RestoreDialog.tsx`):
- Confirmation dialog before restoring
- Shows backup metadata: timestamp, portfolio count, holdings count
- Confirm/Cancel buttons
- Props: `backup: BackupMetadata`, `onConfirm`, `onCancel`

**BackupButton** (`src/components/BackupButton.tsx`):
- Manual backup trigger
- Uses `useBackup` hook
- Shows loading spinner during backup
- Displays success/error status
- Props: `portfolioData: AppState`

**BackupStatus** (`src/components/BackupStatus.tsx`):
- Shows current backup status
- Two variants: compact (inline) and detailed (card)
- Displays last backup time, error state
- Props: `lastBackupTime`, `backupError`, `variant: 'compact' | 'detailed'`

**BackupBrowser** (`src/components/BackupBrowser.tsx`):
- Lists available server backups fetched via `GET /api/portfolio/backups`
- Sortable by timestamp
- Shows metadata per backup (portfolios, holdings)
- Select to restore
- Uses `useManualRestore` hook

**DirectRestoreButton** (`src/components/DirectRestoreButton.tsx`):
- One-click restore from a fixed/embedded backup data file (`portfolio-backup-restore.json`)
- No server interaction needed
- Validates data before loading into store

**RestoreFromFileButton** (`src/components/RestoreFromFileButton.tsx`):
- File upload input (accepts `.json`)
- Reads file, parses JSON, validates structure via `RestoreService.validateBackupData()`
- Loads valid data into store

**ManualRestoreButton** (`src/components/ManualRestoreButton.tsx`):
- Button that opens `ManualRestoreDialog`
- Simple trigger component

**ManualRestoreDialog** (`src/components/ManualRestoreDialog.tsx`):
- Split-pane dialog
- Left pane: list of available backups with metadata
- Right pane: preview of selected backup contents (portfolios, holdings count, settings)
- Confirm restore button
- Uses `useManualRestore` hook

**BackupErrorBoundary** (`src/components/BackupErrorBoundary.tsx`):
- React error boundary wrapping backup/restore components
- Catches rendering errors in backup UI
- Shows fallback UI with retry button
- Prevents backup errors from crashing the entire app

**ErrorNotification** (`src/components/ErrorNotification.tsx`):
- Enhanced error notification component
- Uses `ErrorHandlingService.createErrorNotification()` for user-friendly messages
- Shows: title, message, severity colour, recovery suggestions
- Action buttons: Retry, Check Connection, View Details, Dismiss
- Props: `errorDetails: ErrorDetails`, `onAction: (action: string) => void`, `onDismiss: () => void`

#### Server API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/portfolio/save` | POST | Create backup (body: `{ state: AppState }`) |
| `/api/portfolio/backups` | GET | List available backups |
| `/api/portfolio/restore` | POST | Restore from backup file (body: `{ filePath: string }`) |

---

### Live Prices

Live price fetching is handled by the `useLivePrices` hook and the multi-source price service chain.

**Price Source Chain** (fallback order):
1. Yahoo Finance (primary) via CORS proxy
2. Alpha Vantage (fallback, 25 calls/day free tier)
3. Alpaca Markets (US stocks only, paper trading endpoint)
4. Cached price with random variation (last resort)

**Display Components:**
- `LivePriceStatus` shows update status, quote count, and refresh button
- `LivePriceSettings` controls enable/disable and interval
- `HoldingsGrid` displays live prices with day change colour coding

**Update Behaviour:**
- Configurable interval: 1, 2, 5, 10, 15, 30, 60 minutes
- Filters out Cash holdings and deduplicates tickers
- Processes in batches of 10 with 100ms inter-batch delay
- Performance data fetched 10% of the time to reduce API load
- All prices converted to GBP base currency

**Performance Periods Tracked:**
`1d`, `2d`, `3d`, `1w`, `1m`, `6m`, `ytd`, `1y`, `2y`

---

### CSV Import/Export

**File:** `src/utils/csv.ts` (~373 lines)

Handles three CSV format variants for holdings import plus trade CSV import/export.

#### Holdings CSV Formats

**1. Spec Format (native)**
```
section,theme,assetType,name,ticker,account,price,qty,include,targetPct
```
- Exact header match required
- Direct 1:1 mapping to `HoldingCsvRow`
- Boolean normalisation: `true/yes/1` -> true, `false/no/0` -> false, empty -> true

**2. Interactive Investor Format**
- Detected by presence of columns: `symbol`, `name`, `qty`
- Header is case-insensitive
- Price parsed with `parseMoney()` (handles currency symbols, pence suffix)
- All imported holdings assigned: `section='Imported'`, `theme='Imported'`, `account='Imported'`, `assetType='Other'`
- Rows with qty=0 and price=0 are skipped

**3. Hargreaves Lansdown Format**
- Detected by header starting with `code,stock`
- First non-empty line used as account name
- Prices assumed to be in pence (appends `p` suffix for `parseMoney()`)
- Column detection: `code`, `stock`, `units` (partial match), `price` (partial match)
- Skips rows starting with `""` or containing `totals`

#### Format Detection Strategy
```
parseHoldingsCsv(csv) ->
  1. Try parseSpecCsv() -> if header matches, return result
  2. Try parseInteractiveInvestorCsv() -> if columns found and data exists, return
  3. Try parseHlCsv() -> if columns found and data exists, return
  4. Throw 'Unsupported CSV format'
```

#### Trade CSV
- Export: `tradesToCsv(trades, holdings)` - header: `ticker,name,type,date,price,qty`
- Import: `parseTradesCsv(csv)` - strict header match, returns `TradeCsvRow[]`

#### Key Utilities
- `stripBom()` - removes BOM characters from file start
- `parseCsvRow()` - handles quoted fields with escaped double quotes
- `parseMoney()` - handles `£`, `$`, `euro`, pence suffix, comma separators
- `escapeCsvValue()` - wraps values containing commas/quotes/newlines in double quotes
- `normaliseAssetType()` - validates against allowed types: ETF, Stock, Crypto, Cash, Bond, Fund, Other

---

### Portfolio Switcher

**File:** `src/components/PortfolioSwitcher.tsx` (~261 lines)

Tab bar for managing multiple portfolios with draft system support.

**Props:**
```ts
interface PortfolioSwitcherProps {
  portfolios: Portfolio[];
  activePortfolioId: string;
  onSwitch: (portfolioId: string) => void;
  onAdd: () => void;
  onRename: (portfolioId: string, newName: string) => void;
  onDelete: (portfolioId: string) => void;
  onCreateDraft: (sourcePortfolioId: string) => void;
  onPromoteDraft: (draftPortfolioId: string) => void;
}
```

**User Interactions:**
- Click tab to switch active portfolio
- Double-click tab name to enter inline rename mode (Enter to confirm, Escape to cancel)
- "+" button to add new portfolio
- Context menu per tab: Rename, Create Draft, Promote Draft (draft only), Delete
- Delete requires confirmation dialog

**Data Displayed:**
- Portfolio name in tab
- Holdings count badge per portfolio
- Draft indicator (dashed border + "Draft" label) for draft portfolios
- Active tab highlighted with primary colour

**Draft System:**
- `onCreateDraft(sourcePortfolioId)` - clones a portfolio as a draft for experimental changes
- `onPromoteDraft(draftPortfolioId)` - replaces the original portfolio with the draft version

---

### ETF Explorer

**File:** `src/pages/ETFExplorer.tsx` (~292 lines)

Discovery page for browsing ETFs with filtering capabilities.

**Current State:** Uses mock data (6 ETFs hardcoded).

**Mock ETF Data:**
| Ticker | Name | Expense | AUM | Yield | Region | Category |
|--------|------|---------|-----|-------|--------|----------|
| VWRL | Vanguard FTSE All-World UCITS ETF | 0.22% | 8.2B | 1.8% | Global | Equity |
| EQQQ | Invesco EQQQ NASDAQ-100 UCITS ETF | 0.30% | 4.1B | 0.7% | US | Technology |
| VUKE | Vanguard FTSE 100 UCITS ETF | 0.09% | 2.8B | 3.4% | UK | Equity |
| AGGG | iShares Core Global Aggregate Bond UCITS ETF | 0.10% | 1.9B | 2.1% | Global | Bond |
| VMID | Vanguard FTSE 250 UCITS ETF | 0.10% | 1.2B | 2.8% | UK | Mid Cap |
| SPYG | SPDR S&P 500 Growth ETF | 0.04% | 15.3B | 0.6% | US | Growth |

**Filter Options:**
- Region: All / Global / US / UK / Europe
- Category: All / Equity / Bond / Technology / Growth
- Expense Ratio: Any / Low (<0.15%) / Medium (0.15-0.50%) / High (>0.50%)
- Text search by name or ticker

**UI Layout:**
- Card grid (`repeat(auto-fill, minmax(320px, 1fr))`)
- Each card shows: name, ticker (monospace), expense ratio, AUM, yield, region, category, tags
- Hover animation: `translateY(-4px)` with shadow elevation
- Uses external `FilterBar` component (imported)

---

### News Page

**File:** `src/pages/NewsPage.tsx` (1 line - empty placeholder)

Not implemented. File exists as an empty module.

---

## Hooks

### useLivePrices

**File:** `src/hooks/useLivePrices.ts` (~142 lines)

Fetches live market prices on a configurable interval for all portfolio holdings.

**Parameters:**
```ts
useLivePrices(
  holdings: Holding[],     // Array of holdings to fetch prices for
  enabled: boolean = true, // Toggle live price fetching
  updateInterval: number = 5 // Minutes between updates
)
```

**Return Type:**
```ts
{
  quotes: Map<string, QuoteData>;           // Ticker -> quote data
  performance: Map<string, PerformanceData>; // Ticker -> multi-period performance
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refreshPrices: () => void;                 // Trigger manual refresh
  refreshSinglePrice: (ticker: string) => Promise<void>; // Refresh one ticker
}
```

**Key Logic:**
- Filters holdings: must have non-empty ticker, excludes `assetType === 'Cash'`
- Deduplicates tickers before fetching
- Default exchange set to `'LSE'` if not specified on holding
- Calls `fetchMultipleQuotes()` from yahooFinance service (batched)
- Performance data fetched with 10% probability per update cycle (max 5 tickers)
- `setInterval` with `updateInterval * 60 * 1000` ms
- Uses `isLoadingRef` to prevent concurrent fetches
- Cleanup clears interval on unmount or when disabled

---

### useBackup

**File:** `src/hooks/useBackup.ts` (~187 lines)

Manual backup operations with retry and error handling.

**Parameters:** None (stateless hook)

**Return Type:**
```ts
interface UseBackupReturn {
  createBackup: (portfolioData: AppState, retryConfig?: Partial<RetryConfig>) => Promise<BackupResult>;
  isBackingUp: boolean;
  lastBackupTime: string | null;        // Persisted to localStorage
  backupError: string | null;
  errorDetails: ErrorDetails | null;
  clearError: () => void;
  retryLastBackup: () => Promise<BackupResult>;
}
```

**Key Logic:**
- Calls `POST /api/portfolio/save` with `{ state: portfolioData }` body
- Uses `ErrorHandlingService.withRetry()` for automatic retry with exponential backoff
- Supports `AbortController` - cancels previous in-flight backup if new one starts
- Persists `lastBackupTime` to `localStorage` key `'lastBackupTime'`
- Listens to `StorageEvent` to sync backup time across browser tabs
- Stores `lastPortfolioData` for `retryLastBackup()` functionality

---

### useAutoRestore

**File:** `src/hooks/useAutoRestore.ts` (~122 lines)

Automatic restore detection and execution on app load.

**Parameters:**
```ts
useAutoRestore(
  portfolioData: AppState,
  onRestoreComplete?: (restoredData: AppState) => void
)
```

**Return Type:**
```ts
interface UseAutoRestoreReturn {
  isCheckingRestore: boolean;
  restoreResult: RestoreResult | null;
  availableBackups: BackupMetadata[];
  performRestore: (filePath?: string) => Promise<RestoreResult>;
  clearRestoreResult: () => void;
  checkError: string | null;
}
```

**Key Logic:**
- On mount (via `useEffect`), checks if portfolio is empty via `RestoreService.isPortfolioEmpty()`
- If empty, fetches available backups via `RestoreService.getAvailableBackups()`
- If backups exist, calls `RestoreService.performAutoRestore()`
- On successful restore, invokes `onRestoreComplete` callback with restored data
- Only runs auto-restore check if no previous successful restore (`restoreResult?.success` guard)
- `performRestore(filePath?)` allows manual trigger - restores from specific file or latest

---

### useManualRestore

**File:** `src/hooks/useManualRestore.ts` (~91 lines)

Manual restore from specific backup files with pre-restore safety.

**Parameters:** None

**Return Type:**
```ts
interface UseManualRestoreReturn {
  restoreFromBackup: (filePath: string) => Promise<ManualRestoreResult>;
  getAvailableBackups: () => Promise<BackupMetadata[]>;
  isRestoring: boolean;
  restoreError: string | null;
  clearError: () => void;
}

interface ManualRestoreResult extends RestoreResult {
  preRestoreBackupCreated?: boolean;  // Vite plugin handles pre-restore backup
}
```

**Key Logic:**
- Validates `filePath` is a non-empty string before proceeding
- Delegates to `RestoreService.restoreFromBackup(filePath)`
- Notes that Vite plugin automatically creates pre-restore backups (no explicit backup creation)
- Wraps `RestoreService.getAvailableBackups()` with error state management

---

### useRestoreDetection

**File:** `src/hooks/useRestoreDetection.ts` (~258 lines)

Detects empty portfolio state and provides restore UI integration with full retry support.

**Parameters:**
```ts
useRestoreDetection(portfolioData: AppState)
```

**Return Type:**
```ts
interface UseRestoreDetectionReturn {
  shouldShowRestorePrompt: boolean;
  availableBackups: BackupMetadata[];
  isCheckingBackups: boolean;
  restoreFromLatest: (retryConfig?: Partial<RetryConfig>) => Promise<RestoreResult>;
  restoreFromBackup: (filePath: string, retryConfig?: Partial<RetryConfig>) => Promise<RestoreResult>;
  dismissRestorePrompt: () => void;
  checkError: string | null;
  errorDetails: ErrorDetails | null;
  retryLastRestore: () => Promise<RestoreResult>;
}
```

**Key Logic:**
- On mount and when `portfolioData` changes, checks `isPortfolioEmpty()` (excludes Cash buffer holdings)
- If empty, fetches backups from `GET /api/portfolio/backups` with retry (2 attempts, 1s base delay)
- Sets `shouldShowRestorePrompt = true` if backups are available
- `restoreFromBackup()` calls `POST /api/portfolio/restore` with `ErrorHandlingService.withRetry()`
- `restoreFromLatest()` picks first (newest) backup from sorted list
- `retryLastRestore()` remembers last attempted file path for retry
- `dismissRestorePrompt()` hides the prompt without restoring
- Parses timestamps from filePath pattern if metadata timestamp is missing: `(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)`

---

## Services (API Integrations)

### Yahoo Finance Service (Primary)

**File:** `src/services/yahooFinance.ts` (~565 lines)

Primary price data source. Browser-based implementation using CORS proxies.

**API Endpoint:**
```
https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
```

**CORS Proxies (tried in order):**
1. `https://api.allorigins.win/get?url=...`
2. `https://corsproxy.io/?...`
3. `https://cors-anywhere.herokuapp.com/...`

**Exchange Ticker Formatting:**
| Exchange | Format | Example |
|----------|--------|---------|
| LSE | `{TICKER}.L` | `LLOY.L` |
| AMS | `{TICKER}.AS` | `ASML.AS` |
| XETRA | `{TICKER}.DE` | `SAP.DE` |
| VI | `{TICKER}.VI` | `OMV.VI` |
| XC | `{TICKER}` (strip suffix) | `BTC` |
| NASDAQ/NYSE | `{TICKER}` (strip suffix) | `AAPL` |
| Other | `{TICKER}` (as-is) | - |

**Exported Functions:**

```ts
fetchQuote(symbol: string, exchange: string = 'NYSE'): Promise<QuoteData | null>
fetchHistoricalData(symbol: string, period: string, interval: string = '1d'): Promise<HistoricalData[]>
calculatePerformance(symbol: string): Promise<PerformanceData | null>
fetchMultipleQuotes(holdings: Array<{ticker, exchange}>): Promise<Map<string, QuoteData>>
clearCache(): void
```

**Data Types:**
```ts
interface QuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  marketState: string;
  lastUpdated: Date;
  priceGBP: number;         // Converted to GBP
  changeGBP: number;        // Converted to GBP
  previousCloseGBP: number; // Converted to GBP
  conversionRate: number;
}

interface PerformanceData {
  symbol: string;
  periods: { '1d': number; '2d': number; '3d': number; '1w': number;
             '1m': number; '6m': number; 'ytd': number; '1y': number; '2y': number; };
}
```

**Fallback Chain:**
1. Yahoo Finance via CORS proxy (try 3 proxies)
2. Alpha Vantage API
3. Alpaca Markets API (US stocks only)
4. Cached price with +/-1% random variation
5. Return `null` if all fail

**Batch Processing:**
- `fetchMultipleQuotes()` processes in batches of 10 with 100ms inter-batch delay
- Uses `Promise.allSettled()` per batch (partial failures don't block batch)
- Failed holdings are retried via Alpaca batch fallback
- Alpaca results are converted to `QuoteData` format with GBP conversion

**Caching:**
- 1-minute cache (`CACHE_DURATION = 60000ms`)
- Separate `priceCache` for fallback stability
- All conversions use `convertCurrency()` and `detectCurrency()` from currencyConverter

**Mock Data Generator:**
- `generateMockQuote()` used when all APIs fail
- Hardcoded realistic prices for known UK stocks (LLOY, BARC, VOD, BP, etc.)
- Currency detection: `.L` suffix -> GBX, UK ETF tickers -> GBX, others -> USD

---

### Alpha Vantage Service (Fallback 1)

**File:** `src/services/alphaVantageApi.ts` (~109 lines)

Secondary price source. Free tier: 25 calls/day, 5 calls/minute.

**API Endpoint:**
```
https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={key}
```

**API Key:** `MA6P3RBKOKWFWDUD` (hardcoded)

**Exported Function:**
```ts
fetchAlphaVantageQuote(symbol: string, exchange: string = 'NYSE'): Promise<{
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  marketState: string;
} | null>
```

**Exchange Formatting:**
- LSE: adds `.L` suffix
- NASDAQ/NYSE: strips any existing suffix

**Currency Detection:**
- LSE exchange -> `GBp` (pence)
- All others -> `USD`

**Error Handling:**
- Checks for `Error`, `Error Message` in response body
- Detects rate limiting via `Note` field in response
- Returns `null` on any failure

---

### Alpaca Markets Service (Fallback 2)

**File:** `src/services/alpacaApi.ts` (~226 lines)

Third-tier fallback for US stocks only. Uses paper trading endpoint.

**API Base URL:** `https://paper-api.alpaca.markets`

**Authentication:**
- API Key ID: `PA3F5CKBA5Q2` (hardcoded)
- Secret Key: `import.meta.env.VITE_ALPACA_API_SECRET_KEY` (env variable)

**Endpoints Used:**
| Endpoint | Method | Data |
|----------|--------|------|
| `/v2/stocks/{ticker}/trades/latest` | GET | Latest trade price |
| `/v2/stocks/{ticker}/quotes/latest` | GET | Bid/ask for midpoint price |
| `/v2/stocks/{ticker}/bars?timeframe=1Day&limit=2` | GET | Previous close from daily bars |

**Exported Functions:**
```ts
fetchAlpacaQuote(symbol: string, exchange: string = 'NYSE'): Promise<AlpacaQuoteData | null>
fetchMultipleAlpacaQuotes(holdings: Array<{ticker, exchange}>): Promise<Map<string, AlpacaQuoteData>>
clearAlpacaCache(): void
```

**Key Logic:**
- Only supports US exchanges (NASDAQ, NYSE, Other). Returns empty string for non-US -> function returns null
- Checks `isAlpacaConfigured()` before any API call (requires both key ID and secret)
- Price priority: latest trade price -> bid/ask midpoint -> null
- Previous close from daily bars endpoint, falls back to current price
- Batch processing in groups of 5 with 500ms inter-batch delay
- 1-minute cache per symbol
- All prices in USD (Alpaca is USD-only)

---

### Company Lookup Service

**File:** `src/services/companyLookup.ts` (~123 lines)

Fetches company names for ticker symbols using Yahoo Finance chart API.

**API Endpoint:**
```
https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
```
(Same endpoint as price fetching, but extracts `meta.longName` / `meta.shortName`)

**CORS Proxies:**
1. `https://api.allorigins.win/get?url=...`
2. `https://corsproxy.io/?...`

**Exported Function:**
```ts
fetchCompanyInfo(ticker: string, exchange: string = 'NYSE'): Promise<CompanyInfo | null>

interface CompanyInfo {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
}
```

**Key Logic:**
- 5-minute cache (`CACHE_DURATION = 300000ms`) keyed by `{ticker}_{exchange}`
- Same exchange-specific ticker formatting as Yahoo Finance service
- Extracts from response: `meta.longName || meta.shortName || ticker`
- Currency from `meta.currency || 'USD'`
- On failure: returns `{ symbol: ticker, name: ticker, exchange }` (ticker as fallback name)
- Caches both successful lookups and fallback results

---

### Currency Converter Service

**File:** `src/services/currencyConverter.ts` (~178 lines)

Currency conversion with GBP as base currency. Currently uses mock exchange rates.

**Mock Exchange Rates (GBP base):**
| Currency | Rate |
|----------|------|
| USD | 1.27 |
| GBP | 1.0 (base) |
| GBX | 0.01 (100 pence = 1 pound) |
| EUR | 1.17 |

**Exported Functions:**

```ts
fetchExchangeRates(): Promise<ExchangeRates>
convertCurrency(amount: number, fromCurrency: string, toCurrency: string = 'GBP'): Promise<CurrencyConversionResult>
detectCurrency(symbol: string, price: number, quoteCurrency?: string): string
formatCurrencyWithSymbol(amount: number, currency: string): string
clearCurrencyCache(): void
```

**`convertCurrency()` Conversion Paths:**
1. Same currency -> rate 1.0, no conversion
2. GBX/GBp -> GBP: divide by 100
3. GBX/GBp -> other: divide by 100, then multiply by target rate
4. Any -> GBX: convert to GBP first, then multiply by 100
5. GBP -> other: multiply by `rates[target]`
6. Other -> GBP: divide by `rates[source]`
7. Other -> other: via GBP (divide by source rate, multiply by target rate)
8. Result rounded to 4 decimal places

**`detectCurrency()` Logic:**
1. Symbol ends in `.L` -> force `GBp` (regardless of what Yahoo says)
2. If `quoteCurrency` provided and not `.L` stock -> use it
3. No dot in symbol or NASDAQ/NYSE prefix -> `USD`
4. `.PA`, `.DE`, `.MI`, `.AS`, `.VI` suffix -> `EUR`
5. Default -> `USD`

**`formatCurrencyWithSymbol()` Formatting:**
- GBP -> `pound{amount}` (2 decimal places)
- GBX -> `{amount}p` (0 decimal places)
- USD -> `${amount}` (2 decimal places)
- EUR -> `euro{amount}` (2 decimal places)
- Other -> `{amount} {currency}` (2 decimal places)

**Caching:**
- 5-minute cache for exchange rates
- Rates include small random fluctuation (+/-1%) on each fetch to simulate market movement

---

### Error Handling Service

**File:** `src/services/errorHandlingService.ts` (~305 lines)

Centralised error categorisation, retry logic, and user-friendly error messaging.

**Exported Class: `ErrorHandlingService`** (all static methods)

**`analyzeError(error: unknown): ErrorDetails`**

Categorises errors and generates structured error information:

```ts
interface ErrorDetails {
  code: string;              // e.g. "NET_abc123" (category prefix + timestamp base36)
  message: string;           // Original error message
  userMessage: string;       // User-friendly message
  severity: 'low' | 'medium' | 'high';
  category: 'network' | 'validation' | 'permission' | 'storage' | 'unknown';
  isRetryable: boolean;
  recoverySuggestions: string[];
}
```

**Error Categorisation Rules:**
| Category | Detection Keywords | Severity | Retryable |
|----------|-------------------|----------|-----------|
| network | network, fetch, connection, timeout, abort, 502, 503, 504 | low | yes |
| validation | validation, invalid, malformed, corrupt | medium | no |
| permission | permission, unauthorized, forbidden, 403 | high | no |
| storage | storage, disk, space, quota | high | no |
| unknown | (default) | medium | no |

**`withRetry<T>(operation, config): Promise<RetryResult<T>>`**

Retry with exponential backoff:

```ts
interface RetryConfig {
  maxAttempts: number;       // Default: 3
  baseDelay: number;         // Default: 1000ms
  maxDelay: number;          // Default: 10000ms
  backoffMultiplier: number; // Default: 2
  retryableErrors?: string[];
}

// Delay calculation: min(baseDelay * backoffMultiplier^(attempt-1), maxDelay)
// Attempt 1: 1000ms, Attempt 2: 2000ms, Attempt 3: 4000ms (capped at 10000ms)
```

**`createErrorNotification(errorDetails): { title, message, type, actions }`**

Generates notification objects for UI display:
- `type`: 'error' (high severity), 'warning' (medium), 'info' (low)
- Actions vary by category: Retry (retryable), Check Connection (network), View Details (validation), Dismiss (always)
- Titles: "Connection Problem", "Invalid Data", "Access Denied", "Storage Issue", "Operation Failed"

---

### Restore Service

**File:** `src/services/restoreService.ts` (~277 lines)

Portfolio backup validation and restore operations.

**Exported Class: `RestoreService`** (all static methods)

**Types:**
```ts
interface BackupMetadata {
  timestamp: string;
  filePath: string;
  portfolioCount: number;
  holdingsCount: number;
}

interface RestoreResult {
  success: boolean;
  restoredData?: AppState;
  error?: string;
  message?: string;
}

interface RestoreValidationResult {
  isValid: boolean;
  errors: string[];    // Blocking issues
  warnings: string[];  // Non-blocking issues
}
```

**`validateBackupData(data): RestoreValidationResult`**

Validation checks (errors = blocking, warnings = non-blocking):

| Level | Check |
|-------|-------|
| Error | Data is not an object |
| Error | Missing `portfolios` array |
| Error | Portfolio missing valid `id` (string) |
| Error | Portfolio missing valid `name` (string) |
| Error | Portfolio missing `holdings` array |
| Warning | Holding missing valid `id` |
| Warning | Holding has invalid price (not number or < 0) |
| Warning | Holding has invalid quantity (not number or < 0) |
| Warning | Portfolio missing `settings` object |
| Warning | Portfolio missing `lists` object |
| Warning | Missing or invalid `activePortfolioId` |

**`getAvailableBackups(): Promise<BackupMetadata[]>`**
- Fetches from `GET /api/portfolio/backups`
- Sorts by timestamp descending (newest first)
- Maps response to `BackupMetadata` with defaults for missing fields

**`restoreFromBackup(filePath): Promise<RestoreResult>`**
- Calls `POST /api/portfolio/restore` with `{ filePath }`
- Validates returned data via `validateBackupData()`
- Logs warnings if any exist
- Returns `RestoreResult` with `restoredData` as `AppState`

**`restoreFromLatest(): Promise<RestoreResult>`**
- Fetches available backups, picks the newest (index 0)
- Delegates to `restoreFromBackup()`

**`isPortfolioEmpty(data: AppState): boolean`**
- Returns `true` if no portfolios exist
- Returns `true` if all holdings across all portfolios are Cash buffer (`assetType === 'Cash' && name === 'Cash buffer'`)
- Otherwise returns `false`

**`performAutoRestore(currentData: AppState): Promise<RestoreResult | null>`**
- Returns `null` if portfolio is not empty (no action needed)
- Fetches backups, restores from latest if available
- Returns `null` if no backups exist

---

### Google Finance Service

**File:** `src/services/googleFinance.ts` (1 line - empty placeholder)

Not implemented.

---

## Summary Table

| Feature | Component(s) | Lines | Status |
|---------|-------------|-------|--------|
| Holdings Grid | HoldingsGrid, ColumnSettings | ~1846 | Complete |
| Allocation Manager | AllocationManager, InsightsPanel | ~2133 | Complete |
| Trade System | TradeForm, TradeHistory | ~624 | Complete |
| Portfolio Breakdown | PortfolioBreakdown | ~325 | Complete |
| Settings Panel | SettingsPanel, LivePriceSettings, LivePriceStatus | ~1347 | Complete |
| Backup/Restore | 12 components | ~3000+ | Complete |
| Live Prices | useLivePrices + 3 services | ~1074 | Complete |
| CSV Import/Export | csv.ts utility | ~373 | Complete |
| Portfolio Switcher | PortfolioSwitcher | ~261 | Complete |
| ETF Explorer | ETFExplorer page | ~292 | Mock data only |
| News Page | NewsPage | ~1 | Placeholder |
| Google Finance | googleFinance.ts | ~1 | Placeholder |
