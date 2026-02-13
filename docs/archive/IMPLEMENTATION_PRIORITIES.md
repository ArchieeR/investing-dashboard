# Implementation Priorities — Portfolio Manager

**Last Updated:** November 8, 2025  
**Current Version:** 0.1.0 (MVP Foundation)  
**Target Version:** 1.0.0 (Full Vision)

---

## Priority Framework

Features are prioritized using the **ICE Score** (Impact × Confidence × Ease):
- **Impact:** How much value does this add? (1-10)
- **Confidence:** How sure are we this is needed? (1-10)
- **Ease:** How easy is it to implement? (1-10)

**ICE Score = (Impact × Confidence × Ease) / 100**

Higher scores = higher priority

---

## Critical Path Features (Must Have for Launch)

### 1. Backend Infrastructure ⭐⭐⭐⭐⭐
**ICE Score: 9.0** (10 × 10 × 9)

**Why Critical:**
- Blocks all other features
- Required for multi-user support
- Enables data persistence
- Necessary for API integrations

**Implementation:**
```
Week 1-2: Setup
- Node.js/Express server
- PostgreSQL database
- User authentication (JWT)
- Basic CRUD APIs

Week 3-4: Migration
- Migrate localStorage to DB
- User registration/login
- Session management
- Data sync logic
```

**Dependencies:** None  
**Blocks:** Everything else

---

### 2. Real Market Data Integration ⭐⭐⭐⭐⭐
**ICE Score: 8.4** (10 × 9 × 7)

**Why Critical:**
- Current Yahoo Finance is fragile
- Need fundamentals for research
- Required for AI context
- Table stakes for credibility

**Implementation:**
```
Week 3-4: API Setup
- Finnhub API integration
- Alpha Vantage backup
- Rate limiting & caching
- Error handling

Week 5-6: Features
- Stock fundamentals (P/E, market cap, etc.)
- Earnings calendar
- Dividend schedules
- News feed
- Economic calendar
```

**Dependencies:** Backend infrastructure  
**Blocks:** Research hub, AI chatbot, analytics

---

### 3. AI Chatbot MVP ⭐⭐⭐⭐⭐
**ICE Score: 8.1** (10 × 9 × 9)

**Why Critical:**
- Core differentiator
- Unique value proposition
- Drives engagement
- Enables education

**Implementation:**
```
Week 9-10: Foundation
- Google Gemini API integration
- Chat UI component
- Message history storage
- Context injection system

Week 11-12: Intelligence
- Portfolio data context
- Query understanding
- Response generation
- Citation system
- Disclaimer handling
```

**Dependencies:** Backend, market data  
**Blocks:** Education features

---

### 4. ETF Look-Through MVP ⭐⭐⭐⭐
**ICE Score: 7.2** (10 × 9 × 8)

**Why Critical:**
- Key value proposition
- Enables overlap analysis
- Required for true exposure
- Competitive advantage

**Implementation:**
```
Week 5-6: Data Model
- Instrument table
- Constituent table
- Refresh cadence tracking
- Weight normalization

Week 7-8: Manual Entry
- Top 20 UK/US ETFs
- Constituent data entry
- Overlap calculation
- Sector/country aggregation
```

**Dependencies:** Backend infrastructure  
**Blocks:** Advanced analytics, exposure analysis

---

## High Priority Features (Launch Enhancers)

### 5. Advanced Analytics ⭐⭐⭐⭐
**ICE Score: 6.4** (9 × 8 × 9)

**Why Important:**
- Institutional-grade insights
- Justifies premium pricing
- Builds trust
- Enables better decisions

**Implementation:**
```
Week 13-14: Risk Metrics
- Volatility calculation
- Beta vs benchmarks
- Sharpe/Sortino ratios
- Max drawdown

Week 15-16: Comparisons
- Benchmark tracking
- Correlation matrices
- Performance attribution
- Basic VaR
```

