# Database Architecture & Data Handling

**Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Design Phase (Not Yet Implemented)

---

## Overview

This document defines the database schema, data flow, and handling patterns for the Portfolio Manager platform. The system uses PostgreSQL for relational data with JSONB for flexible metadata storage.

---

## Core Principles

### 1. Data Integrity
- Foreign key constraints for referential integrity
- NOT NULL constraints on critical fields
- Unique constraints on natural keys (email, ISIN, etc.)
- Check constraints for valid ranges (percentages 0-100)

### 2. Performance
- Indexes on frequently queried columns
- Partial indexes for filtered queries
- JSONB indexes for metadata queries
- Materialized views for complex aggregations

### 3. Auditability
- created_at and updated_at on all tables
- Soft deletes where appropriate
- Change history for critical entities
- User action logging

### 4. Scalability
- Normalized schema to reduce redundancy
- Denormalized views for read performance
- Partitioning strategy for time-series data
- Caching layer for hot data

---

## Schema Design

### Entity Relationship Diagram

```
users (1) ──────< (N) portfolios
                        │
                        ├──< holdings
                        │      │
                        │      └──< trades
                        │
                        └──< portfolio_snapshots

instruments (1) ──< (N) constituents (N) ──> (1) instruments
     │
     └──< prices

users (1) ──< (N) chat_messages
users (1) ──< (N) alerts
users (1) ──< (N) education_progress
```

---

## Table Definitions

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  locale VARCHAR(10) DEFAULT 'en-GB',
  timezone VARCHAR(50) DEFAULT 'Europe/London',
  expertise_level VARCHAR(20) DEFAULT 'beginner',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_preferences ON users USING GIN(preferences);
```

**Preferences JSONB Structure:**
```json
{
  "currency": "GBP",
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": false,
    "digest": "daily"
  },
  "research": {
    "preferredSources": ["FT", "Bloomberg"],
    "excludedSources": []
  }
}
```


#### portfolios
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'actual' CHECK (type IN ('actual', 'draft', 'model')),
  parent_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  lists JSONB DEFAULT '{}',
  budgets JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_portfolios_parent ON portfolios(parent_id);
CREATE INDEX idx_portfolios_type ON portfolios(type);
```

**Settings JSONB:**
```json
{
  "currency": "GBP",
  "lockTotal": false,
  "lockedTotal": 50000,
  "targetPortfolioValue": 100000,
  "enableLivePrices": true,
  "livePriceUpdateInterval": 10,
  "visibleColumns": { "section": true, "theme": true, ... }
}
```

**Lists JSONB:**
```json
{
  "sections": ["Core", "Satellite", "Cash"],
  "themes": ["Global Equity", "UK Equity", "Bonds", "Cash"],
  "accounts": ["ISA", "SIPP", "GIA"],
  "themeSections": {
    "Global Equity": "Core",
    "UK Equity": "Satellite",
    "Bonds": "Core",
    "Cash": "Cash"
  }
}
```

**Budgets JSONB:**
```json
{
  "sections": {
    "Core": { "percent": 60, "amount": 60000 },
    "Satellite": { "percent": 30, "amount": 30000 },
    "Cash": { "percent": 10, "amount": 10000 }
  },
  "themes": {
    "Global Equity": { "percentOfSection": 70, "percent": 42, "amount": 42000 }
  },
  "accounts": {
    "ISA": { "amount": 20000 }
  }
}
```

#### holdings
```sql
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  instrument_id UUID REFERENCES instruments(id),
  section VARCHAR(100) NOT NULL,
  theme VARCHAR(100) NOT NULL,
  account VARCHAR(100) NOT NULL,
  qty DECIMAL(20, 10) NOT NULL DEFAULT 0,
  avg_cost DECIMAL(20, 10),
  target_pct DECIMAL(5, 2) CHECK (target_pct >= 0 AND target_pct <= 100),
  include BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_holdings_instrument ON holdings(instrument_id);
CREATE INDEX idx_holdings_section ON holdings(section);
CREATE INDEX idx_holdings_theme ON holdings(theme);
CREATE INDEX idx_holdings_account ON holdings(account);
```

