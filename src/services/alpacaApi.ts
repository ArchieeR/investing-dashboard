import { convertCurrency, detectCurrency } from './currencyConverter';

export interface AlpacaQuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  marketState: string;
}

// Alpaca API configuration
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets'; // Using paper trading for safety
const ALPACA_API_KEY_ID = 'PA3F5CKBA5Q2'; // Provided key ID
const ALPACA_API_SECRET_KEY = import.meta.env.VITE_ALPACA_API_SECRET_KEY || ''; // Store secret in env var

// Cache for Alpaca data
const alpacaCache = new Map<string, { data: AlpacaQuoteData; timestamp: number }>();
const ALPACA_CACHE_DURATION = 60000; // 1 minute cache

const getCachedAlpacaData = (symbol: string): AlpacaQuoteData | null => {
  const cached = alpacaCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < ALPACA_CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedAlpacaData = (symbol: string, data: AlpacaQuoteData): void => {
  alpacaCache.set(symbol, { data, timestamp: Date.now() });
};

// Format ticker for Alpaca (US stocks only, no suffixes)
const formatTickerForAlpaca = (ticker: string, exchange: string): string => {
  const cleanTicker = ticker.toUpperCase().trim();
  
  // Alpaca only supports US stocks, so remove any exchange suffixes
  const baseTicker = cleanTicker.replace(/\.[A-Z]+$/, '');
  
  // Only process if it looks like a US stock
  if (exchange === 'NASDAQ' || exchange === 'NYSE' || exchange === 'Other') {
    return baseTicker;
  }
  
  // For non-US exchanges, return null to indicate not supported
  return '';
};

// Check if Alpaca API is configured
const isAlpacaConfigured = (): boolean => {
  const isConfigured = ALPACA_API_KEY_ID && ALPACA_API_SECRET_KEY;
  if (!isConfigured && ALPACA_API_KEY_ID) {
    console.log('Alpaca API Key ID found but secret key missing. Add VITE_ALPACA_API_SECRET_KEY to your .env file to enable Alpaca fallback.');
  }
  return isConfigured;
};

// Fetch latest quote from Alpaca
export const fetchAlpacaQuote = async (symbol: string, exchange: string = 'NYSE'): Promise<AlpacaQuoteData | null> => {
  if (!isAlpacaConfigured()) {
    console.warn('Alpaca API not configured - missing secret key');
    return null;
  }

  const alpacaTicker = formatTickerForAlpaca(symbol, exchange);
  if (!alpacaTicker) {
    // Only log for US exchanges to avoid spam
    if (exchange === 'NASDAQ' || exchange === 'NYSE') {
      console.log(`Alpaca: ${symbol} not supported (invalid ticker format)`);
    }
    return null;
  }

  // Check cache first
  const cached = getCachedAlpacaData(alpacaTicker);
  if (cached) {
    console.log(`Using cached Alpaca data for ${symbol}`);
    return cached;
  }

  try {
    console.log(`🔄 Alpaca fallback: Fetching ${symbol} (${alpacaTicker})...`);

    // Fetch latest trade data
    const tradesUrl = `${ALPACA_BASE_URL}/v2/stocks/${alpacaTicker}/trades/latest`;
    const quotesUrl = `${ALPACA_BASE_URL}/v2/stocks/${alpacaTicker}/quotes/latest`;
    
    const headers = {
      'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
      'APCA-API-SECRET-KEY': ALPACA_API_SECRET_KEY,
      'Accept': 'application/json',
    };

    // Fetch both trades and quotes data
    const [tradesResponse, quotesResponse] = await Promise.allSettled([
      fetch(tradesUrl, { headers }),
      fetch(quotesUrl, { headers })
    ]);

    let currentPrice = 0;
    let timestamp = new Date();

    // Get current price from latest trade
    if (tradesResponse.status === 'fulfilled' && tradesResponse.value.ok) {
      const tradesData = await tradesResponse.value.json();
      if (tradesData.trade) {
        currentPrice = tradesData.trade.p; // price
        timestamp = new Date(tradesData.trade.t); // timestamp
      }
    }

    // If no trade data, try quote data
    if (currentPrice === 0 && quotesResponse.status === 'fulfilled' && quotesResponse.value.ok) {
      const quotesData = await quotesResponse.value.json();
      if (quotesData.quote) {
        // Use mid-point of bid/ask as current price
        const bid = quotesData.quote.bp || 0;
        const ask = quotesData.quote.ap || 0;
        if (bid > 0 && ask > 0) {
          currentPrice = (bid + ask) / 2;
          timestamp = new Date(quotesData.quote.t);
        }
      }
    }

    if (currentPrice === 0) {
      console.warn(`No price data available from Alpaca for ${symbol}`);
      return null;
    }

    // Get previous close from bars endpoint
    const barsUrl = `${ALPACA_BASE_URL}/v2/stocks/${alpacaTicker}/bars?timeframe=1Day&limit=2&asof=${new Date().toISOString().split('T')[0]}`;
    let previousClose = currentPrice; // fallback
    
    try {
      const barsResponse = await fetch(barsUrl, { headers });
      if (barsResponse.ok) {
        const barsData = await barsResponse.json();
        if (barsData.bars && barsData.bars.length > 0) {
          // Get the most recent bar's close price as previous close
          const latestBar = barsData.bars[barsData.bars.length - 1];
          previousClose = latestBar.c; // close price
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch previous close for ${symbol}:`, error);
    }

    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const quoteData: AlpacaQuoteData = {
      symbol: symbol, // Return original symbol
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketPreviousClose: previousClose,
      currency: 'USD', // Alpaca only supports USD
      marketState: 'REGULAR', // Simplified for now
    };

    setCachedAlpacaData(alpacaTicker, quoteData);
    console.log(`✅ Alpaca fallback successful for ${symbol}: $${currentPrice}`);
    
    return quoteData;

  } catch (error) {
    console.error(`Failed to fetch Alpaca quote for ${symbol}:`, error);
    return null;
  }
};

// Fetch multiple quotes from Alpaca (batch processing)
export const fetchMultipleAlpacaQuotes = async (
  holdings: Array<{ticker: string, exchange: string}>
): Promise<Map<string, AlpacaQuoteData>> => {
  const results = new Map<string, AlpacaQuoteData>();
  
  if (!isAlpacaConfigured()) {
    console.warn('Alpaca API not configured - skipping batch fetch');
    return results;
  }

  // Filter to only US stocks that Alpaca supports
  const supportedHoldings = holdings.filter(holding => {
    const alpacaTicker = formatTickerForAlpaca(holding.ticker, holding.exchange);
    return alpacaTicker !== '';
  });

  if (supportedHoldings.length === 0) {
    console.log('No holdings supported by Alpaca API');
    return results;
  }

  // Process in smaller batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < supportedHoldings.length; i += batchSize) {
    const batch = supportedHoldings.slice(i, i + batchSize);
    const promises = batch.map(holding => fetchAlpacaQuote(holding.ticker, holding.exchange));
    
    try {
      const batchResults = await Promise.allSettled(promises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(batch[index].ticker, result.value);
        }
      });
    } catch (error) {
      console.error('Alpaca batch quote fetch failed:', error);
    }
    
    // Longer delay between batches for Alpaca to respect rate limits
    if (i + batchSize < supportedHoldings.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`Alpaca fetched ${results.size} quotes out of ${supportedHoldings.length} supported holdings`);
  return results;
};

// Clear Alpaca cache
export const clearAlpacaCache = (): void => {
  alpacaCache.clear();
};