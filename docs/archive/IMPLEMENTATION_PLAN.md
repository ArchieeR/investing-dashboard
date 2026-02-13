# Implementation Plan & Task List

**Version:** 1.0  
**Last Updated:** November 8, 2025  
**Timeline:** 24 weeks (6 months)  
**Target:** Launch-Ready Platform

---

## Overview

This document provides a detailed, week-by-week implementation plan with specific tasks, acceptance criteria, and dependencies. Each task includes estimated hours and priority level.

**Legend:**
- 🔴 Critical (blocks other work)
- 🟡 High (important for launch)
- 🟢 Medium (nice to have)
- ⚪ Low (post-launch)

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Backend Setup & Authentication

#### Task 1.1: Project Setup 🔴
**Estimated:** 4 hours

**Subtasks:**
- [ ] Create backend repository
- [ ] Initialize Node.js project with TypeScript
- [ ] Configure ESLint and Prettier
- [ ] Set up folder structure
- [ ] Configure environment variables

**Acceptance Criteria:**
- Backend runs locally on port 3001
- TypeScript compiles without errors
- ESLint passes with no warnings

**Files to Create:**
```
portfolio-manager-api/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── .env.example
└── src/server.ts
```

---

#### Task 1.2: Database Setup 🔴
**Estimated:** 6 hours

**Subtasks:**
- [ ] Install PostgreSQL locally
- [ ] Create database schema
- [ ] Write initial migration
- [ ] Set up connection pooling
- [ ] Test database connection

**Acceptance Criteria:**
- Database created and accessible
- All tables created successfully
- Can insert and query test data
- Connection pool configured

**SQL Files:**
```sql
-- database/migrations/001_initial_schema.sql
CREATE TABLE users (...);
CREATE TABLE portfolios (...);
CREATE TABLE holdings (...);
CREATE TABLE trades (...);
```

---

#### Task 1.3: Authentication System 🔴
**Estimated:** 8 hours

**Subtasks:**
- [ ] Implement user registration
- [ ] Implement login with JWT
- [ ] Create auth middleware
- [ ] Add password hashing (bcrypt)
- [ ] Write auth tests

**Acceptance Criteria:**
- User can register with email/password
- User can login and receive JWT token
- Protected routes require valid token
- Passwords are hashed securely
- All auth tests pass

**Files to Create:**
```typescript
src/routes/auth.ts
src/controllers/auth.controller.ts
src/services/auth.service.ts
src/middleware/auth.ts
src/utils/jwt.ts
tests/integration/auth.test.ts
```

---

#### Task 1.4: Portfolio CRUD API 🔴
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create portfolio routes
- [ ] Implement portfolio controller
- [ ] Add portfolio service layer
- [ ] Implement validation
- [ ] Write integration tests

**Acceptance Criteria:**
- Can create portfolio via API
- Can list user's portfolios
- Can get single portfolio
- Can update portfolio
- Can delete portfolio
- All CRUD tests pass

**API Endpoints:**
```
POST   /api/portfolios
GET    /api/portfolios
GET    /api/portfolios/:id
PUT    /api/portfolios/:id
DELETE /api/portfolios/:id
```

---

### Week 2: Holdings & Trades API

#### Task 2.1: Holdings CRUD 🔴
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create holdings routes
- [ ] Implement holdings controller
- [ ] Add holdings service
- [ ] Implement validation
- [ ] Write tests

**Acceptance Criteria:**
- Can create holding
- Can list portfolio holdings
- Can update holding
- Can delete holding
- Cascade deletes work correctly

**Files:**
```typescript
src/routes/holdings.ts
src/controllers/holdings.controller.ts
src/services/holdings.service.ts
src/validators/holdings.validator.ts
tests/integration/holdings.test.ts
```

---

#### Task 2.2: Trade Recording 🔴
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create trades routes
- [ ] Implement trade controller
- [ ] Add trade service with cost basis calculation
- [ ] Write tests

