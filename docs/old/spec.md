# Portfolio Manager — Implementation Spec (for Codex in VS Code)

> **Purpose**: A concise, implementation‑ready specification that Codex can follow. Keep this file stable; update via versioned PRs (e.g., `spec-v2.md`) rather than ad‑hoc edits.

---

## 1. Problem & Context
Managing multiple accounts (e.g., LISA, ISA, GIA/IG, Crypto, Mum’s SIPP/ISA) across core/satellite themes is awkward in Google Finance + Excel. You want an **interactive, spreadsheet‑like tool** that:
- Consolidates holdings across accounts.
- Lets you **edit Price / Qty / Value** fluidly (two‑way binding; editing *Value* back‑solves *Qty*).
- Supports **targets** and shows **gaps vs target**.
- Allows safe experimentation (**Playground Mode**) and keeping the overall portfolio constant (**Lock Total** via Cash buffer).
- Provides quick **breakdowns by Section, Account, and Theme**.
- Works **locally** (no network calls in MVP) with CSV import/export.

## 2. Goals (MVP)
- G1. Spreadsheet‑like grid with inline editing and select fields.
- G2. Two‑way numeric editing: `value = price * qty`; editing *Value* adjusts *Qty*.
- G3. Targets & delta vs target per line, and % of total.
- G4. Filters and summary breakdowns (Section, Account, Theme).
- G5. Playground Mode (snapshot/restore) and **Lock Total** via a single Cash buffer row.
- G6. CSV import/export with a stable schema.
- G7. Local‑first persistence; privacy by default.

## 3. Non‑Goals (MVP)
- Brokerage linking/trading; tax calculations; real‑time price fetching; country/sector exposure; overlap analytics; alerts. These are roadmap items.

## 4. Users & Constraints
- **Primary user**: You (advanced retail); **secondary**: Mum’s delegated portfolio.
- **Currency**: GBP by default; single‑currency assumption in MVP.
- **Performance**: Smooth editing with up to **1,000 rows**.

## 5. Functional Requirements
**FR1 – Holdings Grid**
- Columns: `section`, `theme`, `assetType`, `name`, `ticker`, `account`, `price`, `qty`, `value(derived/editable)`, `%OfTotal(derived)`, `targetPct(optional)`, `deltaToTarget(derived)`, `include(bool)`, `actions`.
- Inline editors: selects for categorical fields; inputs for numeric/text.

**FR2 – Two‑Way Editing**
- Editing **Price** -> recalculates `value = price * qty`.
- Editing **Qty** -> recalculates `value = price * qty`.
- Editing **Value** -> back‑solves `qty = value / price` (if `price > 0`, else qty = 0).
- Numeric inputs accept decimals; round display to 2 dp (store full precision).

**FR3 – Include Toggle**
- When `include = false`, the row is ignored by totals, %OfTotal, targets, and breakdowns; still visible/editable.

**FR4 – Targets & Deltas**
- `targetPct` optional per row.
- `deltaToTarget` shows: **£ difference** and **percentage difference** versus target share of total.

**FR5 – Filters**
- Filter by **Section**, **Account**, **Theme** (dropdowns). Filter affects the grid display; **breakdowns reflect all included rows** (unfiltered total), with a note on current filters.

**FR6 – Summaries/Breakdowns**
- Cards: **By Section**, **By Account**, **By Theme** → show value and % of total, descending.

**FR7 – Playground Mode**
- Toggle **on** → capture a snapshot of current portfolio state; changes are temporary.
- **Restore** reverts to snapshot; toggling **off** commits current state (overwrites snapshot).

**FR8 – Lock Total**
- When enabled, maintain a single special row: `{ assetType: "Cash", name: "Cash buffer", price: 1 }`.
- Adjust **Cash qty** so that `sum(included non‑cash rows) + cash == lockedTotal` within ±£0.01.
- If Cash buffer doesn’t exist, create it automatically in Section `Core`, Theme `Cash`, Account default.

**FR9 – CSV Import/Export**
- Export header: `section,theme,assetType,name,ticker,account,price,qty,include,targetPct`.
- Import: parse robustly; set defaults for missing fields; parse booleans (`"false"` → false; others true).
- IDs are regenerated on import; semantics preserved.

**FR10 – Lists Management**
- Manage **Sections**, **Themes**, **Accounts** (CRUD of strings; unique per list).

**FR11 – Multi‑Portfolio** (lightweight)
- Support at least two portfolios (Mine, Mum’s) within one workspace; separate holdings and settings; optional shared lists.

