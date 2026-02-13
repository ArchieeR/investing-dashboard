# Watchlists System - Complete Specification

## Overview
Advanced watchlist management system with themed watchlists, market cap categorization (Large/Mid/Small), and AI-powered watchlist generation with personalized recommendations.

---

## Core Features

### 1. Multiple Watchlists
Users can create and manage multiple watchlists with different themes and purposes.

### 2. Themed Watchlists
Pre-defined and custom themes for organizing stocks:
- **Growth Stocks** - High-growth potential companies
- **Dividend Aristocrats** - Consistent dividend payers
- **Tech Leaders** - Technology sector leaders
- **Value Plays** - Undervalued opportunities
- **ESG Focus** - Environmental, Social, Governance
- **Emerging Markets** - International opportunities
- **Small Cap Gems** - Small-cap growth potential
- **Blue Chips** - Large, stable companies
- **Momentum Plays** - Strong price momentum
- **Custom Themes** - User-defined categories

### 3. Market Cap Categories
Automatic categorization by company size:
- **Large Cap** - Market cap > $10B
- **Mid Cap** - Market cap $2B - $10B
- **Small Cap** - Market cap < $2B

### 4. AI Watchlist Generator
Intelligent recommendations based on:
- Portfolio analysis
- Investment goals
- Risk tolerance
- Sector preferences
- Market trends
- Similar investor patterns

---

## User Interface

### Watchlists Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Watchlists                                    [+ New List]   │
├─────────────────────────────────────────────────────────────┤
│ [My Watchlists] [Themed] [AI Suggestions]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Tech Leaders                          12 stocks      │ │
│ │ Large Cap • Technology                                  │ │
│ │ AAPL, MSFT, GOOGL, NVDA, META...                       │ │
│ │ Avg Return: +15.2% YTD                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💎 Small Cap Gems                        8 stocks       │ │
│ │ Small Cap • Mixed Sectors                               │ │
│ │ CRWD, DDOG, NET, ZS...                                  │ │
│ │ Avg Return: +22.8% YTD                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💰 Dividend Aristocrats                  15 stocks      │ │
│ │ Large Cap • Dividend Focus                              │ │
│ │ JNJ, PG, KO, PEP, MCD...                               │ │
│ │ Avg Yield: 3.2%                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Recommended                        10 stocks      │ │
│ │ Based on your portfolio                                 │ │
│ │ [View Recommendations]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Watchlist Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tech Leaders                                        [⋮]  │
│ Large Cap Technology Stocks                                 │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Performance] [Settings]                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 12 stocks • Market Cap: Large • Theme: Technology          │
│ Total Value: $2.4T • Avg Return: +15.2% YTD               │
│                                                             │
│ [+ Add Stock] [Sort: Performance ▼] [Filter: All ▼]        │
│                                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Ticker │ Company        │ Price  │ Change │ Mkt Cap    ││
│ ├────────┼────────────────┼────────┼────────┼────────────┤│
│ │ AAPL   │ Apple Inc.     │ $178.50│ +2.3%  │ $2.8T 🟢  ││
│ │        │ Large Cap      │        │        │ In Portfolio││
│ ├────────┼────────────────┼────────┼────────┼────────────┤│
│ │ MSFT   │ Microsoft      │ $380.25│ +1.8%  │ $2.8T 🟢  ││
│ │        │ Large Cap      │        │        │ In Portfolio││
│ ├────────┼────────────────┼────────┼────────┼────────────┤│
│ │ GOOGL  │ Alphabet       │ $142.80│ +3.1%  │ $1.8T     ││
│ │        │ Large Cap      │        │        │            ││
│ ├────────┼────────────────┼────────┼────────┼────────────┤│
│ │ NVDA   │ NVIDIA         │ $495.20│ +5.2%  │ $1.2T     ││
│ │        │ Large Cap      │        │        │            ││
│ └────────┴────────────────┴────────┴────────┴────────────┘│
│                                                             │
│ [Add to Portfolio] [Compare] [Export]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Create Watchlist

### Manual Creation

```
┌─────────────────────────────────────────────────────────────┐
│ Create New Watchlist                                   [×]  │
├─────────────────────────────────────────────────────────────┤
│ Watchlist Name:                                             │
│ [Tech Leaders                                          ]    │
│                                                             │
│ Description (optional):                                     │
│ [Large cap technology stocks with strong growth        ]    │
│                                                             │
│ Theme:                                                      │
│ ● Technology                                                │
│ ○ Growth                                                    │
│ ○ Dividend                                                  │
│ ○ Value                                                     │
│ ○ ESG                                                       │
│ ○ Custom                                                    │
│                                                             │
│ Market Cap Focus:                                           │
│ [✓] Large Cap (>$10B)                                       │
│ [ ] Mid Cap ($2B-$10B)                                      │
│ [ ] Small Cap (<$2B)                                        │
│                                                             │
│ Icon:                                                       │
│ [📊] [💎] [💰] [🚀] [🌱] [🏆] [⚡] [🎯]                    │
│                                                             │
│ Privacy:                                                    │
│ ● Private (Only you)                                        │
│ ○ Public (Share with community)                            │
│                                                             │
│ [Create Watchlist] [Cancel]                                │
└─────────────────────────────────────────────────────────────┘
```