**Acceptance Criteria:**
- Can record buy trade
- Can record sell trade
- Cost basis updates correctly
- Quantity updates correctly
- Trade history is preserved

---

#### Task 2.3: Frontend Migration 🔴
**Estimated:** 12 hours

**Subtasks:**
- [ ] Create API client service
- [ ] Add authentication context
- [ ] Migrate portfolio store to use API
- [ ] Add loading states
- [ ] Add error handling
- [ ] Update all components

**Acceptance Criteria:**
- Frontend uses API instead of localStorage
- User can login/register
- All existing features work with backend
- Loading states display correctly
- Errors are handled gracefully

**Files to Update:**
```typescript
src/services/api.ts
src/contexts/AuthContext.tsx
src/state/portfolioStore.tsx
src/hooks/useAuth.ts
```

---

### Week 3: Market Data Integration

#### Task 3.1: Finnhub Integration 🔴
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create Finnhub client
- [ ] Implement quote fetching
- [ ] Implement profile fetching
- [ ] Add rate limiting
- [ ] Add error handling
- [ ] Write tests

**Acceptance Criteria:**
- Can fetch stock quotes
- Can fetch company profiles
- Rate limits respected
- Errors handled gracefully
- Tests pass

**Files:**
```typescript
src/integrations/finnhub/client.ts
src/integrations/finnhub/quotes.ts
src/integrations/finnhub/profiles.ts
tests/unit/finnhub.test.ts
```

---

#### Task 3.2: Price Update Service 🔴
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create price updater service
- [ ] Implement background job
- [ ] Add price caching (Redis)
- [ ] Create prices API endpoint
- [ ] Write tests

**Acceptance Criteria:**
- Prices update every 10 minutes
- Prices cached in Redis
- Frontend can fetch latest prices
- Service recovers from failures
- Tests pass

**Files:**
```typescript
src/jobs/price-updater.ts
src/services/price.service.ts
src/routes/prices.ts
src/config/redis.ts
```

---

#### Task 3.3: Instruments Table 🟡
**Estimated:** 6 hours

**Subtasks:**
- [ ] Create instruments migration
- [ ] Add instruments service
- [ ] Create search endpoint
- [ ] Populate with common stocks/ETFs
- [ ] Write tests

**Acceptance Criteria:**
- Instruments table created
- Can search instruments by ticker/name
- Top 100 instruments seeded
- Tests pass

---

### Week 4: News & Events Integration

#### Task 4.1: News API Integration 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create news fetcher service
- [ ] Implement news API endpoint
- [ ] Add ticker tagging
- [ ] Create news table
- [ ] Write tests

**Acceptance Criteria:**
- News fetched from Finnhub
- News stored in database
- Can filter by ticker
- Can filter by date
- Tests pass

**Files:**
```typescript
src/jobs/news-fetcher.ts
src/services/news.service.ts
src/routes/research.ts
database/migrations/005_add_news.sql
```

---

#### Task 4.2: Events Calendar 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create events table
- [ ] Implement earnings fetcher
- [ ] Create events API endpoint
- [ ] Add dividend tracking
- [ ] Write tests

**Acceptance Criteria:**
- Events table created
- Earnings data fetched
- Dividend dates tracked
- Can filter by date range
- Tests pass

---

#### Task 4.3: Frontend Research Hub 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Update NewsPage with real data
- [ ] Update EventsPage with real data
- [ ] Add filtering and search
- [ ] Add pagination
- [ ] Add loading states

**Acceptance Criteria:**
- News displays real data
- Events display real data
- Filtering works
- Pagination works
- Loading states show

---

## Phase 2: Intelligence (Weeks 5-12)

### Week 5-6: ETF Look-Through Foundation

#### Task 5.1: Constituents Table 🔴
**Estimated:** 6 hours

**Subtasks:**
- [ ] Create constituents migration
- [ ] Add constituents service
- [ ] Create admin endpoint for data entry
- [ ] Write tests

