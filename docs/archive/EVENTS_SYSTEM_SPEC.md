# Events System - Complete Specification

## Overview
Comprehensive events tracking system with calendar and list views, intelligent filtering, and portfolio-aware event cards. Includes advanced Earnings X-Ray feature for AI-powered earnings analysis.

---

## Core Features

### 1. Event Types

#### Economic Events
- GDP releases
- Inflation data (CPI, PPI)
- Employment reports
- Central bank decisions (Fed, ECB, BoE, etc.)
- Interest rate announcements
- Economic indicators

#### Political Events
- Elections
- Policy announcements
- Regulatory changes
- Trade agreements
- Geopolitical developments
- Government budget releases

#### Company Events
- **Earnings Reports** (Quarterly/Annual)
- **General RNS** (Regulatory News Service)
  - Dividend announcements
  - Stock splits
  - Mergers & acquisitions
  - Management changes
  - Product launches
  - Guidance updates
  - Share buybacks

---

## View Modes

### Calendar View

```
┌─────────────────────────────────────────────────────────────┐
│ November 2025                    [Month ▼] [Year ▼]         │
├─────────────────────────────────────────────────────────────┤
│ Mon    Tue    Wed    Thu    Fri    Sat    Sun              │
├─────────────────────────────────────────────────────────────┤
│        1      2      3      4      5      6                 │
│                     [AAPL]  [MSFT]                          │
│                     Earn.   Earn.                           │
│                                                             │
│ 7      8      9      10     11     12     13                │
│ [Fed]  [TSLA]              [GDP]                           │
│ Rate   Earn.               Data                            │
│                                                             │
│ 14     15     16     17     18     19     20                │
│        [AMZN]        [ECB]                                 │
│        Earn.         Rate                                  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Month/Year navigation
- Color-coded event types
- Multiple events per day
- Click to view details
- Hover for quick preview
- Portfolio holdings highlighted

### List View

```
┌─────────────────────────────────────────────────────────────┐
│ [Calendar View] [List View]  [Filters ▼] [Columns ▼]       │
├─────────────────────────────────────────────────────────────┤
│ Date       │ Event          │ Type     │ Impact │ Portfolio │
├────────────┼────────────────┼──────────┼────────┼───────────┤
│ Nov 3, 2PM │ Apple Earnings │ Earnings │ High   │ 15.2%    │
│            │ Q4 2024        │          │        │ [AAPL]   │
├────────────┼────────────────┼──────────┼────────┼───────────┤
│ Nov 4, 2PM │ Microsoft      │ Earnings │ High   │ 12.8%    │
│            │ Earnings Q4    │          │        │ [MSFT]   │
├────────────┼────────────────┼──────────┼────────┼───────────┤
│ Nov 7, 2PM │ Fed Rate       │ Economic │ High   │ All      │
│            │ Decision       │          │        │          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Sortable columns
- Filterable by type
- Search functionality
- Bulk actions
- Export to CSV
- Custom column selection

---

## Event Card Details

### Standard Event Card
```
┌─────────────────────────────────────────────────────────────┐
│ Apple Inc. (AAPL) - Q4 2024 Earnings                       │
│ 📊 Earnings Report                                          │
├─────────────────────────────────────────────────────────────┤
│ Date: November 3, 2025 @ 2:00 PM PST                       │
│ Status: Upcoming                                            │
│                                                             │
│ Portfolio Impact:                                           │
│ • Your Position: 150 shares ($22,500)                      │
│ • Portfolio Weight: 15.2%                                   │
│ • ETF Membership: VOO (0.8%), QQQ (12.1%), VGT (21.3%)    │
│                                                             │
│ Analyst Expectations:                                       │
│ • EPS: $1.52 (consensus)                                   │
│ • Revenue: $89.5B                                          │
│ • Guidance: $95-98B (Q1 2025)                              │
│                                                             │
│ [Set Alert] [Add to Calendar] [View Analysis]              │
└─────────────────────────────────────────────────────────────┘
```

### Enhanced Event Card (Portfolio Holdings)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Microsoft Corporation (MSFT) - Q4 2024 Earnings         │
│ You hold this stock                                         │
├─────────────────────────────────────────────────────────────┤
│ Date: November 4, 2025 @ 2:00 PM PST                       │
│                                                             │
│ Your Holdings:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Direct: 200 shares @ $380 = $76,000 (12.8%)           │ │
│ │ Via VOO: ~2.4 shares (0.3% of ETF)                    │ │
│ │ Via QQQ: ~15.2 shares (9.8% of ETF)                   │ │
│ │ Total Exposure: $82,450 (13.9% of portfolio)          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ETF Membership:                                             │
│ • S&P 500 (VOO): 2.8% weight                               │
│ • NASDAQ-100 (QQQ): 9.8% weight                            │
│ • Technology (VGT): 18.5% weight                           │
│                                                             │
│ [Earnings X-Ray] [Set Expectations] [View History]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Column Editor

