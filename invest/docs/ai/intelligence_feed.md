# Project Portfolio: UK/EU Data Acquisition Strategy

**Version:** 1.0 | **Status:** Approved for Phase 1 (MVP)
**Objective:** Enable "Glass-Box Transparency" for UK Investors by acquiring underlying holdings data for UCITS ETFs.

---

## 1. Executive Summary

**The Problem:** Most UK aggregators treat ETFs as "Black Boxes." They show the price, but not the exposure (e.g., "How much NVIDIA is in my FTSE All-World fund?"). Standard APIs (FMP, Google Finance) lack coverage for European (UCITS) fund holdings.

**The Solution:** We will build a **"Smart Poller"**—a lightweight scraping engine that fetches the daily/monthly portfolio composition files (PCF) directly from the issuer's public websites.

**Core Principles:**

1. **Low Bandwidth:** Use `HEAD` requests to check for updates before downloading.
2. **Source Agnostic:** The database schema must not care where the data came from (API vs. Scraper).
3. **Defensive Design:** Respect rate limits to avoid IP bans.

---

## 2. Technical Architecture

### A. The "Smart Poller" Logic

To minimize server costs and detection risk, we do **not** blindly download files daily.

* **Routine:** Run daily at **08:00 UTC** (Before LSE Open).
* **Step 1:** Send a `HEAD` request to the target URL.
* **Step 2:** Extract the `ETag` or `Last-Modified` header.
* **Step 3:** Compare with our database's `last_version_hash`.
* *Match?*  **304 Not Modified**. Stop. (Cost: ~1KB).
* *New?*  **200 OK**. Download & Process. (Cost: ~2-5MB).



### B. The "Static Snapshot" (MVP Rule)

* **Update Frequency:** Monthly.
* **Drift Calculation:** We assume the *share count* held by the ETF is constant for 30 days. We calculate the *weight %* dynamically in the app using live prices from FMP.
* *Formula:* `(Shares_Held × Live_Price_FMP) / Total_Fund_Value`



---

## 3. Issuer Implementation Details

### Tier 1: The Giants (80% of User Portfolios)

#### **1. Vanguard (UK/EU)**

* **Difficulty:** 🟢 Easy (Hidden API)
* **Source Type:** JSON
* **Strategy:** Do not scrape HTML. Vanguard's frontend uses an internal API that returns clean JSON.
* **Endpoint:** `https://eds.ecs.gisp.c1.vanguard.com/eds-eip-distributions-service/price/daily-nav-history/[PORTFOLIO_ID].json`.
* **Workflow:**
1. Map Ticker (e.g., `VUSA`) to Portfolio ID (e.g., `9503` for S&P 500).
2. Fetch JSON.
3. Extract `portId` and `priceItem` arrays.



#### **2. iShares (BlackRock)**

* **Difficulty:** 🟡 Medium
* **Source Type:** CSV / XLS
* **Strategy:** iShares pages often load data via AJAX. We can hit the file generation URL directly.
* **URL Pattern:**
`https://www.ishares.com/uk/individual/en/products/[PRODUCT_ID]/[SLUG]/1467271812596.ajax?fileType=csv&fileName=[TICKER]_holdings&dataType=fund`.
* **Key Challenge:** The `PRODUCT_ID` (e.g., `253743`) is unique per fund. We must build a `mapper.json` file that links `CSPX`  `253743`.

#### **3. Amundi (Lyxor)**

* **Difficulty:** 🔴 Hard
* **Source Type:** Excel (XLSX)
* **Strategy:** Amundi has a fragmented site. The reliable method is their **Document Library**.
* **Target:** Look for files labeled "Composition" or "Portfolio Holdings" in the "Resources" tab.
* **Fallback:** If scraping fails, Amundi publishes the "Top 10" on the main HTML page. Parse this as a partial dataset (better than nothing).

---

## 4. Thematic & Niche Issuers (The "Alpha" Layer)

#### **4. VanEck (Semiconductors / Crypto)**

* **Difficulty:** 🟢 Easy
* **Source Type:** Excel
* **URL Structure:** Extremely predictable.
`https://www.vaneck.com/uk/en/investments/[FUND-SLUG]/downloads/holdings/`
* **Logic:** The "Slug" is usually the full fund name with hyphens (e.g., `semiconductor-etf`). We can guess this programmatically.

#### **5. HANetf (Defense / Uranium)**

* **Difficulty:** 🟡 Medium (Aggregator)
* **Source Type:** CSV (via Partner)
* **Context:** HANetf is a "White Label" issuer. Their data is often hosted by **Master Data Reports** or on sub-pages.
* **Strategy:**
1. Crawl `hanetf.com/product-list` to get the fund URL.
2. On the fund page, look for the `<a>` tag with text "Holdings" or "Constituents".
3. Download the linked CSV.



---

## 5. The "Rosetta Stone" Schema

This is the **Universal Data Model**. Every scraper must convert its raw mess (JSON, CSV, XLS) into this clean format before saving to the database.

**JSON Object: `AssetHolding`**

```json
{
  "parent_isin": "IE00B3XXRP09",     // The ETF Identity
  "last_updated": "2024-05-21T08:00:00Z",
  "source": "ishares_scraper_v1",
  "holdings": [
    {
      "ticker": "NVDA",             // Normalized Ticker
      "isin": "US67066G1040",       // Global ID (Critical for matching)
      "name": "NVIDIA Corp",
      "weight_percent": 6.45,       // Raw weight from issuer
      "sector": "Information Technology",
      "country": "USA",
      "currency": "USD"
    },
    {
      "ticker": "MSFT",
      "isin": "US5949181045",
      "name": "Microsoft Corp",
      "weight_percent": 6.12,
      "sector": "Information Technology",
      "country": "USA",
      "currency": "USD"
    }
    // ... 500 more items
  ]
}
```

---

## 6. Operational Guardrails (The "Grey Zone" Protocol)

To ensure longevity and minimize legal/blocking risk:

1. **User-Agent Rotation:**
Never use `python-requests/2.25`. Always mimic a browser:
`User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...`
2. **Rate Limiting:**
* Maximum **1 request per 5 seconds** to the same domain.
* Implement "Exponential Backoff" if we receive a `429 Too Many Requests` (wait 2s, then 4s, then 8s).


3. **The "Kill Switch":**
If a specific scraper fails 3 days in a row, the system must automatically flag that ETF as "Data Unavailable" in the UI rather than crashing the dashboard.
4. **Attribution:**
The UI must display: *"Holdings data estimated from public disclosures by [Issuer Name]. Not investment advice."*