**Acceptance Criteria:**
- Constituents table created
- Can store ETF holdings
- Can query constituents
- Tests pass

---

#### Task 5.2: Manual ETF Entry Tool 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Create admin UI for ETF entry
- [ ] Add CSV import for constituents
- [ ] Validate weight sums to 100%
- [ ] Add as_of date tracking
- [ ] Write tests

**Acceptance Criteria:**
- Admin can enter ETF constituents
- Can import from CSV
- Weights validated
- Historical data preserved
- Tests pass

---

#### Task 5.3: Top 20 ETFs Data Entry 🟡
**Estimated:** 16 hours

**Subtasks:**
- [ ] Research and gather data for 20 ETFs
- [ ] Enter constituent data
- [ ] Verify accuracy
- [ ] Document sources

**ETFs to Enter:**
1. VWRL - Vanguard FTSE All-World
2. VUKE - Vanguard FTSE 100
3. VMID - Vanguard FTSE 250
4. VUSA - Vanguard S&P 500
5. EQQQ - Invesco NASDAQ-100
6. IUKD - iShares UK Dividend
7. VHYL - Vanguard High Dividend
8. AGGG - iShares Global Aggregate Bond
9. IGLT - iShares UK Gilts
10. VEMT - Vanguard Emerging Markets
11. SPY - SPDR S&P 500
12. QQQ - Invesco QQQ
13. VTI - Vanguard Total Stock Market
14. VOO - Vanguard S&P 500
15. SPYG - SPDR S&P 500 Growth
16. VEA - Vanguard Developed Markets
17. VWO - Vanguard Emerging Markets
18. AGG - iShares Core US Aggregate Bond
19. BND - Vanguard Total Bond Market
20. GLD - SPDR Gold Shares

**Acceptance Criteria:**
- All 20 ETFs entered
- Top 10-20 constituents per ETF
- Weights accurate
- Sources documented

---

### Week 7-8: Exposure Analysis

#### Task 7.1: Exposure Calculation Service 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Implement recursive constituent lookup
- [ ] Calculate sector aggregation
- [ ] Calculate country aggregation
- [ ] Calculate currency exposure
- [ ] Add caching
- [ ] Write tests

**Acceptance Criteria:**
- Can calculate true exposures
- Handles nested ETFs
- Aggregates correctly
- Results cached
- Tests pass

**Files:**
```typescript
src/services/exposure.service.ts
src/utils/aggregation.ts
tests/unit/exposure.test.ts
```

---

#### Task 7.2: Overlap Analysis 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Implement overlap calculation
- [ ] Create overlap matrix
- [ ] Add Herfindahl-Hirschman Index
- [ ] Cache results
- [ ] Write tests

**Acceptance Criteria:**
- Can calculate ETF overlap
- Matrix generated correctly
- HHI calculated
- Results cached
- Tests pass

---

#### Task 7.3: Frontend Exposure Views 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Update AnalysisPage with real data
- [ ] Add sector breakdown chart
- [ ] Add country breakdown chart
- [ ] Add overlap matrix visualization
- [ ] Add top holdings view

**Acceptance Criteria:**
- Real exposure data displayed
- Charts render correctly
- Overlap matrix interactive
- Top holdings accurate
- Loading states work

---

### Week 9-10: AI Chatbot Foundation

#### Task 9.1: Google Gemini Integration 🔴
**Estimated:** 8 hours

**Subtasks:**
- [ ] Set up Google AI API
- [ ] Create AI service
- [ ] Implement chat endpoint
- [ ] Add rate limiting
- [ ] Write tests

**Acceptance Criteria:**
- Can send messages to Gemini
- Responses received
- Rate limits enforced
- Errors handled
- Tests pass

**Files:**
```typescript
src/integrations/google-ai/client.ts
src/services/ai.service.ts
src/routes/ai.ts
tests/integration/ai.test.ts
```

