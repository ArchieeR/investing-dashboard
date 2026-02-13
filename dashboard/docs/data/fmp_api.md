# FMP API Reference

## 1. Overview

**Financial Modeling Prep (FMP)** is our primary data provider for global market data. It serves as the "backbone" of our hybrid data model, providing US-centric market data, ETF holdings, financial statements, and market intelligence.

**Base URL:** `https://financialmodelingprep.com`
**API Versions:** `/api/v3` (legacy) and `/stable` (recommended)
**Documentation:** https://site.financialmodelingprep.com/developer/docs

## 2. Authentication

All endpoints require an API key. Two methods:

**Query Parameter (Recommended):**
```
GET /stable/quote?symbol=AAPL&apikey={FMP_API_KEY}
```

**Header:**
```
GET /stable/quote?symbol=AAPL
Headers: apikey: {FMP_API_KEY}
```

**Environment Variable:** `FMP_API_KEY`

---

## 3. Search & Discovery

### 3.1 Symbol Search

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/search-symbol?query={q}` | Search by ticker symbol | `query` (required) |
| `/stable/search-name?query={q}` | Search by company name | `query` (required) |
| `/stable/search-cik?cik={cik}` | Search by SEC CIK number | `cik` (required) |
| `/stable/search-cusip?cusip={cusip}` | Search by CUSIP | `cusip` (required) |
| `/stable/search-isin?isin={isin}` | Search by ISIN | `isin` (required) |
| `/stable/search-exchange-variants?symbol={sym}` | Find all exchanges for a symbol | `symbol` (required) |

### 3.2 Stock Screener

**Endpoint:** `/stable/company-screener`

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketCapMoreThan` | number | Min market cap (USD) |
| `marketCapLowerThan` | number | Max market cap (USD) |
| `priceMoreThan` | number | Min stock price |
| `priceLowerThan` | number | Max stock price |
| `volumeMoreThan` | number | Min trading volume |
| `volumeLowerThan` | number | Max trading volume |
| `betaMoreThan` | number | Min beta coefficient |
| `betaLowerThan` | number | Max beta coefficient |
| `dividendMoreThan` | number | Min dividend yield |
| `dividendLowerThan` | number | Max dividend yield |
| `sector` | string | Filter by sector |
| `industry` | string | Filter by industry |
| `country` | string | Filter by country code |
| `exchange` | string | Filter by exchange |
| `limit` | number | Max results |

**Example:**
```
/stable/company-screener?marketCapMoreThan=1000000000&sector=Technology&country=US&limit=50
```

---

## 4. Quotes & Real-Time Prices

### 4.1 Stock Quotes

| Endpoint | Description | Use Case |
|----------|-------------|----------|
| `/stable/quote?symbol={sym}` | Full quote with all fields | Detailed asset view |
| `/stable/quote-short?symbol={sym}` | Lightweight (price, volume, change) | Portfolio list |
| `/stable/batch-quote?symbols={sym1,sym2}` | Multiple full quotes | Batch refresh |
| `/stable/batch-quote-short?symbols={sym1,sym2}` | Multiple short quotes | Dashboard |
| `/stable/stock-price-change?symbol={sym}` | Price change over periods | Performance tracking |

### 4.2 Extended Hours

| Endpoint | Description |
|----------|-------------|
| `/stable/aftermarket-quote?symbol={sym}` | After-hours quote |
| `/stable/aftermarket-trade?symbol={sym}` | After-hours trades |
| `/stable/batch-aftermarket-quote?symbols={sym1,sym2}` | Batch after-hours quotes |
| `/stable/batch-aftermarket-trade?symbols={sym1,sym2}` | Batch after-hours trades |

### 4.3 Asset Class Quotes