### Available Columns

**Default Columns:**
- Date & Time
- Event Name
- Type (Earnings, Economic, Political, RNS)
- Impact Level (High, Medium, Low)
- Portfolio Relevance

**Additional Columns:**
- Ticker Symbol
- Company Name
- Sector
- Market Cap
- Your Position (shares/value)
- Portfolio Weight (%)
- ETF Membership
- ETF Weight (%)
- Total Exposure (%)
- Analyst Consensus
- Historical Beat/Miss Rate
- Price Movement (Last 4 earnings)
- Volatility Expected
- Options Activity
- Institutional Ownership
- Insider Trading Activity

### Column Customization UI
```
┌─────────────────────────────────────────────────────────────┐
│ Customize Columns                                      [×]  │
├─────────────────────────────────────────────────────────────┤
│ Visible Columns:                    Available Columns:      │
│ ┌─────────────────────────────┐    ┌──────────────────────┐│
│ │ ☰ Date & Time               │    │ □ Market Cap         ││
│ │ ☰ Event Name                │    │ □ Sector             ││
│ │ ☰ Type                      │    │ □ Analyst Consensus  ││
│ │ ☰ Portfolio Weight          │    │ □ Historical Beat    ││
│ │ ☰ ETF Membership            │    │ □ Price Movement     ││
│ │ ☰ Total Exposure            │    │ □ Volatility         ││
│ └─────────────────────────────┘    │ □ Options Activity   ││
│                                     │ □ Insider Trading    ││
│ Drag to reorder                     └──────────────────────┘│
│                                                             │
│ [Reset to Default]  [Save]  [Cancel]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Filtering System

### Filter Options

```
┌─────────────────────────────────────────────────────────────┐
│ Filters                                                [×]  │
├─────────────────────────────────────────────────────────────┤
│ Event Type:                                                 │
│ [✓] Earnings                                                │
│ [✓] Economic                                                │
│ [✓] Political                                               │
│ [✓] General RNS                                             │
│                                                             │
│ Impact Level:                                               │
│ [✓] High    [✓] Medium    [ ] Low                          │
│                                                             │
│ Portfolio Relevance:                                        │
│ ● All Events                                                │
│ ○ My Holdings Only                                          │
│ ○ My Watchlist                                              │
│ ○ High Exposure (>5%)                                       │
│                                                             │
│ Date Range:                                                 │
│ From: [Nov 1, 2025]  To: [Nov 30, 2025]                   │
│                                                             │
│ Sectors:                                                    │
│ [✓] Technology    [ ] Healthcare    [ ] Finance            │
│ [✓] Energy        [ ] Consumer      [ ] Industrial         │
│                                                             │
│ [Clear All]  [Apply Filters]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Earnings X-Ray Feature

### Overview
AI-powered earnings analysis tool similar to LSEG Workspace's Earn function. Provides real-time analysis, expectation tracking, and automated buy/sell recommendations.