### AI-Assisted Creation

```
┌─────────────────────────────────────────────────────────────┐
│ AI Watchlist Generator                                 [×]  │
├─────────────────────────────────────────────────────────────┤
│ Tell us what you're looking for:                            │
│                                                             │
│ Investment Goal:                                            │
│ ● Growth                                                    │
│ ○ Income (Dividends)                                        │
│ ○ Value                                                     │
│ ○ Balanced                                                  │
│                                                             │
│ Market Cap Preference:                                      │
│ [✓] Large Cap    [✓] Mid Cap    [ ] Small Cap              │
│                                                             │
│ Sectors of Interest:                                        │
│ [✓] Technology    [✓] Healthcare    [ ] Finance            │
│ [ ] Energy        [✓] Consumer      [ ] Industrial         │
│                                                             │
│ Risk Tolerance:                                             │
│ Low [────●────────────] High                                │
│                                                             │
│ Time Horizon:                                               │
│ ○ Short-term (<1 year)                                      │
│ ● Medium-term (1-5 years)                                   │
│ ○ Long-term (>5 years)                                      │
│                                                             │
│ Additional Criteria:                                        │
│ [ ] ESG Focused                                             │
│ [ ] High Dividend Yield (>3%)                               │
│ [ ] Strong Momentum (>20% YTD)                              │
│ [ ] Undervalued (P/E < 20)                                  │
│                                                             │
│ [Generate Recommendations] [Cancel]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Recommendations

### Recommendation Results

```
┌─────────────────────────────────────────────────────────────┐
│ AI Watchlist Recommendations                                │
├─────────────────────────────────────────────────────────────┤
│ Based on your criteria, we found 15 stocks:                 │
│                                                             │
│ 🤖 AI Analysis:                                             │
│ Your portfolio is heavily weighted in Technology (45%).     │
│ These recommendations provide diversification while         │
│ maintaining growth focus. Average P/E: 24.5, Expected      │
│ growth: 18-22% annually.                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Recommended Stocks                                      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ ✓ NVDA - NVIDIA Corporation                            │ │
│ │   Large Cap • Technology • $495.20                     │ │
│ │   Match Score: 95% • Strong Buy                        │ │
│ │   Rationale: AI leader, strong growth, fits tech theme│ │
│ │   [Add to Watchlist]                                   │ │
│ │                                                         │ │
│ │ ✓ UNH - UnitedHealth Group                             │ │
│ │   Large Cap • Healthcare • $528.40                     │ │
│ │   Match Score: 88% • Buy                               │ │
│ │   Rationale: Diversification, stable growth, defensive │ │
│ │   [Add to Watchlist]                                   │ │
│ │                                                         │ │
│ │ ✓ COST - Costco Wholesale                              │ │
│ │   Large Cap • Consumer • $612.30                       │ │
│ │   Match Score: 85% • Buy                               │ │
│ │   Rationale: Consistent performer, recession-resistant │ │
│ │   [Add to Watchlist]                                   │ │
│ │                                                         │ │
│ │ ... 12 more recommendations                            │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Select All] [Create Watchlist] [Refine Criteria]          │
└─────────────────────────────────────────────────────────────┘
```

---

## Themed Watchlist Templates

### Pre-Built Themes

#### 1. Growth Stocks
```
Theme: High-growth companies
Market Cap: Large & Mid Cap
Criteria:
- Revenue growth >20% YoY
- Strong earnings momentum
- Innovation leaders
- High P/E acceptable

Example Stocks: NVDA, TSLA, SHOP, SQ, ROKU
```

#### 2. Dividend Aristocrats
```
Theme: Consistent dividend payers
Market Cap: Large Cap
Criteria:
- 25+ years of dividend increases
- Dividend yield >2%
- Stable earnings
- Low volatility

Example Stocks: JNJ, PG, KO, PEP, MCD
```

#### 3. Tech Leaders
```
Theme: Technology sector dominance
Market Cap: Large Cap
Criteria:
- Market leaders in tech
- Strong balance sheets
- Innovation focus
- Global reach