| Endpoint | Description |
|----------|-------------|
| `/stable/batch-etf-quotes` | All ETF quotes |
| `/stable/batch-mutualfund-quotes` | All mutual fund quotes |
| `/stable/batch-commodity-quotes` | All commodity quotes |
| `/stable/batch-crypto-quotes` | All cryptocurrency quotes |
| `/stable/batch-forex-quotes` | All forex pair quotes |
| `/stable/batch-index-quotes` | All index quotes |
| `/stable/batch-exchange-quote?exchange={ex}` | All quotes for an exchange |

### 4.4 Quote Response Example

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 178.72,
    "changesPercentage": 1.23,
    "change": 2.17,
    "dayLow": 176.21,
    "dayHigh": 179.63,
    "yearHigh": 199.62,
    "yearLow": 124.17,
    "marketCap": 2794000000000,
    "priceAvg50": 175.32,
    "priceAvg200": 168.45,
    "volume": 54638923,
    "avgVolume": 57216891,
    "exchange": "NASDAQ",
    "open": 176.50,
    "previousClose": 176.55,
    "eps": 6.05,
    "pe": 29.54,
    "earningsAnnouncement": "2024-01-25T00:00:00.000+0000",
    "sharesOutstanding": 15634232000,
    "timestamp": 1699574400
  }
]
```

---

## 5. Historical Prices

### 5.1 Daily Prices

| Endpoint | Description | Fields |
|----------|-------------|--------|
| `/stable/historical-price-eod/light?symbol={sym}` | Lightweight daily | date, price, volume |
| `/stable/historical-price-eod/full?symbol={sym}` | Full OHLCV | open, high, low, close, volume, vwap, change |
| `/stable/historical-price-eod/non-split-adjusted?symbol={sym}` | Unadjusted prices | Raw prices without split adjustment |
| `/stable/historical-price-eod/dividend-adjusted?symbol={sym}` | Dividend adjusted | Prices adjusted for dividends |

**Common Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `symbol` | string | Stock ticker (required) |
| `from` | string | Start date (YYYY-MM-DD) |
| `to` | string | End date (YYYY-MM-DD) |

### 5.2 Intraday Prices

| Endpoint | Timeframe |
|----------|-----------|
| `/stable/historical-chart/1min?symbol={sym}` | 1 minute |
| `/stable/historical-chart/5min?symbol={sym}` | 5 minutes |
| `/stable/historical-chart/15min?symbol={sym}` | 15 minutes |
| `/stable/historical-chart/30min?symbol={sym}` | 30 minutes |
| `/stable/historical-chart/1hour?symbol={sym}` | 1 hour |
| `/stable/historical-chart/4hour?symbol={sym}` | 4 hours |

**Response Fields:** `date`, `open`, `high`, `low`, `close`, `volume`

### 5.3 Historical Price Response Example

```json
{
  "symbol": "AAPL",
  "historical": [
    {
      "date": "2024-01-15",
      "open": 176.50,
      "high": 179.63,
      "low": 176.21,
      "close": 178.72,
      "adjClose": 178.72,
      "volume": 54638923,
      "unadjustedVolume": 54638923,
      "change": 2.22,
      "changePercent": 1.26,
      "vwap": 177.85,
      "label": "January 15, 24",
      "changeOverTime": 0.0126
    }
  ]
}
```

---

## 6. ETF Data

### 6.1 ETF Endpoints

| Endpoint | Description | Use Case |
|----------|-------------|----------|
| `/stable/etf/holdings?symbol={sym}` | Full holdings list | Look-Through Analysis |
| `/stable/etf/info?symbol={sym}` | ETF metadata | ETF Explorer |
| `/stable/etf/sector-weightings?symbol={sym}` | Sector allocation | Diversification |
| `/stable/etf/country-weightings?symbol={sym}` | Geographic allocation | Exposure analysis |
| `/stable/etf/asset-exposure?symbol={sym}` | Which ETFs hold this stock | Reverse lookup |

### 6.2 ETF Holdings Response Example

```json
[
  {
    "asset": "Apple Inc",
    "name": "Apple Inc",
    "isin": "US0378331005",
    "cusip": "037833100",
    "shares": 173000000,
    "weightPercentage": 7.12,
    "marketValue": 30935600000,
    "updated": "2024-01-15"
  },
  {
    "asset": "Microsoft Corporation",
    "name": "Microsoft Corporation",
    "isin": "US5949181045",
    "cusip": "594918104",
    "shares": 145000000,
    "weightPercentage": 6.89,
    "marketValue": 29456000000,
    "updated": "2024-01-15"
  }
]
```

### 6.3 ETF Info Response Example

```json
[
  {
    "symbol": "SPY",
    "name": "SPDR S&P 500 ETF Trust",
    "expenseRatio": 0.0945,
    "aum": 450000000000,
    "avgVolume": 85000000,
    "domicile": "US",
    "inceptionDate": "1993-01-22",
    "etfCompany": "State Street Global Advisors"
  }
]
```

### 6.4 Sector Weightings Response Example

```json
[
  { "sector": "Technology", "weightPercentage": "28.50" },
  { "sector": "Healthcare", "weightPercentage": "13.20" },
  { "sector": "Financials", "weightPercentage": "12.80" },
  { "sector": "Consumer Discretionary", "weightPercentage": "10.50" },
  { "sector": "Communication Services", "weightPercentage": "8.90" }
]
```

---

## 7. Company Fundamentals

### 7.1 Company Profile

**Endpoint:** `/stable/profile?symbol={sym}`

**Response Example:**
```json
[
  {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "currency": "USD",
    "cik": "0000320193",
    "isin": "US0378331005",
    "cusip": "037833100",
    "exchange": "NASDAQ",
    "exchangeShortName": "NASDAQ",
    "industry": "Consumer Electronics",
    "sector": "Technology",
    "country": "US",
    "fullTimeEmployees": "164000",
    "phone": "408-996-1010",
    "address": "One Apple Park Way",
    "city": "Cupertino",
    "state": "CA",
    "zip": "95014",
    "website": "https://www.apple.com",
    "image": "https://financialmodelingprep.com/image-stock/AAPL.png",
    "ipoDate": "1980-12-12",
    "defaultImage": false,
    "isEtf": false,
    "isActivelyTrading": true,
    "isFund": false,
    "isAdr": false,
    "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide..."
  }
]
```

### 7.2 Additional Profile Endpoints

| Endpoint | Description |
|----------|-------------|
| `/stable/profile-cik?cik={cik}` | Profile by CIK number |
| `/stable/market-capitalization?symbol={sym}` | Market cap data |
| `/stable/shares-float?symbol={sym}` | Float shares data |
| `/stable/key-executives?symbol={sym}` | Executive information |
| `/stable/sec-profile?symbol={sym}` | Full SEC profile |

---

## 8. Financial Statements

### 8.1 Core Statements

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/income-statement?symbol={sym}` | Income statement | `period`, `limit` |
| `/stable/balance-sheet-statement?symbol={sym}` | Balance sheet | `period`, `limit` |
| `/stable/cash-flow-statement?symbol={sym}` | Cash flow | `period`, `limit` |

