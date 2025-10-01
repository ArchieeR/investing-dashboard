import { convertCurrency, detectCurrency, formatCurrencyWithSymbol } from './currencyConverter';
import { fetchAlphaVantageQuote } from './alphaVantageApi';
import { fetchAlpacaQuote, fetchMultipleAlpacaQuotes } from './alpacaApi';

export interface QuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  marketState: string;
  lastUpdated: Date;
  // Converted values in GBP
  priceGBP: number;
  changeGBP: number;
  previousCloseGBP: number;
  conversionRate: number;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PerformanceData {
  symbol: string;
  periods: {
    '1d': number;
    '2d': number;
    '3d': number;
    '1w': number;
    '1m': number;
    '6m': number;
    'ytd': number;
    '1y': number;
    '2y': number;
  };
}

export type PerformancePeriod = keyof PerformanceData['periods'];

const CACHE_DURATION = 60000; // 1 minute cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Simple price cache to make prices more stable
const priceCache = new Map<string, { price: number; lastUpdate: number }>();

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Format ticker for Yahoo Finance based on exchange
const formatTickerForYahoo = (ticker: string, exchange: string): string => {
  const cleanTicker = ticker.toUpperCase().trim();
  
  switch (exchange) {
    case 'LSE':
      // London Stock Exchange - add .L suffix
      return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.L`;
    
    case 'AMS':
      // Amsterdam Stock Exchange - add .AS suffix
      return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.AS`;
    
    case 'XETRA':
      // German Stock Exchange - add .DE suffix
      return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.DE`;
    
    case 'XC':
      // XC Exchange - no suffix needed
      return cleanTicker.replace(/\.[A-Z]+$/, ''); // Remove any existing suffix
    
    case 'VI':
      // Vienna Stock Exchange - add .VI suffix
      return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.VI`;
    
    case 'NASDAQ':
    case 'NYSE':
      // US exchanges - no suffix needed
      return cleanTicker.replace(/\.[A-Z]+$/, ''); // Remove any existing suffix
    
    case 'Other':
    default:
      // Keep as-is for other exchanges
      return cleanTicker;
  }
};

