import { fmpClient, type FMPQuoteShort } from "@/lib/fmp";
import { logger } from "@/services/logging";

// ============================================
// TYPES
// ============================================

export interface PriceResult {
  symbol: string;
  price: number;
  currency: string;
  source: "fmp" | "apify" | "cached";
  timestamp: Date;
}

export interface PriceServiceConfig {
  batchSize: number;
  delayBetweenBatches: number; // ms
}

const DEFAULT_CONFIG: PriceServiceConfig = {
  batchSize: 10,
  delayBetweenBatches: 100,
};

// ============================================
// EXCHANGE SUFFIX MAPPING
// ============================================

const EXCHANGE_SUFFIXES: Record<string, string> = {
  LSE: ".L",
  AMS: ".AS",
  XETRA: ".DE",
  EURONEXT: ".PA",
  SIX: ".SW",
  TSE: ".T",
  ASX: ".AX",
  HKG: ".HK",
};

/** Format a ticker for the given exchange */
export function formatExchangeTicker(
  ticker: string,
  exchange: string
): string {
  // If ticker already has a suffix, return as-is
  if (ticker.includes(".")) return ticker;
  const suffix = EXCHANGE_SUFFIXES[exchange];
  return suffix ? `${ticker}${suffix}` : ticker;
}

// ============================================
// GBX / GBp CONVERSION
// ============================================

/** GBX (pence) tickers are priced in pence; convert to GBP pounds */
export function convertGbxToGbp(price: number, currency: string): number {
  if (currency === "GBX" || currency === "GBp") {
    return price / 100;
  }
  return price;
}

/** Detect if a ticker is likely priced in GBX */
export function isGbxTicker(symbol: string, currency?: string): boolean {
  if (currency === "GBX" || currency === "GBp") return true;
  // LSE-listed securities are typically in GBX
  return symbol.endsWith(".L");
}

// ============================================
// BATCH HELPERS
// ============================================

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// PRICE SERVICE
// ============================================

/** Check if a ticker should route to Apify (LSE tickers) */
function isLseTicker(symbol: string): boolean {
  return symbol.endsWith(".L");
}

/** Stub: Fetch price from Apify for LSE tickers */
async function fetchFromApify(
  _symbols: string[]
): Promise<Map<string, PriceResult>> {
  // TODO: Implement Apify client for LSE pricing
  logger.debug("portfolio", "Apify fetch stubbed for LSE tickers");
  return new Map();
}

/** Simple in-memory price cache */
const priceCache = new Map<string, PriceResult>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedPrice(symbol: string): PriceResult | null {
  const cached = priceCache.get(symbol);
  if (!cached) return null;
  if (Date.now() - cached.timestamp.getTime() > CACHE_TTL_MS) {
    priceCache.delete(symbol);
    return null;
  }
  return cached;
}

function setCachedPrice(result: PriceResult): void {
  priceCache.set(result.symbol, result);
}

/**
 * Fetch prices for multiple tickers with multi-source fallback.
 * Chain: FMP -> Apify (for LSE) -> Cache
 * Batches requests to avoid rate limits.
 */
export async function fetchPrices(
  symbols: string[],
  config: PriceServiceConfig = DEFAULT_CONFIG
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  if (symbols.length === 0) return results;

  // Separate LSE tickers for Apify routing
  const fmpSymbols = symbols.filter((s) => !isLseTicker(s));
  const lseSymbols = symbols.filter((s) => isLseTicker(s));

  // Batch FMP requests
  const fmpBatches = chunk(fmpSymbols, config.batchSize);
  for (let i = 0; i < fmpBatches.length; i++) {
    try {
      const quotes = await fmpClient.getBatchQuotes(fmpBatches[i]);
      for (const q of quotes) {
        const result: PriceResult = {
          symbol: q.symbol,
          price: q.price,
          currency: "USD", // FMP default; profile lookup needed for accuracy
          source: "fmp",
          timestamp: new Date(),
        };
        results.set(q.symbol, result);
        setCachedPrice(result);
      }
    } catch (err) {
      logger.warn("portfolio", `FMP batch ${i} failed, trying cache`, {
        batch: fmpBatches[i],
      });
      // Fallback to cache for this batch
      for (const sym of fmpBatches[i]) {
        const cached = getCachedPrice(sym);
        if (cached) results.set(sym, cached);
      }
    }

    if (i < fmpBatches.length - 1) {
      await delay(config.delayBetweenBatches);
    }
  }

  // LSE tickers: try Apify, fallback to FMP, fallback to cache
  if (lseSymbols.length > 0) {
    const apifyResults = await fetchFromApify(lseSymbols);

    // Merge Apify results
    for (const [sym, result] of apifyResults) {
      results.set(sym, result);
      setCachedPrice(result);
    }

    // For LSE tickers not found via Apify, try FMP
    const missingLse = lseSymbols.filter((s) => !results.has(s));
    if (missingLse.length > 0) {
      const lseBatches = chunk(missingLse, config.batchSize);
      for (let i = 0; i < lseBatches.length; i++) {
        try {
          const quotes = await fmpClient.getBatchQuotes(lseBatches[i]);
          for (const q of quotes) {
            const result: PriceResult = {
              symbol: q.symbol,
              price: q.price,
              currency: isGbxTicker(q.symbol) ? "GBX" : "GBP",
              source: "fmp",
              timestamp: new Date(),
            };
            results.set(q.symbol, result);
            setCachedPrice(result);
          }
        } catch {
          for (const sym of lseBatches[i]) {
            const cached = getCachedPrice(sym);
            if (cached) results.set(sym, cached);
          }
        }

        if (i < lseBatches.length - 1) {
          await delay(config.delayBetweenBatches);
        }
      }
    }
  }

  // Final cache fallback for any remaining misses
  for (const sym of symbols) {
    if (!results.has(sym)) {
      const cached = getCachedPrice(sym);
      if (cached) results.set(sym, cached);
    }
  }

  return results;
}

/** Fetch a single price with fallback chain */
export async function fetchPrice(symbol: string): Promise<PriceResult | null> {
  const results = await fetchPrices([symbol]);
  return results.get(symbol) ?? null;
}

/** Clear the in-memory price cache */
export function clearPriceCache(): void {
  priceCache.clear();
}
