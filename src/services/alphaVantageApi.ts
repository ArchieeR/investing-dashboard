// Alpha Vantage API fallback for when Yahoo Finance fails
// Free tier: 25 calls/day, 5 calls/minute
// Better international stock support including LSE

export interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

const ALPHA_VANTAGE_API_KEY = 'MA6P3RBKOKWFWDUD';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Convert ticker to Alpha Vantage format
const formatTickerForAlphaVantage = (ticker: string, exchange: string): string => {
  const cleanTicker = ticker.toUpperCase().trim();
  
  switch (exchange) {
    case 'LSE':
      // London Stock Exchange - keep .L suffix for Alpha Vantage
      return cleanTicker.includes('.L') ? cleanTicker : `${cleanTicker}.L`;
      
    case 'NASDAQ':
    case 'NYSE':
      // US exchanges - no suffix needed
      return cleanTicker.replace(/\.[A-Z]+$/, '');
    default:
      return cleanTicker;
  }
};

export const fetchAlphaVantageQuote = async (symbol: string, exchange: string = 'NYSE'): Promise<{
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  marketState: string;
} | null> => {
  try {
    const alphaSymbol = formatTickerForAlphaVantage(symbol, exchange);
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(alphaSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    console.log(`🔄 Trying Alpha Vantage for ${symbol} (${alphaSymbol})...`);
    console.log(`📡 Alpha Vantage URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for Alpha Vantage errors
    if (data.Error || data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data.Error || data['Error Message']}`);
    }
    
    if (data.Note) {
      throw new Error(`Alpha Vantage rate limit: ${data.Note}`);
    }
    
    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('No Global Quote data from Alpha Vantage');
    }
    
    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    
    if (!price || price === 0) {
      throw new Error('No price data from Alpha Vantage');
    }
    
    // Determine currency based on exchange
    let currency = 'USD';
    if (exchange === 'LSE') {
      // UK stocks are typically in pence (GBp)
      currency = 'GBp';
    }
    
    console.log(`✅ Alpha Vantage data for ${symbol}: ${currency} ${price}`);
    
    return {
      symbol: symbol,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketPreviousClose: previousClose,
      currency: currency,
      marketState: 'REGULAR',
    };
    
  } catch (error) {
    console.warn(`⚠️ Alpha Vantage failed for ${symbol}:`, error.message);
    return null;
  }
};