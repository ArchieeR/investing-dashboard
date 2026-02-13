# Next Steps — Portfolio Manager

**Date:** November 8, 2025  
**Current State:** MVP Foundation Complete  
**Goal:** Launch-Ready Platform in 6 Months

---

## Immediate Actions (This Week)

### 1. Strategic Decision Required 🎯

**Question:** What's your launch strategy?

**Option A: Quick Launch (2-3 months)**
- Launch current MVP as "Portfolio Tracker"
- No AI claims, no education promises
- Focus on portfolio management excellence
- Add AI/education in v2.0

**Option B: Vision Launch (6-9 months)**
- Build backend + AI + education first
- Launch as "AI-Powered Investment Workspace"
- Full feature set from day one
- Higher risk, higher reward

**Option C: Hybrid Launch (4-5 months)**
- Backend + AI chatbot + basic research
- Defer education to v1.1
- Launch with core differentiator (AI)
- Faster to market, still differentiated

**Recommendation:** Option C — Get AI chatbot live, defer education

---

### 2. Technical Setup (Days 1-3)

#### Backend Repository
```bash
# Create new backend repo
mkdir portfolio-manager-api
cd portfolio-manager-api
npm init -y

# Install core dependencies
npm install express pg jsonwebtoken bcrypt cors dotenv
npm install --save-dev typescript @types/node @types/express nodemon

# Setup TypeScript
npx tsc --init

# Create folder structure
mkdir -p src/{routes,controllers,models,services,middleware,utils}
mkdir -p src/config
```

#### Database Setup
```bash
# Install PostgreSQL (if not installed)
# macOS: brew install postgresql

# Create database
createdb portfolio_manager

# Create initial schema
psql portfolio_manager < schema.sql
```

#### Environment Configuration
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://localhost:5432/portfolio_manager
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=development

# API Keys
FINNHUB_API_KEY=your-key
ALPHA_VANTAGE_API_KEY=your-key
GOOGLE_AI_API_KEY=your-key
EOF
```

---

### 3. Database Schema (Day 4-5)

Create `schema.sql`:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'actual',
  parent_id UUID REFERENCES portfolios(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Holdings
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  section VARCHAR(100),
  theme VARCHAR(100),
  asset_type VARCHAR(50),
  name VARCHAR(255),
  ticker VARCHAR(50),
  exchange VARCHAR(50),
  account VARCHAR(100),
  price DECIMAL(20, 10),
  qty DECIMAL(20, 10),
  avg_cost DECIMAL(20, 10),
  target_pct DECIMAL(5, 2),
  include BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID REFERENCES holdings(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  price DECIMAL(20, 10),
  qty DECIMAL(20, 10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Instruments (for ETF look-through)
CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50),
  isin VARCHAR(50) UNIQUE,
  ticker VARCHAR(50),
  name VARCHAR(255),
  currency VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Constituents (ETF holdings)
CREATE TABLE constituents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
  child_instrument_id UUID REFERENCES instruments(id),
  weight DECIMAL(10, 6),
  as_of DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prices (cached market data)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
  date_time TIMESTAMP,
  price DECIMAL(20, 10),
  currency VARCHAR(10),
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(instrument_id, date_time)
);

-- Create indexes
CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX idx_trades_holding ON trades(holding_id);
CREATE INDEX idx_constituents_instrument ON constituents(instrument_id);
CREATE INDEX idx_prices_instrument_date ON prices(instrument_id, date_time DESC);
```

---

## Week 1-2: Backend Foundation

### Day 1-2: Authentication
```typescript
// src/routes/auth.ts
import express from 'express';
import { register, login, me } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

export default router;
```

### Day 3-4: Portfolio CRUD
```typescript
// src/routes/portfolios.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
} from '../controllers/portfolios';

const router = express.Router();

router.use(authenticate);

router.get('/', getPortfolios);
router.get('/:id', getPortfolio);
router.post('/', createPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);

export default router;
```

### Day 5-7: Holdings & Trades
```typescript
// src/routes/holdings.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
  recordTrade
} from '../controllers/holdings';

const router = express.Router();

router.use(authenticate);

router.get('/portfolio/:portfolioId', getHoldings);
router.post('/', createHolding);
router.put('/:id', updateHolding);
router.delete('/:id', deleteHolding);
router.post('/:id/trades', recordTrade);

export default router;
```