---

#### Task 9.2: Context Injection System 🔴
**Estimated:** 12 hours

**Subtasks:**
- [ ] Build portfolio context builder
- [ ] Add holdings context
- [ ] Add performance context
- [ ] Add market data context
- [ ] Implement prompt templates
- [ ] Write tests

**Acceptance Criteria:**
- Context includes portfolio data
- Context includes recent trades
- Context includes performance metrics
- Prompts well-structured
- Tests pass

**Files:**
```typescript
src/services/context-builder.service.ts
src/templates/prompts.ts
tests/unit/context-builder.test.ts
```

---

#### Task 9.3: Chat UI Component 🔴
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create chat interface
- [ ] Add message history
- [ ] Add streaming responses
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style chat UI

**Acceptance Criteria:**
- Chat interface functional
- Messages display correctly
- Streaming works
- History persists
- Errors handled gracefully

**Files:**
```typescript
src/components/ai/AIChat.tsx
src/components/ai/Message.tsx
src/hooks/useAIChat.ts
src/styles/chat.css
```

---

### Week 11-12: AI Intelligence & Analytics

#### Task 11.1: Portfolio Query Handling 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Implement query understanding
- [ ] Add portfolio-specific responses
- [ ] Add calculation capabilities
- [ ] Add citation system
- [ ] Write tests

**Example Queries:**
- "What's my portfolio worth?"
- "How is my tech exposure?"
- "Should I rebalance?"
- "What's my P/E ratio?"

**Acceptance Criteria:**
- Understands portfolio queries
- Provides accurate answers
- Cites data sources
- Tests pass

---

#### Task 11.2: Advanced Analytics 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Implement volatility calculation
- [ ] Implement beta calculation
- [ ] Implement Sharpe ratio
- [ ] Implement Sortino ratio
- [ ] Add benchmark comparison
- [ ] Write tests

**Acceptance Criteria:**
- Volatility calculated correctly
- Beta vs benchmarks accurate
- Sharpe/Sortino ratios correct
- Benchmark data integrated
- Tests pass

**Files:**
```typescript
src/services/analytics.service.ts
src/utils/risk-metrics.ts
tests/unit/analytics.test.ts
```

---

#### Task 11.3: Analytics Dashboard 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create analytics page
- [ ] Add risk metrics display
- [ ] Add performance charts
- [ ] Add benchmark comparison
- [ ] Add correlation matrix

**Acceptance Criteria:**
- Analytics page functional
- Metrics display correctly
- Charts render properly
- Comparisons accurate
- UI responsive

---

## Phase 3: Engagement (Weeks 13-20)

### Week 13-14: Alerts System

#### Task 13.1: Alerts Backend 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Create alerts table
- [ ] Implement alert rules engine
- [ ] Add alert checker job
- [ ] Create alerts API
- [ ] Write tests

**Alert Types:**
- Price threshold
- Drift from target
- Earnings announcement
- Rebalancing needed
- Exposure limit exceeded

**Acceptance Criteria:**
- Alerts table created
- Rules engine functional
- Checker runs periodically
- API endpoints work
- Tests pass

---

#### Task 13.2: Email Notifications 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Set up email service (SendGrid/SES)
- [ ] Create email templates
- [ ] Implement notification service
- [ ] Add digest functionality
- [ ] Write tests

**Acceptance Criteria:**
- Emails send successfully
- Templates render correctly
- Digest aggregates alerts
- Unsubscribe works
- Tests pass

---

#### Task 13.3: Alerts UI 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create alerts page
- [ ] Add alert creation form
- [ ] Add alert list
- [ ] Add notification preferences
- [ ] Add alert history

**Acceptance Criteria:**
- Can create alerts
- Can view active alerts
- Can dismiss alerts
- Preferences save
- History displays

---

### Week 15-16: Tax Helpers & Advanced Features

#### Task 15.1: CGT Calculator 🟡
**Estimated:** 10 hours

