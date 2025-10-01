export interface ExchangeRates {
  USD: number;
  GBP: number;
  GBX: number; // Pence (1/100 of GBP)
  EUR: number;
  [key: string]: number;
}

export interface CurrencyConversionResult {
  originalValue: number;
  originalCurrency: string;
  convertedValue: number;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated: Date;
}

// Mock exchange rates - in production, you'd fetch from a real API like exchangerate-api.io
const mockExchangeRates: ExchangeRates = {
  USD: 1.27, // 1 GBP = 1.27 USD
  GBP: 1.0,  // Base currency
  GBX: 0.01, // 1 GBX = 0.01 GBP (100 pence = 1 pound)
  EUR: 1.17, // 1 GBP = 1.17 EUR
};

const CACHE_DURATION = 300000; // 5 minutes cache for exchange rates
let cachedRates: { rates: ExchangeRates; timestamp: number } | null = null;

export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  // Check cache first
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates;
  }

  try {
    // In production, you would fetch from a real API:
    // const response = await fetch('https://api.exchangerate-api.io/v4/latest/GBP');
    // const data = await response.json();
    // const rates = data.rates;

    // For now, use mock rates with small random fluctuations
    const rates: ExchangeRates = {
      USD: mockExchangeRates.USD + (Math.random() - 0.5) * 0.02, // ±1% fluctuation
      GBP: 1.0,
      GBX: 0.01, // This is fixed (100 pence = 1 pound)
      EUR: mockExchangeRates.EUR + (Math.random() - 0.5) * 0.02,
    };

    // Cache the rates
    cachedRates = { rates, timestamp: Date.now() };
    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Fallback to cached rates or defaults
    return cachedRates?.rates || mockExchangeRates;
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'GBP'
): Promise<CurrencyConversionResult> => {
  if (fromCurrency === toCurrency) {
    return {
      originalValue: amount,
      originalCurrency: fromCurrency,
      convertedValue: amount,
      targetCurrency: toCurrency,
      exchangeRate: 1.0,
      lastUpdated: new Date(),
    };
  }

  const rates = await fetchExchangeRates();
  
  let convertedValue: number;
  let exchangeRate: number;

  // Special handling for GBX/GBp (pence) - convert to GBP first
  if (fromCurrency === 'GBX' || fromCurrency === 'GBp') {
    if (toCurrency === 'GBP') {
      // GBX to GBP: divide by 100
      exchangeRate = 0.01;
      convertedValue = amount * 0.01;
      console.log(`💱 Converting ${amount} GBX to ${convertedValue} GBP`);
    } else {
      // GBX to other currency: convert to GBP first, then to target
      const gbpAmount = amount * 0.01;
      const gbpToTargetRate = rates[toCurrency] || 1.0;
      exchangeRate = 0.01 * gbpToTargetRate;
      convertedValue = gbpAmount * gbpToTargetRate;
      console.log(`💱 Converting ${amount} GBX to ${convertedValue} ${toCurrency} via GBP`);
    }
  } else if (toCurrency === 'GBX') {
    if (fromCurrency === 'GBP') {
      // GBP to GBX: multiply by 100
      exchangeRate = 100;
      convertedValue = amount * 100;
    } else {
      // Other currency to GBX: convert to GBP first, then to pence
      const toGbpRate = 1 / (rates[fromCurrency] || 1.0);
      const gbpAmount = amount * toGbpRate;
      exchangeRate = toGbpRate * 100;
      convertedValue = gbpAmount * 100;
    }
  } else if (fromCurrency === 'GBP') {
    // Converting from GBP to another currency
    exchangeRate = rates[toCurrency] || 1.0;
    convertedValue = amount * exchangeRate;
  } else if (toCurrency === 'GBP') {
    // Converting to GBP from another currency
    exchangeRate = 1 / (rates[fromCurrency] || 1.0);
    convertedValue = amount * exchangeRate;
  } else {
    // Converting between two non-GBP currencies (via GBP)
    const toGbpRate = 1 / (rates[fromCurrency] || 1.0);
    const fromGbpRate = rates[toCurrency] || 1.0;
    exchangeRate = toGbpRate * fromGbpRate;
    convertedValue = amount * exchangeRate;
  }

  return {
    originalValue: amount,
    originalCurrency: fromCurrency,
    convertedValue: Math.round(convertedValue * 10000) / 10000, // Round to 4 decimal places
    targetCurrency: toCurrency,
    exchangeRate,
    lastUpdated: new Date(),
  };
};

export const detectCurrency = (symbol: string, price: number, quoteCurrency?: string): string => {
  const upperSymbol = symbol.toUpperCase();
  
  // Force GBp for UK stocks ending in .L, regardless of what Yahoo Finance says
  if (upperSymbol.endsWith('.L')) {
    console.log(`🇬🇧 Forcing GBp currency for UK stock ${symbol} (Yahoo said: ${quoteCurrency})`);
    return 'GBp'; // Most UK stocks are quoted in pence
  }
  
  // Use the currency from Yahoo Finance quote if available and not UK stock
  if (quoteCurrency && !upperSymbol.endsWith('.L')) {
    return quoteCurrency;
  }
  
  // US stocks are typically in USD
  if (!upperSymbol.includes('.') || upperSymbol.includes('NASDAQ:') || upperSymbol.includes('NYSE:')) {
    return 'USD';
  }
  
  // European stocks
  if (upperSymbol.endsWith('.PA') || upperSymbol.endsWith('.DE') || upperSymbol.endsWith('.MI') || upperSymbol.endsWith('.AS') || upperSymbol.endsWith('.VI')) {
    return 'EUR';
  }
  
  // Default to USD for unknown symbols
  return 'USD';
};

export const formatCurrencyWithSymbol = (amount: number, currency: string): string => {
  switch (currency) {
    case 'GBP':
      return `£${amount.toFixed(2)}`;
    case 'GBX':
      return `${amount.toFixed(0)}p`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    default:
      return `${amount.toFixed(2)} ${currency}`;
  }
};

export const clearCurrencyCache = (): void => {
  cachedRates = null;
};