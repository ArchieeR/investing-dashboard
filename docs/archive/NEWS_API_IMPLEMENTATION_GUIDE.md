# News API Implementation Guide

## Quick Start: Free Tier Setup

### Recommended Free APIs for MVP

#### 1. NewsAPI.org (Primary)
**Best for:** General news aggregation

```typescript
// Setup
const NEWS_API_KEY = 'your_key_here'; // Get from newsapi.org
const NEWS_API_URL = 'https://newsapi.org/v2';

// Fetch news
async function fetchNewsAPI(sources: string[] = ['reuters', 'the-wall-street-journal']) {
  const response = await fetch(
    `${NEWS_API_URL}/everything?` +
    `sources=${sources.join(',')}&` +
    `apiKey=${NEWS_API_KEY}&` +
    `language=en&` +
    `sortBy=publishedAt`
  );
  return response.json();
}
```

**Pros:**
- Easy to use
- 100 requests/day free
- Supports Reuters, WSJ, MarketWatch
- Good documentation

**Cons:**
- Limited free tier
- 24-hour delay on free tier
- No Barron's

**Cost:** Free (100 req/day) or $449/month (unlimited)

---

#### 2. Finnhub (Market-Focused)
**Best for:** Company-specific news and market data

```typescript
// Setup
const FINNHUB_API_KEY = 'your_key_here'; // Get from finnhub.io
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// Fetch market news
async function fetchFinnhubMarketNews() {
  const response = await fetch(
    `${FINNHUB_URL}/news?category=general&token=${FINNHUB_API_KEY}`
  );
  return response.json();
}

// Fetch company news
async function fetchFinnhubCompanyNews(ticker: string) {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = new Date().toISOString().split('T')[0];
  
  const response = await fetch(
    `${FINNHUB_URL}/company-news?` +
    `symbol=${ticker}&` +
    `from=${from}&` +
    `to=${to}&` +
    `token=${FINNHUB_API_KEY}`
  );
  return response.json();
}
```

**Pros:**
- 60 calls/minute free
- Real-time data
- Includes sentiment
- Company-specific news

**Cons:**
- Limited sources
- Requires ticker symbols

**Cost:** Free (60 req/min) or $59/month (Pro)

---

#### 3. Alpha Vantage (Ticker News)
**Best for:** Stock-specific news feed

```typescript
// Setup
const ALPHA_VANTAGE_KEY = 'your_key_here'; // Get from alphavantage.co
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

// Fetch news by ticker
async function fetchAlphaVantageNews(tickers: string[]) {
  const response = await fetch(
    `${ALPHA_VANTAGE_URL}?` +
    `function=NEWS_SENTIMENT&` +
    `tickers=${tickers.join(',')}&` +
    `apikey=${ALPHA_VANTAGE_KEY}`
  );
  return response.json();
}

// Fetch general market news
async function fetchAlphaVantageMarketNews() {
  const response = await fetch(
    `${ALPHA_VANTAGE_URL}?` +
    `function=NEWS_SENTIMENT&` +
    `topics=financial_markets&` +
    `apikey=${ALPHA_VANTAGE_KEY}`
  );
  return response.json();
}
```

**Pros:**
- Free tier available
- Sentiment scores included
- Topic-based filtering
- Relevance scores

**Cons:**
- 5 requests/minute limit
- 500 requests/day limit

**Cost:** Free (limited) or $49.99/month (Premium)

---

## Handling Subscription Sources (Barron's, WSJ)

### Option 1: RSS Feeds (Easiest)

Many premium sources offer authenticated RSS feeds to subscribers.

```typescript
interface RSSFeedConfig {
  url: string; // User's authenticated RSS feed URL
  source: string;
  updateInterval: number;
}

async function fetchRSSFeed(config: RSSFeedConfig) {
  const response = await fetch(config.url);
  const xml = await response.text();
  
  // Parse RSS XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const items = Array.from(doc.querySelectorAll('item')).map(item => ({
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    description: item.querySelector('description')?.textContent,
    pubDate: new Date(item.querySelector('pubDate')?.textContent || ''),
    source: config.source
  }));
  
  return items;
}

// User provides their RSS feed URL from Barron's account
const barronsConfig: RSSFeedConfig = {
  url: 'https://feeds.barrons.com/user/[user-specific-token]',
  source: 'Barrons',
  updateInterval: 900000 // 15 minutes
};
```