### Day 8-10: Frontend Migration
```typescript
// Update frontend to use API instead of localStorage

// src/services/api.ts
const API_BASE = 'http://localhost:3001/api';

export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      }),
    
    login: (email: string, password: string) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }),
  },
  
  portfolios: {
    list: (token: string) =>
      fetch(`${API_BASE}/portfolios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
    
    get: (id: string, token: string) =>
      fetch(`${API_BASE}/portfolios/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
    
    create: (data: any, token: string) =>
      fetch(`${API_BASE}/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }),
  },
  
  // ... more endpoints
};
```

---

## Week 3-4: Market Data Integration

### Day 1-3: Finnhub Integration
```typescript
// src/services/finnhub.ts
import axios from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export const finnhub = {
  async getQuote(symbol: string) {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return response.data;
  },
  
  async getProfile(symbol: string) {
    const response = await axios.get(`${BASE_URL}/stock/profile2`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return response.data;
  },
  
  async getEarnings(symbol: string) {
    const response = await axios.get(`${BASE_URL}/calendar/earnings`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return response.data;
  },
  
  async getNews(category: string = 'general') {
    const response = await axios.get(`${BASE_URL}/news`, {
      params: { category, token: FINNHUB_API_KEY }
    });
    return response.data;
  }
};
```

### Day 4-7: Price Update Service
```typescript
// src/services/priceUpdater.ts
import { finnhub } from './finnhub';
import { db } from '../config/database';

export class PriceUpdater {
  private updateInterval: NodeJS.Timeout | null = null;
  
  start(intervalMinutes: number = 10) {
    this.updateInterval = setInterval(
      () => this.updateAllPrices(),
      intervalMinutes * 60 * 1000
    );
    
    // Run immediately on start
    this.updateAllPrices();
  }
  
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
  
  async updateAllPrices() {
    try {
      // Get all unique tickers from holdings
      const tickers = await db.query(`
        SELECT DISTINCT ticker, exchange
        FROM holdings
        WHERE ticker IS NOT NULL
      `);
      
      for (const { ticker, exchange } of tickers.rows) {
        await this.updatePrice(ticker, exchange);
      }
      
      console.log(`Updated prices for ${tickers.rows.length} instruments`);
    } catch (error) {
      console.error('Price update failed:', error);
    }
  }
  
  async updatePrice(ticker: string, exchange: string) {
    try {
      const quote = await finnhub.getQuote(ticker);
      
      await db.query(`
        INSERT INTO prices (instrument_id, date_time, price, currency, source)
        SELECT id, NOW(), $1, 'USD', 'finnhub'
        FROM instruments
        WHERE ticker = $2
        ON CONFLICT (instrument_id, date_time) DO UPDATE
        SET price = $1
      `, [quote.c, ticker]);
      
    } catch (error) {
      console.error(`Failed to update price for ${ticker}:`, error);
    }
  }
}

// Start price updater
export const priceUpdater = new PriceUpdater();
priceUpdater.start(10); // Update every 10 minutes
```

---

## Week 5-8: ETF Look-Through MVP

### Manual ETF Entry Tool
```typescript
// src/routes/admin.ts (admin-only route)
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post('/etf/:ticker/constituents', async (req, res) => {
  const { ticker } = req.params;
  const { constituents, asOf } = req.body;
  
  // Get or create ETF instrument
  const etf = await db.query(`
    INSERT INTO instruments (type, ticker, name)
    VALUES ('ETF', $1, $2)
    ON CONFLICT (ticker) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `, [ticker, req.body.name]);
  
  // Delete old constituents
  await db.query(`
    DELETE FROM constituents
    WHERE instrument_id = $1
  `, [etf.rows[0].id]);
  
  // Insert new constituents
  for (const constituent of constituents) {
    await db.query(`
      INSERT INTO constituents (instrument_id, child_instrument_id, weight, as_of)
      VALUES ($1, $2, $3, $4)
    `, [etf.rows[0].id, constituent.instrumentId, constituent.weight, asOf]);
  }
  
  res.json({ success: true });
});

export default router;
```

### Top 20 ETFs to Enter Manually
```
UK ETFs:
1. VWRL - Vanguard FTSE All-World
2. VUKE - Vanguard FTSE 100
3. VMID - Vanguard FTSE 250
4. VUSA - Vanguard S&P 500
5. EQQQ - Invesco NASDAQ-100
6. IUKD - iShares UK Dividend
7. VHYL - Vanguard FTSE All-World High Dividend
8. AGGG - iShares Core Global Aggregate Bond
9. IGLT - iShares Core UK Gilts
10. VEMT - Vanguard FTSE Emerging Markets

US ETFs:
11. SPY - SPDR S&P 500
12. QQQ - Invesco QQQ
13. VTI - Vanguard Total Stock Market
14. VOO - Vanguard S&P 500
15. SPYG - SPDR S&P 500 Growth
16. VEA - Vanguard FTSE Developed Markets
17. VWO - Vanguard FTSE Emerging Markets
18. AGG - iShares Core US Aggregate Bond
19. BND - Vanguard Total Bond Market
20. GLD - SPDR Gold Shares
```

---

## Week 9-12: AI Chatbot MVP

### Google Gemini Integration
```typescript
// src/services/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class AIAssistant {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  async chat(userId: string, message: string) {
    // Get user's portfolio context
    const context = await this.getPortfolioContext(userId);
    
    // Build prompt with context
    const prompt = this.buildPrompt(message, context);
    
    // Generate response
    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    
    // Store conversation
    await this.storeMessage(userId, message, response);
    
    return response;
  }
  
  private async getPortfolioContext(userId: string) {
    const portfolios = await db.query(`
      SELECT p.*, 
        json_agg(h.*) as holdings
      FROM portfolios p
      LEFT JOIN holdings h ON h.portfolio_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id
    `, [userId]);
    
    return portfolios.rows;
  }
  
  private buildPrompt(message: string, context: any) {
    return `
You are a helpful financial assistant for a portfolio management platform.

IMPORTANT DISCLAIMERS:
- You provide educational information only, not financial advice
- Users should consult qualified financial advisors for personalized advice
- Past performance does not guarantee future results

USER'S PORTFOLIO CONTEXT:
${JSON.stringify(context, null, 2)}

USER'S QUESTION:
${message}

Provide a helpful, accurate response based on the portfolio context.
If you reference specific data, cite where it comes from.
Keep responses concise and actionable.
    `.trim();
  }
  
  private async storeMessage(userId: string, message: string, response: string) {
    await db.query(`
      INSERT INTO chat_messages (user_id, message, response, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [userId, message, response]);
  }
}

export const aiAssistant = new AIAssistant();
```

### Chat UI Component
```typescript
// src/components/AIChat.tsx
import { useState } from 'react';
import { api } from '../services/api';

export const AIChat = () => {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await api.ai.chat(input);
      const aiMessage = { role: 'assistant', content: response.message };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ai-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="message assistant loading">Thinking...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your portfolio..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## Success Criteria

### Week 2 Checkpoint
- ✅ Backend running locally
- ✅ Database schema created
- ✅ User registration/login working
- ✅ Can create portfolio via API

### Week 4 Checkpoint
- ✅ Frontend migrated to API
- ✅ Live prices from Finnhub
- ✅ Price update service running
- ✅ All MVP features working with backend

### Week 8 Checkpoint
- ✅ Top 20 ETFs entered
- ✅ Overlap calculation working
- ✅ Sector/country aggregation
- ✅ Real news feed integrated

### Week 12 Checkpoint
- ✅ AI chatbot responding
- ✅ Portfolio context injection
- ✅ Chat history stored
- ✅ Basic analytics working

---

## Resources Needed

### API Keys (Free Tiers)
- Finnhub: https://finnhub.io (60 calls/minute free)
- Alpha Vantage: https://www.alphavantage.co (5 calls/minute free)
- Google AI: https://ai.google.dev (Free tier available)
- NewsAPI: https://newsapi.org (100 requests/day free)

### Hosting (Initial)
- Backend: Railway.app or Render.com ($5-10/month)
- Database: Supabase or Railway ($0-10/month)
- Frontend: Vercel or Netlify (Free)

### Total Monthly Cost (MVP): ~$15-20

---

## Getting Help

### When Stuck
1. Check documentation for specific APIs
2. Search GitHub issues for similar problems
3. Ask in relevant Discord/Slack communities
4. Use AI assistants (Claude, ChatGPT) for code help

### Communities
- r/reactjs (React questions)
- r/node (Backend questions)
- r/typescript (TypeScript questions)
- r/algotrading (Finance API questions)

---

## Final Checklist

Before starting:
- [ ] Strategic decision made (Option A/B/C)
- [ ] Development environment ready
- [ ] API keys obtained
- [ ] Database installed
- [ ] Time commitment confirmed (20-30 hrs/week)

Week 1 ready:
- [ ] Backend repo created
- [ ] Database schema applied
- [ ] Authentication working
- [ ] First API endpoint tested

---

**You've got this!** The foundation is solid. Now it's time to build the backend and bring the AI vision to life. Start with Week 1 tasks and check back weekly to track progress.

Good luck! 🚀