#### trades
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  date DATE NOT NULL,
  price DECIMAL(20, 10) NOT NULL,
  qty DECIMAL(20, 10) NOT NULL,
  fees DECIMAL(20, 10) DEFAULT 0,
  fx_rate DECIMAL(20, 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trades_holding ON trades(holding_id);
CREATE INDEX idx_trades_date ON trades(date DESC);
CREATE INDEX idx_trades_type ON trades(type);
```

### Market Data Tables

#### instruments
```sql
CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ETF', 'Stock', 'Bond', 'Crypto', 'Fund', 'Cash', 'Other')),
  isin VARCHAR(50) UNIQUE,
  ticker VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  exchange VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'GBP',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instruments_ticker ON instruments(ticker);
CREATE INDEX idx_instruments_isin ON instruments(isin);
CREATE INDEX idx_instruments_type ON instruments(type);
CREATE INDEX idx_instruments_metadata ON instruments USING GIN(metadata);
```

**Metadata JSONB (ETF):**
```json
{
  "domicile": "IE",
  "replicationMethod": "physical",
  "securitiesLending": true,
  "ocf": 0.22,
  "trackingDifference": -0.15,
  "distributionPolicy": "accumulating",
  "lastConstituentsUpdate": "2025-01-01",
  "constituentsRefreshCadence": "weekly"
}
```

#### constituents
```sql
CREATE TABLE constituents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  child_instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  weight DECIMAL(10, 6) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  as_of DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_instrument_id, child_instrument_id, as_of)
);

CREATE INDEX idx_constituents_parent ON constituents(parent_instrument_id, as_of DESC);
CREATE INDEX idx_constituents_child ON constituents(child_instrument_id);
```

#### prices
```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  date_time TIMESTAMP NOT NULL,
  open DECIMAL(20, 10),
  high DECIMAL(20, 10),
  low DECIMAL(20, 10),
  close DECIMAL(20, 10) NOT NULL,
  volume BIGINT,
  currency VARCHAR(10) NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(instrument_id, date_time, source)
);

CREATE INDEX idx_prices_instrument_date ON prices(instrument_id, date_time DESC);
CREATE INDEX idx_prices_source ON prices(source);

-- Partition by month for performance
CREATE TABLE prices_2025_01 PARTITION OF prices
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### fx_rates
```sql
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(20, 10) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, date, source)
);

CREATE INDEX idx_fx_rates_pair_date ON fx_rates(from_currency, to_currency, date DESC);
```

### Events & News Tables

#### events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earnings', 'dividend', 'rns', 'rebalance', 'macro', 'political')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  date_time TIMESTAMP NOT NULL,
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_instrument ON events(instrument_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_date ON events(date_time DESC);
CREATE INDEX idx_events_impact ON events(impact);
```

#### news_items
```sql
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  url TEXT,
  published_at TIMESTAMP NOT NULL,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  category VARCHAR(100),
  tickers TEXT[], -- Array of related tickers
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news_items(published_at DESC);
CREATE INDEX idx_news_tickers ON news_items USING GIN(tickers);
CREATE INDEX idx_news_category ON news_items(category);
```

### AI & Education Tables

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_user_date ON chat_messages(user_id, created_at DESC);
```

#### education_modules
```sql
CREATE TABLE education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modules_order ON education_modules(order_index);
CREATE INDEX idx_modules_difficulty ON education_modules(difficulty);
```

#### education_progress
```sql
CREATE TABLE education_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES education_modules(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_progress_user ON education_progress(user_id);
CREATE INDEX idx_progress_status ON education_progress(status);
```

#### alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('price', 'drift', 'event', 'rebalance', 'exposure')),
  condition JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'dismissed')),
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX idx_alerts_type ON alerts(type);
```

**Condition JSONB Examples:**
```json
// Price alert
{
  "ticker": "AAPL",
  "operator": "above",
  "threshold": 150.00
}

// Drift alert
{
  "theme": "Global Equity",
  "operator": "exceeds",
  "threshold": 5.0,
  "unit": "percentage"
}
```

---

## Derived/Cached Tables

### exposure_snapshots
```sql
CREATE TABLE exposure_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  as_of TIMESTAMP NOT NULL,
  exposures JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(portfolio_id, as_of)
);