**Dependencies:** Market data, ETF look-through  
**Blocks:** None

---

### 6. Education Academy ⭐⭐⭐⭐
**ICE Score: 6.3** (9 × 7 × 10)

**Why Important:**
- Retention driver
- Builds trust
- Serves beginners
- Unique positioning

**Implementation:**
```
Week 17-18: Content
- 10-15 core modules
- Interactive quizzes
- Glossary system
- Progress tracking

Week 19-20: Integration
- Portfolio-linked examples
- Just-in-time hints
- Concept mapping
- Achievement system
```

**Dependencies:** Backend, AI chatbot (for explanations)  
**Blocks:** None

---

### 7. Alerts & Notifications ⭐⭐⭐
**ICE Score: 5.6** (8 × 7 × 10)

**Why Important:**
- Drives engagement
- Proactive value
- Reduces churn
- Easy to implement

**Implementation:**
```
Week 13-14: System
- Alert rules engine
- Threshold monitoring
- Event detection
- Email service

Week 15: Features
- Price alerts
- Drift notifications
- Earnings reminders
- Rebalancing nudges
```

**Dependencies:** Backend, market data  
**Blocks:** None

---

### 8. Real Research Hub ⭐⭐⭐
**ICE Score: 5.4** (8 × 9 × 7.5)

**Why Important:**
- Completes platform
- Reduces app-switching
- Enables informed decisions
- Competitive parity

**Implementation:**
```
Week 7-8: News
- News API integration
- Ticker tagging
- Sentiment analysis
- Reading queue

Week 9-10: Events
- Earnings calendar
- Dividend tracker
- Economic events
- RNS integration (UK)

Week 11-12: ETF Research
- Comparison tool
- Holdings viewer
- Performance charts
- Document links
```

**Dependencies:** Backend, market data  
**Blocks:** None

---

## Medium Priority Features (Post-Launch)

### 9. Broker Integrations ⭐⭐⭐
**ICE Score: 4.8** (9 × 8 × 6.7)

**Why Valuable:**
- Reduces friction
- Automatic syncing
- Competitive feature
- Complex to implement

**Implementation:**
```
Phase 3 (Weeks 25-28):
- Open Banking/Finance API
- Broker API connectors
- Transaction syncing
- Account aggregation
```

**Dependencies:** Backend, authentication  
**Blocks:** None

---

### 10. Advanced Scenario Testing ⭐⭐
**ICE Score: 4.2** (8 × 7 × 7.5)

**Why Valuable:**
- Power user feature
- Planning tool
- Differentiation
- Moderate complexity

**Implementation:**
```
Phase 3 (Weeks 29-32):
- Scenario engine
- Stress testing
- Monte Carlo simulations
- Glide-path planning
```

**Dependencies:** Advanced analytics  
**Blocks:** None

---

### 11. Mobile Native App ⭐⭐
**ICE Score: 3.6** (8 × 6 × 7.5)

**Why Valuable:**
- User preference
- Push notifications
- Offline support
- Significant effort

**Implementation:**
```
Phase 3 (Weeks 33-40):
- React Native setup
- Core features port
- Offline sync
- Push notifications
```

**Dependencies:** Backend, PWA foundation  
**Blocks:** None

---

## Low Priority Features (Future Consideration)

### 12. Collaborative Features
**ICE Score: 2.8** (7 × 5 × 8)

**Why Low:**
- Niche use case
- Complex permissions
- Unclear demand

### 13. Adviser Workspace
**ICE Score: 2.4** (8 × 5 × 6)

**Why Low:**
- Different market
- Regulatory complexity
- Requires separate product

### 14. Crypto Deep Integration
**ICE Score: 2.1** (6 × 5 × 7)

**Why Low:**
- Volatile market
- Regulatory uncertainty
- Basic support sufficient

---

## Implementation Sequence (Recommended)