Example Stocks: AAPL, MSFT, GOOGL, META, AMZN
```

#### 4. Value Plays
```
Theme: Undervalued opportunities
Market Cap: All
Criteria:
- P/E < sector average
- P/B < 3
- Strong fundamentals
- Turnaround potential

Example Stocks: BAC, WFC, F, GM, XOM
```

#### 5. ESG Focus
```
Theme: Sustainable investing
Market Cap: All
Criteria:
- High ESG scores
- Environmental leaders
- Social responsibility
- Good governance

Example Stocks: TSLA, NEE, ENPH, SEDG, BEP
```

#### 6. Small Cap Gems
```
Theme: Small-cap growth potential
Market Cap: Small Cap (<$2B)
Criteria:
- High growth potential
- Niche market leaders
- Strong management
- Scalable business model

Example Stocks: CRWD, DDOG, NET, ZS, SNOW
```

#### 7. Momentum Plays
```
Theme: Strong price momentum
Market Cap: All
Criteria:
- 52-week high proximity
- Strong relative strength
- High volume
- Positive catalysts

Example Stocks: NVDA, META, NFLX, AMD, AVGO
```

#### 8. Blue Chips
```
Theme: Stable, reliable companies
Market Cap: Large Cap
Criteria:
- S&P 500 members
- Long operating history
- Market leaders
- Consistent performance

Example Stocks: AAPL, MSFT, JNJ, JPM, V
```

---

## Market Cap Categorization

### Automatic Classification

```typescript
interface MarketCapCategory {
  category: 'large' | 'mid' | 'small' | 'micro';
  threshold: {
    min: number;
    max: number;
  };
  characteristics: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
}

const marketCapCategories = {
  large: {
    category: 'large',
    threshold: { min: 10_000_000_000, max: Infinity },
    characteristics: [
      'Established companies',
      'Lower volatility',
      'Stable earnings',
      'Often dividend payers',
    ],
    riskLevel: 'low',
  },
  mid: {
    category: 'mid',
    threshold: { min: 2_000_000_000, max: 10_000_000_000 },
    characteristics: [
      'Growth potential',
      'Moderate volatility',
      'Expanding market share',
      'Balance of growth and stability',
    ],
    riskLevel: 'medium',
  },
  small: {
    category: 'small',
    threshold: { min: 300_000_000, max: 2_000_000_000 },
    characteristics: [
      'High growth potential',
      'Higher volatility',
      'Niche market leaders',
      'Greater risk/reward',
    ],
    riskLevel: 'high',
  },
  micro: {
    category: 'micro',
    threshold: { min: 0, max: 300_000_000 },
    characteristics: [
      'Very high growth potential',
      'Very high volatility',
      'Speculative',
      'Highest risk/reward',
    ],
    riskLevel: 'very-high',
  },
};
```

### Visual Indicators

```
Large Cap: 🟢 Green badge
Mid Cap:   🟡 Yellow badge
Small Cap: 🟠 Orange badge
Micro Cap: 🔴 Red badge
```

---

## AI Recommendation Engine

### Analysis Factors

#### Portfolio Analysis
- Current holdings
- Sector allocation
- Market cap distribution
- Risk profile
- Performance history

#### User Preferences
- Investment goals
- Risk tolerance
- Time horizon
- Sector interests
- ESG preferences

#### Market Analysis
- Sector trends
- Momentum indicators
- Valuation metrics
- Analyst ratings
- News sentiment

#### Similarity Matching
- Similar investor portfolios
- Successful patterns
- Correlation analysis
- Diversification opportunities

### Recommendation Algorithm

```typescript
interface RecommendationScore {
  ticker: string;
  score: number; // 0-100
  factors: {
    portfolioFit: number;
    valuationScore: number;
    momentumScore: number;
    fundamentalScore: number;
    sentimentScore: number;
  };
  rationale: string[];
  risks: string[];
  action: 'strong-buy' | 'buy' | 'hold' | 'watch';
}

function generateRecommendations(
  portfolio: Portfolio,
  preferences: UserPreferences,
  marketData: MarketData
): RecommendationScore[] {
  // 1. Analyze portfolio gaps
  const gaps = analyzePortfolioGaps(portfolio);
  
  // 2. Screen universe of stocks
  const candidates = screenStocks(preferences, marketData);
  
  // 3. Score each candidate
  const scored = candidates.map(stock => ({
    ticker: stock.ticker,
    score: calculateScore(stock, portfolio, preferences),
    factors: analyzeFactors(stock, portfolio),
    rationale: generateRationale(stock, portfolio, gaps),
    risks: identifyRisks(stock),
    action: determineAction(stock, portfolio),
  }));
  
  // 4. Sort by score and return top recommendations
  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}
