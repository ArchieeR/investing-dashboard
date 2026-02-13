# On‑Demand Prices for Personal Use — Google Sheets Bridge & Light Scraper

> This doc shows two simple ways to fetch prices **only when you’re using the app** (no 24/7 polling), plus an optional free‑API fallback. It’s aimed at personal use and keeps the infrastructure tiny.

---

## TL;DR
- **Safest & easiest**: Google Sheets `GOOGLEFINANCE()` → read via Google Sheets API. No scraping, low maintenance.  
- **Quick & dirty**: Minimal Google Finance **page scrape** on demand with caching and polite delays. Works, but brittle and *not* recommended for production.  
- **Resilience**: Add a free API fallback (e.g., Alpha Vantage) if Sheets/scrape fails.  
- **Popular alternative**: Yahoo Finance (`yfinance` in Python or `yahoo-finance2` in Node) is a simple and popular choice for personal projects.

> ⚠️ **Terms & legality**: Scraping Google pages may breach ToS and can break without notice. Use for personal experiments only. Don’t redistribute scraped data.

---

## Option A — Google Sheets Bridge (recommended)

### 1) Build a tiny price sheet
In **Google Sheets**:

- Column **A**: `Ticker` (e.g., `VUSA:LON`, `NVDA:NASDAQ`, `SGLN:LON`).
- Column **B**: `Price` formula using `GOOGLEFINANCE`:
  ```
  =IF(A2="","", GOOGLEFINANCE(A2, "price"))
  ```
- Optional extras (C–F): `currency`, `changepct`, `marketcap`, etc:
  ```
  =IF(A2="","", GOOGLEFINANCE(A2, "price", NOW()))
  =IF(A2="","", GOOGLEFINANCE(A2, "changepct"))
  ```
- Give the sheet a name, e.g. **Prices**. Put tickers from your app in rows 2..N.

> Tip: Google prefers the format **`SYMBOL:EXCHANGE`** in Sheets; e.g. `VUSA:LON`.

### 2) Enable the Sheets API
- Create a Google Cloud project → enable **Google Sheets API**.  
- Create **Service Account** credentials.  
- Share the **Sheet** with the service account email (read‑only).  
- Store the JSON key securely (locally in `.env.local` pointing to a file path, not committed).

### 3) Add a tiny fetcher (server side)
Create a lightweight endpoint (Node/Express or serverless). This keeps your service account key off the client.

```ts
// /server/prices/sheets.ts
import { google } from 'googleapis';
import type { Request, Response } from 'express';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = process.env.SHEETS_PRICES_ID!; // e.g. 1AbC...
const RANGE = 'Prices!A2:B'; // ticker in A, price in B

let cache: { data: Record<string, number>; ts: number } | null = null;

export async function sheetsHandler(req: Request, res: Response) {
  try {
    // 1) Cache 30s to avoid hammering Google
    if (cache && Date.now() - cache.ts < 30_000) return res.json(cache.data);

    // 2) Auth
    const auth = new google.auth.GoogleAuth({
      scopes: SCOPES,
      credentials: {
        client_email: process.env.GSA_CLIENT_EMAIL,
        private_key: (process.env.GSA_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 3) Read sheet
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
    const rows = resp.data.values || [];

    // 4) Map ticker → price
    const out: Record<string, number> = {};
    for (const [ticker, price] of rows) {
      if (!ticker) continue;
      const p = Number(String(price).replace(/[, ]/g, ''));
      if (Number.isFinite(p)) out[ticker] = p;
    }

    cache = { data: out, ts: Date.now() };
    res.json(out);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'sheets error' });
  }
}
```

Client usage (React):
```ts
// src/utils/prices.ts
export async function fetchSheetPrices(): Promise<Record<string, number>> {
  const r = await fetch('/api/prices/sheets');
  if (!r.ok) throw new Error('sheets fetch failed');
  return r.json();
}
```

Now you can **refresh on demand** (button click) and display prices against your tickers.

