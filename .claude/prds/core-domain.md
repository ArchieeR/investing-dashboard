---
name: core-domain
description: Core domain logic including data hierarchy, type system, dual calculations, budget system, percentage preservation, caching, reducer actions, selectors, CSV, and persistence.
status: backlog
created: 2026-02-13T10:51:08Z
---

# PRD: Core Domain Logic

## Executive Summary

This PRD defines the complete domain model for the portfolio intelligence platform. The core domain implements a hierarchical data structure (Portfolio > Section > Theme > Holding), a dual calculation system (Live values for current reality, Target values for allocation planning), a 3-tier budget system with percentage preservation, cash buffer auto-adjustment, GBX/GBp currency handling, 3-tier caching, 32 reducer actions, derived selectors, CSV import/export across 3 formats, and a persistence layer targeting Firestore with localStorage fallback.

## Problem Statement

Retail investors, particularly in the UK, lack affordable tools that combine portfolio tracking with sophisticated allocation planning. Existing tools either provide basic tracking without target allocation support, or are prohibitively expensive (Bloomberg Terminal). The core domain must support real-world complexity: multiple account types (ISA, SIPP, GIA), UK-specific currency handling (GBX pence), hierarchical budget allocation with cascading percentage preservation, and seamless import from major UK brokerages (Interactive Investor, Hargreaves Lansdown).

## User Stories

### US-1: Hierarchical Portfolio Organisation
**As a** retail investor with multiple accounts,
**I want to** organise my holdings into Sections (Core/Satellite/Cash), Themes (Tech/Value/Growth), and Accounts (ISA/SIPP/GIA),
**So that** I can understand my allocation at every level of the hierarchy.

**Acceptance Criteria:**
- Portfolios contain ordered lists of Sections, Themes, and Accounts
- Themes map to parent Sections via `themeSections` mapping
- Changing a theme's section assignment auto-updates all holdings in that theme
- The "Cash" section cannot be renamed or removed and always appears last
- At least one section, theme, and account must exist at all times
- Default sections: Core, Satellite, Cash; default themes: All, Cash; default accounts: Brokerage

### US-2: Dual Calculation System
**As a** portfolio manager,
**I want to** see both my current market values (Live) and my planned allocation targets (Target),
**So that** I can understand where I am and where I want to be.

**Acceptance Criteria:**
- Live values use `livePrice` (or fallback to manual `price`) multiplied by `qty`
- Target values cascade: `holdingTarget = themeTargetValue * holdingTargetPct / 100`
- `themeTargetValue = sectionTargetValue * themePercentOfSection / 100`
- `sectionTargetValue = portfolioTargetValue * sectionPercent / 100`
- Target delta shows difference between current value and target value
- Legacy fallback: when no `targetPortfolioValue` is set, use current live total as fallback
- Only included holdings (`include=true`) participate in calculations

### US-3: Budget Allocation with Percentage Preservation
**As a** portfolio planner,
**I want to** change a section's target percentage and have all child theme percentages scale proportionally,
**So that** I do not have to manually re-calculate every child allocation.

**Acceptance Criteria:**
- Changing a section percent triggers `preserveThemeRatiosOnSectionChange`
- Scale factor = `newPct / oldPct`; each child theme's `percentOfSection` is multiplied by the scale factor
- Changing a theme's `percentOfSection` triggers `preserveHoldingRatiosOnThemeChange`
- Each child holding's `targetPct` is multiplied by the scale factor
- Preservation only fires when old percentage > 0 and old !== new
- Budget resolution priority for themes: (1) `percentOfSection`, (2) `amount`, (3) `percent`

### US-4: Cash Buffer Auto-Adjustment
**As a** portfolio planner with a locked total,
**I want** the cash buffer to auto-adjust when I add or change holdings,
**So that** my total portfolio value always matches my locked target.