**Subtasks:**
- [ ] Implement CGT calculation
- [ ] Add allowance tracking
- [ ] Create tax report
- [ ] Add bed-and-ISA suggestions
- [ ] Write tests

**Acceptance Criteria:**
- CGT calculated correctly
- Allowance tracked
- Report generated
- Suggestions accurate
- Tests pass

---

#### Task 15.2: Performance Attribution 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Implement TWRR calculation
- [ ] Implement MWRR calculation
- [ ] Add contribution analysis
- [ ] Create performance report
- [ ] Write tests

**Acceptance Criteria:**
- TWRR accurate
- MWRR accurate
- Attribution correct
- Report generated
- Tests pass

---

### Week 17-18: Education Academy

#### Task 17.1: Education Content 🟡
**Estimated:** 20 hours

**Subtasks:**
- [ ] Write 10-15 core modules
- [ ] Create quizzes
- [ ] Add interactive examples
- [ ] Build glossary
- [ ] Review and edit

**Modules:**
1. Introduction to Investing
2. Understanding ETFs
3. Diversification Principles
4. Risk Management
5. Portfolio Rebalancing
6. Tax-Efficient Investing (UK)
7. Reading Financial News
8. Understanding Fees
9. Market Cycles
10. Long-Term Thinking

**Acceptance Criteria:**
- All modules written
- Quizzes created
- Examples interactive
- Glossary complete
- Content reviewed

---

#### Task 17.2: Education Backend 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Create education tables
- [ ] Implement progress tracking
- [ ] Create education API
- [ ] Add quiz scoring
- [ ] Write tests

**Acceptance Criteria:**
- Tables created
- Progress tracked
- API functional
- Scoring works
- Tests pass

---

#### Task 17.3: Education UI 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Create education page
- [ ] Add module viewer
- [ ] Add quiz interface
- [ ] Add progress tracker
- [ ] Add achievements

**Acceptance Criteria:**
- Education page functional
- Modules display correctly
- Quizzes work
- Progress saves
- Achievements unlock

---

### Week 19-20: Polish & Optimization

#### Task 19.1: Performance Optimization 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement query caching
- [ ] Optimize frontend bundle
- [ ] Add lazy loading
- [ ] Measure and improve

**Acceptance Criteria:**
- Query times <200ms
- Page load <2s
- Bundle size reduced 30%
- Lighthouse score >90
- No memory leaks

---

#### Task 19.2: UI/UX Refinement 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Conduct user testing
- [ ] Fix usability issues
- [ ] Improve mobile experience
- [ ] Add animations
- [ ] Polish design

**Acceptance Criteria:**
- User feedback incorporated
- Mobile fully functional
- Animations smooth
- Design consistent
- Accessibility improved

---

#### Task 19.3: Documentation 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Write user guide
- [ ] Create API documentation
- [ ] Add inline help
- [ ] Create video tutorials
- [ ] Write FAQ

**Acceptance Criteria:**
- User guide complete
- API docs generated
- Help tooltips added
- 3-5 videos created
- FAQ covers common questions

---

## Phase 4: Launch Prep (Weeks 21-24)

### Week 21-22: Testing & Bug Fixes

#### Task 21.1: Comprehensive Testing 🔴
**Estimated:** 20 hours

**Subtasks:**
- [ ] Write missing unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Test all user flows
- [ ] Test edge cases
- [ ] Fix all bugs

**Acceptance Criteria:**
- Test coverage >80%
- All critical paths tested
- No P0/P1 bugs
- All tests pass
- Performance acceptable

---

#### Task 21.2: Security Audit 🔴
**Estimated:** 8 hours

**Subtasks:**
- [ ] Run security scanner
- [ ] Fix vulnerabilities
- [ ] Review authentication
- [ ] Review authorization
- [ ] Test SQL injection
- [ ] Test XSS

