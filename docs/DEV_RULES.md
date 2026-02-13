# Development Rules & Guidelines

**Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Living Document

---

## Core Principles

### 1. Code Quality Over Speed
- Write clean, maintainable code
- Refactor as you go
- Don't accumulate technical debt
- "Leave it better than you found it"

### 2. Type Safety First
- Use TypeScript strictly
- No `any` types without justification
- Define interfaces for all data structures
- Use discriminated unions for variants

### 3. Test-Driven Development
- Write tests before implementation (when possible)
- Aim for >80% code coverage
- Test edge cases and error paths
- Keep tests simple and readable

### 4. Security by Default
- Never trust user input
- Sanitize and validate everything
- Use parameterized queries
- Follow OWASP guidelines

### 5. Performance Matters
- Optimize for user experience
- Cache aggressively
- Lazy load when appropriate
- Monitor and measure

---

## TypeScript Rules

### Strict Mode Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Definitions

**DO:**
```typescript
// Define explicit interfaces
interface Portfolio {
  id: string;
  name: string;
  type: 'actual' | 'draft' | 'model';
  holdings: Holding[];
}

// Use discriminated unions
type TradeType = 'buy' | 'sell';

interface Trade {
  id: string;
  type: TradeType;
  price: number;
  qty: number;
}

// Use readonly for immutable data
interface Config {
  readonly apiKey: string;
  readonly baseUrl: string;
}
```

**DON'T:**
```typescript
// Avoid any
function processData(data: any) { ... }  // ❌

// Avoid implicit types
const portfolio = { name: 'Main' };  // ❌ Type not explicit

// Avoid type assertions without reason
const value = data as Portfolio;  // ❌ Unsafe
```

### Null Safety

```typescript
// Use optional chaining
const price = holding?.livePrice ?? holding.price;

// Use nullish coalescing
const value = userInput ?? defaultValue;

// Check for null/undefined explicitly
if (portfolio !== null && portfolio !== undefined) {
  // Safe to use portfolio
}

// Or use type guards
function isPortfolio(obj: unknown): obj is Portfolio {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

---

## React Component Rules

### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Portfolio } from '@/types';

// 2. Types/Interfaces
interface PortfolioCardProps {
  portfolio: Portfolio;
  onSelect: (id: string) => void;
  className?: string;
}

// 3. Component
export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onSelect,
  className
}) => {
  // 4. State
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 6. Memoized values
  const totalValue = useMemo(() => 
    calculateTotal(portfolio.holdings), 
    [portfolio.holdings]
  );
  
  // 7. Callbacks
  const handleClick = useCallback(() => {
    onSelect(portfolio.id);
  }, [portfolio.id, onSelect]);
  
  // 8. Render
  return (
    <div className={className}>
      {/* JSX */}
    </div>
  );
};
```

### Hooks Rules

**DO:**
```typescript
// Custom hooks for reusable logic
function usePortfolio(id: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchPortfolio(id)
      .then(setPortfolio)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
  
  return { portfolio, loading, error };
}

// Memoize expensive calculations
const breakdown = useMemo(() => 
  calculateBreakdown(holdings), 
  [holdings]
);

// Memoize callbacks to prevent re-renders
const handleSave = useCallback(() => {
  savePortfolio(portfolio);
}, [portfolio]);
```

**DON'T:**
```typescript
// Don't call hooks conditionally
if (condition) {
  useEffect(() => { ... });  // ❌
}

// Don't call hooks in loops
for (const item of items) {
  useState(item);  // ❌
}

// Don't forget dependencies
useEffect(() => {
  doSomething(value);
}, []);  // ❌ Missing 'value' dependency
```

### Component Composition

```typescript
// Prefer composition over props drilling
const PortfolioPage = () => {
  return (
    <PortfolioProvider>
      <PortfolioHeader />
      <PortfolioContent />
      <PortfolioFooter />
    </PortfolioProvider>
  );
};

// Use children prop for flexibility
interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    <h3>{title}</h3>
    {children}
  </div>
);
```

---

## State Management Rules

### Context Usage

