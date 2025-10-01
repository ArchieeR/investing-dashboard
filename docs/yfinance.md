# Using Yahoo Finance with the Portfolio Manager Tool

## Overview

Yahoo Finance provides a rich source of financial data, including stock prices, historical data, dividends, and more. Although Yahoo Finance does not offer an official public API, there are popular unofficial libraries that allow easy access to this data:

- **Python:** [`yfinance`](https://github.com/ranaroussi/yfinance) — a widely-used library that fetches data from Yahoo Finance.
- **Node/TypeScript:** [`yahoo-finance2`](https://github.com/gadicc/node-yahoo-finance2) — a modern, promise-based client for Yahoo Finance data.

These libraries enable you to integrate Yahoo Finance data into your personal portfolio manager tool with minimal setup.

---

## Pros and Cons

### Pros
- Free and no API key required.
- Access to a wide range of data: current prices, historical prices, dividends, splits, etc.
- Easy to use and integrate.
- Large community and good documentation.

### Cons
- Unofficial APIs: subject to potential breaking changes by Yahoo.
- Rate limits are not officially documented and may apply.
- Data accuracy and completeness depend on Yahoo Finance.
- Limited support for some international exchanges or ticker symbols.

---

## Setup Instructions

### Python (`yfinance`)

1. Install the package via pip:

   ```bash
   pip install yfinance
   ```

2. Import and use in your Python script.

### Node/TypeScript (`yahoo-finance2`)

1. Install via npm or yarn:

   ```bash
   npm install yahoo-finance2
   # or
   yarn add yahoo-finance2
   ```

2. Import and use in your Node/TypeScript project.

---

## Example Usage

### Python Example

```python
import yfinance as yf

# Fetch latest price
ticker = yf.Ticker("AAPL")
latest_price = ticker.history(period="1d")['Close'][0]
print(f"Latest price: {latest_price}")

# Fetch historical data for 1, 2, and 5 days
hist_1d = ticker.history(period="1d")
hist_2d = ticker.history(period="2d")
hist_5d = ticker.history(period="5d")

print("1-day history:")
print(hist_1d)

print("2-day history:")
print(hist_2d)

print("5-day history:")
print(hist_5d)

# Compute percentage change over the last 5 days
close_prices = hist_5d['Close']
pct_change = ((close_prices[-1] - close_prices[0]) / close_prices[0]) * 100
print(f"5-day % change: {pct_change:.2f}%")
```

### Node/TypeScript Example

```typescript
import yahooFinance from 'yahoo-finance2';

async function fetchData() {
  // Fetch latest price
  const quote = await yahooFinance.quote('AAPL');
  console.log(`Latest price: ${quote.regularMarketPrice}`);

  // Fetch historical data for 1, 2, and 5 days
  const hist1d = await yahooFinance.historical('AAPL', { period1: '1d' });
  const hist2d = await yahooFinance.historical('AAPL', { period1: '2d' });
  const hist5d = await yahooFinance.historical('AAPL', { period1: '5d' });

  console.log('1-day history:', hist1d);
  console.log('2-day history:', hist2d);
  console.log('5-day history:', hist5d);

  // Compute percentage change over the last 5 days
  if (hist5d.length >= 2) {
    const start = hist5d[0].close;
    const end = hist5d[hist5d.length - 1].close;
    const pctChange = ((end - start) / start) * 100;
    console.log(`5-day % change: ${pctChange.toFixed(2)}%`);
  }
}

fetchData();
```

---

## Notes on Ticker Suffixes

Yahoo Finance uses suffixes to denote different exchanges. For example:

- `.L` — London Stock Exchange (e.g., `VOD.L`)
- `.TO` — Toronto Stock Exchange
- `.HK` — Hong Kong Stock Exchange
- `.NS` — National Stock Exchange of India

Make sure to include the appropriate suffix when querying non-US stocks to get accurate data.

---

## Usage Recommendation

For a personal portfolio manager tool, these unofficial Yahoo Finance APIs offer a convenient and cost-effective way to retrieve financial data. Use them to:

- Fetch real-time and historical prices.
- Calculate portfolio performance metrics.
- Track dividends and splits.
- Integrate with other data sources as needed.

Be mindful of potential API changes and consider caching data to reduce repeated requests. For professional or commercial applications, evaluate official data providers for guaranteed stability and support.