CREATE INDEX idx_exposure_portfolio_date ON exposure_snapshots(portfolio_id, as_of DESC);
```

**Exposures JSONB:**
```json
{
  "byRegion": {
    "US": 58.2,
    "UK": 15.4,
    "Europe": 12.3
  },
  "bySector": {
    "Technology": 28.5,
    "Healthcare": 15.2
  },
  "byCountry": {
    "United States": 58.2,
    "United Kingdom": 15.4
  },
  "byCurrency": {
    "USD": 65.0,
    "GBP": 30.0,
    "EUR": 5.0
  }
}
```

### overlap_matrices
```sql
CREATE TABLE overlap_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  as_of TIMESTAMP NOT NULL,
  matrix JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(portfolio_id, as_of)
);
```

**Matrix JSONB:**
```json
{
  "VWRL": {
    "VWRL": 100,
    "EQQQ": 15,
    "VUKE": 25
  },
  "EQQQ": {
    "VWRL": 15,
    "EQQQ": 100,
    "VUKE": 8
  }
}
```

---

## Data Flow Patterns

### 1. User Registration Flow
```
Client → POST /api/auth/register
  ↓
Validate email/password
  ↓
Hash password (bcrypt)
  ↓
INSERT INTO users
  ↓
Generate JWT token
  ↓
Return token + user data
```

### 2. Portfolio Creation Flow
```
Client → POST /api/portfolios
  ↓
Authenticate user (JWT)
  ↓
Validate portfolio data
  ↓
BEGIN TRANSACTION
  ↓
INSERT INTO portfolios
  ↓
Create default lists/budgets
  ↓
COMMIT
  ↓
Return portfolio data
```

### 3. Live Price Update Flow
```
Background Job (every 10 min)
  ↓
SELECT DISTINCT ticker FROM holdings
  ↓
For each ticker:
  ↓
  Fetch from Finnhub API
  ↓
  INSERT INTO prices (ON CONFLICT UPDATE)
  ↓
  Cache in Redis (5 min TTL)
  ↓
Broadcast update via WebSocket
```

### 4. ETF Look-Through Flow
```
Client → GET /api/holdings/:id/exposure
  ↓
Check cache (Redis)
  ↓
If miss:
  ↓
  Get holding instrument
  ↓
  Get constituents (recursive)
  ↓
  Calculate weights
  ↓
  Aggregate by sector/country
  ↓
  Cache result (1 hour TTL)
  ↓
Return exposure data
```

### 5. AI Chat Flow
```
Client → POST /api/ai/chat
  ↓
Authenticate user
  ↓
Get portfolio context:
  - Holdings
  - Recent trades
  - Performance metrics
  ↓
Build prompt with context
  ↓
Call Google Gemini API
  ↓
Parse response
  ↓
INSERT INTO chat_messages
  ↓
Return response
```

---

## Caching Strategy

### Redis Cache Layers

#### Layer 1: Hot Data (TTL: 5 minutes)
- Current prices
- User session data
- Active portfolio summary

#### Layer 2: Warm Data (TTL: 1 hour)
- ETF constituents
- Exposure calculations
- Overlap matrices

#### Layer 3: Cold Data (TTL: 24 hours)
- Historical prices
- News articles
- Education content

### Cache Keys Pattern
```
price:{ticker}:{exchange}
portfolio:{portfolioId}:summary
exposure:{portfolioId}:{date}
overlap:{portfolioId}:{date}
user:{userId}:preferences
```

---

## Data Consistency Rules

### 1. Holdings ↔ Trades
- When trade recorded: Update holding qty and avg_cost
- When holding deleted: Cascade delete trades
- Maintain audit trail in trades table

### 2. Portfolios ↔ Holdings
- When portfolio deleted: Cascade delete holdings
- When draft promoted: Copy holdings to new portfolio
- Preserve parent_id for traceability

### 3. Instruments ↔ Constituents
- When ETF updated: Soft delete old constituents
- Maintain as_of date for historical accuracy
- Validate weight sum = 100%

### 4. Prices ↔ Holdings
- Use latest price for live value
- Fall back to manual price if no live data
- Store original currency + conversion rate

---

## Backup & Recovery

### Automated Backups
```bash
# Daily full backup
pg_dump portfolio_manager > backup_$(date +%Y%m%d).sql

