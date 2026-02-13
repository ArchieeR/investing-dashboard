# Feature Spec: Dashboard & Playground

## 1. Overview
The Dashboard is the "Command Center" of the Portfolio application. It is designed to replace complex Excel spreadsheets with a high-performance, reactive web interface. It serves as the primary view for 90% of user interactions.

**Scope Note:** The Dashboard handles **Quantitative Data** (Prices, Weights, Costs). For **Qualitative Data** (News, Research, Notes), see [05_research_hub.md](05_research_hub.md).

## 2. Key Components

### 2.1 The "Playground" Grid
A high-density data grid (Excel-style) that lists all individual holdings.
*   **Columns:** Ticker, Name, Asset Class, Quantity, Avg Cost, Current Price, Current Value, Day Change (%), Day Change ($), Allocation %, Target %, Action.
*   **Inline Editing:** Users can directly edit `Quantity`, `Avg Cost`, and `Target %` cells.
*   **Live vs. Manual Mode:**
    *   *Live:* Prices update automatically via API.
        *   **Standard Equities/ETFs (LSE):** Apify (Google Finance) for low-latency live pricing.
        *   **Commodities/ETCs (Gold/Silver):** FMP (Financial Modeling Prep) as the primary source (Google Finance coverage is spotty here).
        *   **US Market:** FMP (Real-time).
    *   *Manual:* User manually enters the "Current Price" for unlisted or custom assets.
*   **Grouping:** Collapsible rows grouped by "Section" (e.g., Core vs. Satellite).

### 2.2 Allocation Manager
A visual interface for defining the portfolio hierarchy.
*   **Structure:**
    *   **Sections:** High-level buckets (e.g., "Core", "Speculative").
    *   **Themes:** Sub-buckets within Sections (e.g., "Clean Energy", "AI").
*   **Interaction:** Drag-and-drop support to move Holdings between Themes/Sections.
*   **Validation:** Visual warning if total Target % != 100%.

### 2.3 Visual Breakdown
*   **Sunburst / Pie Chart:** Visualizes `Actual` vs `Target` allocation.
*   **Drift Analysis:** Highlights the "Delta" (difference) between current value and target value.
    *   *Example:* "Underweight Tech by £1,200".

### 2.4 Trade History Log
A distinct view or drawer that logs all transactions.
*   **Automatic Calculation:** Adding a "Buy" trade automatically updates the `Quantity` and `Avg Cost` in the Playground.
*   **Fields:** Date, Ticker, Type (Buy/Sell), Shares, Price, Fee, Currency.

### 2.5 Portfolio Switcher
A global header component to switch contexts.
*   **Contexts:** Real Portfolios (e.g., "My ISA"), Draft Portfolios (Sandboxes).

## 3. Data Requirements (Firestore)

### `portfolios/{portfolioId}`
*   Metadata: Name, Currency, Total Value, Cash Balance.

### `portfolios/{portfolioId}/holdings/{holdingId}`
*   `ticker`: string
*   `qty`: number
*   `avgCost`: number
*   `targetPercent`: number
*   `sectionId`: string (Reference)
*   `themeId`: string (Reference)

### `portfolios/{portfolioId}/transactions/{transactionId}`
*   Immutable ledger of actions.

## 4. UI/UX Requirements
*   **Density:** "Compact" mode by default. Minimal padding.
*   **Response:** Optimistic UI updates. When a user edits a cell, the total calculates instantly locally before syncing.
*   **Theme:** Shadcn/Zinc/Neutral aesthetics.