**Common Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `symbol` | string | Stock ticker (required) |
| `period` | `annual`, `quarterly` | Reporting period |
| `limit` | number | Number of periods (default: 10) |
| `datatype` | `json`, `csv` | Response format |

### 8.2 TTM (Trailing Twelve Months)

| Endpoint | Description |
|----------|-------------|
| `/stable/income-statement-ttm?symbol={sym}` | TTM income statement |
| `/stable/balance-sheet-statement-ttm?symbol={sym}` | TTM balance sheet |
| `/stable/cash-flow-statement-ttm?symbol={sym}` | TTM cash flow |

### 8.3 Growth Analysis

| Endpoint | Description |
|----------|-------------|
| `/stable/income-statement-growth?symbol={sym}` | Income growth rates |
| `/stable/balance-sheet-statement-growth?symbol={sym}` | Balance sheet growth |
| `/stable/cash-flow-statement-growth?symbol={sym}` | Cash flow growth |

### 8.4 As-Reported Statements

| Endpoint | Description |
|----------|-------------|
| `/stable/income-statement-as-reported?symbol={sym}` | Raw SEC filing data |
| `/stable/balance-sheet-statement-as-reported?symbol={sym}` | Raw balance sheet |
| `/stable/cash-flow-statement-as-reported?symbol={sym}` | Raw cash flow |

