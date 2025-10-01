import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMultipleQuotes, fetchQuote, calculatePerformance, type QuoteData, type PerformanceData } from '../services/yahooFinance';
import type { Holding } from '../state/types';

export interface LivePriceData {
  quotes: Map<string, QuoteData>;
  performance: Map<string, PerformanceData>;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export const useLivePrices = (
  holdings: Holding[],
  enabled: boolean = true,
  updateInterval: number = 5 // minutes
) => {
  const [data, setData] = useState<LivePriceData>({
    quotes: new Map(),
    performance: new Map(),
    isLoading: false,
    lastUpdated: null,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  const updatePrices = useCallback(async () => {
    if (!enabled || isLoadingRef.current) return;

    const holdingsWithTickers = holdings
      .filter(h => h.ticker && h.ticker.trim() !== '' && h.assetType !== 'Cash')
      .map(h => ({ ticker: h.ticker.trim(), exchange: h.exchange || 'LSE' }))
      .filter((holding, index, arr) => 
        arr.findIndex(h => h.ticker === holding.ticker) === index
      ); // Remove duplicates

    if (holdingsWithTickers.length === 0) {
      setData(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }

    isLoadingRef.current = true;
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch quotes
      const quotes = await fetchMultipleQuotes(holdingsWithTickers);
      
      // Only fetch performance data occasionally to reduce API load
      const shouldFetchPerformance = Math.random() < 0.1; // 10% chance
      const performanceMap = new Map<string, PerformanceData>();
      
      if (shouldFetchPerformance) {
        const maxPerformanceRequests = 5; // Reduce to 5 to minimize API calls
        const performanceTickers = holdingsWithTickers.slice(0, maxPerformanceRequests).map(h => h.ticker);
        
        for (const ticker of performanceTickers) {
          try {
            const perf = await calculatePerformance(ticker);
            if (perf) {
              performanceMap.set(ticker, perf);
            }
          } catch (error) {
            console.warn(`Failed to fetch performance for ${ticker}:`, error);
          }
        }
      }

      setData(prev => ({
        quotes,
        performance: shouldFetchPerformance ? performanceMap : prev.performance,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Failed to update live prices:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live prices',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [holdings, enabled]);

  const refreshPrices = useCallback(() => {
    updatePrices();
  }, [updatePrices]);

  const refreshSinglePrice = useCallback(async (ticker: string) => {
    if (!enabled || !ticker.trim()) return;

    try {
      const quote = await fetchQuote(ticker);
      if (quote) {
        setData(prev => ({
          ...prev,
          quotes: new Map(prev.quotes).set(ticker, quote),
          lastUpdated: new Date(),
        }));
      }
    } catch (error) {
      console.error(`Failed to refresh price for ${ticker}:`, error);
    }
  }, [enabled]);

  // Set up automatic updates
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial load
    updatePrices();

    // Set up interval
    if (updateInterval > 0) {
      intervalRef.current = setInterval(updatePrices, updateInterval * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, updateInterval, updatePrices]);

  return {
    ...data,
    refreshPrices,
    refreshSinglePrice,
  };
};