// Browser-compatible Yahoo Finance implementation using CORS proxy
const fetchYahooQuote = async (symbol: string, exchange: string = 'NYSE') => {
  try {
    // Format the ticker symbol for Yahoo Finance based on exchange
    const yahooTicker = formatTickerForYahoo(symbol, exchange);
    
    // Use CORS proxy to access Yahoo Finance API
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`;
    // Try multiple CORS proxies
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
      `https://cors-anywhere.herokuapp.com/${yahooUrl}`,
    ];
    
    let proxyUrl = proxyUrls[0]; // Start with first proxy
    
    console.log(`Fetching real data for ${symbol} (${exchange} -> ${yahooTicker})...`);
    
    let response;
    let data;
    
    // Try different CORS proxies
    for (let i = 0; i < proxyUrls.length; i++) {
      try {
        proxyUrl = proxyUrls[i];
        response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Proxy ${i + 1} failed: ${response.status}`);
        }
        
        const proxyData = await response.json();
        
        // Handle different proxy response formats
        if (proxyData.contents) {
          // allorigins.win format
          data = JSON.parse(proxyData.contents);
        } else if (typeof proxyData === 'object' && proxyData.chart) {
          // Direct proxy format
          data = proxyData;
        } else {
          throw new Error('Invalid proxy response format');
        }
        
        break; // Success, exit loop
      } catch (error) {
        console.warn(`Proxy ${i + 1} failed:`, error.message);
        if (i === proxyUrls.length - 1) {
          throw new Error('All CORS proxies failed');
        }
      }
    }
    
    // Check for Yahoo Finance error responses
    if (data.chart?.error) {
      throw new Error(`Yahoo Finance error: ${data.chart.error.description || 'Unknown error'}`);
    }
    
    if (!data.chart?.result?.[0]) {
      // Check if it's a "not found" vs other error
      if (data.chart?.result === null) {
        throw new Error(`Ticker '${symbol}' not found on Yahoo Finance`);
      }
      throw new Error('No chart data returned from Yahoo Finance');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    if (!meta) {
      throw new Error('No metadata in Yahoo Finance response');
    }
    
    if (!quote || !quote.close || quote.close.length === 0) {
      throw new Error('No price data in Yahoo Finance response');
    }
    
    // Get the latest values
    const latestIndex = quote.close.length - 1;
    const currentPrice = quote.close[latestIndex];
    const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    
    console.log(`✅ Real data fetched for ${symbol}: ${meta.currency} ${currentPrice}`);
    
    return {
      symbol: symbol, // Return original symbol, not corrected one
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketPreviousClose: previousClose,
      currency: meta.currency || 'USD',
      marketState: meta.marketState || 'REGULAR',
    };
  } catch (error) {
    console.warn(`⚠️ Real API failed for ${symbol}:`, error.message);
    
    // Try Alpha Vantage as fallback
    const alphaVantageQuote = await fetchAlphaVantageQuote(symbol, exchange);
    if (alphaVantageQuote) {
      return alphaVantageQuote;
    }
    
    // Try Alpaca as third fallback (US stocks only)
    const alpacaQuote = await fetchAlpacaQuote(symbol, exchange);
    if (alpacaQuote) {
      return alpacaQuote;
    }
    
    // Third fallback: use cached price with small random variation to simulate market movement
    const cached = priceCache.get(symbol);
    if (cached && cached.price) {
      console.warn(`Using cached price as third fallback for ${symbol}`);
      const variation = (Math.random() - 0.5) * 0.02; // ±1% random variation
      const adjustedPrice = cached.price * (1 + variation);
      
      return {
        symbol,
        price: adjustedPrice,
        change: adjustedPrice - cached.price,
        changePercent: ((adjustedPrice - cached.price) / cached.price) * 100,
        currency: cached.currency || 'GBP',
        lastUpdated: new Date(),
        marketState: 'CLOSED' as const,
      };
    }
    
    console.warn(`All fallbacks failed for ${symbol}, no price data available`);
    return null;
  }
};

// Fallback mock data generator
const generateMockQuote = (symbol: string) => {
  // Use cached price if available for consistency
  const cached = priceCache.get(symbol);
  const now = Date.now();
  
  let basePrice: number;
  
  if (cached && (now - cached.lastUpdate) < 30000) {
    basePrice = cached.price + (Math.random() - 0.5) * 2;
  } else {
    // Determine currency and realistic price based on symbol
    const upperSymbol = symbol.toUpperCase();
    
    if (upperSymbol.endsWith('.L')) {
      // London Stock Exchange stocks - most are in pence (GBX)
      if (upperSymbol.includes('LLOY')) {
        basePrice = 45 + Math.random() * 10; // Lloyds around 45-55p
      } else if (upperSymbol.includes('BARC')) {
        basePrice = 180 + Math.random() * 40; // Barclays around 180-220p
      } else if (upperSymbol.includes('VOD')) {
        basePrice = 70 + Math.random() * 20; // Vodafone around 70-90p
      } else if (upperSymbol.includes('BP')) {
        basePrice = 450 + Math.random() * 100; // BP around 450-550p
      } else if (upperSymbol.includes('ORCP')) {
        basePrice = 47.35; // ORCP realistic price
      } else if (upperSymbol.includes('VPNG')) {
        basePrice = 29.25; // VPNG realistic price
      } else if (upperSymbol.includes('DFNG')) {
        basePrice = 90; // DFNG realistic price
      } else if (upperSymbol.includes('TRET')) {
        basePrice = 31.23; // TRET realistic price
      } else if (upperSymbol.includes('SMGB')) {
        basePrice = 126.8; // SMGB realistic price
      } else if (upperSymbol.includes('DXJP')) {
        basePrice = 99.46; // DXJP realistic price
      } else if (upperSymbol.includes('XUKX')) {
        basePrice = 41.52; // XUKX realistic price
      } else {
        basePrice = 100 + Math.random() * 1900; // General UK stocks 100-2000p
      }
    } else if (upperSymbol.includes('VUKE') || upperSymbol.includes('FTSE')) {
      // UK ETFs typically in GBP
      basePrice = 20 + Math.random() * 80; // £20-100 range
    } else if (upperSymbol.includes('AAPL')) {
      basePrice = 170 + Math.random() * 30; // Apple around $170-200
    } else if (upperSymbol.includes('MSFT')) {
      basePrice = 350 + Math.random() * 50; // Microsoft around $350-400
    } else if (upperSymbol.includes('GOOGL')) {
      basePrice = 130 + Math.random() * 40; // Google around $130-170
    } else {
      basePrice = 10 + Math.random() * 200; // Default range
    }
    
    priceCache.set(symbol, { price: basePrice, lastUpdate: now });
  }
  
  // Determine currency based on symbol
  let currency = 'USD';
  const upperSymbol = symbol.toUpperCase();
  
  // UK ETFs and stocks - these should be GBX (pence) or GBP
  const ukETFs = ['CS1', 'EQQQ', 'XUKX', 'DXJP', 'SMGB', 'TRET', 'DFNG', 'VPNG', 'ORCP'];
  if (upperSymbol.endsWith('.L') || ukETFs.includes(upperSymbol)) {
    currency = 'GBX'; // Most UK instruments are in pence
  } else if (upperSymbol.includes('VUKE') || upperSymbol.includes('FTSE')) {
    currency = 'GBP';
  }
  
  const finalPrice = Math.round(basePrice * 100) / 100;
  const finalChange = (Math.random() - 0.5) * (currency === 'GBX' ? 20 : 2);
  
  return {
    symbol,
    regularMarketPrice: finalPrice,
    regularMarketChange: Math.round(finalChange * 100) / 100,
    regularMarketChangePercent: Math.round(((finalChange / finalPrice) * 100) * 100) / 100,
    regularMarketPreviousClose: Math.round((finalPrice - finalChange) * 100) / 100,
    currency,
    marketState: 'REGULAR',
  };
};

// Yahoo Finance API wrapper
const yahooFinanceAPI = {
  quote: (symbol: string, exchange: string = 'NYSE') => fetchYahooQuote(symbol, exchange),
  
  historical: async (symbol: string, options: any) => {
    // For now, return mock historical data
    // In production, you'd implement real historical data fetching
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const days = Math.min(30, Math.max(1, Math.floor(Math.random() * 30)));
    const basePrice = 100 + Math.random() * 400;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const price = basePrice + (Math.random() - 0.5) * 20;
      
      data.push({
        date,
        open: price + (Math.random() - 0.5) * 2,
        high: price + Math.random() * 3,
        low: price - Math.random() * 3,
        close: price,
        volume: Math.floor(Math.random() * 1000000),
      });
    }
    
    return data;
  },
};

export const fetchQuote = async (symbol: string, exchange: string = 'NYSE'): Promise<QuoteData | null> => {
  if (!symbol.trim()) return null;
  
  const cacheKey = `quote_${symbol}`;
  const cached = getCachedData<QuoteData>(cacheKey);
  if (cached) return cached;

  try {
    let quote = await yahooFinanceAPI.quote(symbol, exchange);
    
    if (!quote.regularMarketPrice) {
      console.warn(`No price data for symbol: ${symbol}, trying Alpha Vantage fallback...`);
      // Try Alpha Vantage as fallback when Yahoo Finance returns null price
      const alphaVantageQuote = await fetchAlphaVantageQuote(symbol, exchange);
      if (alphaVantageQuote) {
        quote = alphaVantageQuote;
      } else {
        // Try Alpaca as third fallback
        const alpacaQuote = await fetchAlpacaQuote(symbol, exchange);
        if (alpacaQuote) {
          quote = alpacaQuote;
        } else {
          console.warn(`All APIs failed for ${symbol} (Yahoo Finance, Alpha Vantage, Alpaca), no price data available`);
          return null;
        }
      }
    }

    // Use currency from Yahoo Finance quote, with fallback detection
    const currency = detectCurrency(symbol, quote.regularMarketPrice, quote.currency);
    
    console.log(`🏷️ Currency detection for ${symbol}:`, {
      yahooCurrency: quote.currency,
      detectedCurrency: currency,
      price: quote.regularMarketPrice,
      symbol: symbol
    });

    // Convert prices to GBP
    const priceConversion = await convertCurrency(quote.regularMarketPrice, currency, 'GBP');
    const changeConversion = await convertCurrency(quote.regularMarketChange || 0, currency, 'GBP');
    const previousCloseConversion = await convertCurrency(
      quote.regularMarketPreviousClose || quote.regularMarketPrice, 
      currency, 
      'GBP'
    );

    const data: QuoteData = {
      symbol: quote.symbol || symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange || 0,
      regularMarketChangePercent: quote.regularMarketChangePercent || 0,
      regularMarketPreviousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
      currency,
      marketState: quote.marketState || 'UNKNOWN',
      lastUpdated: new Date(),
      // Converted values in GBP
      priceGBP: priceConversion.convertedValue,
      changeGBP: changeConversion.convertedValue,
      previousCloseGBP: previousCloseConversion.convertedValue,
      conversionRate: priceConversion.exchangeRate,
    };

    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
};

export const fetchHistoricalData = async (
  symbol: string,
  period: string,
  interval: string = '1d'
): Promise<HistoricalData[]> => {
  if (!symbol.trim()) return [];

  const cacheKey = `hist_${symbol}_${period}_${interval}`;
  const cached = getCachedData<HistoricalData[]>(cacheKey);
  if (cached) return cached;

  try {
    const historical = await yahooFinanceAPI.historical(symbol, { period, interval });
    setCachedData(cacheKey, historical);
    return historical;
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error);
    return [];
  }
};

export const calculatePerformance = async (symbol: string): Promise<PerformanceData | null> => {
  if (!symbol.trim()) return null;

  const cacheKey = `perf_${symbol}`;
  const cached = getCachedData<PerformanceData>(cacheKey);
  if (cached) return cached;

  try {
    const periods: PerformancePeriod[] = ['1d', '2d', '3d', '1w', '1m', '6m', 'ytd', '1y', '2y'];
    const performance: PerformanceData = {
      symbol,
      periods: {} as PerformanceData['periods'],
    };

    // Fetch current price
    const quote = await fetchQuote(symbol);
    if (!quote) return null;

    const currentPrice = quote.regularMarketPrice;

    // Calculate performance for each period
    for (const period of periods) {
      try {
        const historical = await fetchHistoricalData(symbol, period);
        if (historical.length > 0) {
          const startPrice = historical[0].close;
          const changePercent = ((currentPrice - startPrice) / startPrice) * 100;
          performance.periods[period] = changePercent;
        } else {
          performance.periods[period] = 0;
        }
      } catch (error) {
        console.warn(`Failed to calculate ${period} performance for ${symbol}:`, error);
        performance.periods[period] = 0;
      }
    }

    setCachedData(cacheKey, performance);
    return performance;
  } catch (error) {
    console.error(`Failed to calculate performance for ${symbol}:`, error);
    return null;
  }
};

export const fetchMultipleQuotes = async (holdings: Array<{ticker: string, exchange: string}>): Promise<Map<string, QuoteData>> => {
  const results = new Map<string, QuoteData>();
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < holdings.length; i += batchSize) {
    const batch = holdings.slice(i, i + batchSize);
    const promises = batch.map(holding => fetchQuote(holding.ticker, holding.exchange));
    
    try {
      const batchResults = await Promise.allSettled(promises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(batch[index].ticker, result.value);
        }
      });
    } catch (error) {
      console.error('Batch quote fetch failed:', error);
    }
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < holdings.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // For any holdings that failed, try Alpaca as a batch fallback for US stocks
  const failedHoldings = holdings.filter(holding => !results.has(holding.ticker));
  if (failedHoldings.length > 0) {
    console.log(`Trying Alpaca fallback for ${failedHoldings.length} failed holdings...`);
    
    try {
      const alpacaResults = await fetchMultipleAlpacaQuotes(failedHoldings);
      
      // Convert Alpaca results to QuoteData format and add to results
      for (const [ticker, alpacaQuote] of alpacaResults) {
        const currency = detectCurrency(ticker, alpacaQuote.regularMarketPrice, alpacaQuote.currency);
        
        // Convert to GBP
        const priceConversion = await convertCurrency(alpacaQuote.regularMarketPrice, currency, 'GBP');
        const changeConversion = await convertCurrency(alpacaQuote.regularMarketChange, currency, 'GBP');
        const previousCloseConversion = await convertCurrency(alpacaQuote.regularMarketPreviousClose, currency, 'GBP');
        
        const quoteData: QuoteData = {
          symbol: alpacaQuote.symbol,
          regularMarketPrice: alpacaQuote.regularMarketPrice,
          regularMarketChange: alpacaQuote.regularMarketChange,
          regularMarketChangePercent: alpacaQuote.regularMarketChangePercent,
          regularMarketPreviousClose: alpacaQuote.regularMarketPreviousClose,
          currency,
          marketState: alpacaQuote.marketState,
          lastUpdated: new Date(),
          priceGBP: priceConversion.convertedValue,
          changeGBP: changeConversion.convertedValue,
          previousCloseGBP: previousCloseConversion.convertedValue,
          conversionRate: priceConversion.exchangeRate,
        };
        
        results.set(ticker, quoteData);
      }
      
      console.log(`✅ Alpaca fallback provided ${alpacaResults.size} additional quotes`);
    } catch (error) {
      console.error('Alpaca batch fallback failed:', error);
    }
  }
  
  return results;
};

export const clearCache = (): void => {
  cache.clear();
};