**Acceptance Criteria:**
- When `settings.lockTotal=true` and `settings.lockedTotal` is set, a "Cash buffer" holding is maintained
- Cash buffer: `assetType='Cash'`, `name='Cash buffer'`, `price=1`, `section='Cash'`, `theme='Cash'`
- `cashQty = roundToPennies(lockedTotal - nonCashTotal)` where nonCashTotal = sum of `price * qty` for all included non-cash holdings
- Cash buffer is auto-created if missing
- Every mutation that calls `applyBudgetsAndLock` triggers this adjustment

### US-5: GBX/GBp Currency Handling
**As a** UK investor,
**I want** prices in pence (GBX/GBp) to be automatically converted to pounds (GBP) for calculations,
**So that** my portfolio totals are accurate without manual conversion.

**Acceptance Criteria:**
- If `originalCurrency` is "GBX" or "GBp", `calculationPrice = originalPrice * 0.01`
- Emergency fallback: if ticker ends with `.L` and price > 1000, assume pence and divide by 100
- Stored on holding: `livePrice` (GBP-converted), `originalLivePrice` (raw), `originalCurrency` (source code)
- Cash holdings are skipped during live price updates
- CSV import: `parseMoney()` handles trailing `p` or `pence` suffix (divides by 100)
- Hargreaves Lansdown CSV: prices always treated as pence (appends `p` before parsing)

### US-6: CSV Import with Auto-Detection
**As a** user migrating from a UK brokerage,
**I want to** upload my CSV export and have the system auto-detect the format,
**So that** I can import holdings without manual formatting.

**Acceptance Criteria:**
- Format detection order: (1) Spec CSV, (2) Interactive Investor, (3) Hargreaves Lansdown
- Spec CSV: header exactly `"section,theme,assetType,name,ticker,account,price,qty,include,targetPct"`
- Interactive Investor: header contains `symbol`, `name`, `qty` columns (case-insensitive)
- Hargreaves Lansdown: contains a line starting with `"code,stock"` (case-insensitive)
- De-duplication by `ticker::name` (case-insensitive); existing holdings never overwritten
- Import auto-creates sections, themes, accounts from CSV data
- All filters are cleared after import
- Unsupported format throws `Error('Unsupported CSV format')`

### US-7: Trade Recording with Cost Basis
**As a** trader,
**I want to** record buy and sell trades that automatically update my average cost and quantity,
**So that** I can track my cost basis and profit/loss accurately.

**Acceptance Criteria:**
- Buy: `newQty = currentQty + tradeQty`; `newAvgCost = (currentAvgCost * currentQty + tradePrice * tradeQty) / newQty`
- Sell: `newQty = max(0, currentQty - tradeQty)`; `avgCost` unchanged unless `newQty === 0` (then `avgCost = 0`)
- Trade is appended to the portfolio's `trades[]` array with a generated ID
- Profit/loss: `totalGain = marketValue - costBasis`; `totalGainPercent = (totalGain / costBasis) * 100`

### US-8: Multiple Portfolios with Draft System
**As a** investor,
**I want to** maintain multiple portfolios and create draft copies for what-if scenarios,
**So that** I can experiment without affecting my real portfolio.

**Acceptance Criteria:**
- Initial state creates 3 default portfolios: Main Portfolio, ISA Portfolio, SIPP Portfolio
- `create-draft-portfolio`: deep-clones parent as draft (`type='draft'`, `parentId` set), sets draft as active
- `promote-draft-to-actual`: replaces parent data with draft data, keeps parent ID/name, removes draft
- Playground mode: snapshot current portfolio, experiment freely, restore from snapshot
- Switching portfolios clears all filters and disables playground
- At least one portfolio must remain at all times

## Functional Requirements

### FR-1: Type System

#### Core Types
- `AssetType`: `'ETF' | 'Stock' | 'Crypto' | 'Cash' | 'Bond' | 'Fund' | 'Other'`
- `Exchange`: `'LSE' | 'NYSE' | 'NASDAQ' | 'AMS' | 'XETRA' | 'XC' | 'VI' | 'Other'`
- `TradeType`: `'buy' | 'sell'`
- `PortfolioType`: `'actual' | 'draft'`