### 8.5 Income Statement Response Example

```json
[
  {
    "date": "2023-09-30",
    "symbol": "AAPL",
    "reportedCurrency": "USD",
    "cik": "0000320193",
    "fillingDate": "2023-11-03",
    "acceptedDate": "2023-11-02 18:04:43",
    "calendarYear": "2023",
    "period": "FY",
    "revenue": 383285000000,
    "costOfRevenue": 214137000000,
    "grossProfit": 169148000000,
    "grossProfitRatio": 0.4413,
    "researchAndDevelopmentExpenses": 29915000000,
    "sellingGeneralAndAdministrativeExpenses": 24932000000,
    "operatingExpenses": 54847000000,
    "operatingIncome": 114301000000,
    "operatingIncomeRatio": 0.2982,
    "interestIncome": 3750000000,
    "interestExpense": 3933000000,
    "incomeBeforeTax": 113736000000,
    "incomeTaxExpense": 16741000000,
    "netIncome": 96995000000,
    "netIncomeRatio": 0.2531,
    "eps": 6.13,
    "epsdiluted": 6.13,
    "weightedAverageShsOut": 15812547000,
    "weightedAverageShsOutDil": 15812547000,
    "link": "https://www.sec.gov/...",
    "finalLink": "https://www.sec.gov/..."
  }
]
```

---

## 9. Key Metrics & Ratios

### 9.1 Metrics Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/key-metrics?symbol={sym}` | Key financial metrics | `period`, `limit`, `page` |
| `/stable/key-metrics-ttm?symbol={sym}` | TTM key metrics | - |
| `/stable/ratios?symbol={sym}` | Financial ratios | `period`, `limit`, `page` |
| `/stable/ratios-ttm?symbol={sym}` | TTM ratios | - |

### 9.2 Additional Metrics

| Endpoint | Description |
|----------|-------------|
| `/stable/enterprise-values?symbol={sym}` | Enterprise value data |
| `/stable/owner-earnings?symbol={sym}` | Owner earnings (Buffett metric) |
| `/stable/financial-scores?symbol={sym}` | Altman Z, Piotroski scores |

### 9.3 Key Metrics Response Example

```json
[
  {
    "symbol": "AAPL",
    "date": "2023-09-30",
    "period": "FY",
    "revenuePerShare": 24.25,
    "netIncomePerShare": 6.13,
    "operatingCashFlowPerShare": 7.15,
    "freeCashFlowPerShare": 6.58,
    "cashPerShare": 4.03,
    "bookValuePerShare": 3.95,
    "tangibleBookValuePerShare": 3.95,
    "shareholdersEquityPerShare": 3.95,
    "interestDebtPerShare": 6.84,
    "marketCap": 2794000000000,
    "enterpriseValue": 2850000000000,
    "peRatio": 28.75,
    "priceToSalesRatio": 7.29,
    "pbRatio": 44.72,
    "evToSales": 7.44,
    "enterpriseValueOverEBITDA": 22.15,
    "evToOperatingCashFlow": 25.21,
    "evToFreeCashFlow": 27.43,
    "earningsYield": 0.0348,
    "freeCashFlowYield": 0.0365,
    "debtToEquity": 1.73,
    "debtToAssets": 0.32,
    "netDebtToEBITDA": 0.44,
    "currentRatio": 0.99,
    "dividendYield": 0.0051,
    "payoutRatio": 0.1474,
    "roic": 0.5621,
    "roe": 1.5509,
    "roa": 0.2802
  }
]
```