## 6. Data Model (TypeScript)
```ts
export type AssetType = 'ETF' | 'Stock' | 'Crypto' | 'Cash' | 'Bond' | 'Fund' | 'Other';
export interface Holding {
  id: string;
  section: string;
  theme: string;
  assetType: AssetType;
  name: string;
  ticker: string;
  account: string;
  price: number; // editable
  qty: number;   // editable (or derived when editing value)
  include: boolean;
  targetPct?: number; // optional
}
export interface Lists { sections: string[]; themes: string[]; accounts: string[] }
export interface Settings { currency: string; lockTotal: boolean; lockedTotal?: number }
export interface Portfolio { id: string; name: string; lists: Lists; holdings: Holding[]; settings: Settings }
export interface AppState { portfolios: Portfolio[]; activePortfolioId: string; playground: { enabled: boolean; snapshot?: Portfolio }; filters: { section?: string; theme?: string; account?: string } }
```

## 7. Derived Calculations
- **Row value**: `value = price * qty`.
- **Total**: sum of `value` for rows with `include=true`.
- **%OfTotal**: `(row.value / total) * 100` (hidden if total = 0 or row excluded).
- **Target delta**: `targetValue = total * (targetPct/100)`; show `£(row.value - targetValue)` and `%((row.value/total)*100 - targetPct)`.
- **Breakdowns**: group sums by Section/Account/Theme over included rows.

## 8. CSV Schema
```
section,theme,assetType,name,ticker,account,price,qty,include,targetPct
```
- On import: unknown `assetType` → `Other`; blank numeric → 0; missing booleans → `true`.

## 9. Architecture
- **Frontend only (MVP)**: React + TypeScript; Tailwind + shadcn/ui.
- **State**: Zustand or React state + selectors (memoised derived values).
- **Persistence**: LocalStorage (upgrade to IndexedDB if needed). Auto‑save on change.
- **No external network calls** in MVP.

## 10. UX & Flows
- **Grid**: inline selects/inputs; edit Value to back‑solve Qty; duplicate/delete actions per row.
- **Controls**: Add row, Export CSV, Import CSV, Clear; Currency input; toggles for Playground and Lock Total.
- **Filters**: top row dropdowns for Section/Account/Theme.
- **Summaries**: three cards with breakdowns.
- **Lists manager**: tabs for Sections, Themes, Accounts.
- **Hints**: a small tip area explaining Value back‑solve and Lock Total.

## 11. Performance & Accessibility
- Handle 1,000 included rows with minimal input latency (< ~16ms render budget per keystroke on a mid‑range laptop).
- Keyboard navigation across grid fields; proper labels for form controls.

## 12. Security & Privacy
- Local‑only data; no external API calls.
- CSV export/import is explicit user action.

## 13. Acceptance Criteria (AC)
- **AC1 (Two‑way)**: Editing Value recalculates Qty (`price>0`), and %OfTotal updates immediately.
- **AC2 (Include)**: Excluded rows don’t impact totals, %OfTotal, targets, or breakdowns.
- **AC3 (Targets)**: When `targetPct` is set, delta shows correct £ and % differences versus target share of total.
- **AC4 (Lock Total)**: With Lock Total on, changes to any non‑cash row auto‑adjust Cash buffer qty so the overall total equals the locked total within ±£0.01.
- **AC5 (Playground)**: Toggling on captures a snapshot; Restore brings state back exactly; toggling off commits changes.
- **AC6 (CSV)**: Exported CSV re‑imports to an equivalent portfolio (IDs may differ), preserving fields/semantics.
- **AC7 (Breakdowns)**: Breakdown values & percentages equal sums from included rows and reconcile to portfolio total.
- **AC8 (Perf)**: Editing remains responsive with 1k rows.

## 14. Out of Scope (MVP)
- Prices/news/overlap/exposures/alerts; multi‑currency; tax; trading; authentication.

## 15. Open Questions
- Should lists be global or per‑portfolio by default? (MVP: per‑portfolio, with optional copy‑from.)
- Rounding rules for display vs storage? (MVP: display 2 dp; store full precision.)
- Snapshot persistence across sessions? (MVP: in‑memory; optional save later.)

## 16. Appendix: LLM Digest (for Codex)
```
MVP: Local React/TS app. Grid with fields: section, theme, assetType, name, ticker, account, price, qty, value(derived/editable), pctOfTotal(derived), targetPct(optional), deltaToTarget(derived), include(bool). Two‑way editing: price×qty=value; editing Value back‑solves Qty if price>0. Include=false excludes from totals. Lock Total uses a single “Cash buffer” row (price=1) to keep overall total fixed. Playground Mode snapshot/restore. Filters by section/account/theme. Breakdowns by section/account/theme. CSV import/export with header `section,theme,assetType,name,ticker,account,price,qty,include,targetPct`. No network calls. Persist locally.
```

---

**Next files to add (recommended):**
- `docs/rules.md` – guardrails for Codex (no new deps, tests for core logic, small diffs, etc.).
- `docs/tasks.md` – master task list; you keep it short, Codex expands per task when implementing.
