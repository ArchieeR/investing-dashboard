# Folder Structure & Organization

**Version:** 1.0  
**Last Updated:** November 8, 2025

---

## Overview

This document defines the folder structure for both frontend and backend codebases, explaining the purpose of each directory and file organization patterns.

---

## Current Frontend Structure

```
portfolio-manager/
├── src/
│   ├── components/          # React components
│   │   ├── portfolio/       # Portfolio-specific components
│   │   ├── research/        # Research hub components
│   │   ├── analytics/       # Analytics & charts
│   │   ├── education/       # Education components
│   │   ├── ai/              # AI chat components
│   │   ├── common/          # Shared/reusable components
│   │   └── layout/          # Layout components (Nav, Header, etc.)
│   │
│   ├── pages/               # Page-level components
│   │   ├── DashboardPage.tsx
│   │   ├── AnalysisPage.tsx
│   │   ├── ResearchPage.tsx
│   │   ├── ETFExplorer.tsx
│   │   ├── NewsPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── EducationPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── state/               # State management
│   │   ├── portfolioStore.tsx
│   │   ├── types.ts
│   │   ├── selectors.ts
│   │   ├── storage.ts
│   │   └── actions.ts
│   │
│   ├── services/            # External service integrations
│   │   ├── api.ts           # Backend API client
│   │   ├── yahooFinance.ts
│   │   ├── finnhub.ts
│   │   ├── googleAI.ts
│   │   └── auth.ts
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePortfolio.ts
│   │   ├── useLivePrices.ts
│   │   ├── useBackup.ts
│   │   └── useAIChat.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── calculations.ts
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── csv.ts
│   │   └── date.ts
│   │
│   ├── data/                # Static/mock data
│   │   ├── etfHoldings.json
│   │   ├── mockNews.json
│   │   └── samplePortfolio.json
│   │
│   ├── styles/              # Global styles
│   │   ├── variables.css
│   │   ├── themes.css
│   │   └── components.css
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── market.ts
│   │   └── education.ts
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── styles.css           # Global styles
│
├── public/                  # Static assets
│   ├── icons/
│   ├── images/
│   └── favicon.ico
│
├── docs/                    # Documentation
│   ├── DATABASE_ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DEV_RULES.md
│   └── IMPLEMENTATION_PLAN.md
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Proposed Backend Structure

```
portfolio-manager-api/
├── src/
│   ├── routes/              # API route definitions
│   │   ├── auth.ts          # /api/auth/*
│   │   ├── portfolios.ts    # /api/portfolios/*
│   │   ├── holdings.ts      # /api/holdings/*
│   │   ├── trades.ts        # /api/trades/*
│   │   ├── instruments.ts   # /api/instruments/*
│   │   ├── prices.ts        # /api/prices/*
│   │   ├── research.ts      # /api/research/*
│   │   ├── ai.ts            # /api/ai/*
│   │   ├── education.ts     # /api/education/*
│   │   └── alerts.ts        # /api/alerts/*
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── portfolios.controller.ts
│   │   ├── holdings.controller.ts
│   │   ├── ai.controller.ts
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── portfolio.service.ts
│   │   ├── market-data.service.ts
│   │   ├── etf-lookup.service.ts
│   │   ├── ai.service.ts
│   │   ├── analytics.service.ts
│   │   └── notification.service.ts
│   │
│   ├── models/              # Database models
│   │   ├── User.ts
│   │   ├── Portfolio.ts
│   │   ├── Holding.ts
│   │   ├── Trade.ts
│   │   ├── Instrument.ts
│   │   └── ...
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validation.ts    # Request validation
│   │   ├── error.ts         # Error handling
│   │   ├── rate-limit.ts    # Rate limiting
│   │   └── logging.ts       # Request logging
│   │
│   ├── utils/               # Utility functions
│   │   ├── calculations.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── crypto.ts
│   │
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── api-keys.ts
│   │   └── constants.ts
│   │
│   ├── jobs/                # Background jobs
│   │   ├── price-updater.ts
│   │   ├── etf-refresher.ts
│   │   ├── news-fetcher.ts
│   │   └── alert-checker.ts
│   │
│   ├── integrations/        # External API integrations
│   │   ├── finnhub/
│   │   │   ├── client.ts
│   │   │   ├── quotes.ts
│   │   │   └── news.ts
│   │   ├── google-ai/
│   │   │   ├── client.ts
│   │   │   └── chat.ts
│   │   └── alpha-vantage/
│   │       └── client.ts
│   │
│   ├── types/               # TypeScript types
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── market.ts
│   │
│   ├── validators/          # Input validation schemas
│   │   ├── auth.validator.ts
│   │   ├── portfolio.validator.ts
│   │   └── holding.validator.ts
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── database/                # Database files
│   ├── migrations/          # Schema migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_instruments.sql
│   │   └── ...
│   ├── seeds/               # Seed data
│   │   ├── users.sql
│   │   └── etfs.sql
│   └── schema.sql           # Complete schema
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                 # Utility scripts
│   ├── migrate.ts
│   ├── seed.ts
│   └── backup.sh
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Component Organization Patterns