**How users get RSS URLs:**
1. Log into Barron's/WSJ account
2. Navigate to RSS feed settings
3. Copy personalized RSS feed URL
4. Paste into app settings

---

### Option 2: Dow Jones DNA API (Professional)

For production apps with budget:

```typescript
// Dow Jones DNA API (WSJ + Barron's)
const DJ_API_KEY = 'your_enterprise_key';
const DJ_API_URL = 'https://api.dowjones.com/content';

async function fetchDowJonesNews(params: {
  sources?: string[]; // ['WSJ', 'Barron']
  query?: string;
  from?: Date;
  to?: Date;
}) {
  const response = await fetch(
    `${DJ_API_URL}/search?` +
    `apikey=${DJ_API_KEY}&` +
    `sources=${params.sources?.join(',')}&` +
    `query=${params.query || ''}&` +
    `from=${params.from?.toISOString()}&` +
    `to=${params.to?.toISOString()}`
  );
  return response.json();
}
```

**Cost:** $10,000+/month (Enterprise only)

---

### Option 3: Web Scraping (Not Recommended)

Only as last resort, with proper rate limiting and respect for ToS:

```typescript
// NOT RECOMMENDED - Use only if no other option
// Requires user to be logged in via browser extension

async function scrapeWithUserSession(url: string, sessionCookie: string) {
  // This would require a browser extension to capture session
  // and proxy requests through user's authenticated session
  
  // DO NOT implement without legal review
  // Violates most ToS
}
```

---

## Complete News Service Implementation