### Main Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Earnings X-Ray: Apple Inc. (AAPL)                          │
│ Q4 2024 Earnings - November 3, 2025 @ 2:00 PM PST         │
├─────────────────────────────────────────────────────────────┤
│ [Live Analysis] [Expectations] [History] [Recommendations]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 LIVE - Earnings Call in Progress                    │ │
│ │ Started: 2:03 PM PST                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Key Metrics:                                                │
│ ┌──────────────┬──────────┬──────────┬──────────┬─────────┐│
│ │ Metric       │ Expected │ Actual   │ Variance │ Status  ││
│ ├──────────────┼──────────┼──────────┼──────────┼─────────┤│
│ │ EPS          │ $1.52    │ $1.64    │ +7.9%    │ ✓ BEAT  ││
│ │ Revenue      │ $89.5B   │ $91.2B   │ +1.9%    │ ✓ BEAT  ││
│ │ iPhone Rev   │ $43.2B   │ $42.8B   │ -0.9%    │ ✗ MISS  ││
│ │ Services Rev │ $22.1B   │ $23.5B   │ +6.3%    │ ✓ BEAT  ││
│ │ Gross Margin │ 45.2%    │ 46.1%    │ +0.9pp   │ ✓ BEAT  ││
│ └──────────────┴──────────┴──────────┴──────────┴─────────┘│
│                                                             │
│ AI Analysis:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 Strong quarter with beats on EPS and revenue.       │ │
│ │ Services growth accelerating (+12% YoY). iPhone sales  │ │
│ │ slightly soft but offset by strong Mac and iPad.       │ │
│ │ Management tone: Optimistic on Q1 guidance.            │ │
│ │ Market reaction: +3.2% after-hours (positive).         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recommendation:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 HOLD / SLIGHT BUY                                   │ │
│ │                                                         │ │
│ │ Rationale:                                              │ │
│ │ • Strong beat on key metrics                           │ │
│ │ • Services momentum continues                          │ │
│ │ • Positive guidance for Q1                             │ │
│ │ • Your position: 15.2% (within target range)          │ │
│ │                                                         │ │
│ │ Suggested Action: Hold current position                │ │
│ │ Consider adding: If dips below $175                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Execute Trade] [Set Alert] [View Full Report]             │
└─────────────────────────────────────────────────────────────┘
```

### Set Expectations

```
┌─────────────────────────────────────────────────────────────┐
│ Set Earnings Expectations: AAPL Q4 2024                    │
├─────────────────────────────────────────────────────────────┤
│ Key Metrics:                                                │
│                                                             │
│ EPS (Earnings Per Share):                                   │
│ Expected: [$1.52] (Consensus: $1.52)                       │
│ Beat if above: [$1.55] (+2%)                               │
│ Miss if below: [$1.48] (-3%)                               │
│                                                             │
│ Revenue:                                                    │
│ Expected: [$89.5B] (Consensus: $89.5B)                     │
│ Beat if above: [$90.5B] (+1%)                              │
│ Miss if below: [$88.0B] (-2%)                              │
│                                                             │
│ iPhone Revenue:                                             │
│ Expected: [$43.2B] (Consensus: $43.2B)                     │
│ Critical: [✓] Flag if misses                               │
│                                                             │
│ Services Revenue:                                           │
│ Expected: [$22.1B] (Consensus: $22.1B)                     │
│ Critical: [✓] Flag if misses                               │
│                                                             │
│ Gross Margin:                                               │
│ Expected: [45.2%] (Consensus: 45.2%)                       │
│ Beat if above: [45.5%]                                     │
│                                                             │
│ Q1 2025 Guidance:                                           │
│ Revenue: [$95-98B] (Consensus: $96.5B)                     │
│ Critical: [✓] Flag if below $94B                           │
│                                                             │
│ Custom Rules:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [+] Add Rule                                            │ │
│ │                                                         │ │
│ │ Rule 1: If Services growth < 10% YoY → Flag as concern │ │
│ │ Rule 2: If China revenue < $15B → Flag as concern      │ │
│ │ Rule 3: If margin < 45% → Consider reducing position   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Save Expectations] [Cancel]                                │
└─────────────────────────────────────────────────────────────┘
```

### AI Analysis Features

#### Real-Time Monitoring
- Live earnings call transcription
- Sentiment analysis of management tone
- Key phrase detection
- Competitor mentions
- Forward guidance extraction

#### Automated Flagging
- Beat/Miss on key metrics
- Guidance above/below expectations
- Margin compression/expansion
- Revenue mix changes
- Management tone shifts

#### Market Reaction Analysis
- After-hours price movement
- Volume analysis
- Options flow
- Analyst upgrades/downgrades
- Social sentiment

#### Portfolio-Aware Recommendations
- Position size consideration
- Sector exposure
- Correlation with other holdings
- Risk tolerance alignment
- Tax implications

---

## Data Model

### Event Schema
```typescript
interface Event {
  id: string;
  type: 'earnings' | 'economic' | 'political' | 'rns';
  subType?: 'dividend' | 'split' | 'merger' | 'guidance' | 'product';
  
  // Basic Info
  title: string;
  description: string;
  date: Date;
  time?: string;
  timezone: string;
  
  // Company Info (if applicable)
  ticker?: string;
  companyName?: string;
  sector?: string;
  marketCap?: number;
  
  // Impact
  impactLevel: 'high' | 'medium' | 'low';
  affectedMarkets: string[];
  affectedSectors: string[];
  
  // Portfolio Relevance
  portfolioRelevance: {
    hasDirectHolding: boolean;
    directPosition?: {
      shares: number;
      value: number;
      portfolioWeight: number;
    };
    etfExposure?: Array<{
      etfTicker: string;
      etfName: string;
      weightInETF: number;
      sharesViaETF: number;
      valueViaETF: number;
    }>;
    totalExposure: {
      shares: number;
      value: number;
      portfolioWeight: number;
    };
  };
  