#### Holding Interface
```typescript
interface Holding {
  id: string;
  section: string;
  theme: string;
  assetType: AssetType;
  name: string;
  ticker: string;
  exchange: Exchange;
  account: string;
  price: number;
  qty: number;
  include: boolean;
  targetPct?: number;
  avgCost?: number;
  livePrice?: number;
  livePriceUpdated?: Date;
  dayChange?: number;
  dayChangePercent?: number;
  originalLivePrice?: number;
  originalCurrency?: string;
  conversionRate?: number;
}
```

#### Trade Interface
```typescript
interface Trade {
  id: string;
  holdingId: string;
  type: TradeType;
  date: string;
  price: number;
  qty: number;
}
```

#### Lists Interface (Taxonomy)
```typescript
interface Lists {
  sections: string[];
  themes: string[];
  accounts: string[];
  themeSections: Record<string, string>;
}
```

#### Settings Interface
```typescript
interface Settings {
  currency: string;              // Default "GBP"
  lockTotal: boolean;
  lockedTotal?: number;
  targetPortfolioValue?: number;
  enableLivePrices: boolean;     // Default true
  livePriceUpdateInterval: number; // Default 10 (minutes)
  visibleColumns: VisibleColumns;
}
```

#### VisibleColumns Interface (30+ boolean flags)
Sections: Basic Info (section, theme, assetType, name, ticker, exchange, account), Pricing (price, livePrice, avgCost), Holdings (qty, value, liveValue, costBasis), Daily Changes (dayChange, dayChangePercent), Portfolio Metrics (pctOfPortfolio, pctOfSection, pctOfTheme, targetPct, targetDelta), Performance (1d, 2d, 3d, 1w, 1m, 6m, ytd, 1y, 2y), Controls (include, actions).

#### Budget System
```typescript
interface BudgetLimit {
  amount?: number;
  percent?: number;
  percentOfSection?: number;
}

interface Budgets {
  sections: Record<string, BudgetLimit>;
  accounts: Record<string, BudgetLimit>;
  themes: Record<string, BudgetLimit>;
}
```