### 1. Feature-Based Components

Group related components by feature:

```
src/components/portfolio/
├── PortfolioList.tsx
├── PortfolioCard.tsx
├── PortfolioForm.tsx
├── PortfolioSwitcher.tsx
├── HoldingsGrid.tsx
├── HoldingForm.tsx
├── HoldingRow.tsx
└── index.ts              # Barrel export
```

### 2. Common/Shared Components

Reusable components used across features:

```
src/components/common/
├── Button.tsx
├── Input.tsx
├── Select.tsx
├── Modal.tsx
├── Card.tsx
├── Table.tsx
├── Chart.tsx
└── index.ts
```

### 3. Layout Components

Page structure and navigation:

```
src/components/layout/
├── Navigation.tsx
├── Header.tsx
├── Sidebar.tsx
├── Footer.tsx
└── PageLayout.tsx
```

---

## Service Layer Organization

### API Service Pattern

```typescript
// src/services/api.ts
export const api = {
  auth: {
    register: (data) => post('/auth/register', data),
    login: (data) => post('/auth/login', data),
    logout: () => post('/auth/logout'),
  },
  
  portfolios: {
    list: () => get('/portfolios'),
    get: (id) => get(`/portfolios/${id}`),
    create: (data) => post('/portfolios', data),
    update: (id, data) => put(`/portfolios/${id}`, data),
    delete: (id) => del(`/portfolios/${id}`),
  },
  
  holdings: {
    list: (portfolioId) => get(`/portfolios/${portfolioId}/holdings`),
    create: (data) => post('/holdings', data),
    update: (id, data) => put(`/holdings/${id}`, data),
    delete: (id) => del(`/holdings/${id}`),
  },
  
  // ... more endpoints
};
```

### External Service Pattern

```typescript
// src/services/finnhub.ts
export class FinnhubService {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  
  async getQuote(symbol: string) { ... }
  async getProfile(symbol: string) { ... }
  async getNews(category: string) { ... }
}

export const finnhub = new FinnhubService();
```

---

## State Management Organization

### Store Structure

```typescript
// src/state/portfolioStore.tsx
export const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const PortfolioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);
  
  // Selectors
  const activePortfolio = useMemo(() => 
    getActivePortfolio(state), [state]);
  
  const totalValue = useMemo(() => 
    selectTotalValue(activePortfolio), [activePortfolio]);
  
  // Actions
  const addHolding = useCallback((holding) => 
    dispatch({ type: 'add-holding', holding }), []);
  
  return (
    <PortfolioContext.Provider value={{ state, dispatch, ... }}>
      {children}
    </PortfolioContext.Provider>
  );
};
```

### Selectors Pattern

```typescript
// src/state/selectors.ts
export const selectTotalValue = (portfolio: Portfolio): number => {
  return portfolio.holdings
    .filter(h => h.include)
    .reduce((sum, h) => sum + (h.livePrice || h.price) * h.qty, 0);
};

export const selectBreakdownBySection = (portfolio: Portfolio): BreakdownEntry[] => {
  // ... calculation logic
};
```

---

## File Naming Conventions

### Components
- PascalCase: `PortfolioCard.tsx`
- Suffix with component type: `HoldingForm.tsx`, `PriceChart.tsx`

### Hooks
- camelCase with `use` prefix: `usePortfolio.ts`, `useLivePrices.ts`

### Services
- camelCase with service suffix: `api.ts`, `finnhub.service.ts`

### Utils
- camelCase: `calculations.ts`, `formatting.ts`

### Types
- PascalCase for interfaces: `Portfolio`, `Holding`
- camelCase for type files: `types.ts`, `api.types.ts`

### Constants
- UPPER_SNAKE_CASE: `API_BASE_URL`, `MAX_RETRIES`

---

## Import Organization