  // Earnings Specific
  earningsData?: {
    quarter: string;
    fiscalYear: number;
    consensus: {
      eps: number;
      revenue: number;
      guidance?: {
        epsLow: number;
        epsHigh: number;
        revenueLow: number;
        revenueHigh: number;
      };
    };
    actual?: {
      eps: number;
      revenue: number;
      beat: boolean;
      surprise: number;
    };
    customExpectations?: {
      metrics: Array<{
        name: string;
        expected: number;
        critical: boolean;
        beatThreshold?: number;
        missThreshold?: number;
      }>;
      rules: Array<{
        condition: string;
        action: string;
      }>;
    };
  };
  
  // Analysis
  aiAnalysis?: {
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPoints: string[];
    concerns: string[];
    opportunities: string[];
    recommendation: {
      action: 'buy' | 'sell' | 'hold' | 'reduce' | 'add';
      confidence: number;
      rationale: string[];
    };
  };
  
  // User Actions
  alerts: boolean;
  notes?: string;
  watched: boolean;
}
```

---

## Implementation Phases

### Phase 1: Basic Events (MVP)
- [ ] Calendar view with month navigation
- [ ] List view with sortable columns
- [ ] Basic event types (Earnings, Economic, Political)
- [ ] Simple filtering (type, date range)
- [ ] Event cards with basic info
- [ ] Portfolio holdings detection

### Phase 2: Enhanced Events
- [ ] ETF membership calculation
- [ ] Total exposure tracking
- [ ] Custom column editor
- [ ] Advanced filtering
- [ ] Event alerts/notifications
- [ ] Export functionality

### Phase 3: Earnings X-Ray (Basic)
- [ ] Earnings event details
- [ ] Analyst consensus data
- [ ] Historical beat/miss tracking
- [ ] Basic expectations setting
- [ ] Manual analysis notes

### Phase 4: Earnings X-Ray (AI)
- [ ] Live earnings call monitoring
- [ ] AI sentiment analysis
- [ ] Automated beat/miss flagging
- [ ] Custom rules engine
- [ ] Market reaction analysis
- [ ] Portfolio-aware recommendations

### Phase 5: Advanced Features
- [ ] Real-time transcription
- [ ] Competitor analysis
- [ ] Automated trading suggestions
- [ ] Historical pattern recognition
- [ ] Predictive analytics
- [ ] Integration with trading platforms

---

## Technical Requirements

### Data Sources

#### Events Data
- **Earnings Calendar:** Alpha Vantage, Finnhub, IEX Cloud
- **Economic Calendar:** Trading Economics API, Forex Factory
- **Political Events:** News APIs, manual curation
- **RNS Data:** Company filings, SEC EDGAR, LSE RNS

#### Real-Time Data
- **Earnings Calls:** Seeking Alpha, Yahoo Finance
- **Transcription:** AssemblyAI, Rev.ai
- **Market Data:** Real-time price feeds
- **Options Flow:** CBOE, market data providers

#### AI/ML
- **Sentiment Analysis:** OpenAI, Anthropic, Google AI
- **NLP:** spaCy, Hugging Face models
- **Pattern Recognition:** Custom ML models
- **Recommendation Engine:** Rule-based + ML hybrid

### Performance Considerations
- Cache event data (24-hour refresh)
- Real-time updates via WebSocket
- Lazy load historical data
- Optimize ETF membership calculations
- Background processing for AI analysis

---

## UI Components Needed

1. **EventsCalendar** - Month/week/day views
2. **EventsList** - Sortable, filterable table
3. **EventCard** - Detailed event information
4. **EventFilters** - Advanced filtering UI
5. **ColumnEditor** - Drag-drop column customization
6. **EarningsXRay** - Main analysis interface
7. **ExpectationsEditor** - Set custom expectations
8. **LiveAnalysis** - Real-time earnings monitoring
9. **RecommendationCard** - AI-powered suggestions
10. **PortfolioImpact** - Exposure visualization

---

## Future Enhancements

- Calendar sync (Google, Outlook, Apple)
- Mobile app with push notifications
- Voice alerts for critical events
- Social sentiment integration
- Peer comparison analysis
- Historical earnings replay
- Backtesting recommendations
- Community insights
- Analyst call recordings
- Automated report generation

---

**Status:** 📋 Specification Complete - Ready for Implementation
**Priority:** High - Core feature for portfolio management
**Estimated Effort:** 8-12 weeks (full implementation)

**Last Updated:** November 11, 2025