```typescript
// Create typed context
interface PortfolioContextType {
  state: AppState;
  dispatch: React.Dispatch<PortfolioAction>;
  activePortfolio: Portfolio;
  addHolding: (holding: Holding) => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

// Custom hook for context
export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within PortfolioProvider');
  }
  return context;
}
```

### Reducer Pattern

```typescript
// Define action types
type PortfolioAction =
  | { type: 'add-holding'; holding: Holding }
  | { type: 'update-holding'; id: string; patch: Partial<Holding> }
  | { type: 'delete-holding'; id: string };

// Reducer with exhaustive checking
function portfolioReducer(
  state: AppState,
  action: PortfolioAction
): AppState {
  switch (action.type) {
    case 'add-holding':
      return { ...state, holdings: [...state.holdings, action.holding] };
    
    case 'update-holding':
      return {
        ...state,
        holdings: state.holdings.map(h =>
          h.id === action.id ? { ...h, ...action.patch } : h
        )
      };
    
    case 'delete-holding':
      return {
        ...state,
        holdings: state.holdings.filter(h => h.id !== action.id)
      };
    
    default:
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = action;
      return state;
  }
}
```

---

## API & Data Fetching Rules

### Error Handling

```typescript
// Always handle errors
async function fetchPortfolio(id: string): Promise<Portfolio> {
  try {
    const response = await api.portfolios.get(id);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return validatePortfolio(data);  // Validate response
    
  } catch (error) {
    if (error instanceof NetworkError) {
      // Handle network errors
      throw new Error('Network connection failed');
    }
    
    if (error instanceof ValidationError) {
      // Handle validation errors
      throw new Error('Invalid portfolio data');
    }
    
    // Re-throw unknown errors
    throw error;
  }
}
```

### Loading States

```typescript
// Track loading, error, and data states
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    let cancelled = false;
    
    setState({ data: null, loading: true, error: null });
    
    asyncFn()
      .then(data => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return state;
}
```

### Caching Strategy

```typescript
// Simple in-memory cache
class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Usage
const priceCache = new Cache<number>(5);  // 5 minute TTL

async function getPrice(ticker: string): Promise<number> {
  const cached = priceCache.get(ticker);
  if (cached !== null) return cached;
  
  const price = await fetchPrice(ticker);
  priceCache.set(ticker, price);
  return price;
}
```

---

## Backend API Rules

### Route Handlers

```typescript
// Use async/await with try-catch
export const getPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;  // From auth middleware
    
    // Validate input
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid portfolio ID' });
    }
    
    // Fetch data
    const portfolio = await portfolioService.getById(id, userId);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Return response
    res.json({ data: portfolio });
    
  } catch (error) {
    next(error);  // Pass to error handler
  }
};
```

### Input Validation

```typescript
// Use validation library (e.g., Zod)
import { z } from 'zod';

const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['actual', 'draft', 'model']),
  settings: z.object({
    currency: z.string().length(3),
    targetPortfolioValue: z.number().positive().optional()
  }).optional()
});

export const createPortfolio = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const data = CreatePortfolioSchema.parse(req.body);
    
    // Create portfolio
    const portfolio = await portfolioService.create(req.user.id, data);
    
    res.status(201).json({ data: portfolio });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    throw error;
  }
};
```

### Database Queries

```typescript
// Use parameterized queries ALWAYS
const getPortfolio = async (id: string, userId: string) => {
  const result = await pool.query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  return result.rows[0] || null;
};

// Use transactions for multi-step operations
const createPortfolioWithHoldings = async (
  userId: string,
  portfolioData: any,
  holdings: any[]
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create portfolio
    const portfolioResult = await client.query(
      'INSERT INTO portfolios (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, portfolioData.name, portfolioData.type]
    );
    
    const portfolio = portfolioResult.rows[0];
    
    // Create holdings
    for (const holding of holdings) {
      await client.query(
        'INSERT INTO holdings (portfolio_id, ...) VALUES ($1, ...)',
        [portfolio.id, ...]
      );
    }
    
    await client.query('COMMIT');
    return portfolio;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## Security Rules

### Authentication

```typescript
// Hash passwords with bcrypt
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure JWT tokens
import jwt from 'jsonwebtoken';

