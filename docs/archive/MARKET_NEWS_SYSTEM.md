# Market News System - Technical Specification

## Overview
A comprehensive, AI-powered market news aggregation and filtering system with multi-source support, intelligent categorization, and customizable layouts.

---

## Core Features

### 1. News Source Management

#### Default Sources
- **Reuters** - General market news, breaking news
- **Barron's** - Premium analysis, investment insights (subscription)
- **Wall Street Journal** - Business news, market analysis (subscription)
- **MarketWatch** - Real-time market data and news

#### Additional Sources (Future)
- Bloomberg
- Financial Times
- CNBC
- Seeking Alpha
- Yahoo Finance

---

## News API Integration Strategy

### API Options & Implementation

#### Option 1: News Aggregator APIs (Recommended for MVP)
**NewsAPI.org**
- Free tier: 100 requests/day
- Supports: WSJ, Reuters, MarketWatch
- No authentication required for sources
- Limitation: Barron's not available

**Alpha Vantage News API**
- Free tier available
- Market-focused news
- Ticker-specific news feeds

**Finnhub**
- Free tier: 60 calls/minute
- Company news by ticker
- Market news feed
- Sentiment analysis included

#### Option 2: Direct Source APIs
**Reuters Connect API**
- Enterprise solution
- Requires business account
- Real-time news feeds