#### Portfolio Interface
```typescript
interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  parentId?: string;
  lists: Lists;
  holdings: Holding[];
  settings: Settings;
  budgets: Budgets;
  trades: Trade[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Application State
```typescript
interface AppState {
  portfolios: Portfolio[];
  activePortfolioId: string;
  playground: PlaygroundState;
  filters: Filters;
}
```

### FR-2: Reducer Actions (32 Total)

**Holding CRUD (4):** `add-holding`, `delete-holding`, `duplicate-holding`, `update-holding` -- all call `applyBudgetsAndLock`.

**Portfolio Value (1):** `set-total` -- sets `lockTotal=true`, `lockedTotal=total`, triggers cash buffer.

**Filters (1):** `set-filter` -- sets or clears section/theme/account filter.

**Budget System (2):** `set-budget` (with percentage preservation cascade), `set-holding-target-percent`.

**Taxonomy (5):** `set-theme-section`, `add-list-item`, `rename-list-item`, `remove-list-item`, `reorder-list`.

**CSV Import (2):** `import-holdings` (de-duplicates by ticker::name), `import-trades` (creates holdings if needed).

**Trade (1):** `record-trade` -- applies trade to holding, appends to trades array.

**Portfolio Management (6):** `set-active-portfolio`, `rename-portfolio`, `add-portfolio`, `remove-portfolio`, `create-draft-portfolio`, `promote-draft-to-actual`.

**Playground (2):** `set-playground-enabled`, `restore-playground`.

**Backup/Restore (2):** `restore-state`, `restore-portfolio-backup`.

**Settings (1):** `update-portfolio-settings`.

**Live Prices (1):** `update-live-prices` -- GBX/GBp conversion, emergency fallback for `.L` tickers.

**Core Helpers:**
- `updateActivePortfolio(state, updater)` -- applies updater, wraps in `ensureCashPortfolio`
- `ensureCashPortfolio(portfolio)` -- ensures settings, Cash lists, type, timestamps
- `applyBudgetsAndLock(portfolio)` -- aligns holdings to theme sections, adjusts cash buffer if locked
- `adjustTotal(portfolio, total)` -- cash buffer auto-adjustment algorithm
- `applyTradeToHolding(holding, trade)` -- buy/sell logic for cost basis

### FR-3: Selectors and Derived Data

**`calculateHoldingValue(holding)`:** Returns `{ value, liveValue, manualValue, dayChangeValue, usedLivePrice }`.

**`calculateLivePortfolioTotals(holdings)`:** Sums included holdings into `{ totalAllocatedValue, sectionTotals, themeTotals }`.

**`calculateTargetHierarchy(portfolio, liveTotals)`:** Builds target hierarchy from budgets. Falls back to live totals as targets when no `targetPortfolioValue`.

**`selectHoldingsWithDerived(portfolio)`:** Primary selector producing `HoldingDerived[]` with: value, liveValue, manualValue, dayChangeValue, pctOfTotal, pctOfSection, pctOfTheme, targetValue, targetValueDiff, targetPctDiff, profitLoss.

**Breakdown Selectors:** `selectBreakdownBySection`, `selectBreakdownByAccount`, `selectBreakdownByTheme` -- each returns `BreakdownEntry[]` sorted by value descending.

**Budget Remaining Selector:** `selectBudgetRemaining` -- returns remaining budget for sections, accounts, themes with hierarchical theme budget calculation.

### FR-4: Calculation Utilities

- `calculateValue({ price, qty })` -- price * qty with guards
- `calculateQtyFromValue(value, price)` -- value / price with guards
- `calculatePctOfTotal(value, total)` -- (value / total) * 100
- `calculateLiveDelta({ currentValue, previousValue })` -- value and percentage differences
- `calculateTargetDelta(input)` -- two interfaces (legacy and new) for target difference
- `roundToPennies(value)` -- `Math.round(value * 100) / 100`
- `calculateValueForShare(others, share)` -- `(share * others) / (1 - share)`
- `calculateCashBufferQty({ lockedTotal, nonCashTotal })` -- `roundToPennies(lockedTotal - nonCashTotal)`
- `calculateProfitLoss({ currentPrice, avgCost, quantity, dayChange?, dayChangePercent? })` -- full P/L calculation
- `validatePercentage(percentage, allowZero?, maxPercent?)` -- validation helper
- `safeDivide(numerator, denominator)` -- division with zero guard
- `getEffectivePrice(livePrice, manualPrice)` -- live price preference with fallback

### FR-5: 3-Tier Caching

| Cache | Key Generation | Invalidation |
|-------|---------------|-------------|
| `liveCalculationCache` | Holdings: `id-qty-price-livePrice-avgCost-dayChange-dayChangePercent-include-section-theme-account-assetType-exchange` | Live price updates, qty changes, holdings added/removed |
| `targetCalculationCache` | Holdings: `id-targetPct-include-section-theme-account-assetType-exchange` + `targetPortfolioValue` + JSON budgets + JSON themeSections | Target % changes, budget changes |
| `derivedHoldingsCache` | Combined: `derived:{liveKey}\|{targetKey}` | Either live or target invalidated |

Max 10 entries per cache. Older entries pruned. `cacheInvalidation` API exposes `invalidateLiveCalculations`, `invalidateTargetCalculations`, `invalidateAllCalculations`, `getCacheStats`.

### FR-6: CSV Import/Export

**Export:** `holdingsToCsv(rows)` with header: `section,theme,assetType,name,ticker,account,price,qty,include,targetPct`. `tradesToCsv(trades, holdings)` with header: `ticker,name,type,date,price,qty`.

**Import Parsers:**
- `parseSpecCsv(csv)` -- exact header match, direct mapping
- `parseInteractiveInvestorCsv(csv)` -- header contains symbol/name/qty, assigns Imported to section/theme/account
- `parseHlCsv(csv)` -- "code,stock" header detection, first line as account name, prices always in pence
- `parseTradesCsv(csv)` -- strict header match

**Utilities:** `stripBom`, `parseCsvRow` (RFC-4180), `normaliseBoolean`, `parseNumber`, `parseMoney` (handles pence suffix, currency symbols), `normaliseAssetType`, `escapeCsvValue`.

### FR-7: Persistence

**Storage Key:** `'portfolio-manager-state'`

**Load Flow:** (1) In dev: fetch `/api/portfolio/load`. (2) Fallback: `localStorage.getItem`. (3) If localStorage has data but file did not (dev): migrate to file.

**Save Flow:** (1) In dev: POST to `/api/portfolio/save`. (2) Always: `localStorage.setItem`.

**Serialization:** `serializeAppState` converts Date objects to ISO strings. `deserializeAppState` converts back.

**Save Guard:** Provider tracks `hasLoadedInitialState` to prevent saving empty default state.

## Non-Functional Requirements

- **NFR-1:** All state updates must be immutable (new objects, never mutate)
- **NFR-2:** Cash buffer accuracy within +/- 0.01 GBP of locked total
- **NFR-3:** Calculation cache hit rate > 90% during normal usage
- **NFR-4:** CSV import of 500 holdings completes in < 500ms
- **NFR-5:** All numeric values rounded to pennies (2 decimal places) via `roundToPennies`
- **NFR-6:** State persistence is async and non-blocking to the UI
- **NFR-7:** Deep clone for draft/playground uses `JSON.parse(JSON.stringify())` for correctness

## Technical Specification

### State Architecture
- React `useReducer` + `createContext` pattern (reference implementation)
- Target: Firestore for persistence, TanStack Query for server state, React Context for global state
- Every mutation to active portfolio passes through `updateActivePortfolio` which calls `ensureCashPortfolio`
- Most mutations call `applyBudgetsAndLock` which aligns holdings and adjusts cash buffer

### Constants
```typescript
const CASH_BUFFER_NAME = 'Cash buffer';
const CASH_BUFFER_PRICE = 1;
const CASH_SECTION = 'Cash';
const IMPORTED_LABEL = 'Imported';
```

### Protected Entities
- "Cash" section: cannot be renamed or removed, always last in sections list
- "Cash" theme: always last in themes list
- Minimum one section/theme/account/portfolio must exist

### Factory Functions
- `createEmptyPortfolio(id, name, type, parentId?)` -- creates portfolio with defaults
- `createHolding(overrides?)` -- creates holding with defaults (section=Core, theme=All, assetType=ETF, exchange=LSE)
- `createInitialState()` -- creates 3 default portfolios
- `getActivePortfolio(state)` -- safe accessor, throws if not found

## Success Criteria

1. All 32 reducer actions pass unit tests with edge cases
2. Dual calculation system produces correct values for portfolios with mixed live/manual prices
3. Percentage preservation maintains proportional ratios within 0.01% precision
4. Cash buffer maintains locked total within 0.01 GBP
5. All 3 CSV formats import correctly with proper de-duplication
6. GBX/GBp conversion handles all known UK stock scenarios
7. Cache invalidation triggers correctly on each mutation type
8. State round-trips through serialization/deserialization without data loss

## Constraints & Assumptions

- GBP is the base currency for all calculations
- The "Cash buffer" holding uses `price=1` (1 unit = 1 GBP)
- `targetPct` on holdings is percentage of theme, not portfolio
- Budget `percentOfSection` on themes is percentage of parent section, not portfolio
- CSV imports never overwrite existing holdings (de-duplication by ticker::name)
- All IDs are regenerated on import (using `crypto.randomUUID` with fallback)
- Dates are stored as ISO strings in persistence, converted to Date objects in memory

## Out of Scope

- Real-time multi-user collaboration
- Undo/redo history
- Time-series historical tracking of portfolio values
- Tax calculations (capital gains, dividend tax)
- Broker API integration for automatic trade import
- Currency conversion beyond GBX/GBp to GBP (handled by separate currency service)

## Dependencies

- **Firebase Firestore** (PRD: infrastructure) -- for production persistence
- **FMP API** (PRD: infrastructure) -- for live price data feeding into `update-live-prices`
- **Apify** (PRD: infrastructure) -- for LSE pricing fallback
- **UI Components** (PRD: ui-design-system) -- for rendering derived holding data
- **Feature Layer** (PRD: features) -- for user-facing allocation, trade, and import interfaces
