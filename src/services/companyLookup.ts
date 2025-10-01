// Service to fetch company names from Yahoo Finance
export interface CompanyInfo {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
}

const CACHE_DURATION = 300000; // 5 minutes cache for company names
const companyCache = new Map<string, { data: CompanyInfo; timestamp: number }>();

const getCachedCompany = (symbol: string): CompanyInfo | null => {
  const cached = companyCache.get(symbol.toUpperCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedCompany = (symbol: string, data: CompanyInfo): void => {
  companyCache.set(symbol.toUpperCase(), { data, timestamp: Date.now() });
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
      return cleanTicker.replace(/\.[A-Z]+$/, '');
    
    case 'VI':
      // Vienna Stock Exchange - add .VI suffix
      return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.VI`;
    
    case 'NASDAQ':
    case 'NYSE':
      // US exchanges - no suffix needed
      return cleanTicker.replace(/\.[A-Z]+$/, '');
    
    case 'Other':
    default:
      // Keep as-is for other exchanges
      return cleanTicker;
  }
};

export const fetchCompanyInfo = async (ticker: string, exchange: string = 'NYSE'): Promise<CompanyInfo | null> => {
  if (!ticker.trim()) return null;
  
  const cacheKey = `${ticker.toUpperCase()}_${exchange}`;
  const cached = getCachedCompany(cacheKey);
  if (cached) return cached;

  try {
    const yahooTicker = formatTickerForYahoo(ticker, exchange);
    
    // Use Yahoo Finance quote API to get company name
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`;
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    ];
    
    let data;
    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' },
        });
        
        if (!response.ok) continue;
        
        const proxyData = await response.json();
        data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!data?.chart?.result?.[0]?.meta) {
      throw new Error('No company data found');
    }
    
    const meta = data.chart.result[0].meta;
    const companyInfo: CompanyInfo = {
      symbol: ticker.toUpperCase(),
      name: meta.longName || meta.shortName || ticker.toUpperCase(),
      exchange: exchange,
      currency: meta.currency || 'USD',
    };
    
    setCachedCompany(cacheKey, companyInfo);
    return companyInfo;
    
  } catch (error) {
    console.warn(`Failed to fetch company info for ${ticker}:`, error.message);
    
    // Return basic info with ticker as name if lookup fails
    const fallbackInfo: CompanyInfo = {
      symbol: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      exchange: exchange,
    };
    
    setCachedCompany(cacheKey, fallbackInfo);
    return fallbackInfo;
  }
};