```typescript
// types.ts
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: Date;
  imageUrl?: string;
  author?: string;
  
  // AI-enhanced fields
  categories?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  relevanceScore?: number;
  relatedTickers?: string[];
  relatedSectors?: string[];
  importance?: 'high' | 'medium' | 'low';
}

export interface NewsSource {
  id: string;
  name: string;
  type: 'free' | 'subscription' | 'rss';
  isActive: boolean;
  config: NewsSourceConfig;
}

export interface NewsSourceConfig {
  apiKey?: string;
  rssUrl?: string;
  updateInterval: number;
  categories?: string[];
}

// news-service.ts
export class NewsService {
  private sources: Map<string, NewsSource> = new Map();
  private cache: Map<string, NewsArticle[]> = new Map();
  
  async addSource(source: NewsSource): Promise<void> {
    // Validate source
    const isValid = await this.validateSource(source);
    if (!isValid) {
      throw new Error(`Invalid source configuration: ${source.name}`);
    }
    
    this.sources.set(source.id, source);
    await this.saveSourcesToStorage();
  }
  
  async fetchAllNews(): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];
    
    for (const [id, source] of this.sources) {
      if (!source.isActive) continue;
      
      try {
        const articles = await this.fetchFromSource(source);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
      }
    }
    
    // Deduplicate
    const unique = this.deduplicateArticles(allArticles);
    
    // Sort by date
    unique.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    
    return unique;
  }
  
  private async fetchFromSource(source: NewsSource): Promise<NewsArticle[]> {
    switch (source.id) {
      case 'newsapi':
        return this.fetchNewsAPI(source.config);
      case 'finnhub':
        return this.fetchFinnhub(source.config);
      case 'alphavantage':
        return this.fetchAlphaVantage(source.config);
      case 'rss':
        return this.fetchRSS(source.config);
      default:
        throw new Error(`Unknown source: ${source.id}`);
    }
  }
  
  private async fetchNewsAPI(config: NewsSourceConfig): Promise<NewsArticle[]> {
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `sources=reuters,the-wall-street-journal,marketwatch&` +
      `apiKey=${config.apiKey}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=100`
    );
    
    const data = await response.json();
    
    return data.articles.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.title,
      summary: article.description,
      content: article.content,
      url: article.url,
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.urlToImage,
      author: article.author
    }));
  }
  
  private async fetchFinnhub(config: NewsSourceConfig): Promise<NewsArticle[]> {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?` +
      `category=general&` +
      `token=${config.apiKey}`
    );
    
    const data = await response.json();
    
    return data.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.headline,
      summary: article.summary,
      url: article.url,
      source: article.source,
      publishedAt: new Date(article.datetime * 1000),
      imageUrl: article.image,
      relatedTickers: article.related ? [article.related] : []
    }));
  }
  
  private async fetchAlphaVantage(config: NewsSourceConfig): Promise<NewsArticle[]> {
    const response = await fetch(
      `https://www.alphavantage.co/query?` +
      `function=NEWS_SENTIMENT&` +
      `topics=financial_markets&` +
      `apikey=${config.apiKey}`
    );
    
    const data = await response.json();
    
    return data.feed?.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.title,
      summary: article.summary,
      url: article.url,
      source: article.source,
      publishedAt: new Date(article.time_published),
      imageUrl: article.banner_image,
      sentiment: this.mapSentiment(article.overall_sentiment_score),
      sentimentScore: article.overall_sentiment_score,
      relatedTickers: article.ticker_sentiment?.map((t: any) => t.ticker) || []
    })) || [];
  }
  
  private async fetchRSS(config: NewsSourceConfig): Promise<NewsArticle[]> {
    if (!config.rssUrl) {
      throw new Error('RSS URL not configured');
    }
    
    const response = await fetch(config.rssUrl);
    const xml = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    return Array.from(doc.querySelectorAll('item')).map(item => ({
      id: this.generateId(item.querySelector('link')?.textContent || ''),
      title: item.querySelector('title')?.textContent || '',
      summary: item.querySelector('description')?.textContent || '',
      url: item.querySelector('link')?.textContent || '',
      source: 'RSS Feed',
      publishedAt: new Date(item.querySelector('pubDate')?.textContent || '')
    }));
  }
  
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.url || article.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  private generateId(url: string): string {
    return btoa(url).substring(0, 16);
  }
  
  private mapSentiment(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.15) return 'positive';
    if (score < -0.15) return 'negative';
    return 'neutral';
  }
  
  private async validateSource(source: NewsSource): Promise<boolean> {
    try {
      const articles = await this.fetchFromSource(source);
      return articles.length > 0;
    } catch {
      return false;
    }
  }
  
  private async saveSourcesToStorage(): Promise<void> {
    const sourcesArray = Array.from(this.sources.values());
    localStorage.setItem('newsSources', JSON.stringify(sourcesArray));
  }
}
```

---

## AI Enhancement Layer

```typescript
// ai-news-processor.ts
export class AINewsProcessor {
  async enhanceArticles(
    articles: NewsArticle[],
    userContext: {
      portfolio: string[];
      watchlist: string[];
      preferences: any;
    }
  ): Promise<NewsArticle[]> {
    return Promise.all(
      articles.map(article => this.enhanceArticle(article, userContext))
    );
  }
  
  private async enhanceArticle(
    article: NewsArticle,
    userContext: any
  ): Promise<NewsArticle> {
    // Categorize
    const categories = await this.categorize(article);
    
    // Calculate relevance
    const relevanceScore = this.calculateRelevance(article, userContext);
    
    // Determine importance
    const importance = this.determineImportance(article, relevanceScore);
    
    // Extract tickers if not present
    if (!article.relatedTickers?.length) {
      article.relatedTickers = this.extractTickers(article);
    }
    
    return {
      ...article,
      categories,
      relevanceScore,
      importance
    };
  }
  
