'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPrices, convertGbxToGbp, isGbxTicker } from '@/services/price-service';
import { usePortfolio } from '@/context/PortfolioContext';
import { logger } from '@/services/logging';
import type { Holding } from '@/types/portfolio';

export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updated: Date;
}

export interface PerformanceData {
  symbol: string;
  data: Record<string, number>;
}

interface UseLivePricesReturn {
  quotes: Map<string, LiveQuote>;
  performance: PerformanceData[];
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refreshPrices: () => Promise<void>;
  refreshSinglePrice: (ticker: string) => Promise<void>;
}

function getUniqueTickers(holdings: Holding[]): string[] {
  const seen = new Set<string>();
  return holdings
    .filter((h) => h.assetType !== 'Cash' && h.ticker.trim() !== '')
    .reduce<string[]>((acc, h) => {
      const ticker = h.ticker.trim();
      if (!seen.has(ticker)) {
        seen.add(ticker);
        acc.push(ticker);
      }
      return acc;
    }, []);
}

export function useLivePrices(
  holdings: Holding[],
  enabled = true,
  updateInterval = 10,
): UseLivePricesReturn {
  const { updateLivePrices } = usePortfolio();
  const [quotes, setQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshPrices = useCallback(async () => {
    const tickers = getUniqueTickers(holdings);
    if (tickers.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchPrices(tickers);
      const newQuotes = new Map<string, LiveQuote>();
      const priceMap = new Map<
        string,
        {
          price: number;
          change: number;
          changePercent: number;
          updated: Date;
          originalPrice?: number;
          originalCurrency?: string;
          conversionRate?: number;
        }
      >();

      for (const [symbol, result] of results) {
        const gbx = isGbxTicker(symbol, result.currency);
        const displayPrice = gbx ? convertGbxToGbp(result.price, result.currency) : result.price;

        newQuotes.set(symbol, {
          symbol,
          price: displayPrice,
          change: 0,
          changePercent: 0,
          updated: result.timestamp,
        });

        priceMap.set(symbol, {
          price: displayPrice,
          change: 0,
          changePercent: 0,
          updated: result.timestamp,
          originalPrice: result.price,
          originalCurrency: result.currency,
        });
      }

      setQuotes(newQuotes);
      setLastUpdated(new Date());
      updateLivePrices(priceMap);

      logger.debug('portfolio', `Live prices updated for ${results.size} tickers`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(message);
      logger.warn('portfolio', 'Live price fetch failed', { error: message });
    } finally {
      setIsLoading(false);
    }
  }, [holdings, updateLivePrices]);

  const refreshSinglePrice = useCallback(
    async (ticker: string) => {
      try {
        const results = await fetchPrices([ticker]);
        const result = results.get(ticker);
        if (!result) return;

        const gbx = isGbxTicker(ticker, result.currency);
        const displayPrice = gbx ? convertGbxToGbp(result.price, result.currency) : result.price;

        setQuotes((prev) => {
          const next = new Map(prev);
          next.set(ticker, {
            symbol: ticker,
            price: displayPrice,
            change: 0,
            changePercent: 0,
            updated: result.timestamp,
          });
          return next;
        });

        const priceMap = new Map<
          string,
          {
            price: number;
            change: number;
            changePercent: number;
            updated: Date;
            originalPrice?: number;
            originalCurrency?: string;
          }
        >();
        priceMap.set(ticker, {
          price: displayPrice,
          change: 0,
          changePercent: 0,
          updated: result.timestamp,
          originalPrice: result.price,
          originalCurrency: result.currency,
        });
        updateLivePrices(priceMap);
      } catch (err) {
        logger.warn('portfolio', `Single price refresh failed for ${ticker}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [updateLivePrices],
  );

  useEffect(() => {
    if (!enabled) return;

    refreshPrices();

    const intervalMs = Math.max(1, Math.min(60, updateInterval)) * 60 * 1000;
    intervalRef.current = setInterval(refreshPrices, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, updateInterval, refreshPrices]);

  return {
    quotes,
    performance,
    isLoading,
    lastUpdated,
    error,
    refreshPrices,
    refreshSinglePrice,
  };
}
