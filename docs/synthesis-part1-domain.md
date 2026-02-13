# Portfolio Manager - Core Domain Logic Synthesis

> Extracted verbatim from `_portfolio-reference/src/` -- the authoritative source for all domain logic.
> This document is intended to serve as the complete blueprint for rebuilding the application.

---

## Table of Contents

1. [Type Definitions](#1-type-definitions)
2. [State Management & Reducer Actions](#2-state-management--reducer-actions)
3. [Selectors & Derived Data](#3-selectors--derived-data)
4. [Calculation Utilities](#4-calculation-utilities)
5. [Percentage Preservation Algorithm](#5-percentage-preservation-algorithm)
6. [CSV Parsing & Export](#6-csv-parsing--export)
7. [Storage & Persistence](#7-storage--persistence)
8. [Serialization](#8-serialization)
9. [Key Architectural Patterns](#9-key-architectural-patterns)

---

## 1. Type Definitions

Source: `_portfolio-reference/src/state/types.ts`

### Core Enums / Union Types

```typescript
export type AssetType =
  | 'ETF'
  | 'Stock'
  | 'Crypto'
  | 'Cash'
  | 'Bond'
  | 'Fund'
  | 'Other';

export type Exchange = 'LSE' | 'NYSE' | 'NASDAQ' | 'AMS' | 'XETRA' | 'XC' | 'VI' | 'Other';

export type TradeType = 'buy' | 'sell';

export type PortfolioType = 'actual' | 'draft';
```

### Holding (the fundamental unit)

```typescript
export interface Holding {
  id: string;
  section: string;          // Top-level grouping (e.g. "Core", "Satellite", "Cash")
  theme: string;            // Mid-level grouping (e.g. "Tech", "All", "Cash")
  assetType: AssetType;
  name: string;
  ticker: string;
  exchange: Exchange;
  account: string;          // Brokerage account (e.g. "ISA", "GIA", "SIPP")
  price: number;            // Manual/fallback price
  qty: number;              // Quantity held
  include: boolean;         // Whether to include in portfolio calculations
  targetPct?: number;       // Target % within its theme (for allocation planning)
  avgCost?: number;         // Average cost basis per unit
  livePrice?: number;       // Live market price (GBP-converted for UK stocks)
  livePriceUpdated?: Date;
  dayChange?: number;       // Per-share day change
  dayChangePercent?: number;
  originalLivePrice?: number;   // Raw price before currency conversion
  originalCurrency?: string;    // e.g. "GBX", "GBp", "USD", "GBP"
  conversionRate?: number;      // FX conversion rate applied
}
```

### Trade

```typescript
export interface Trade {
  id: string;
  holdingId: string;
  type: TradeType;
  date: string;
  price: number;
  qty: number;
}
```

### Lists (taxonomy management)

```typescript
export interface Lists {
  sections: string[];                    // Ordered list of section names
  themes: string[];                      // Ordered list of theme names
  accounts: string[];                    // Ordered list of account names
  themeSections: Record<string, string>; // Maps theme name -> parent section name
}
```

**Default lists:**
```typescript
sections: ['Core', 'Satellite', 'Cash']
themes: ['All', 'Cash']
accounts: ['Brokerage']
themeSections: { All: 'Core', Cash: 'Cash' }
```

### Settings

```typescript
export interface Settings {
  currency: string;                  // Base currency, default "GBP"
  lockTotal: boolean;                // When true, auto-adjusts cash buffer
  lockedTotal?: number;              // The locked portfolio total value
  targetPortfolioValue?: number;     // Target value for planning/target allocation
  enableLivePrices: boolean;         // Default true
  livePriceUpdateInterval: number;   // Minutes between updates, default 10
  visibleColumns: VisibleColumns;    // Which grid columns to show
}
```

### VisibleColumns (all boolean flags)

```typescript
export interface VisibleColumns {
  section: boolean;           // default: true
  theme: boolean;             // default: true
  assetType: boolean;         // default: true
  name: boolean;              // default: true
  ticker: boolean;            // default: true
  exchange: boolean;          // default: true
  account: boolean;           // default: true
  price: boolean;             // default: false  (manual price hidden by default)
  livePrice: boolean;         // default: true
  avgCost: boolean;           // default: true
  qty: boolean;               // default: true
  value: boolean;             // default: false  (manual value hidden by default)
  liveValue: boolean;         // default: true
  costBasis: boolean;         // default: false
  dayChange: boolean;         // default: true
  dayChangePercent: boolean;  // default: true
  pctOfPortfolio: boolean;    // default: true
  pctOfSection: boolean;      // default: false
  pctOfTheme: boolean;        // default: true
  targetPct: boolean;         // default: true
  targetDelta: boolean;       // default: true
  performance1d: boolean;     // default: false
  performance2d: boolean;     // default: false
  performance3d: boolean;     // default: false
  performance1w: boolean;     // default: false
  performance1m: boolean;     // default: false
  performance6m: boolean;     // default: false
  performanceYtd: boolean;    // default: false
  performance1y: boolean;     // default: false
  performance2y: boolean;     // default: false
  include: boolean;           // default: true
  actions: boolean;           // default: true
}
```

### Budget System (3-tier)

```typescript
export interface BudgetLimit {
  amount?: number;            // Absolute GBP amount
  percent?: number;           // Percentage of portfolio total
  percentOfSection?: number;  // Percentage of parent section (themes only)
}

export interface Budgets {
  sections: Record<string, BudgetLimit>;   // Section name -> budget limit
  accounts: Record<string, BudgetLimit>;   // Account name -> budget limit
  themes: Record<string, BudgetLimit>;     // Theme name -> budget limit
}
```

**Budget resolution priority (for themes):**
1. `percentOfSection` -- Theme target = Section target x (Theme % of Section)
2. `amount` -- Absolute amount; derive section percentage from it
3. `percent` -- Percentage of total portfolio; derive amount and section percentage

### Portfolio

```typescript
export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;       // 'actual' or 'draft'
  parentId?: string;         // For draft portfolios, reference to actual portfolio
  lists: Lists;
  holdings: Holding[];
  settings: Settings;
  budgets: Budgets;
  trades: Trade[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Filters

```typescript
export interface Filters {
  section?: string;
  theme?: string;
  account?: string;
}
```

### Playground (sandbox mode)

```typescript
export interface PlaygroundState {
  enabled: boolean;
  snapshot?: Portfolio;    // Saved snapshot to restore from
}
```

### Top-Level Application State

```typescript
export interface AppState {
  portfolios: Portfolio[];
  activePortfolioId: string;
  playground: PlaygroundState;
  filters: Filters;
}
```

### Factory Functions

```typescript
// Generate unique IDs (crypto.randomUUID with fallback)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `holding-${Math.random().toString(36).slice(2, 11)}`;
};

// Create empty portfolio with defaults
export const createEmptyPortfolio = (
  id: string, name: string, type: PortfolioType = 'actual', parentId?: string
): Portfolio => ({
  id, name, type, parentId,
  lists: createEmptyLists(),
  holdings: [],
  settings: {
    currency: 'GBP',
    lockTotal: false,
    enableLivePrices: true,
    livePriceUpdateInterval: 10,
    visibleColumns: createDefaultVisibleColumns(),
  },
  budgets: { sections: {}, accounts: {}, themes: {} },
  trades: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create holding with defaults
export const createHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: overrides.id ?? generateId(),
  section: overrides.section ?? 'Core',
  theme: overrides.theme ?? 'All',
  assetType: overrides.assetType ?? 'ETF',
  name: overrides.name ?? '',
  ticker: overrides.ticker ?? '',
  exchange: overrides.exchange ?? 'LSE',
  account: overrides.account ?? 'Brokerage',
  price: overrides.price ?? 0,
  qty: overrides.qty ?? 0,
  include: overrides.include ?? true,
  targetPct: overrides.targetPct,
  avgCost: overrides.avgCost ?? overrides.price ?? 0,
});

// Initial state: 3 default portfolios
export const createInitialState = (): AppState => {
  const portfolios = [
    createEmptyPortfolio('portfolio-1', 'Main Portfolio', 'actual'),
    createEmptyPortfolio('portfolio-2', 'ISA Portfolio', 'actual'),
    createEmptyPortfolio('portfolio-3', 'SIPP Portfolio', 'actual'),
  ];
  return {
    portfolios,
    activePortfolioId: portfolios[0].id,
    playground: { enabled: false },
    filters: {},
  };
};

// Safe accessor
export const getActivePortfolio = (state: AppState): Portfolio => {
  const portfolio = state.portfolios.find((p) => p.id === state.activePortfolioId);
  if (!portfolio) throw new Error('Active portfolio not found');
  return portfolio;
};
```

---

## 2. State Management & Reducer Actions

Source: `_portfolio-reference/src/state/portfolioStore.tsx`

### Architecture

- Uses React `useReducer` + `createContext` pattern
- All mutations flow through `portfolioReducer`
- Every mutation to the active portfolio passes through `updateActivePortfolio` which calls `ensureCashPortfolio` on the result
- Most mutations call `applyBudgetsAndLock` which:
  1. Aligns holdings to their theme's section via `themeSections` mapping
  2. If `lockTotal` is enabled, auto-adjusts the cash buffer

### Constants

```typescript
const CASH_BUFFER_NAME = 'Cash buffer';
const CASH_BUFFER_PRICE = 1;       // Cash is always priced at 1 (GBP)
const CASH_SECTION = 'Cash';
const IMPORTED_LABEL = 'Imported';
```

### Core Helper Functions

#### `updateActivePortfolio(state, updater)`
Finds the active portfolio by `activePortfolioId`, applies the updater function, then wraps result in `ensureCashPortfolio`.

#### `ensureCashPortfolio(portfolio)`
Ensures data integrity on every mutation:
1. Calls `ensurePortfolioSettings` -- adds missing settings with defaults (`enableLivePrices: true`, `livePriceUpdateInterval: 5`, default `visibleColumns`)
2. Calls `ensureCashLists` -- guarantees "Cash" exists in both `sections` and `themes` arrays (always at the end), and that `themeSections['Cash'] = 'Cash'`
3. Ensures `type` defaults to `'actual'`
4. Ensures `createdAt` and `updatedAt` exist

#### `applyBudgetsAndLock(portfolio)`
Called after most mutations:
```
1. applyThemeSections(portfolio)
   -- For each holding, if its theme has a mapped section in themeSections,
      force the holding's section to match.

2. If settings.lockTotal && settings.lockedTotal:
   -- Call adjustTotal(portfolio, lockedTotal)
```

#### `adjustTotal(portfolio, total)`
The cash buffer auto-adjustment algorithm:
```
1. Find the "Cash buffer" holding (assetType='Cash', name='Cash buffer')
2. If not found, create one and append it
3. Calculate nonCashTotal = sum of (price * qty) for all included, non-cash holdings
4. cashQty = calculateCashBufferQty({ lockedTotal: total, nonCashTotal })
          = roundToPennies(lockedTotal - nonCashTotal)
5. Update cash buffer holding: price=1, qty=cashQty, include=true,
   section='Cash', theme='Cash'
```

#### `applyTradeToHolding(holding, trade)`
```
For BUY:
  newQty = currentQty + tradeQty
  totalCost = currentAvgCost * currentQty + tradePrice * tradeQty
  newAvgCost = newQty > 0 ? totalCost / newQty : 0
  Update price to trade price if > 0

For SELL:
  newQty = max(0, currentQty - tradeQty)
  avgCost unchanged (unless newQty === 0, then avgCost = 0)
```

#### `resolveBudgetValue(limit, targetTotal)`
Priority:
1. If `limit.amount` is set and finite -> return `max(amount, 0)`
2. If `limit.percent` is set and finite and `targetTotal > 0` -> return `max((percent/100) * targetTotal, 0)`
3. Otherwise -> `undefined`

### Complete Action Catalog (32 actions)

#### Holding CRUD

| Action | Behavior |
|--------|----------|
| `add-holding` | Adds a new holding (with defaults from first section/theme/account). Calls `applyBudgetsAndLock`. |
| `delete-holding` | Removes holding by ID. Calls `applyBudgetsAndLock`. |
| `duplicate-holding` | Deep-clones holding (new ID), inserts after original. Calls `applyBudgetsAndLock`. |
| `update-holding` | Merges `patch` into holding by ID. Calls `applyBudgetsAndLock`. |

#### Portfolio Value Controls

| Action | Behavior |
|--------|----------|
| `set-total` | Sets `lockTotal=true` and `lockedTotal=total`. Calls `applyBudgetsAndLock` (triggers cash buffer adjustment). |

#### Filters

| Action | Behavior |
|--------|----------|
| `set-filter` | Sets or clears a filter key (section/theme/account). |

#### Budget System

| Action | Behavior |
|--------|----------|
| `set-budget` | Sets budget for a domain (sections/accounts/themes) and key. Normalizes the limit. For **section percent changes**: calls `preserveThemeRatiosOnSectionChange` to scale child theme percentages proportionally. For **theme percentOfSection changes**: calls `preserveHoldingRatiosOnThemeChange` to scale child holding target percentages. Also derives `amount` and `percent` from `percentOfSection` using the section's budget. |
| `set-holding-target-percent` | Sets `targetPct` on a specific holding. If value is 0 or undefined, clears it. |

#### Taxonomy (Lists) Management

| Action | Behavior |
|--------|----------|
| `set-theme-section` | Maps a theme to a section (or removes mapping). Updates all holdings with that theme to the new section. |
| `add-list-item` | Adds a section/theme/account. For themes, auto-maps to a section via `themeSections`. |
| `rename-list-item` | Renames a section/theme/account. Updates all holdings, budgets, themeSections mappings, and active filters. **Cannot rename the "Cash" section.** |
| `remove-list-item` | Removes a section/theme/account (min 1 must remain). Reassigns holdings to fallback (first remaining item). Updates budgets, themeSections, filters. **Cannot remove the "Cash" section.** |
| `reorder-list` | Reorders items in a list by drag index. **Cash section always stays at the end.** |

#### CSV Import

| Action | Behavior |
|--------|----------|
| `import-holdings` | Imports CSV rows. De-duplicates by `ticker::name` (case-insensitive). Auto-creates sections/themes/accounts from CSV data. Clears all filters after import. |
| `import-trades` | Imports trade rows. Creates holdings if ticker not found. Applies each trade to the matching holding via `applyTradeToHolding`. |

#### Trade Recording

| Action | Behavior |
|--------|----------|
| `record-trade` | Applies a single trade to a holding. Generates trade ID, appends to `trades[]`. Uses `applyTradeToHolding` for the holding update. |

#### Portfolio Management

| Action | Behavior |
|--------|----------|
| `set-active-portfolio` | Switches active portfolio. Clears filters and disables playground. |
| `rename-portfolio` | Renames portfolio with unique name generation. |
| `add-portfolio` | Creates new empty portfolio. Auto-generates unique name. Sets it as active. |
| `remove-portfolio` | Removes portfolio (min 1 must remain). If active was removed, switches to first remaining. |
| `create-draft-portfolio` | Deep-clones parent portfolio as a draft (`type='draft'`, `parentId` set). Sets draft as active. |
| `promote-draft-to-actual` | Replaces parent portfolio data with draft data, keeps parent's ID and name, removes draft. |

#### Playground (Sandbox)

| Action | Behavior |
|--------|----------|
| `set-playground-enabled` | `true`: snapshots current active portfolio. `false`: clears snapshot. |
| `restore-playground` | Restores active portfolio from playground snapshot. |

#### Backup/Restore

| Action | Behavior |
|--------|----------|
| `restore-state` | Replaces entire `AppState` wholesale. |
| `restore-portfolio-backup` | Replaces current active portfolio with backup data (keeps current portfolio ID). |

#### Settings

| Action | Behavior |
|--------|----------|
| `update-portfolio-settings` | Merges partial settings into active portfolio's settings. |

#### Live Prices

| Action | Behavior |
|--------|----------|
| `update-live-prices` | Updates holdings with live price data from a `Map<ticker, priceData>`. **GBX/GBp handling**: if `originalCurrency` is "GBX" or "GBp", converts `originalPrice * 0.01` to get GBP. **Emergency fallback**: if ticker ends with `.L` and price > 1000, assumes pence and divides by 100. Only creates new portfolio object if at least one holding actually changed. Skips `Cash` asset type holdings. |

### GBX/GBp Conversion Logic (verbatim from `update-live-prices`)

```typescript
if (priceData.originalCurrency === 'GBX' || priceData.originalCurrency === 'GBp') {
  // If original currency is GBX/GBp (pence), convert to GBP for calculations
  calculationPrice = priceData.originalPrice * 0.01;
} else if (
  holding.ticker.toUpperCase().endsWith('.L') &&
  (priceData.price > 1000 || priceData.originalPrice > 1000)
) {
  // Fallback: if it's a UK stock and price is suspiciously high, assume pence
  const priceToConvert = priceData.originalPrice || priceData.price;
  calculationPrice = priceToConvert * 0.01;
}
```

Stored on the holding:
- `livePrice` = GBP-converted price (for calculations)
- `originalLivePrice` = raw price before conversion (for display)
- `originalCurrency` = source currency code (for display)

### Context Value (PortfolioContextValue)

The React context exposes:

```typescript
interface PortfolioContextValue {
  // Data
  portfolios: Array<{ id; name; type; owner; parentId }>;  // Summary list
  allPortfolios: Portfolio[];                                // Full objects
  portfolio: Portfolio;                                      // Active portfolio
  derivedHoldings: HoldingDerived[];                         // Computed holding data
  totalValue: number;                                        // Sum of live values
  targetPortfolioValue: number;                              // User-set target
  filters: Filters;
  bySection: BreakdownEntry[];
  byAccount: BreakdownEntry[];
  byTheme: BreakdownEntry[];
  budgets: Budgets;
  remaining: { sections; accounts; themes } (BudgetRemaining[]);
  trades: Trade[];
  playground: PlaygroundState;

  // Actions (all useCallback-wrapped)
  addHolding, duplicateHolding, updateHolding, deleteHolding,
  setTotal, setTargetPortfolioValue, setFilter,
  setBudget, setHoldingTargetPercent,
  setThemeSection, addListItem, renameListItem, removeListItem, reorderList,
  importHoldings, recordTrade, importTrades,
  setActivePortfolio, renamePortfolio, addPortfolio, removePortfolio,
  createDraftPortfolio, promoteDraftToActual,
  setPlaygroundEnabled, restorePlayground,
  restorePortfolioBackup, restoreFullBackup,
  updatePortfolioSettings, updateLivePrices,
}
```

### Provider Lifecycle

```
Mount:
  1. Start with createInitialState() (3 default portfolios)
  2. Async loadState() from file API (dev) or localStorage (prod)
  3. If loaded, dispatch 'restore-state'
  4. Set hasLoadedInitialState = true

Every state change (after initial load):
  1. saveState(state) -- async save to file API + localStorage backup
```

---

## 3. Selectors & Derived Data

Source: `_portfolio-reference/src/state/selectors.ts`

### Internal Types (not exported)

```typescript
interface HoldingValueResult {
  value: number;           // Current market value (= liveValue)
  liveValue: number;       // Live price * qty (or manual fallback)
  manualValue: number;     // Manual price * qty
  dayChangeValue: number;  // liveValue - manualValue (0 if no live price)
  usedLivePrice: boolean;
}

interface LivePortfolioTotals {
  totalAllocatedValue: number;
  sectionTotals: Map<string, number>;
  themeTotals: Map<string, number>;
}

interface SectionTarget {
  percentage: number;       // User-set % of portfolio
  targetValue: number;      // portfolioTarget * percentage / 100
  allocatedValue: number;   // Current live value in this section
}

interface ThemeTarget {
  section: string;
  percentage: number;           // User-set % of section
  percentageOfPortfolio: number; // Derived: targetValue / portfolioTarget * 100
  targetValue: number;          // sectionTargetValue * percentage / 100
  allocatedValue: number;       // Current live value in this theme
}

interface TargetHierarchy {
  portfolioTarget: number;
  sectionTargets: Map<string, SectionTarget>;
  themeTargets: Map<string, ThemeTarget>;
}
```

### Exported Types

```typescript
export interface HoldingDerived {
  holding: Holding;
  value: number;               // = liveValue
  liveValue: number;           // Live/effective price * qty
  manualValue: number;         // Manual price * qty
  dayChangeValue: number;      // Diff between live and manual
  usedLivePrice: boolean;
  pctOfTotal: number;          // % of total portfolio (live values)
  pctOfSection: number;        // % of section total (live values)
  sectionTotal: number;        // Total live value of holding's section
  pctOfTheme: number;          // % of theme TARGET value (not current total)
  targetValue?: number;        // Calculated target value for this holding
  targetValueDiff?: number;    // Current value - target value
  targetPctDiff?: number;      // Current % - target %
  profitLoss?: {
    totalGain: number;         // marketValue - costBasis
    totalGainPercent: number;  // (totalGain / costBasis) * 100
    dayChangeValue: number;    // dayChange * qty
    dayChangePercent: number;  // From live price feed
    costBasis: number;         // avgCost * qty
    marketValue: number;       // currentPrice * qty
  };
}

export interface BreakdownEntry {
  label: string;
  value: number;
  percentage: number;
}

export interface BudgetRemaining {
  label: string;
  used: number;
  percentage: number;
  amountLimit?: number;
  amountRemaining?: number;
  percentLimit?: number;
  percentRemaining?: number;
  section?: string;
  sectionPercentLimit?: number;
}
```

### Core Calculation: `calculateHoldingValue(holding)`

```
livePrice  = holding.livePrice          (may be undefined)
manualPrice = holding.price
qty         = holding.qty

manualValue = manualPrice * qty
usedLivePrice = livePrice !== undefined
effectivePrice = usedLivePrice ? livePrice : manualPrice
liveValue = effectivePrice * qty
value = liveValue                       (always equals liveValue)
dayChangeValue = usedLivePrice ? (liveValue - manualValue) : 0
```

### Core Calculation: `calculateLivePortfolioTotals(holdings)`

```
Filter to include=true holdings only.
For each included holding:
  liveValue = calculateHoldingValue(holding).liveValue
  totalAllocatedValue += liveValue
  sectionTotals[holding.section] += liveValue
  themeTotals[holding.theme] += liveValue
```

### Core Calculation: `calculateTargetHierarchy(portfolio, liveTotals)`

**When `targetPortfolioValue` is set and > 0 (proper hierarchy):**

```
For each section:
  sectionBudget = normalized budgets.sections[section]
  percentage = sectionBudget.percent ?? 0
  targetValue = (percentage / 100) * portfolioTarget
  allocatedValue = liveTotals.sectionTotals[section] ?? 0

For each theme:
  themeBudget = normalized budgets.themes[theme]
  section = themeSections[theme]
  if section exists AND themeBudget.percentOfSection exists:
    percentage = themeBudget.percentOfSection
    targetValue = (percentage / 100) * sectionTarget.targetValue
    percentageOfPortfolio = (targetValue / portfolioTarget) * 100
    allocatedValue = liveTotals.themeTotals[theme] ?? 0
```

**Legacy fallback (no explicit target):**

```
fallbackPortfolioTarget = totalAllocatedValue   (current live total)
If fallbackPortfolioTarget <= 0: return null

For each theme with a non-zero total:
  themeTotal = liveTotals.themeTotals[theme]
  targetValue = themeTotal                     (target = current)
  percentage = 100                              (100% of current)
  percentageOfPortfolio = (themeTotal / fallbackPortfolioTarget) * 100
```

### Primary Selector: `selectHoldingsWithDerived(portfolio)`

This is the main computation engine. For each holding, it produces `HoldingDerived`.

**Live calculation phase (per holding):**
```
holdingValue = calculateHoldingValue(holding)
profitLoss:
  if holding.avgCost defined AND qty > 0:
    currentPrice = livePrice ?? price
    profitLoss = calculateProfitLoss({ currentPrice, avgCost, qty, dayChange, dayChangePercent })
```

**Target calculation phase (per holding):**
```
If holding is NOT included or has NO targetPct: skip targets

If targetPortfolioValue is set:
  themeTarget = targetHierarchy.themeTargets[holding.theme]
  if themeTarget exists and targetValue > 0:
    holdingTargetValue = (targetPct / 100) * themeTarget.targetValue
    delta = calculateTargetDelta({ value: liveValue, total: themeTarget.targetValue, targetPct })

Legacy fallback:
  themeTotal = liveTotals.themeTotals[holding.theme]
  holdingTargetValue = (targetPct / 100) * themeTotal
  delta = calculateTargetDelta({ value: liveValue, total: themeTotal, targetPct })
```

**Percentage calculations:**
```
pctOfTotal = (liveValue / totalAllocatedValue) * 100
pctOfSection = (liveValue / sectionTotal) * 100
pctOfTheme:
  if targetHierarchy exists:
    themeTarget = targetHierarchy.themeTargets[holding.theme]
    pctOfTheme = (liveValue / themeTarget.targetValue) * 100
  else: 0
```

### Breakdown Selectors

```typescript
selectBreakdownBySection(portfolio)  // Groups by holding.section
selectBreakdownByAccount(portfolio)  // Groups by holding.account
selectBreakdownByTheme(portfolio)    // Groups by holding.theme
```

Each returns `BreakdownEntry[]` sorted by value descending:
```
{ label, value (live), percentage: (value / total) * 100 }
```

### Budget Remaining Selector: `selectBudgetRemaining(portfolio)`

Returns `{ sections: BudgetRemaining[], accounts: BudgetRemaining[], themes: BudgetRemaining[] }`.

**For sections and accounts:**
```
For each label:
  used = breakdownEntry.value ?? 0
  percentage = breakdownEntry.percentage ?? 0
  amountLimit = resolved from budget
  amountRemaining = max(amountLimit - used, 0)
  percentLimit = budget.percent
  percentRemaining = max(percentLimit - percentage, 0)
```

**For themes (hierarchical budget calculation):**
```
percentage = theme's live value / section's live value * 100
  (i.e. theme % is relative to its SECTION, not the whole portfolio)

Budget augmentation logic (theme-specific):
  sectionLimit = budgets.sections[section]
  sectionTargetAmount = sectionLimit resolved amount, or current sectionValue

  Priority 1: percentOfSection is set
    amountLimit = (percentOfSection / 100) * sectionTargetAmount
    percentLimit = (amountLimit / totalValue) * 100

  Priority 2: amount is set
    sectionPercentLimit = (amount / sectionTargetAmount) * 100
    percentLimit = (amount / totalValue) * 100

  Priority 3: percent (of total) is set
    amountLimit = (percent / 100) * totalValue
    sectionPercentLimit = (amountLimit / sectionTargetAmount) * 100
```

### 3-Tier Caching Strategy

Three separate Map caches with independent invalidation:

| Cache | Key Generation | Invalidation Trigger |
|-------|---------------|---------------------|
| `liveCalculationCache` | Holdings: `id-qty-price-livePrice-avgCost-dayChange-dayChangePercent-include-section-theme-account-assetType-exchange` | Live price updates, quantity changes, holdings added/removed |
| `targetCalculationCache` | Holdings: `id-targetPct-include-section-theme-account-assetType-exchange` + `targetPortfolioValue` + JSON budgets + JSON themeSections | Target % changes, budget changes, targetPortfolioValue changes |
| `derivedHoldingsCache` | Combined: `derived:{liveKey}|{targetKey}` | Either live or target cache invalidated |

Each cache keeps max 10 entries; older entries are pruned.

```typescript
export const cacheInvalidation = {
  invalidateLiveCalculations: () => { liveCalculationCache.clear(); derivedHoldingsCache.clear(); },
  invalidateTargetCalculations: () => { targetCalculationCache.clear(); derivedHoldingsCache.clear(); },
  invalidateAllCalculations: () => { /* clears all three */ },
  getCacheStats: () => ({ /* sizes and keys */ }),
};
```

---

## 4. Calculation Utilities

Source: `_portfolio-reference/src/utils/calculations.ts`

### `calculateValue({ price, qty })`
```
Returns price * qty
Guards: returns 0 if either is non-finite, negative
```

### `calculateQtyFromValue(value, price)`
```
Returns value / price
Guards: returns 0 if price <= 0 or either non-finite/negative
```

### `calculatePctOfTotal(value, total)`
```
Returns (value / total) * 100
Guards: returns 0 if total <= 0 or either non-finite/negative
```

### `calculateLiveDelta({ currentValue, previousValue })`
```
valueDiff = roundToPennies(currentValue - previousValue)
pctDiff   = roundToPennies(previousValue > 0 ? (valueDiff / previousValue) * 100 : 0)
Returns { valueDiff, pctDiff }
```

### `calculateTargetDelta(input)` (two interfaces)

**Legacy interface** (`{ value, total, targetPct }`):
```
targetValue = (targetPct / 100) * total
currentPct = (value / total) * 100
valueDiff = roundToPennies(value - targetValue)
pctDiff = roundToPennies(currentPct - targetPct)
Returns { valueDiff, pctDiff }
Returns undefined if targetPct < 0, total <= 0, or non-finite
```

**New interface** (`{ currentValue, targetValue, totalValue, targetPct }`):
```
valueDiff = roundToPennies(currentValue - targetValue)
currentPct = (currentValue / totalValue) * 100
pctDiff = targetPct !== undefined ? currentPct - targetPct : 0
Returns { valueDiff, pctDiff, currentPct }
Returns undefined if any required value is non-finite/negative
```

### `roundToPennies(value)`
```
Returns Math.round(value * 100) / 100
Guards: returns 0 if non-finite
```

### `calculateValueForShare(others, share)`
```
boundedShare = min(share, 0.999999)    // Prevent division by zero at 100%
Returns (boundedShare * others) / (1 - boundedShare)
Guards: returns 0 if share <= 0 or others < 0
```

Example: To get 20% when others total 8000: `(0.2 * 8000) / (1 - 0.2) = 2000`

### `calculateCashBufferQty({ lockedTotal, nonCashTotal })`
```
Returns roundToPennies(lockedTotal - nonCashTotal)
Guards: returns 0 if either non-finite or negative
```

### `calculateProfitLoss({ currentPrice, avgCost, quantity, dayChange?, dayChangePercent? })`
```
costBasis    = avgCost * quantity
marketValue  = currentPrice * quantity
totalGain    = marketValue - costBasis
totalGainPct = costBasis > 0 ? (totalGain / costBasis) * 100 : 0
dayChangeVal = dayChange * quantity

Returns {
  totalGain:        roundToPennies(totalGain),
  totalGainPercent: roundToPennies(totalGainPct),
  dayChangeValue:   roundToPennies(dayChangeVal),
  dayChangePercent: dayChangePercent (passthrough),
  costBasis:        roundToPennies(costBasis),
  marketValue:      roundToPennies(marketValue),
}
```

### `validatePercentage(percentage, allowZero?, maxPercent?)`
```
Returns true if: percentage is finite AND >= (allowZero ? 0 : 0.01) AND <= maxPercent
Default: allowZero=true, maxPercent=100
```

### `safeDivide(numerator, denominator)`
```
Returns numerator / denominator
Returns 0 if denominator is 0, or either is non-finite
```

### `getEffectivePrice(livePrice, manualPrice)`
```
If livePrice is defined, finite, and >= 0:
  return { price: livePrice, usedLivePrice: true }
Else:
  return { price: manualPrice (safe), usedLivePrice: false }
```

---

## 5. Percentage Preservation Algorithm

Source: `_portfolio-reference/src/utils/percentagePreservation.ts`

This implements cascading proportional scaling when a parent allocation changes.

### Hierarchy: Portfolio -> Section -> Theme -> Holding

When a section's percentage changes, theme percentages within that section are scaled proportionally. When a theme's percentage changes, holding target percentages within that theme are scaled proportionally.

### Core Algorithm: `preserveChildPercentageRatios(childPercentages, parentOldPercent, parentNewPercent)`

```
scaleFactor = parentNewPercent / parentOldPercent

For each child:
  newChildPercent = childPercent * scaleFactor
```

Example: Section goes from 40% to 60% (scaleFactor = 1.5). Theme was 20% of section -> becomes 30%.

### `getThemePercentagesInSection(portfolio, sectionName)`

Finds all themes mapped to the given section via `themeSections`, returns their `percentOfSection` values.

### `getHoldingPercentagesInTheme(portfolio, themeName)`

Finds all holdings in the given theme with non-zero `targetPct`, returns their percentages.

### `preserveThemeRatiosOnSectionChange(portfolio, sectionName, oldPct, newPct)`

```
1. Get all themes in this section and their percentOfSection values
2. Calculate scaleFactor = newPct / oldPct
3. Scale each theme's percentOfSection by scaleFactor
4. Update budgets.themes with new percentOfSection values
5. Return updated portfolio
```

### `preserveHoldingRatiosOnThemeChange(portfolio, themeName, oldPct, newPct)`

```
1. Get all holdings in this theme and their targetPct values
2. Calculate scaleFactor = newPct / oldPct
3. Scale each holding's targetPct by scaleFactor
4. Return updated portfolio with modified holdings
```

### When Preservation is Triggered (in the reducer)

In the `set-budget` action:

**Section percent change:**
```typescript
if (action.domain === 'sections' && normalized.percent !== undefined) {
  oldSectionPercent = calculateSectionCurrentPercent(currentBudget, totalValue);
  newSectionPercent = normalized.percent;
  if (old > 0 && old !== new) {
    portfolio = preserveThemeRatiosOnSectionChange(portfolio, key, old, new);
  }
}
```

**Theme percentOfSection change:**
```typescript
if (action.domain === 'themes' && normalized.percentOfSection !== undefined) {
  oldThemePercent = calculateThemeCurrentPercent(currentBudget); // = percentOfSection || 0
  newThemePercent = normalized.percentOfSection;
  if (old > 0 && old !== new) {
    portfolio = preserveHoldingRatiosOnThemeChange(portfolio, key, old, new);
  }
}
```

### Helper: `calculateSectionCurrentPercent(sectionBudget, totalValue)`

```
If budget has percent: return percent
If budget has amount and totalValue > 0: return (amount / totalValue) * 100
Otherwise: return 0
```

### Helper: `calculateThemeCurrentPercent(themeBudget)`

```
Returns themeBudget.percentOfSection || 0
```

---

## 6. CSV Parsing & Export

Source: `_portfolio-reference/src/utils/csv.ts`

### Types

```typescript
export type HoldingCsvRow = Omit<Holding, 'id' | 'avgCost'>;

export interface TradeCsvRow {
  ticker: string;
  name?: string;
  type: 'buy' | 'sell';
  date: string;
  price: number;
  qty: number;
}
```

### Low-Level Utilities

**`stripBom(value)`**: Removes BOM characters from start of string.

**`parseCsvRow(line)`**: Full RFC-4180-ish CSV parser. Handles:
- Quoted fields with `"` characters
- Escaped quotes (`""` inside quotes)
- Commas within quotes
- Returns array of trimmed, BOM-stripped cells

**`normaliseBoolean(raw)`**: `'true'|'yes'|'1'` -> true; `'false'|'no'|'0'` -> false; empty/missing -> true (default include)

**`parseNumber(raw)`**: Strips non-numeric chars except `-` and `.`, returns float or 0.

**`parseMoney(raw)`**: Like parseNumber but also handles:
- Trailing `p` or `pence` -> divides by 100 (GBX/pence conversion)
- Strips `$`, `EUR`, `GBP` symbols and commas
- Example: `"1234.5p"` -> `12.345`

**`normaliseAssetType(raw)`**: Maps to valid `AssetType` or `'Other'`.

**`escapeCsvValue(value)`**: Wraps in quotes if contains `,`, `"`, or `\n`. Escapes internal quotes.

### Export Functions

**`holdingsToCsv(rows)`**:
```
Header: "section,theme,assetType,name,ticker,account,price,qty,include,targetPct"
Each row: CSV-escaped values, targetPct blank if not set
```

**`tradesToCsv(trades, holdings)`**:
```
Header: "ticker,name,type,date,price,qty"
Looks up holding by holdingId to get ticker/name
```

### Format 1: Spec CSV (`parseSpecCsv`)

Detection: First line MUST exactly match the header string `"section,theme,assetType,name,ticker,account,price,qty,include,targetPct"`.

Parsing:
```
For each line after header:
  [section, theme, assetType, name, ticker, account, price, qty, include, targetPct] = parseCsvRow(line)
  Returns HoldingCsvRow with parseNumber for price/qty, normaliseBoolean for include,
  normaliseAssetType for assetType, optional targetPct
```

Returns `undefined` if header doesn't match (allows fallthrough to other formats).

### Format 2: Interactive Investor CSV (`parseInteractiveInvestorCsv`)

Detection: Header row contains columns named `symbol`, `name`, and `qty` (case-insensitive).

Parsing:
```
Find column indices for: symbol, name, qty, price (starts with "price")
For each data row:
  qty = parseNumber(cells[qtyIndex])
  price = parseMoney(cells[priceIndex])     // Handles pence notation
  Skip if both qty=0 and price=0
  section = theme = account = 'Imported'
  assetType = 'Other'
```

Returns `undefined` if header doesn't match.

### Format 3: Hargreaves Lansdown CSV (`parseHlCsv`)

Detection: Contains a line starting with `"code,stock"` (case-insensitive).

Structure:
```
Line 1: Account name (e.g. "ISA")
...
Header line: "Code,Stock,...Units,...Price..."
Data rows below header
```

Parsing:
```
account = first non-empty line (or 'Imported')
Find header line index by looking for "code,stock" prefix
Find column indices: code, stock, units, price
For each data row after header:
  Skip lines starting with '""' or containing 'totals'
  qty = parseNumber(cells[unitsIndex])
  price = parseMoney(`${cells[priceIndex]}p`)   // HL prices are ALWAYS in pence
  section = theme = 'Imported'
  assetType = 'Other'
```

**Critical**: HL prices are always treated as pence by appending `'p'` before calling `parseMoney`, which then divides by 100.

Returns `undefined` if no `"code,stock"` header found.

### Master Parser: `parseHoldingsCsv(csv)`

Tries parsers in order:
```
1. parseSpecCsv(csv)              -- returns if header matches
2. parseInteractiveInvestorCsv(csv) -- returns if header matches and rows > 0
3. parseHlCsv(csv)                -- returns if header matches and rows > 0
4. throw Error('Unsupported CSV format')
```

### Trade CSV: `parseTradesCsv(csv)`

Header must be exactly `"ticker,name,type,date,price,qty"` (case-insensitive).

```
For each line after header:
  type = 'sell' if matches, otherwise 'buy'
  date defaults to today's ISO string
  price = parseNumber, qty = parseNumber
```

---

## 7. Storage & Persistence

Source: `_portfolio-reference/src/state/storage.ts`

### Storage Key
```typescript
const STORAGE_KEY = 'portfolio-manager-state';
```

### `loadState()` (async)

```
In development (import.meta.env.DEV):
  1. Try: fetch('/api/portfolio/load') -> JSON -> AppState
  2. If success: return data

Fallback for all environments:
  3. Try: localStorage.getItem(STORAGE_KEY) -> JSON.parse -> AppState

If localStorage data exists but file didn't (dev only):
  4. Migrate: POST to '/api/portfolio/migrate' with state
```

### `saveState(state)` (async)

```
In development:
  1. serializeAppState(state)           // Convert Dates to ISO strings
  2. POST to '/api/portfolio/save'

Always (all environments):
  3. localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
```

### `clearState()`

Only clears localStorage (preserves file storage).

### Save Guard in Provider

The provider tracks `hasLoadedInitialState` to prevent saving the default empty state before the real data is loaded:

```typescript
// Don't save until we've loaded initial state
if (!hasLoadedInitialState) return;
saveState(state);
```

---

## 8. Serialization

Source: `_portfolio-reference/src/utils/serializeState.ts`

### `serializeAppState(state)`

Converts Date objects to ISO strings for JSON storage:
- `portfolio.createdAt` -> ISO string
- `portfolio.updatedAt` -> ISO string
- `holding.livePriceUpdated` -> ISO string

### `deserializeAppState(state)`

Converts ISO strings back to Date objects:
- `portfolio.createdAt` string -> `new Date(string)`
- `portfolio.updatedAt` string -> `new Date(string)`
- `holding.livePriceUpdated` string -> `new Date(string)`

---

## 9. Key Architectural Patterns

### The Hierarchy: Portfolio -> Section -> Theme -> Holding

This is the central organizational model:
- **Portfolio**: Top-level container with its own settings, budgets, and holdings
- **Section**: Broad allocation category (e.g. "Core", "Satellite", "Cash"). Budget as % of portfolio.
- **Theme**: Specific investment focus within a section (e.g. "Tech", "Value"). Budget as % of section.
- **Holding**: Individual asset within a theme. Target as % of theme.

Themes map to sections via `lists.themeSections`. When a theme is assigned to a section, all its holdings' `section` field is auto-updated.

### Dual Value System: Live vs Target

**Live values** (current reality):
- Based on actual holdings, quantities, and live/manual prices
- Used for: portfolio totals, breakdowns, percentages, profit/loss
- Cache key based on: prices, quantities, include flags

**Target values** (planning/allocation):
- Based on `targetPortfolioValue`, section budgets (% of portfolio), theme budgets (% of section), holding targets (% of theme)
- Target hierarchy: `holdingTarget = themeTargetValue * holdingTargetPct / 100`
- `themeTargetValue = sectionTargetValue * themePercentOfSection / 100`
- `sectionTargetValue = portfolioTargetValue * sectionPercent / 100`
- Cache key based on: target %, budgets, theme-section mappings

### Cash Buffer Auto-Adjustment

When `settings.lockTotal` is true:
1. Sum all non-cash included holdings: `nonCashTotal = sum(price * qty)`
2. Cash buffer quantity = `lockedTotal - nonCashTotal`
3. Cash buffer is a special holding: `assetType='Cash'`, `name='Cash buffer'`, `price=1`
4. This ensures `totalPortfolioValue = lockedTotal` at all times
5. Cash buffer is auto-created if missing

### Percentage Preservation Cascade

When you change a parent's percentage, all children scale proportionally:
- Change section % -> all themes in that section scale their `percentOfSection`
- Change theme % -> all holdings in that theme scale their `targetPct`
- Scale factor = `newParentPercent / oldParentPercent`

### Budget Resolution for Themes

Themes have three ways to express their budget, resolved in priority order:
1. `percentOfSection` -> amount = `(pctOfSection / 100) * sectionTargetAmount`
2. `amount` -> derive sectionPercent = `(amount / sectionTargetAmount) * 100`
3. `percent` (of total) -> derive amount = `(pct / 100) * totalValue`

When setting a theme's `percentOfSection`, the reducer also derives:
- `percent` (of total portfolio) = `(sectionPercent * percentOfSection) / 100`
- `amount` = `(percentOfSection / 100) * sectionAmount`

### Import De-duplication

CSV imports check for duplicate holdings by `ticker::name` (both lowercased, trimmed). Existing holdings are never overwritten -- duplicates are silently skipped.

### Immutability Pattern

All state updates create new objects. The reducer never mutates existing state. `clonePortfolio` uses `JSON.parse(JSON.stringify())` for deep cloning (used by playground/draft features).

### Protected Entities

- The "Cash" section cannot be renamed or removed
- The "Cash" section is always positioned at the end of the sections list
- The "Cash" theme is always positioned at the end of the themes list
- At least one section/theme/account must remain (cannot remove the last one)
- At least one portfolio must remain