  private async categorize(article: NewsArticle): Promise<string[]> {
    const categories: string[] = [];
    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    // Simple keyword-based categorization
    // In production, use ML model
    if (text.match(/earnings|revenue|profit|loss|quarter/)) {
      categories.push('Company News');
    }
    if (text.match(/fed|interest rate|inflation|gdp|unemployment/)) {
      categories.push('Economic News');
    }
    if (text.match(/market|index|dow|s&p|nasdaq/)) {
      categories.push('Market News');
    }
    if (text.match(/election|congress|regulation|policy/)) {
      categories.push('Political News');
    }
    
    return categories.length ? categories : ['General'];
  }
  
  private calculateRelevance(article: NewsArticle, userContext: any): number {
    let score = 0;
    
    // Check portfolio holdings
    const portfolioMatch = article.relatedTickers?.some(ticker =>
      userContext.portfolio.includes(ticker)
    );
    if (portfolioMatch) score += 50;
    
    // Check watchlist
    const watchlistMatch = article.relatedTickers?.some(ticker =>
      userContext.watchlist.includes(ticker)
    );
    if (watchlistMatch) score += 30;
    
    // Check categories
    const categoryMatch = article.categories?.some(cat =>
      userContext.preferences.categories?.includes(cat)
    );
    if (categoryMatch) score += 20;
    
    // Recency bonus
    const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) score += 10;
    else if (hoursOld < 6) score += 5;
    
    return Math.min(score, 100);
  }
  
  private determineImportance(
    article: NewsArticle,
    relevanceScore: number
  ): 'high' | 'medium' | 'low' {
    if (relevanceScore > 70) return 'high';
    if (relevanceScore > 40) return 'medium';
    return 'low';
  }
  
  private extractTickers(article: NewsArticle): string[] {
    const text = `${article.title} ${article.summary}`;
    const tickerPattern = /\b[A-Z]{1,5}\b/g;
    const matches = text.match(tickerPattern) || [];
    
    // Filter out common words
    const commonWords = ['CEO', 'CFO', 'USA', 'NYSE', 'NASDAQ', 'SEC', 'IPO'];
    return matches.filter(match => !commonWords.includes(match));
  }
}
```

---

## Usage Example

```typescript
// Initialize services
const newsService = new NewsService();
const aiProcessor = new AINewsProcessor();

// Add free sources
await newsService.addSource({
  id: 'newsapi',
  name: 'NewsAPI',
  type: 'free',
  isActive: true,
  config: {
    apiKey: 'your_newsapi_key',
    updateInterval: 900000 // 15 minutes
  }
});

await newsService.addSource({
  id: 'finnhub',
  name: 'Finnhub',
  type: 'free',
  isActive: true,
  config: {
    apiKey: 'your_finnhub_key',
    updateInterval: 900000
  }
});

// Add RSS source (Barron's)
await newsService.addSource({
  id: 'barrons-rss',
  name: "Barron's",
  type: 'rss',
  isActive: true,
  config: {
    rssUrl: 'https://feeds.barrons.com/user/[user-token]',
    updateInterval: 900000
  }
});

// Fetch and enhance news
const articles = await newsService.fetchAllNews();
const enhanced = await aiProcessor.enhanceArticles(articles, {
  portfolio: ['AAPL', 'MSFT', 'GOOGL'],
  watchlist: ['TSLA', 'NVDA'],
  preferences: {
    categories: ['Company News', 'Market News']
  }
});

// Filter by relevance
const relevant = enhanced.filter(article => article.relevanceScore! > 50);

console.log(`Found ${relevant.length} relevant articles`);
```

---

## Next Steps

1. **Get API Keys:**
   - NewsAPI.org: https://newsapi.org/register
   - Finnhub: https://finnhub.io/register
   - Alpha Vantage: https://www.alphavantage.co/support/#api-key

2. **Test Integration:**
   - Start with one API
   - Verify data format
   - Test rate limits

3. **Build UI:**
   - News feed component
   - Source management
   - Filter controls

4. **Add AI Layer:**
   - Implement categorization
   - Add relevance scoring
   - Test with real portfolio data

5. **Handle Subscriptions:**
   - Add RSS feed support
   - Build credential management
   - Test with user accounts