# Hourly incremental (WAL archiving)
archive_command = 'cp %p /backup/wal/%f'
```

### Point-in-Time Recovery
```bash
# Restore to specific timestamp
pg_restore --target-time='2025-01-15 14:30:00'
```

### User Data Export
```sql
-- Export user's complete data (GDPR compliance)
SELECT json_build_object(
  'user', (SELECT row_to_json(u) FROM users u WHERE id = $1),
  'portfolios', (SELECT json_agg(p) FROM portfolios p WHERE user_id = $1),
  'holdings', (SELECT json_agg(h) FROM holdings h 
               JOIN portfolios p ON h.portfolio_id = p.id 
               WHERE p.user_id = $1)
);
```

---

## Performance Optimization

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for slow queries
EXPLAIN ANALYZE
SELECT h.*, i.name, p.close as live_price
FROM holdings h
JOIN instruments i ON h.instrument_id = i.id
LEFT JOIN LATERAL (
  SELECT close FROM prices
  WHERE instrument_id = i.id
  ORDER BY date_time DESC
  LIMIT 1
) p ON true
WHERE h.portfolio_id = $1;

-- Add covering index
CREATE INDEX idx_holdings_portfolio_instrument 
ON holdings(portfolio_id, instrument_id) 
INCLUDE (qty, avg_cost);
```

### Connection Pooling
```typescript
// pg-pool configuration
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Materialized Views
```sql
-- Pre-compute expensive aggregations
CREATE MATERIALIZED VIEW portfolio_summaries AS
SELECT 
  p.id,
  p.user_id,
  COUNT(h.id) as holding_count,
  SUM(h.qty * pr.close) as total_value,
  json_object_agg(h.section, SUM(h.qty * pr.close)) as section_totals
FROM portfolios p
LEFT JOIN holdings h ON h.portfolio_id = p.id
LEFT JOIN LATERAL (
  SELECT close FROM prices
  WHERE instrument_id = h.instrument_id
  ORDER BY date_time DESC
  LIMIT 1
) pr ON true
GROUP BY p.id, p.user_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_summaries;
```

---

## Security Considerations

### Row-Level Security
```sql
-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own portfolios
CREATE POLICY portfolio_isolation ON portfolios
  FOR ALL
  USING (user_id = current_setting('app.user_id')::uuid);
```

### Sensitive Data Encryption
```sql
-- Encrypt sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted data
INSERT INTO users (email, password_hash)
VALUES ($1, crypt($2, gen_salt('bf')));

-- Verify password
SELECT * FROM users
WHERE email = $1
AND password_hash = crypt($2, password_hash);
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
const result = await pool.query(
  'SELECT * FROM holdings WHERE portfolio_id = $1',
  [portfolioId]
);

// NEVER concatenate user input
// BAD: `SELECT * FROM holdings WHERE id = '${id}'`
```

---

## Migration Strategy

### From localStorage to PostgreSQL
```typescript
// Migration script
async function migrateUserData(userId: string, localData: any) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create portfolios
    for (const portfolio of localData.portfolios) {
      const result = await client.query(`
        INSERT INTO portfolios (id, user_id, name, type, settings, lists, budgets)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [portfolio.id, userId, portfolio.name, portfolio.type, 
          portfolio.settings, portfolio.lists, portfolio.budgets]);
      
      // 2. Create holdings
      for (const holding of portfolio.holdings) {
        await client.query(`
          INSERT INTO holdings (id, portfolio_id, section, theme, account, qty, avg_cost, target_pct)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [holding.id, result.rows[0].id, holding.section, holding.theme,
            holding.account, holding.qty, holding.avgCost, holding.targetPct]);
      }
      
      // 3. Create trades
      for (const trade of portfolio.trades) {
        await client.query(`
          INSERT INTO trades (id, holding_id, type, date, price, qty)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [trade.id, trade.holdingId, trade.type, trade.date, trade.price, trade.qty]);
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## Monitoring & Observability

### Key Metrics to Track
- Query response times (p50, p95, p99)
- Connection pool utilization
- Cache hit rates
- Database size growth
- Slow query log
- Failed transactions

### Logging
```typescript
// Structured logging
logger.info('Portfolio created', {
  userId,
  portfolioId,
  duration: Date.now() - startTime,
  holdingCount: holdings.length
});
```

---

**Next:** See `docs/DATA_HANDLING_PATTERNS.md` for implementation patterns and best practices.