---

## Option B — Light Google Finance Scraper (personal, brittle)

> Use only on demand. Keep requests few and cached. Expect it to break when Google changes HTML.

### URL format & ticker mapping
Google Finance page URLs typically look like:
```
https://www.google.com/finance/quote/<SYMBOL>:<EXCHANGE>
```
Examples: `VUSA:LON`, `NVDA:NASDAQ`, `SGLN:LON`.

### Minimal Node endpoint (Express + fetch + cheerio)
```ts
// /server/prices/scrape.ts
import type { Request, Response } from 'express';
import { load } from 'cheerio';
import fetch from 'node-fetch';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36';
const cache = new Map<string, { price: number; ts: number }>();

function gUrl(symbol: string) {
  // symbol expected as SYMBOL:EXCHANGE (e.g., VUSA:LON)
  return `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}`;
}

export async function scrapeOne(symbol: string): Promise<number> {
  // 1) Cache 30s
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < 30_000) return hit.price;

  // 2) Fetch politely
  const r = await fetch(gUrl(symbol), { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const html = await r.text();
  const $ = load(html);

  // 3) Parse: price often in a div like .YMlKec or [jsname="vWLAgc"]
  const el = $('div.YMlKec').first().text() || $('div[jsname="vWLAgc"]').first().text();
  const price = Number(el.replace(/[, ]/g, ''));
  if (!Number.isFinite(price)) throw new Error('price not found');

  cache.set(symbol, { price, ts: Date.now() });
  return price;
}

export async function scrapeHandler(req: Request, res: Response) {
  try {
    const symbols = (req.query.symbols as string || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!symbols.length) return res.status(400).json({ error: 'symbols required' });

    const entries = await Promise.all(symbols.map(async s => [s, await scrapeOne(s)] as const));
    res.json(Object.fromEntries(entries));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'scrape error' });
  }
}
```

Client usage (React):
```ts
export async function fetchScrapedPrices(symbols: string[]): Promise<Record<string, number>> {
  const r = await fetch(`/api/prices/scrape?symbols=${symbols.join(',')}`);
  if (!r.ok) throw new Error('scrape failed');
  return r.json();
}
```

**Politeness & safety**
- Call this only when you press **Refresh** in the UI.  
- Cache results for at least **30–60s**.  
- Never loop through hundreds of tickers rapidly.  
- Be ready to fall back if the DOM changes.

---

## Option C — Free API Fallback (Alpha Vantage example)

Set an environment variable `ALPHAVANTAGE_KEY` and add a tiny proxy:

```ts
// /server/prices/alphavantage.ts
import type { Request, Response } from 'express';
import fetch from 'node-fetch';

const API = 'https://www.alphavantage.co/query';

async function avPrice(symbol: string) {
  const url = `${API}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHAVANTAGE_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  const p = Number(j?.['Global Quote']?.['05. price']);
  if (!Number.isFinite(p)) throw new Error('no quote');
  return p;
}

export async function alphaHandler(req: Request, res: Response) {
  try {
    const symbols = (req.query.symbols as string || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!symbols.length) return res.status(400).json({ error: 'symbols required' });

    const out: Record<string, number> = {};
    for (const s of symbols) out[s] = await avPrice(s);
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'alpha error' });
  }
}
```

---

## Option D — Yahoo Finance (simple, popular)

Yahoo Finance is an unofficial but widely used source for personal projects. It’s easier than Sheets or scraping, offers broad coverage, and provides intraday and short-term historical data. It is not officially supported and may have some delays or lack SLA guarantees.

### Python example with `yfinance`

```python
import yfinance as yf

# Fetch current price
ticker = yf.Ticker("AAPL")
price = ticker.info.get('regularMarketPrice')
print(f"Current price: {price}")

# Fetch short-term history (1d, 2d, 5d)
hist_1d = ticker.history(period="1d")
hist_2d = ticker.history(period="2d")
hist_5d = ticker.history(period="5d")