function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
}
```

### Input Sanitization

```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// Validate and sanitize
function sanitizePortfolioName(name: string): string {
  // Remove special characters
  const cleaned = name.replace(/[^\w\s-]/g, '');
  
  // Trim and limit length
  return cleaned.trim().slice(0, 255);
}
```

### Rate Limiting

```typescript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', apiLimiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
```

---

## Testing Rules

### Unit Tests

```typescript
// Test pure functions
describe('calculateTotal', () => {
  it('should sum holding values', () => {
    const holdings = [
      { price: 100, qty: 10 },
      { price: 50, qty: 20 }
    ];
    
    expect(calculateTotal(holdings)).toBe(2000);
  });
  
  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
  
  it('should ignore excluded holdings', () => {
    const holdings = [
      { price: 100, qty: 10, include: true },
      { price: 50, qty: 20, include: false }
    ];
    
    expect(calculateTotal(holdings)).toBe(1000);
  });
});
```

### Integration Tests

```typescript
// Test API endpoints
describe('POST /api/portfolios', () => {
  it('should create portfolio with valid data', async () => {
    const response = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Portfolio',
        type: 'actual'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe('Test Portfolio');
  });
  
  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '',  // Invalid: empty name
        type: 'invalid'  // Invalid: wrong type
      });
    
    expect(response.status).toBe(400);
  });
});
```

### Component Tests

```typescript
// Test React components
import { render, screen, fireEvent } from '@testing-library/react';

describe('PortfolioCard', () => {
  const mockPortfolio = {
    id: '1',
    name: 'Test Portfolio',
    holdings: []
  };
  
  it('should render portfolio name', () => {
    render(<PortfolioCard portfolio={mockPortfolio} />);
    expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
  });
  
  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<PortfolioCard portfolio={mockPortfolio} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

---

## Performance Rules

### Optimization Techniques

```typescript
// 1. Memoize expensive calculations
const breakdown = useMemo(() => 
  calculateBreakdown(holdings), 
  [holdings]
);

// 2. Debounce user input
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

// 3. Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 4. Virtualize long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={holdings.length}
  itemSize={50}
>
  {({ index, style }) => (
    <HoldingRow holding={holdings[index]} style={style} />
  )}
</FixedSizeList>

// 5. Use pagination for large datasets
const PAGE_SIZE = 50;

function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(0);
  
  const pageItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);
  
  return { pageItems, page, setPage };
}
```

---

## Code Review Checklist

Before submitting code for review:

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Types are explicit (no `any`)
- [ ] Error handling is comprehensive
- [ ] Input validation is present
- [ ] Security best practices followed
- [ ] Performance considered
- [ ] Documentation updated
- [ ] Commit messages are clear

---

## Git Commit Rules

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(portfolio): add draft portfolio creation

Implement ability to create draft portfolios that can be
edited without affecting the actual portfolio.

Closes #123
```

```
fix(prices): handle missing live price data

Fall back to manual price when live price is unavailable.
Add error logging for debugging.

Fixes #456
```

---

## Documentation Rules

### Code Comments

```typescript
// DO: Explain WHY, not WHAT
// Calculate target value using hierarchical approach because
// theme targets depend on section targets
const targetValue = (theme.percentOfSection / 100) * sectionTarget;

// DON'T: State the obvious
// Set the value to 10
const value = 10;  // ❌
```

### JSDoc for Public APIs

```typescript
/**
 * Calculates the total value of a portfolio including all holdings.
 * 
 * @param portfolio - The portfolio to calculate
 * @param options - Calculation options
 * @param options.includeCash - Whether to include cash holdings
 * @param options.useLivePrice - Whether to use live prices
 * @returns The total portfolio value in the base currency
 * 
 * @example
 * ```typescript
 * const total = calculatePortfolioValue(portfolio, {
 *   includeCash: true,
 *   useLivePrice: true
 * });
 * ```
 */
export function calculatePortfolioValue(
  portfolio: Portfolio,
  options: CalculationOptions
): number {
  // Implementation
}
```

---

**Remember:** These rules exist to maintain code quality and team productivity. When in doubt, ask for clarification or propose changes to these guidelines.