---

## 10. Analyst Data

### 10.1 Estimates & Targets

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/analyst-estimates?symbol={sym}` | Revenue/EPS estimates | `period`, `page`, `limit` |
| `/stable/price-target-summary?symbol={sym}` | Average price targets | - |
| `/stable/price-target-consensus?symbol={sym}` | High/low/median targets | - |

### 10.2 Ratings & Grades

| Endpoint | Description |
|----------|-------------|
| `/stable/grades?symbol={sym}` | Latest analyst grades |
| `/stable/grades-historical?symbol={sym}` | Historical grade changes |
| `/stable/grades-consensus?symbol={sym}` | Buy/hold/sell summary |
| `/stable/ratings-snapshot?symbol={sym}` | Financial health rating |
| `/stable/ratings-historical?symbol={sym}` | Historical ratings |

### 10.3 Analyst Estimates Response Example

```json
[
  {
    "symbol": "AAPL",
    "date": "2024-09-30",
    "estimatedRevenueLow": 380000000000,
    "estimatedRevenueHigh": 410000000000,
    "estimatedRevenueAvg": 395000000000,
    "estimatedEbitdaLow": 115000000000,
    "estimatedEbitdaHigh": 135000000000,
    "estimatedEbitdaAvg": 125000000000,
    "estimatedNetIncomeLow": 90000000000,
    "estimatedNetIncomeHigh": 105000000000,
    "estimatedNetIncomeAvg": 97500000000,
    "estimatedEpsLow": 5.85,
    "estimatedEpsHigh": 6.65,
    "estimatedEpsAvg": 6.25,
    "numberAnalystEstimatedRevenue": 28,
    "numberAnalystsEstimatedEps": 32
  }
]
```

### 10.4 Grades Consensus Response Example

```json
[
  {
    "symbol": "AAPL",
    "strongBuy": 15,
    "buy": 22,
    "hold": 8,
    "sell": 2,
    "strongSell": 0,
    "consensus": "Buy"
  }
]
```

---

## 11. SEC Filings & Regulatory

### 11.1 SEC Filings

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/sec-filings-8k` | Latest 8-K filings | `from`, `to`, `page`, `limit` |
| `/stable/sec-filings-financials` | 10-K, 10-Q, 8-K filings | `from`, `to`, `page`, `limit` |
| `/stable/sec-filings-search/form-type` | Search by form type | `formType`, `from`, `to`, `page`, `limit` |
| `/stable/sec-filings-search/symbol` | Search by symbol | `symbol`, `from`, `to`, `page`, `limit` |
| `/stable/sec-filings-search/cik` | Search by CIK | `cik`, `from`, `to`, `page`, `limit` |
| `/stable/sec-filings-company-search/name` | Search by company name | `company` |

### 11.2 Institutional Holdings (13F)

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/institutional-ownership/latest` | Latest 13F filings | `page`, `limit` |
| `/stable/institutional-ownership/extract` | 13F detailed holdings | `cik`, `year`, `quarter` |
| `/stable/institutional-ownership/dates` | 13F filing dates | `cik` |
| `/stable/institutional-ownership/extract-analytics/holder` | Holdings with analytics | `symbol`, `year`, `quarter`, `page`, `limit` |
| `/stable/institutional-ownership/symbol-positions-summary` | Position summary | `symbol`, `year`, `quarter` |

### 11.3 Insider Trading

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/insider-trading/latest` | Latest insider trades | `page`, `limit` |
| `/stable/insider-trading/search` | Search insider trades | `page`, `limit` |
| `/stable/insider-trading/reporting-name` | Search by insider name | `name` |
| `/stable/insider-trading/statistics` | Trade statistics | `symbol` |
| `/stable/acquisition-of-beneficial-ownership` | Beneficial ownership | `symbol` |

---

## 12. Calendar & Events

### 12.1 Earnings Calendar