```

---

## Data Model

### Watchlist Schema

```typescript
interface Watchlist {
  id: string;
  name: string;
  description?: string;
  icon: string;
  theme: WatchlistTheme;
  marketCapFocus: ('large' | 'mid' | 'small')[];
  
  // Stocks
  stocks: WatchlistStock[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  
  // Performance
  performance: {
    totalValue: number;
    avgReturn: number;
    avgYield?: number;
    bestPerformer: string;
    worstPerformer: string;
  };
  
  // Settings
  settings: {
    autoUpdate: boolean;
    notifications: boolean;
    sortBy: 'performance' | 'alphabetical' | 'marketCap' | 'custom';
  };
}

interface WatchlistStock {
  ticker: string;
  addedAt: Date;
  notes?: string;
  targetPrice?: number;
  alerts?: {
    priceAbove?: number;
    priceBelow?: number;
    volumeSpike?: boolean;
    newsAlert?: boolean;
  };
  
  // Cached data
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  marketCapCategory: 'large' | 'mid' | 'small' | 'micro';
  
  // Portfolio status
  inPortfolio: boolean;
  portfolioWeight?: number;
}

type WatchlistTheme = 
  | 'growth'
  | 'dividend'
  | 'technology'
  | 'value'
  | 'esg'
  | 'emerging'
  | 'small-cap'
  | 'blue-chip'
  | 'momentum'
  | 'custom';
```

---

## Features by Phase

### Phase 1: Basic Watchlists (MVP)
- [ ] Create/edit/delete watchlists
- [ ] Add/remove stocks
- [ ] View stock details
- [ ] Basic sorting and filtering
- [ ] Market cap categorization
- [ ] Simple themes

### Phase 2: Enhanced Watchlists
- [ ] Multiple watchlist views
- [ ] Performance tracking
- [ ] Price alerts
- [ ] Notes and target prices
- [ ] Export functionality
- [ ] Watchlist sharing

### Phase 3: Themed Watchlists
- [ ] Pre-built theme templates
- [ ] Theme-based filtering
- [ ] Automatic stock suggestions per theme
- [ ] Theme performance comparison
- [ ] Custom theme creation

### Phase 4: AI Recommendations (Basic)
- [ ] Portfolio analysis
- [ ] Basic stock screening
- [ ] Simple recommendations
- [ ] Match scoring
- [ ] Rationale generation

### Phase 5: AI Recommendations (Advanced)
- [ ] Machine learning models
- [ ] Sentiment analysis
- [ ] Pattern recognition
- [ ] Personalized learning
- [ ] Community insights
- [ ] Predictive analytics

---

## Technical Requirements

### Data Sources
- **Stock Data:** Yahoo Finance, Alpha Vantage, IEX Cloud
- **Market Cap:** Real-time market data APIs
- **Fundamentals:** Financial Modeling Prep, Alpha Vantage
- **News/Sentiment:** News APIs, social sentiment APIs
- **Analyst Ratings:** Benzinga, TipRanks

### AI/ML Stack
- **Recommendation Engine:** Python + scikit-learn
- **NLP:** spaCy, Hugging Face
- **Sentiment Analysis:** OpenAI, Anthropic
- **Pattern Recognition:** TensorFlow, PyTorch

### Performance
- Cache watchlist data (15-minute refresh)
- Real-time price updates via WebSocket
- Lazy load stock details
- Background AI processing
- Optimized queries

---

## UI Components

1. **WatchlistsOverview** - Grid of all watchlists
2. **WatchlistCard** - Summary card for each watchlist
3. **WatchlistDetail** - Full watchlist view with stocks
4. **CreateWatchlist** - Manual creation form
5. **AIWatchlistGenerator** - AI-assisted creation
6. **RecommendationsList** - AI recommendations display
7. **StockRow** - Individual stock in watchlist
8. **MarketCapBadge** - Visual market cap indicator
9. **ThemeSelector** - Theme selection UI
10. **PerformanceChart** - Watchlist performance visualization

---

## Future Enhancements

- Watchlist comparison tool
- Backtesting watchlist performance
- Social features (follow other users' watchlists)
- Watchlist ETF creator (create virtual ETF from watchlist)
- Automated rebalancing suggestions
- Integration with trading platforms
- Mobile app with push notifications
- Voice commands for adding stocks
- Collaborative watchlists (family/team)
- Watchlist tournaments/competitions

---

**Status:** 📋 Specification Complete - Ready for Implementation
**Priority:** High - Core feature for research and discovery
**Estimated Effort:** 6-10 weeks (full implementation)

**Last Updated:** November 11, 2025