**Dow Jones DNA (WSJ/Barron's)**
- Enterprise API
- Expensive but comprehensive
- Includes WSJ and Barron's content

#### Option 3: Web Scraping (Fallback)
- RSS feeds where available
- Requires careful rate limiting
- Legal considerations for paywalled content
- Not recommended for subscription sources

---

### Subscription Source Handling

#### Authentication System
```typescript
interface NewsSourceCredentials {
  sourceId: string;
  sourceName: string;
  requiresAuth: boolean;
  authType: 'api_key' | 'oauth' | 'session' | 'rss';
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
    accessToken?: string;
  };
  isActive: boolean;
  lastVerified?: Date;
}
```

#### Implementation Approaches

**For Barron's/WSJ (Subscription Sources):**

1. **RSS Feed Method** (Easiest)
   - User provides their authenticated RSS feed URL
   - Many premium sources offer personalized RSS feeds
   - No API key needed, just feed URL

2. **API Key Method** (If available)
   - User obtains API key from their account
   - Store encrypted in user settings
   - Validate on setup

3. **Proxy Method** (Advanced)
   - User runs local proxy with their credentials
   - App connects to local proxy
   - Keeps credentials on user's machine

4. **Browser Extension Method** (Future)
   - Extension captures authenticated session
   - Shares session with app
   - Auto-refreshes tokens

---

## AI-Powered News Filtering

### Intelligent Categorization

#### Primary Categories
- **Market News** - Indices, sectors, general market movements
- **Company News** - Earnings, announcements, corporate actions
- **Economic News** - Fed decisions, economic indicators, policy
- **Political News** - Elections, regulations, geopolitical events
- **Sector News** - Industry-specific developments

#### AI Filtering System

```typescript
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publishedAt: Date;
  url: string;
  
  // AI-generated metadata
  categories: NewsCategory[];
  relevanceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedTickers: string[];
  relatedSectors: string[];
  importance: 'high' | 'medium' | 'low';
  
  // User interaction
  isRead: boolean;
  isSaved: boolean;
  userRating?: number;
}

interface NewsFilter {
  categories: NewsCategory[];
  sources: string[];
  minRelevanceScore: number;
  sentiments: string[];
  tickers: string[];
  sectors: string[];
  importance: string[];
  dateRange: { start: Date; end: Date };
  keywords: string[];
  excludeKeywords: string[];
}
```

#### AI Processing Pipeline

1. **Content Analysis**
   - Extract entities (companies, people, locations)
   - Identify mentioned tickers
   - Determine sector relevance

2. **Sentiment Analysis**
   - Overall article sentiment
   - Per-ticker sentiment
   - Market impact prediction

3. **Relevance Scoring**
   - Match against user's portfolio holdings
   - Match against watchlists
   - Match against user preferences
   - Historical engagement patterns

4. **Smart Categorization**
   - Multi-label classification
   - Context-aware tagging
   - Dynamic category suggestions

---

## User Interface Design

### News Page Layout

#### Layout 1: Traditional Feed
```
┌─────────────────────────────────────────┐
│ [Filters] [Sources] [Categories]        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Article Title                       │ │
│ │ Source • Time • Category            │ │
│ │ Summary preview...                  │ │
│ │ [Related: AAPL, MSFT]              │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Article Title                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Layout 2: Card Grid
```
┌───────────────┬───────────────┬───────────────┐
│ Article Card  │ Article Card  │ Article Card  │
│ [Image]       │ [Image]       │ [Image]       │
│ Title         │ Title         │ Title         │
│ Source • Time │ Source • Time │ Source • Time │
└───────────────┴───────────────┴───────────────┘
```

#### Layout 3: Magazine Style
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │     FEATURED ARTICLE (Large)        │ │
│ │     [Hero Image]                    │ │
│ └─────────────────────────────────────┘ │
├──────────────────┬──────────────────────┤
│ Article 2        │ Article 3            │
│ [Thumbnail]      │ [Thumbnail]          │
└──────────────────┴──────────────────────┘
```

#### Layout 4: Compact List
```
• Article Title - Source - 2h ago [AAPL]
• Article Title - Source - 3h ago [Market]
• Article Title - Source - 5h ago [TSLA, Economic]
```

### Multiple News Tabs

#### Tab System
```typescript
interface NewsTab {
  id: string;
  name: string;
  icon?: string;
  filters: NewsFilter;
  layout: 'feed' | 'grid' | 'magazine' | 'compact';
  sortBy: 'time' | 'relevance' | 'importance';
  autoRefresh: boolean;
  refreshInterval?: number;
}

// Example tabs
const defaultTabs: NewsTab[] = [
  {
    name: "My Portfolio",
    filters: { tickers: userPortfolioTickers },
    layout: "feed"
  },
  {
    name: "Market Overview",
    filters: { categories: ["Market", "Economic"] },
    layout: "magazine"
  },
  {
    name: "Breaking News",
    filters: { importance: ["high"], dateRange: last24Hours },
    layout: "feed"
  },
  {
    name: "Watchlist",
    filters: { tickers: userWatchlistTickers },
    layout: "grid"
  }
];
```

---

## Settings & Configuration

### Admin/Settings Page Structure

#### News Sources Section
```
┌─────────────────────────────────────────┐
│ NEWS SOURCES                            │
├─────────────────────────────────────────┤
│ ✓ Reuters              [Active]         │
│   Free • No auth required               │
│                                         │
│ ✓ MarketWatch          [Active]         │
│   Free • No auth required               │
│                                         │
│ ○ Barron's             [Configure]      │
│   Subscription required                 │
│   [+ Add Credentials]                   │
│                                         │
│ ○ Wall Street Journal  [Configure]      │
│   Subscription required                 │
│   [+ Add Credentials]                   │
│                                         │
│ [+ Add Custom Source]                   │
└─────────────────────────────────────────┘
```

#### Add News Account Modal
```
┌─────────────────────────────────────────┐
│ Add News Source                    [×]  │
├─────────────────────────────────────────┤
│ Source: [Barron's ▼]                    │
│                                         │
│ Authentication Method:                  │
│ ○ RSS Feed URL                          │
│ ○ API Key                               │
│ ○ Username/Password (via proxy)         │
│                                         │
│ [Input field based on method]           │
│                                         │
│ [Test Connection]  [Save]  [Cancel]     │
└─────────────────────────────────────────┘
```

#### AI Filter Settings
```
┌─────────────────────────────────────────┐
│ AI FILTERING PREFERENCES                │
├─────────────────────────────────────────┤
│ Relevance Threshold: [●────────] 70%    │
│                                         │
│ Auto-categorize news:  [✓]              │
│ Show sentiment badges: [✓]              │
│ Highlight portfolio news: [✓]           │
│                                         │
│ Priority Categories:                    │
│ [✓] Company News                        │
│ [✓] Economic News                       │
│ [✓] Market News                         │
│ [ ] Political News                      │
│                                         │
│ Smart Notifications:                    │
│ [✓] High importance news                │
│ [✓] Portfolio-related news              │
│ [ ] All breaking news                   │
└─────────────────────────────────────────┘
```

#### Default News Tabs
```
┌─────────────────────────────────────────┐
│ NEWS TABS                               │
├─────────────────────────────────────────┤
│ ☰ My Portfolio        [Edit] [Delete]   │
│ ☰ Market Overview     [Edit] [Delete]   │
│ ☰ Breaking News       [Edit] [Delete]   │
│ ☰ Watchlist           [Edit] [Delete]   │
│                                         │
│ [+ Create New Tab]                      │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Data Flow

```
News Sources → API Aggregator → AI Processor → Cache → UI
                                      ↓
                              User Preferences
                              Portfolio Data
                              Watchlists
```

### Backend Architecture

```typescript
// News Service
class NewsService {
  async fetchNews(sources: string[]): Promise<NewsArticle[]>
  async processWithAI(articles: NewsArticle[]): Promise<NewsArticle[]>
  async filterNews(articles: NewsArticle[], filter: NewsFilter): Promise<NewsArticle[]>
  async getRelevanceScore(article: NewsArticle, user: User): Promise<number>
}

// Source Manager
class NewsSourceManager {
  async addSource(credentials: NewsSourceCredentials): Promise<void>
  async validateSource(sourceId: string): Promise<boolean>
  async removeSource(sourceId: string): Promise<void>
  async refreshSource(sourceId: string): Promise<void>
}

// AI Processor
class NewsAIProcessor {
  async categorize(article: NewsArticle): Promise<NewsCategory[]>
  async analyzeSentiment(article: NewsArticle): Promise<Sentiment>
  async extractEntities(article: NewsArticle): Promise<Entity[]>
  async calculateRelevance(article: NewsArticle, context: UserContext): Promise<number>
}
```

### Caching Strategy

- Cache news articles for 24 hours
- Real-time updates for breaking news
- Incremental updates every 15 minutes
- User-specific relevance scores cached per session

### Security Considerations

- Encrypt stored credentials
- Never log sensitive authentication data
- Use HTTPS for all API calls
- Implement rate limiting
- Validate all user inputs
- Secure credential storage (use system keychain if possible)

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)
- [ ] Integrate NewsAPI.org for free sources
- [ ] Basic news feed layout
- [ ] Simple filtering (source, category, date)
- [ ] Single default tab
- [ ] Manual refresh

### Phase 2: AI Enhancement
- [ ] Implement AI categorization
- [ ] Sentiment analysis
- [ ] Relevance scoring based on portfolio
- [ ] Smart notifications
- [ ] Auto-refresh

### Phase 3: Premium Sources
- [ ] Add subscription source support
- [ ] Credential management UI
- [ ] RSS feed integration
- [ ] API key management
- [ ] Connection testing

### Phase 4: Advanced Features
- [ ] Multiple layout options
- [ ] Custom tabs system
- [ ] Advanced filtering
- [ ] Saved searches
- [ ] News analytics dashboard

### Phase 5: Intelligence
- [ ] Machine learning for personalization
- [ ] Predictive relevance
- [ ] Market impact prediction
- [ ] Automated summaries
- [ ] Cross-article analysis

---

## API Recommendations

### For MVP (Free Tier)
1. **NewsAPI.org** - Primary aggregator
2. **Finnhub** - Market-specific news
3. **Alpha Vantage** - Ticker-specific news

### For Production (Paid)
1. **Benzinga News API** - Real-time financial news
2. **IEX Cloud** - Market data + news
3. **Polygon.io** - Comprehensive market data

### For Premium Sources
1. **Dow Jones DNA** - WSJ/Barron's (expensive)
2. **Reuters Connect** - Professional grade
3. **Bloomberg Terminal API** - Enterprise only

---

## Cost Estimates

### Free Tier (MVP)
- NewsAPI.org: $0 (100 req/day)
- Finnhub: $0 (60 req/min)
- Alpha Vantage: $0 (5 req/min)
- **Total: $0/month**

### Starter Tier
- NewsAPI.org Business: $449/month
- Finnhub Pro: $59/month
- **Total: ~$500/month**

### Professional Tier
- Benzinga Pro: $1,000+/month
- IEX Cloud: $500+/month
- **Total: ~$1,500+/month**

### Enterprise Tier
- Dow Jones DNA: $10,000+/month
- Reuters Connect: $15,000+/month
- **Total: $25,000+/month**

---

## User Experience Flow

### First-Time Setup
1. User navigates to News page
2. Default sources (free) are pre-configured
3. Prompt to add premium sources (optional)
4. AI learns from user interactions
5. Personalized feed improves over time

### Adding Premium Source
1. Click "Add News Source" in settings
2. Select source (Barron's, WSJ, etc.)
3. Choose authentication method
4. Enter credentials/RSS URL
5. Test connection
6. Save and activate

### Daily Usage
1. Open News tab
2. See personalized feed with portfolio-relevant news
3. Switch between custom tabs
4. Filter by category/source
5. Save important articles
6. Get notifications for breaking news

---

## Future Enhancements

- Voice-to-text news summaries
- News-to-trade automation
- Social sentiment integration
- Analyst rating changes
- Insider trading news
- SEC filing alerts
- Earnings call transcripts
- Video news integration
- Podcast integration
- Newsletter aggregation

---

## Notes for Development

- Start with free APIs for MVP
- Build modular source adapters
- Design for easy source addition
- Prioritize user privacy
- Make AI filtering optional
- Allow full manual control
- Cache aggressively
- Handle API failures gracefully
- Provide offline mode
- Export/share functionality