### Order of Imports

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal modules (absolute imports)
import { api } from '@/services/api';
import { usePortfolio } from '@/hooks/usePortfolio';

// 3. Types
import type { Portfolio, Holding } from '@/types';

// 4. Relative imports
import { PortfolioCard } from './PortfolioCard';
import { calculateTotal } from '../utils/calculations';

// 5. Styles
import styles from './Portfolio.module.css';
```

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

---

## Backend Route Organization

### RESTful Route Structure

```
/api/auth
  POST   /register
  POST   /login
  POST   /logout
  GET    /me

/api/portfolios
  GET    /                    # List all
  POST   /                    # Create
  GET    /:id                 # Get one
  PUT    /:id                 # Update
  DELETE /:id                 # Delete
  POST   /:id/draft           # Create draft
  POST   /:id/promote         # Promote draft

/api/portfolios/:portfolioId/holdings
  GET    /                    # List holdings
  POST   /                    # Create holding
  GET    /:id                 # Get holding
  PUT    /:id                 # Update holding
  DELETE /:id                 # Delete holding
  POST   /:id/trades          # Record trade

/api/instruments
  GET    /                    # Search instruments
  GET    /:id                 # Get instrument
  GET    /:id/constituents    # Get ETF holdings
  GET    /:id/prices          # Get price history

/api/research
  GET    /news                # Get news
  GET    /events              # Get events
  GET    /etfs                # Search ETFs
  GET    /etfs/:id/compare    # Compare ETFs

/api/ai
  POST   /chat                # Send message
  GET    /history             # Get chat history

/api/education
  GET    /modules             # List modules
  GET    /modules/:id         # Get module
  POST   /modules/:id/progress # Update progress
```

---

## Database Migration Organization

### Migration Files

```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_instruments.sql
├── 003_add_constituents.sql
├── 004_add_prices.sql
├── 005_add_events.sql
├── 006_add_chat_messages.sql
└── 007_add_education.sql
```

### Migration Template

```sql
-- Migration: 001_initial_schema.sql
-- Description: Create initial tables for users and portfolios
-- Date: 2025-01-15

BEGIN;

-- Create tables
CREATE TABLE users (...);
CREATE TABLE portfolios (...);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);

-- Create constraints
ALTER TABLE portfolios ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id);

COMMIT;
```

---

## Test Organization

### Test File Structure

```
tests/
├── unit/
│   ├── utils/
│   │   ├── calculations.test.ts
│   │   └── formatting.test.ts
│   ├── services/
│   │   └── portfolio.service.test.ts
│   └── components/
│       └── PortfolioCard.test.tsx
│
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   └── portfolios.test.ts
│   └── database/
│       └── queries.test.ts
│
└── e2e/
    ├── auth.spec.ts
    ├── portfolio-management.spec.ts
    └── live-prices.spec.ts
```

### Test Naming Convention

```typescript
// Component tests
describe('PortfolioCard', () => {
  it('should render portfolio name', () => { ... });
  it('should display total value', () => { ... });
  it('should handle click events', () => { ... });
});

// Service tests
describe('PortfolioService', () => {
  describe('createPortfolio', () => {
    it('should create portfolio with valid data', () => { ... });
    it('should throw error with invalid data', () => { ... });
  });
});
```

---

## Documentation Organization

```
docs/
├── README_DOCS.md                  # Documentation index
├── CURRENT_STATE_ASSESSMENT.md     # Gap analysis
├── IMPLEMENTATION_PRIORITIES.md    # Feature priorities
├── NEXT_STEPS.md                   # Action plan
├── DATABASE_ARCHITECTURE.md        # Database design
├── FOLDER_STRUCTURE.md             # This file
├── DEV_RULES.md                    # Development guidelines
├── IMPLEMENTATION_PLAN.md          # Detailed task list
├── API_DOCUMENTATION.md            # API reference
└── old/                            # Archived docs
```

---

## Environment Files

### Development
```
.env.development
.env.test
.env.production
.env.example
```

### Structure
```bash
# .env.example
# Database
DATABASE_URL=postgresql://localhost:5432/portfolio_manager
REDIS_URL=redis://localhost:6379

# API Keys
FINNHUB_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here

# Auth
JWT_SECRET=your_secret_here
JWT_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=development
```

---

## Build Output Organization

```
dist/                    # Production build
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── index.html
└── ...

build/                   # Backend build
├── routes/
├── controllers/
├── services/
└── server.js
```

---

**Next:** See `docs/DEV_RULES.md` for coding standards and best practices.