**Endpoint:** `/stable/earnings-calendar`

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Start date (YYYY-MM-DD) |
| `to` | string | End date (YYYY-MM-DD) |
| `symbol` | string | Filter by ticker |

**Response Example:**
```json
[
  {
    "date": "2024-01-25",
    "symbol": "AAPL",
    "eps": 2.18,
    "epsEstimated": 2.10,
    "time": "amc",
    "revenue": 119575000000,
    "revenueEstimated": 117890000000,
    "fiscalDateEnding": "2023-12-31",
    "updatedFromDate": "2024-01-20"
  }
]
```

### 12.2 Dividend Calendar

**Endpoint:** `/stable/dividends-calendar`

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Start date |
| `to` | string | End date |
| `symbol` | string | Filter by ticker |

**Response Example:**
```json
[
  {
    "date": "2024-02-15",
    "label": "February 15, 24",
    "symbol": "AAPL",
    "dividend": 0.24,
    "recordDate": "2024-02-12",
    "paymentDate": "2024-02-15",
    "declarationDate": "2024-02-01"
  }
]
```

### 12.3 Other Calendars

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/ipos-calendar` | Upcoming IPOs | `from`, `to` |
| `/stable/splits-calendar` | Stock splits | `from`, `to` |
| `/stable/economic-calendar` | Economic events | - |

---

## 13. Market Intelligence

### 13.1 Market Movers

| Endpoint | Description |
|----------|-------------|
| `/stable/biggest-gainers` | Top gaining stocks |
| `/stable/biggest-losers` | Top losing stocks |
| `/stable/most-actives` | Most traded stocks |

### 13.2 Sector & Industry Performance

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/sector-performance-snapshot` | Sector returns | `date` |
| `/stable/industry-performance-snapshot` | Industry returns | `date` |
| `/stable/historical-sector-performance` | Historical sector data | `sector` |
| `/stable/historical-industry-performance` | Historical industry data | `industry` |
| `/stable/sector-pe-snapshot` | Sector P/E ratios | `date` |
| `/stable/industry-pe-snapshot` | Industry P/E ratios | `date` |
| `/stable/historical-sector-pe` | Historical sector P/E | `sector` |
| `/stable/historical-industry-pe` | Historical industry P/E | `industry` |

### 13.3 Market Hours

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/exchange-market-hours` | Exchange trading hours | `exchange` |
| `/stable/holidays-by-exchange` | Exchange holidays | `exchange` |
| `/stable/all-exchange-market-hours` | All exchange hours | - |

---

## 14. News & Transcripts

### 14.1 News Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/news/stock-latest` | Latest stock news | `page`, `limit` |
| `/stable/news/general-latest` | Latest general news | `page`, `limit` |
| `/stable/news/press-releases-latest` | Latest press releases | `page`, `limit` |
| `/stable/news/stock` | Stock news by symbol | `symbols`, `page`, `limit` |
| `/stable/news/press-releases` | Press releases by symbol | `symbols`, `page`, `limit` |

### 14.2 Earnings Transcripts

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/stable/earning-call-transcript-latest` | Latest transcripts | `page`, `limit` |
| `/stable/earning-call-transcript` | Full transcript | `symbol`, `year`, `quarter` |
| `/stable/earning-call-transcript-dates` | Transcript dates | `symbol` |

---

## 15. Technical Indicators

### 15.1 Available Indicators

| Endpoint | Indicator | Parameters |
|----------|-----------|------------|
| `/stable/technical-indicators/sma` | Simple Moving Average | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/ema` | Exponential Moving Average | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/wma` | Weighted Moving Average | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/dema` | Double EMA | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/tema` | Triple EMA | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/rsi` | Relative Strength Index | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/standarddeviation` | Standard Deviation | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/williams` | Williams %R | `symbol`, `periodLength`, `timeframe` |
| `/stable/technical-indicators/adx` | Average Directional Index | `symbol`, `periodLength`, `timeframe` |