**Acceptance Criteria:**
- No critical vulnerabilities
- Auth/authz secure
- SQL injection prevented
- XSS prevented
- OWASP checklist complete

---

### Week 23: Beta Launch

#### Task 23.1: Beta Deployment 🔴
**Estimated:** 12 hours

**Subtasks:**
- [ ] Set up production environment
- [ ] Configure CI/CD
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configure monitoring
- [ ] Set up backups

**Acceptance Criteria:**
- Production environment live
- CI/CD pipeline working
- Monitoring active
- Backups automated
- SSL configured

---

#### Task 23.2: Beta User Onboarding 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Recruit 20-50 beta users
- [ ] Create onboarding flow
- [ ] Set up feedback collection
- [ ] Monitor usage
- [ ] Provide support

**Acceptance Criteria:**
- 20+ beta users signed up
- Onboarding smooth
- Feedback collected
- Usage monitored
- Support responsive

---

### Week 24: Launch Preparation

#### Task 24.1: Marketing Materials 🟡
**Estimated:** 12 hours

**Subtasks:**
- [ ] Create landing page
- [ ] Write launch announcement
- [ ] Create demo video
- [ ] Prepare social media
- [ ] Write press release

**Acceptance Criteria:**
- Landing page live
- Announcement ready
- Demo video published
- Social media scheduled
- Press release drafted

---

#### Task 24.2: Final Polish 🟡
**Estimated:** 8 hours

**Subtasks:**
- [ ] Fix beta feedback issues
- [ ] Final UI polish
- [ ] Update documentation
- [ ] Prepare support resources
- [ ] Final testing

**Acceptance Criteria:**
- Critical feedback addressed
- UI polished
- Docs updated
- Support ready
- All tests pass

---

## Success Metrics

### Technical Metrics
- [ ] Backend uptime >99%
- [ ] API response time <200ms
- [ ] Frontend load time <2s
- [ ] Test coverage >80%
- [ ] Zero critical bugs

### User Metrics
- [ ] 100+ registered users
- [ ] 60%+ 30-day retention
- [ ] 40%+ daily active users
- [ ] 70%+ AI feature adoption
- [ ] <5% error rate

### Business Metrics
- [ ] 20+ beta testimonials
- [ ] 4.5+ star rating
- [ ] 50%+ conversion to paid (if applicable)
- [ ] <2% churn rate
- [ ] Positive unit economics

---

## Risk Mitigation

### High-Risk Items
1. **AI Chatbot Complexity**
   - Mitigation: Start simple, iterate
   - Fallback: Manual FAQ system

2. **ETF Data Sourcing**
   - Mitigation: Manual entry for MVP
   - Fallback: Top 10 ETFs only

3. **API Rate Limits**
   - Mitigation: Aggressive caching
   - Fallback: Multiple providers

### Medium-Risk Items
1. **User Adoption**
   - Mitigation: Beta testing
   - Fallback: Pivot features

2. **Performance Issues**
   - Mitigation: Early optimization
   - Fallback: Reduce features

---

## Contingency Plans

### If Behind Schedule
1. Defer education academy to v1.1
2. Reduce ETF coverage to top 10
3. Simplify AI responses
4. Launch with basic analytics

### If Ahead of Schedule
1. Add more ETFs
2. Build mobile app
3. Add broker integrations
4. Implement advanced scenarios

---

## Weekly Checklist Template

Use this for weekly progress tracking:

```markdown
## Week X Progress

### Completed Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### In Progress
- [ ] Task 4 (50% complete)
- [ ] Task 5 (25% complete)

### Blocked
- [ ] Task 6 (waiting on API key)

### Next Week
- [ ] Task 7
- [ ] Task 8

### Notes
- Issue with X, resolved by Y
- Need to revisit Z

### Metrics
- Tests passing: X/Y
- Code coverage: Z%
- Bugs fixed: N
```

---

**This plan is a living document. Review and adjust weekly based on progress and learnings.**