### Weeks 1-4: Foundation
1. Backend infrastructure (Weeks 1-2)
2. User authentication (Week 2)
3. Market data integration (Weeks 3-4)
4. Database migration (Week 4)

### Weeks 5-8: Core Features
5. ETF look-through data model (Weeks 5-6)
6. Manual ETF entry (Weeks 7-8)
7. Real news hub (Weeks 7-8)
8. Real events calendar (Weeks 7-8)

### Weeks 9-12: Intelligence
9. AI chatbot foundation (Weeks 9-10)
10. AI portfolio context (Weeks 11-12)
11. ETF comparison tool (Weeks 11-12)

### Weeks 13-16: Analytics & Engagement
12. Advanced analytics (Weeks 13-14)
13. Alerts system (Weeks 13-14)
14. Benchmark comparison (Weeks 15-16)

### Weeks 17-20: Education & Polish
15. Education academy (Weeks 17-18)
16. Portfolio-linked learning (Weeks 19-20)
17. UI/UX refinement (Weeks 19-20)

### Weeks 21-24: Beta Launch Prep
18. Testing & bug fixes
19. Performance optimization
20. Documentation
21. Beta user onboarding

---

## Resource Allocation

### Solo Developer (Current)
- **Realistic Timeline:** 24-32 weeks to launch-ready
- **Focus:** Critical path only (items 1-4)
- **Defer:** Medium/low priority features

### Small Team (2-3 developers)
- **Realistic Timeline:** 16-20 weeks to launch-ready
- **Parallel Tracks:**
  - Dev 1: Backend + infrastructure
  - Dev 2: AI + analytics
  - Dev 3: Research + education

### Funded Team (4-6 developers)
- **Realistic Timeline:** 12-16 weeks to launch-ready
- **Parallel Tracks:**
  - Backend team (2 devs)
  - Frontend team (2 devs)
  - Data/AI team (2 devs)

---

## Decision Points

### Launch Criteria (Minimum Viable)
- ✅ Backend infrastructure
- ✅ User authentication
- ✅ Real market data
- ✅ AI chatbot MVP
- ✅ ETF look-through (top 20)
- ✅ Basic analytics
- ✅ Real research hub
- ⚠️ Education (optional for v1.0)

### Launch Criteria (Ideal)
- All minimum viable features
- ✅ Education academy
- ✅ Alerts system
- ✅ Advanced analytics
- ✅ Mobile-optimized PWA

---

## Risk Mitigation

### High-Risk Items
1. **AI Chatbot:** Complex, may need iteration
   - **Mitigation:** Start simple, iterate based on feedback
   
2. **ETF Look-Through:** Data sourcing challenge
   - **Mitigation:** Manual entry for MVP, automate later
   
3. **Market Data:** API costs & rate limits
   - **Mitigation:** Aggressive caching, multiple providers

### Medium-Risk Items
1. **Backend Scaling:** Performance under load
   - **Mitigation:** Start with proven stack, optimize later
   
2. **User Adoption:** Will people use AI features?
   - **Mitigation:** Beta testing, user interviews

---

## Success Metrics

### Phase 1 (Foundation)
- Backend uptime: >99%
- API response time: <200ms
- Data accuracy: >99.9%

### Phase 2 (Intelligence)
- AI response time: <3s
- AI accuracy: >90% (user satisfaction)
- ETF coverage: Top 20 ETFs

### Phase 3 (Scale)
- User retention: >60% (30-day)
- Daily active users: >40%
- Feature adoption: >70% use AI

---

## Conclusion

**Recommended Path:** Focus on critical path (items 1-4) for next 12 weeks, then reassess.

**Key Insight:** Backend infrastructure is the bottleneck. Everything else depends on it.

**Strategic Advice:** Don't launch without AI chatbot. It's your moat. But you can launch without education academy if needed.

**Timeline Reality Check:** 6-9 months to full vision with solo development. 3-4 months with a small team.

---

*This document should be reviewed monthly and updated based on progress and user feedback.*
