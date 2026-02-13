# Feature Spec: ETF Explorer

## 1. Overview
The ETF Explorer is the research engine of the application. It solves the "Black Box" problem of ETFs by allowing users to see exactly what is inside a fund before they buy it.

## 2. Key Components

### 2.1 Search & Filter Engine
A highly responsive search interface.
*   **Text Search:** By Ticker (e.g., "VUKE") or Name.
*   **Filters:**
    *   Region (Global, US, UK, EM)
    *   Sector (Tech, Health, Finance)
    *   Issuer (Vanguard, BlackRock, Invesco)
    *   Fee / TER (< 0.10%, < 0.50%)
    *   Distribution Policy (Accumulating vs. Distributing)

### 2.2 "Glass-Box" Analysis (Look-Through)
The core value prop. When a user clicks an ETF, they see:
*   **Top 10 Holdings:** The biggest weights.
*   **Full Constituent Search:** "Does this ETF hold Tesla?" -> Returns "Yes, 1.2% weight".
*   **Country Breakdown:** Map or List view of geographic exposure.
*   **Sector Breakdown:** Pie chart of industry exposure.
*   **Look-Through Attribution:** Answer "Why is this ETF up today?".
    *   Show the top 5 constituents that contributed to the move (e.g. "NVIDIA (+5%) pulled the S&P 500 up by 0.2%").

### 2.3 Actionability
*   **"Add to Workspace":** One-click button to add the ETF to a specific Portfolio or Watchlist.
*   **"Compare":** Select two ETFs to see a side-by-side overlap matrix (e.g., "These two funds have 80% overlap").

## 3. Data Strategy (Proprietary Database)

### 3.1 The "Asset Universe" (Hybrid Data Strategy)
We utilize a two-tiered approach to build our competitive advantage:
1.  **The Backbone (FMP):** We rely on Financial Modeling Prep for the "Commodity Data" — Live/EOD prices, US Stock/ETF holdings, and Company Profiles.
2.  **The Specialist Layer (Custom Scrapers):** We build our own monthly scrapers for European (UCITS) ETFs (Vanguard, iShares) where public APIs fail. (See `docs/ai/intelligence_feed.md` for the "Smart Poller" spec).

### 3.2 The "Overlap Engine" (Core IP)
No API will tell you "Which of my ETFs holds Palantir?". We build the intelligence to answer this.
*   **Logic:** SQL-based intersection queries against our normalized `holdings` database.
*   **Normalization:** All data, whether from FMP JSON or Vanguard CSV, is converted into our **Universal Asset Schema** before ingestion.

### 3.3 Data Pipeline & Storage
1.  **Ingestion:**
    *   `FMP Pipe`: Daily sync for US data and prices.
    *   `Custom Scrapers`: Monthly fetch for UCITS ETF CSVs.
2.  **Storage:**
    *   **BigQuery:** The "Data Lake" for heavy analytics and overlap calculations.
    *   **Firestore:** The "Hot Cache" for fast UI retrieval and user portfolios.

## 4. UI/UX Requirements
*   **Visuals:** Modern financial cards. Logos for issuers (Vanguard red ship, etc.).
*   **Speed:** Search should be instant (Algolia or Firestore embedded search).