### 15.2 Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `symbol` | string | Stock ticker (required) |
| `periodLength` | number | Indicator period (e.g., 14, 20, 50) |
| `timeframe` | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `daily` | Data timeframe |

### 15.3 Technical Indicator Response Example

```json
[
  {
    "date": "2024-01-15 16:00:00",
    "open": 176.50,
    "high": 179.63,
    "low": 176.21,
    "close": 178.72,
    "volume": 54638923,
    "sma": 175.32
  }
]
```

---

## 16. Integration with Invorm

### 16.1 Current Implementation

Located in `src/services/data_ingestion/fmp_client.ts`:

| Method | Endpoint | Use Case |
|--------|----------|----------|
| `search(query, limit)` | `/search` | Symbol search |
| `getETFHoldings(ticker)` | `/etf-holder/{symbol}` | Look-Through |
| `getQuote(ticker)` | `/quote/{symbol}` | Live prices |

### 16.2 Waterfall Routing

The `price_fetcher.ts` routes requests based on ticker suffix:

| Ticker Pattern | Route To | Reason |
|----------------|----------|--------|
| `.L` or `:LON` | Apify | FMP LSE data is delayed |
| All others | FMP | Primary source |

### 16.3 Recommended Additions

| Feature | Endpoints | Priority |
|---------|-----------|----------|
| Portfolio Charts | `historical-price-eod/full` | High |
| Company Cards | `profile` | High |
| Sector Analysis | `etf/sector-weightings`, `sector-performance-snapshot` | Medium |
| Earnings Alerts | `earnings-calendar` | Medium |
| Dividend Tracking | `dividends-calendar` | Medium |
| Research Hub | `income-statement`, `key-metrics`, `analyst-estimates` | Medium |
| Intelligence Feed | `news/stock`, `insider-trading/latest` | Low |
| Technical Charts | `technical-indicators/sma`, `rsi` | Low |

---

## 17. Rate Limits

| Tier | Limit | Cost |
|------|-------|------|
| Free | 250 requests/day | $0 |
| Starter | 300 requests/minute | $14/month |
| Professional | 750 requests/minute | $49/month |
| Ultimate | 1500 requests/minute | $99/month |

### 17.1 Optimization Strategies

1. **Batch Requests:** Use `/batch-quote?symbols=AAPL,MSFT,GOOGL` (1 request vs 3)
2. **Short Quotes:** Use `quote-short` for price-only needs
3. **Caching:** Cache static data (profiles, holdings) aggressively
4. **Next.js Revalidate:** Use ISR for smart cache invalidation
5. **Request Queuing:** Implement queue for batch operations

---

## 18. Error Handling

### 18.1 Response Patterns

FMP returns empty arrays `[]` or objects `{}` for invalid symbols rather than HTTP errors.

```typescript
const data = await this.fetch<FMPQuote[]>(`/quote/${symbol}`);
if (!data || data.length === 0) {
  console.warn(`FMP: No data for symbol ${symbol}`);
  return null;
}
return data[0];
```

### 18.2 Common Error Scenarios

| Scenario | Response | Handling |
|----------|----------|----------|
| Invalid symbol | `[]` | Check array length, return null |
| Rate limit exceeded | HTTP 429 | Implement backoff, queue requests |
| Invalid API key | HTTP 401 | Check env variable |
| Server error | HTTP 500 | Retry with exponential backoff |

---

## 19. Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| LSE prices delayed | UK stocks show stale data | Route `.L` tickers to Apify |
| UCITS ETF holdings sparse | Missing Vanguard UK holdings | Custom CSV scrapers |
| No fractional share data | Can't track fractional positions | Store in Firestore manually |
| Empty responses for invalid symbols | Silent failures | Validate responses, log warnings |
| Rate limits on free tier | Limited requests | Upgrade or implement caching |
| No pre-market quotes in standard endpoints | Missing extended hours | Use aftermarket-quote endpoints |
