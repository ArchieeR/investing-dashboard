# Data Strategy: The Hybrid Model

## 1. The Core Philosophy: "Ingestion on Discovery"
We do not attempt to clone the entire stock market into our database. That is expensive and wasteful. Instead, we build our "Asset Universe" organically based on what our users actually care about.

### How it works:
1.  **Discovery**: When a user searches for or views an asset (e.g., "AAPL") for the first time on our platform, we treat this as a "Discovery Event".
2.  **Ingestion**: We immediately fetch the static metadata (Profile, Sector, Description, ETF Details) from our providers (FMP).
3.  **Persistence**: We save this "Golden Record" into our Global Asset Database (`assets` collection).
4.  **Reuse**: The next user who views "AAPL" gets the cached version from our DB. No API credits used.

---

## 2. The Hybrid Architecture

We separate **Static Data** (Slow moving) from **Live Data** (Fast moving).

### 2.1 The "Hot Store" (Firestore)
*   **Content**: Profiles, Tickers, Logos, Sector Classifications, ETF Holdings (Top 10).
*   **Update Frequency**: Low (Daily/Weekly).
*   **Source**: FMP API (Primary) + Custom Scrapers (Secondary for specific ETF look-throughs).
*   **Cost Efficiency**: 99% of UI reads come from here.

### 2.2 The "Live Pipe" (FMP API)
*   **Content**: Real-time Price, Day Change %, Volume.
*   **Update Frequency**: High (Real-time/Hourly).
*   **Storage**: **Ephemeral**. We utilize short-term server-side caching (60s) but do NOT write every price tick to the database.
*   **Client Merging**: The UI receives the *Static Asset* from DB and the *Live Price* from FMP, merging them into a single view.

---

## 3. Data Sources & Specialization

### 3.1 The Backbone (FMP)
Used for 90% of global data.
*   US Stocks & ETFs.
*   Global Pricing.
*   Standard Fundamentals.

### 3.2 The Specialist Layer (Scrapers)
Used where APIs fail, specifically for **UK/European UCITS ETFs** (e.g., Vanguard UK).
*   **Problem**: APIs often lack detailed "Look-Through" holdings for non-US ETFs.
*   **Solution**: We run targeted scrapers against issuer sites (Vanguard, iShares) to fetch the CSV holdings when these assets are "Discovered" or refreshed.

---

## 4. The "Overlap Engine" (Future)
Once we have built a critical mass of asset data in Firestore, we can mirror this to **BigQuery**.
*   **Goal**: Enable complex SQL queries like "Show me all ETFs in my portfolio that hold NVIDIA".
*   **Mechanism**: Firebase Extension (Firestore to BigQuery Export).