print(hist_1d)
```

### Node.js example with `yahoo-finance2`

```ts
import yahooFinance from 'yahoo-finance2';

async function fetchPrice(symbol: string) {
  // symbol example: "AAPL", or "VOD.L" for LSE tickers (note .L suffix)
  const quote = await yahooFinance.quote(symbol);
  console.log(`Current price for ${symbol}:`, quote.regularMarketPrice);
  
  const history = await yahooFinance.historical(symbol, { period1: '5d' });
  console.log(`5-day history for ${symbol}:`, history);
}

fetchPrice('AAPL');
fetchPrice('VOD.L'); // LSE ticker example
```

### Notes
- Use suffixes like `.L` for London Stock Exchange tickers (e.g., `VOD.L`).
- Pros: easy to use, broad coverage, intraday and historical data available.
- Cons: unofficial, sometimes delayed data, no formal SLA.

---

## A unified provider in your app
Create a provider that tries **Sheets → Scrape → Alpha** in order, returning the first success.

Yahoo Finance can be slotted in as the first or second option depending on your preference (e.g., try Yahoo first for ease, then Sheets, then scrape, then Alpha).

```ts
// src/utils/priceProvider.ts
import { fetchSheetPrices } from './prices';

export async function getPrices(symbols: string[]): Promise<Record<string, number>> {
  const tryFns = [
    // Example: Yahoo Finance could be tried here first or second
    async () => {
      // pseudo-code for Yahoo Finance fetch
      // const map = await fetchYahooPrices(symbols);
      // if (Object.keys(map).length) return map;
      // throw new Error('yahoo: none found');
      throw new Error('yahoo not implemented');
    },
    async () => {
      const map = await fetchSheetPrices();
      const out: Record<string, number> = {};
      for (const s of symbols) if (map[s] != null) out[s] = map[s];
      if (Object.keys(out).length) return out;
      throw new Error('sheet: none found');
    },
    async () => {
      const r = await fetch(`/api/prices/scrape?symbols=${symbols.join(',')}`);
      if (r.ok) return r.json();
      throw new Error('scrape failed');
    },
    async () => {
      const r = await fetch(`/api/prices/alpha?symbols=${symbols.join(',')}`);
      if (r.ok) return r.json();
      throw new Error('alpha failed');
    },
  ];

  for (const fn of tryFns) {
    try { return await fn(); } catch (_) {}
  }
  throw new Error('no price source available');
}
```

Trigger this from a **Refresh** button; don’t poll in the background.

---

## Operational notes
- **Environment**: keep secrets in `.env.local` (`GSA_CLIENT_EMAIL`, `GSA_PRIVATE_KEY`, `SHEETS_PRICES_ID`, `ALPHAVANTAGE_KEY`).  
- **Caching**: both server endpoints cache for 30–60s; the client can also store the last result in state to reduce calls.
- **Resilience**: show a friendly banner if prices are stale or unavailable; the core app still works from manually entered prices.
- **Testing**: unit test parsing utils (e.g., number parsing, ticker mapping) and the provider’s fallback order.

---

## FAQ
**Q: Why Sheets first?**  
A: It’s the least brittle and fastest to maintain. Google handles fetching; you only read a table.

**Q: Can I scrape tick‑by‑tick?**  
A: Don’t. It’s impolite and likely to get blocked. On‑demand refresh is the right pattern.

**Q: Do I need per‑exchange mapping?**  
A: Prefer the `SYMBOL:EXCHANGE` format for Google (e.g., `VUSA:LON`). Maintain a simple mapping table in your app if needed.

---

### Summary
For a personal, on‑demand portfolio tool: **use a Google Sheets bridge** for prices; optionally add **a light scraper**, **Yahoo Finance**, and **Alpha Vantage fallback**. Keep calls manual (Refresh button), cache for 30–60s, and expect occasional hiccups without breaking the app.
