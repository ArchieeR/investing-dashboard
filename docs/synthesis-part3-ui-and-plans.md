# Synthesis Part 3: UI Design System & Product Plans

**Generated:** February 13, 2026
**Source:** dashboard/ UI reference + docs/ planning documents (all files)

---

## UI Design System

### Theme & Colors

#### Color Palette (Dark Theme - Primary)

The design system uses a neutral gray scale with blue accent, optimized for financial data display.

**Backgrounds (dark-to-light hierarchy):**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0a` | Page/body background |
| `--bg-secondary` | `#171717` | Section backgrounds, card default |
| `--bg-tertiary` | `#262626` | Elevated elements, hover states |
| `--bg-card` | `#171717` | Card surfaces |
| `--bg-card-hover` | `#262626` | Card hover state |

**Gray Scale:**
| Token | Value |
|-------|-------|
| `--gray-50` | `#fafafa` |
| `--gray-100` | `#f5f5f5` |
| `--gray-200` | `#e5e5e5` |
| `--gray-300` | `#d4d4d4` |
| `--gray-400` | `#a3a3a3` |
| `--gray-500` | `#737373` |
| `--gray-600` | `#525252` |
| `--gray-700` | `#404040` |
| `--gray-800` | `#262626` |
| `--gray-900` | `#171717` |
| `--gray-950` | `#0a0a0a` |

**Text Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#ffffff` | Headings, primary content |
| `--text-secondary` | `#a3a3a3` | Body text, descriptions |
| `--text-muted` | `#737373` | Placeholders, subtle labels |
| `--text-accent` | `#3b82f6` | Links, highlights |

**Accent / Semantic Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `--primary-500` | `#3b82f6` | Primary buttons, active tabs, focus rings |
| `--primary-600` | `#2563eb` | Primary hover states |
| `--success-500` | `#10b981` | Positive gains, green indicators |
| `--success-600` | `#059669` | Success hover |
| `--warning-500` | `#f59e0b` | Caution, approaching targets |
| `--warning-600` | `#d97706` | Warning hover |
| `--error-500` | `#ef4444` | Losses, errors, delete actions |
| `--error-600` | `#dc2626` | Error hover |

**Badge Colors (with transparency):**
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `rgba(59, 130, 246, 0.2)` | `#60a5fa` | `rgba(59, 130, 246, 0.3)` |
| Success | `rgba(34, 197, 94, 0.2)` | `#4ade80` | `rgba(34, 197, 94, 0.3)` |
| Warning | `rgba(245, 158, 11, 0.2)` | `#fbbf24` | `rgba(245, 158, 11, 0.3)` |
| Error | `rgba(239, 68, 68, 0.2)` | `#f87171` | `rgba(239, 68, 68, 0.3)` |
| Gray | `rgba(148, 163, 184, 0.2)` | `var(--text-secondary)` | `rgba(148, 163, 184, 0.3)` |

**Borders:**
| Token | Value | Usage |
|-------|-------|-------|
| `--border-color` | `#262626` | Default card/input borders |
| `--border-color-hover` | `#404040` | Hover state borders |
| Subtle separator | `rgba(255, 255, 255, 0.1)` | Table row borders, glassmorphism card borders |
| Ultra-subtle | `rgba(255, 255, 255, 0.05)` | Table cell bottom borders |

**Shadows:**
| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` |
| `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` |

**Border Radius:**
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.375rem` | Small elements, scrollbar |
| `--radius-md` | `0.5rem` | Buttons, inputs, tabs |
| `--radius-lg` | `0.75rem` | Cards, dropdowns |
| `--radius-xl` | `1rem` | Hero sections, large cards, modals |
| Full pill | `9999px` | Badges |

**Gradient Card Pattern:**
- `var(--gradient-card)` used in premium elements (asset cards, hero sections, allocation manager)
- Glassmorphism cards: `background: rgba(15, 23, 42, 0.8)` with `backdrop-filter: blur(20px)`
- Decorative gradient lines at top of hero sections (shimmer animation)

#### Typography

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
- Loaded from Google Fonts: weights 300, 400, 500, 600, 700, 800, 900
- Line height: `1.5` (body default)
- Font smoothing: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`

**Icon System:**
- Material Symbols Outlined (Google Fonts, weight 300-700, optical size 24-48)
- Used inline with `<span className="material-symbols-outlined">`
- Common icons: `add`, `delete`, `edit`, `close`, `more_vert`, `visibility`, `trending_up`, `trending_down`, `arrow_upward`, `arrow_downward`, `settings`, `person`, `logout`, `show_chart`, `analytics`, `search`, `filter_list`, `drag_indicator`

**Type Scale:**
| Name | Size | Usage |
|------|------|-------|
| xs | `0.75rem` | Badges, labels, table headers (uppercase + letter-spacing 0.05em) |
| sm / body | `0.875rem` | Body text, table cells, buttons, inputs |
| base | `1rem` | Section descriptions |
| lg | `1.125rem` | Card titles, settings header |
| xl | `1.25rem` | Close buttons, icon buttons |
| 2xl | `1.5rem` | Sub-page titles, section headings |
| 3xl (hero) | `1.875rem` | Page titles |
| 4xl (hero value) | `3rem` | Portfolio total value display |

**Font Weights:**
| Weight | Token | Usage |
|--------|-------|-------|
| 400 | normal | Body text |
| 500 | medium | Buttons, table cells, nav links |
| 600 | semibold | Card titles, section headings, active tabs, table headers |
| 700 | bold | Hero titles, gradient text headings |

---

### Layout Architecture

#### Global Layout
```
+------------------------------------------------------------------+
| Navigation (sticky, 64px, z-index 1000, glassmorphism)            |
+------------------------------------------------------------------+
| Main Content (maxWidth: 1440px, padding: 2rem, margin: 0 auto)   |
|                                                                    |
|  [Page-specific content]                                          |
|                                                                    |
+------------------------------------------------------------------+
```

**Navigation Bar:**
- Sticky top, 64px height, z-index 1000
- Glass effect: `backdrop-filter: blur(20px)`, `background: rgba(15, 23, 42, 0.8)`, `border-bottom: 1px solid rgba(255, 255, 255, 0.1)`
- Internal: maxWidth 1440px, flex between left/center/right
- Left: Logo (blue square icon) + product name
- Center: Nav links (Portfolio, Research, Analysis) with Material icons
- Right: Avatar dropdown (Profile, Settings, Logout)

#### Portfolio Page Layout
```
PortfolioSwitcher + PortfolioActions (row, space-between)
  |
PortfolioHero (2-column: value/gains | chart)
  |
HoldingsGrid (full-width table with toolbar)
  |
AllocationManager (collapsible, 2 tabs)
  |
PortfolioBreakdown (collapsible, 4 tabs with pie charts)
  |
TradeHistory (table with filters)
```

#### Research Page Layout
- Tabbed container: News | Events | Watchlists | Research Hub
- Each sub-page is a full component embedded in the tab content area

#### Analysis Page Layout
- Tabbed container: Overview | ETF Overlap | Exposure | Risk | Trade History
- Grid matrix for overlap heatmap (120px + repeat(5, 80px) columns)
- Analysis cards in grid layout

#### Settings Page Layout
- Sidebar (250px sticky) + Content area (max 800px centered)
- Sidebar tabs: Account, News Sources, Portfolio, Display, Notifications, Privacy, Data & Backup, Integrations, Advanced

#### Grid Patterns Used
| Pattern | Spec | Usage |
|---------|------|-------|
| Auto-fit summary | `repeat(auto-fit, minmax(280px, 1fr))` | Dashboard summary cards |
| Auto-fit metrics | `repeat(auto-fit, minmax(240px, 1fr))` | Metrics grid |
| Auto-fill watchlists | `repeat(auto-fill, minmax(350px, 1fr))` | Watchlist cards |
| Auto-fit checkboxes | `repeat(auto-fit, minmax(200px, 1fr))` | Column settings |
| Fixed matrix | `120px repeat(5, 80px)` | Overlap heatmap |

---

### Component Catalog

#### 1. PortfolioHero
- **File:** `dashboard/src/components/PortfolioHero.tsx`
- Two-column layout with gradient background
- Decorative top-line with shimmer animation
- Left: portfolio name, type badge (actual/draft/model), total value (3rem), day change, total gain
- Right: PortfolioChart (SVG line chart)
- Last updated timestamp

#### 2. HoldingsGrid (Primary - 1748 lines)
- **File:** `dashboard/src/components/HoldingsGrid.tsx`
- Dual mode: **Monitor** (read-only market view) / **Editor** (full editing)
- **Monitor columns:** ticker, name, livePrice, qty, dayChange, dayChangePercent, liveValue
- **Editor columns:** section, theme, assetType, name, ticker, exchange, account, livePrice, qty, liveValue, pctOfTheme, targetPct, targetDelta, include, actions
- Grouping by theme or account with collapsible headers showing group totals
- Inline section/theme/account filters in toolbar
- Column settings dropdown
- Per-row actions dropdown: Record Trade, Duplicate, Delete
- GBX/pence handling for UK stocks (divide by 100)
- Hover: row highlight with `rgba(51, 65, 85, 0.3)`, scale(1.01)

#### 3. HoldingsGridEnhanced (Alternative)
- **File:** `dashboard/src/components/HoldingsGridEnhanced.tsx`
- Search bar (250px min), filter chips, bulk selection
- Sortable columns: name, ticker, value, dayChange
- Bulk actions bar: Duplicate, Delete, Clear selection
- Inline editing support

#### 4. AllocationManager (1275 lines)
- **File:** `dashboard/src/components/AllocationManager.tsx`
- Collapsible section with two tabs: Portfolio Structure | Accounts
- Hierarchical: Sections contain Themes (expandable/collapsible)
- Each row: drag handle, name, live value, target amount, target %, progress bar
- Progress bars color-coded: green (near target), yellow (drifting), red (far from target)
- Add/delete sections, themes, accounts
- Drag-and-drop reordering
- Section Allocation Overview with stacked bar charts

#### 5. PortfolioBreakdown
- **File:** `dashboard/src/components/PortfolioBreakdown.tsx`
- Collapsible section
- Tabs: Sections | Themes | Accounts | Asset Types
- SVG pie charts with 10-color palette
- Legend with colored boxes, values, and percentages

#### 6. PortfolioChart
- **File:** `dashboard/src/components/PortfolioChart.tsx`
- SVG line chart with area fill gradient
- Time period selector: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
- Green gradient for positive performance, red for negative
- Mock data generation for demo

#### 7. PortfolioSwitcher
- **File:** `dashboard/src/components/PortfolioSwitcher.tsx`
- Horizontal tab bar: pill buttons for each portfolio
- Active: `--primary-500` background, white text, semibold
- Inactive: transparent, `--text-secondary`
- Settings icon button (2.5rem square)
- Dropdown for portfolio management actions

#### 8. PortfolioActions
- **File:** `dashboard/src/components/PortfolioActions.tsx`
- Icon buttons: Add Holding (primary blue), Record Trade, Rebalance
- 2.5rem square buttons with Material icons

#### 9. Navigation
- **File:** `dashboard/src/components/Navigation.tsx`
- Glassmorphism sticky nav (described in Layout Architecture above)

#### 10. MetricsGrid
- **File:** `dashboard/src/components/MetricsGrid.tsx`
- Auto-fit grid (minmax 240px)
- Cards: colored icon container (3rem), label (uppercase 0.75rem), value (1.75rem bold), change indicator
- Hover: `translateY(-4px)` with shadow-lg
- Status coloring: good (green), warning (yellow), bad (red), neutral (gray)
- Skeleton loading variant with shimmer

#### 11. DashboardSummary
- **File:** `dashboard/src/components/DashboardSummary.tsx`
- Auto-fit grid (minmax 280px) of summary cards
- Cards: Total Portfolio Value, Today's Performance
- GBP formatting: `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`

#### 12. FilterBar
- **File:** `dashboard/src/components/FilterBar.tsx`
- Glassmorphism container with gradient card background, backdrop blur 20px
- Filter groups with labeled selects
- Search input
- Clear all button
- Decorative gradient line at top

#### 13. TradeHistory
- **File:** `dashboard/src/components/TradeHistory.tsx`
- Table with sortable columns
- Filters: type (buy/sell), account, date range
- Summary row: total trades, total value, P/L
- Currency formatting with `formatCurrency = (value) => £${value.toFixed(2)}`

#### 14. PortfolioExposureAnalysis
- **File:** `dashboard/src/components/PortfolioExposureAnalysis.tsx`
- Tabs: Companies | Sectors | Countries
- ETF look-through: calculates combined exposure through all ETFs
- Table: symbol, name, totalWeight, totalValue, exposures by ETF
- Glassmorphism container with gradient card
- Gradient text titles: `background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent`

#### 15. ETFHoldingsDetail
- **File:** `dashboard/src/components/ETFHoldingsDetail.tsx`
- Modal overlay: `rgba(0, 0, 0, 0.8)` with `backdrop-filter: blur(10px)`
- Modal: 800px max, glassmorphism card
- Tabs for different views of ETF holdings data
- Close button: red-tinted (error-500 with opacity backgrounds)

#### 16. ColumnSettings
- **File:** `dashboard/src/components/ColumnSettings.tsx`
- Modal overlay with centered modal (600px max, 80vh max-height)
- Checkbox grid (auto-fit minmax 200px)
- Grouped by category
- Toggle columns visible/hidden

#### 17. SettingsPanel
- **File:** `dashboard/src/components/SettingsPanel.tsx`
- Sidebar navigation (250px) + content area (800px max)
- Tabs: Account, News Sources, Portfolio, Display, Notifications, Privacy, Data & Backup, Integrations, Advanced
- Active tab: blue background, white text
- Includes backup/restore components

#### 18. Toast Notifications
- **File:** `dashboard/src/components/common/Toast.tsx`
- Fixed bottom-right, z-index 9999
- 4 types: success, error, warning, info with semantic colored backgrounds
- Glassmorphism with backdrop blur
- Slide-in animation, auto-dismiss (default 5s)

#### 19. SkeletonLoader
- **File:** `dashboard/src/components/common/SkeletonLoader.tsx`
- Shimmer animation (CSS class `.shimmer`)
- Variants: base Skeleton, SkeletonTableRow, SkeletonCard, SkeletonHoldingsTable

#### 20. EmptyState
- **File:** `dashboard/src/components/common/EmptyState.tsx`
- Centered: 4rem icon, 1.5rem title, 1rem description
- Primary and secondary action buttons

#### Page Components (14 pages total)

| Page | File | Key Features |
|------|------|-------------|
| Portfolio | Main in App.tsx | Hero + Grid + Allocation + Breakdown + Trades |
| Research | ResearchPage.tsx | Tabbed: News, Events, Watchlists, Research Hub |
| Analysis | AnalysisPage.tsx | Tabbed: Overview, ETF Overlap, Exposure, Risk, Trades |
| News | NewsPage.tsx | Cards with sentiment, category filtering, tags |
| Events | EventsPage.tsx | Calendar + List views, earnings/economic/political types, portfolio weight column |
| Watchlists | WatchlistsPage.tsx | Grid of watchlist cards, detail view, AI generator view |
| Asset Research Hub | AssetResearchHub.tsx | Search/filter/compare assets, detail view |
| Asset Detail | AssetDetailPage.tsx | Full asset view: overview, news, performance, metrics |
| Asset Comparison | AssetComparison.tsx | Side-by-side (up to 4), tabbed metrics |
| ETF Explorer | ETFExplorer.tsx | Grid of ETF cards, filtering, search |
| Overlap | OverlapPage.tsx | Heatmap matrix, common holdings |
| Analytics | AnalyticsPage.tsx | Performance, risk, allocation vs targets |
| Trades | TradesPage.tsx | Enhanced trade history, filtering, export |
| Insights | InsightsPage.tsx | AI-powered insights panel |

---

### CSS Patterns & Effects

#### Glassmorphism
Used for navigation, filter bars, modals, and premium cards:
```css
.nav-glass {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```
Also applied to: badges, table headers, toast notifications, modal overlays, filter bars.

#### Animations (6 Keyframes)

**fadeIn** - Page/section entrance:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Usage: animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) */
```

**fadeInUp** - Badge/element entrance:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Usage: animation: fadeInUp 0.5s ease-out */
```

**slideInRight** - Side panel entrance:
```css
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
/* Usage: animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) */
```

**pulse** - Status dot breathing:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
/* Usage: animation: pulse 2s infinite */
```

**glow** - Blue accent glow:
```css
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
}
/* Usage: animation: glow 2s ease-in-out infinite */
```

**shimmer** - Skeleton loading:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer {
  background: linear-gradient(90deg,
    rgba(51, 65, 85, 0.3) 25%,
    rgba(71, 85, 105, 0.5) 50%,
    rgba(51, 65, 85, 0.3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

#### Hover Effects (Inline Styles Pattern)
```typescript
// Card hover - lift + shadow
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-4px)';
  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = 'none';
}}

// Table row hover (CSS class)
.table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
  transform: scale(1.01);
}
```

#### Transition Standards
- Default: `transition: all 0.15s ease` (buttons, inputs, tabs)
- Smooth: `transition: all 0.2s ease` (cards, filters)
- Rich: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (badges, table rows)

#### Focus Styles
```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
input:focus { border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
```

#### Status Indicators with Glow
```css
.status-dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; animation: pulse 2s infinite; }
.status-dot.success { background: var(--success-500); box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
.status-dot.warning { background: var(--warning-500); box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
.status-dot.error { background: var(--error-500); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
```

#### Gradient Text Pattern
Used for premium headings in exposure analysis and ETF detail:
```typescript
const titleStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-accent) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
```

#### Scrollbar Styling
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); border-radius: var(--radius-sm); }
::-webkit-scrollbar-thumb { background: var(--gray-600); border-radius: var(--radius-sm); }
::-webkit-scrollbar-thumb:hover { background: var(--gray-500); }
```

#### Responsive Breakpoint
Single breakpoint at `768px`:
```css
@media (max-width: 768px) {
  .card-body { padding: 1rem; }
  .btn { padding: 0.625rem 1.25rem; font-size: 0.8125rem; }
  .table th, .table td { padding: 0.75rem 0.5rem; }
}
```

#### Styling Approach
- **Hybrid CSS + Inline:** Global styles in `styles.css` with CSS custom properties; component-specific styles as TypeScript `CSSProperties` objects (inline)
- **No CSS-in-JS library.** All component styles are plain objects passed to `style` prop
- **CSS classes** for global reusable patterns: `.btn`, `.card`, `.badge`, `.table`, `.shimmer`, `.nav-glass`, utility classes
- **Inline styles** for component-specific layout, sizing, positioning

#### Utility Classes Available
```css
/* Text */ .text-xs .text-sm .text-base .text-lg .text-xl .text-2xl
/* Weight */ .font-medium .font-semibold .font-bold
/* Color */ .text-gray-500 .text-gray-600 .text-gray-700 .text-gray-900 .text-primary .text-success .text-warning .text-error
/* Flex */ .flex .items-center .justify-between .gap-2 .gap-4
/* Spacing */ .mb-2 .mb-4 .mb-6 .p-4 .p-6
/* Animation */ .animate-fade-in .animate-slide-in .animate-glow
```

---

## Product Plans

### Roadmap

#### Phase Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| MVP | Completed | Frontend with mock data, core portfolio management | Done |
| 1. Firebase Integration | 4 weeks | Auth, Firestore, real-time sync, hosting | Planning |
| 2. Real Data Integration | 4 weeks | Market data APIs, news, ETF data | Future |
| 3. Advanced Analytics | 4 weeks | Risk metrics, performance, portfolio optimization | Future |
| 4. AI Integration | 4 weeks | Gemini chatbot, RAG, portfolio intelligence | Future |
| 5. Education System | 4 weeks | Academy, quizzes, simulators | Future |
| 6. Alerts & Automation | 4 weeks | Price/drift/event alerts, smart notifications | Future |
| 7. Mobile & Polish | 4 weeks | PWA, native apps, accessibility audit | Future |
| 8. Scale & Monetization | Ongoing | Growth, referral, API, enterprise | Future |

**Total to MVP+:** 28 weeks (~7 months)
**Total to Full Vision:** 12+ months

#### Current Status (as per docs)
- Phase 1, Week 0 (Planning)
- Frontend feature-complete with mock data
- Ready for backend integration

#### Refined Timeline (from summary.md)

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| Foundation | 1-12 | Backend infra, auth, real market data, ETF look-through MVP, real events/news |
| Intelligence | 13-24 | AI chatbot (Gemini), analytics, alerts, tax helpers, Education v1 |
| Scale | 25-36 | Full ETF automation, factor analysis, Monte Carlo, broker connections, mobile |

#### Critical Path Items (ICE Scored from archive)
1. **Backend Infrastructure** - ICE 9.0 (blocks everything)
2. **Real Market Data** - ICE 8.4 (core value proposition)
3. **AI Chatbot** - ICE 8.1 (differentiator, "don't launch without it")
4. **ETF Look-Through** - ICE 7.2 (unique feature for UK market)

---

### Architecture Decisions

#### Current Stack (Frontend Only - Dashboard Reference)
- React 18 + TypeScript
- Vite (build tool)
- State: React Context + useReducer
- Styling: CSS Variables + Inline CSSProperties objects
- Data: localStorage
- Pricing: Yahoo Finance API (client-side)

#### Target Stack (Invorm - Next.js Implementation)
- **Framework:** Next.js 16 + React 19 + TypeScript strict
- **Styling:** Tailwind v4 + Shadcn UI + Framer Motion
- **Backend:** Firebase (Auth, Firestore, Cloud Functions Gen 2)
- **Market Data:** FMP API (40+ endpoints, Zod-validated) + Apify (LSE pricing)
- **Payments:** Stripe (2 tiers)
- **AI:** Genkit + Vertex AI (Google Gemini)
- **Monitoring:** Sentry
- **Hosting:** Firebase Hosting / Vercel

#### Database Decision History
1. **Initially planned:** PostgreSQL (relational, JSONB, mature) - see `archive/DATABASE_ARCHITECTURE.md`
2. **Pivoted to:** Firebase/Firestore (real-time sync, offline-first, serverless, lower dev overhead)
3. **Rationale:** Solo developer, faster time-to-market, built-in auth, real-time out of box, free tier covers MVP

#### Firestore Schema (Confirmed)
```
users/{userId}           -> profile, preferences, subscription, stats
portfolios/{portfolioId} -> metadata, settings, budgets, computed values
  /holdings/{holdingId}  -> position data, live price cache, computed fields
  /trades/{tradeId}      -> trade details, performance tracking
watchlists/{watchlistId} -> theme, market cap focus, stats
  /stocks/{stockId}      -> cached price data, portfolio status
instruments/{ticker}     -> shared market data (write: Cloud Functions only)
  /prices/{date}         -> OHLCV
news/{articleId}         -> shared news (write: Cloud Functions only)
events/{eventId}         -> shared events (write: Cloud Functions only)
```

#### Cloud Functions Plan
| Function | Trigger | Frequency |
|----------|---------|-----------|
| `updateLivePrices` | PubSub schedule | Every 10 min (market hours) |
| `calculatePortfolioMetrics` | Firestore onWrite | On holding/trade change |
| `updateTradePerformance` | PubSub schedule | Daily at midnight |
| `fetchNews` | PubSub schedule | Every hour |
| `fetchEvents` | PubSub schedule | Daily at 06:00 |

#### Security Rules Design
- Owner-based access: users can only read/write their own data
- Shared data (instruments, news, events): read-only for authenticated users, write-only from Cloud Functions
- Holdings/trades: access verified via parent portfolio ownership

#### API Strategy
- **MVP:** FMP API (covers most needs) + Apify for LSE pricing gaps
- **News:** NewsAPI.org (free tier: 100 req/day), Finnhub (sentiment), Alpha Vantage News
- **ETF Data:** Source ETF holdings from FMP / data providers
- **Fallback:** RSS feeds for news sources where API unavailable

---

### Feature Priorities

#### What Is Built (Frontend Complete)
- Multiple portfolios (Main, ISA, SIPP) with actual/draft/model types
- Hierarchical structure: Portfolio > Section > Theme > Holding
- Holdings grid with monitor/editor dual mode, inline editing
- Trade recording with cost basis tracking
- Target allocation and rebalancing logic
- Budget management by section/theme/account
- Draft portfolios for what-if scenarios
- CSV import/export (3 formats: spec, Interactive Investor, Hargreaves Lansdown)
- Yahoo Finance live pricing with multi-currency (GBP, USD, EUR, GBX)
- Asset Research Hub: search, compare (up to 4), detail pages
- ETF overlap matrix
- Sector and geographic exposure analysis
- Risk metrics display (Sharpe, Beta, Volatility, Max Drawdown)
- News/events/watchlists (mock UI)
- Responsive dark theme with glassmorphism
- Column customization
- Backup/restore system

#### What Uses Mock Data (Needs Real Backend)
- News articles
- Events calendar
- Asset fundamentals (P/E, market cap, etc.)
- ETF holdings data
- Watchlist stocks
- Risk metrics calculations
- Performance history

#### What Is Not Built Yet
| Feature | Priority | Phase |
|---------|----------|-------|
| User authentication | Critical | 1 |
| Data persistence (beyond localStorage) | Critical | 1 |
| Multi-device sync | High | 1 |
| Real market data integration | High | 2 |
| ETF look-through (real) | High | 2 |
| AI chatbot (Gemini) | High | 2 |
| Advanced analytics (real calculations) | Medium | 3 |
| Education academy | Medium | 5 |
| Alerts & notifications | Medium | 6 |
| Broker integrations | Low | 9+ |
| Monte Carlo simulations | Low | 9+ |
| Factor analysis (Fama-French) | Low | 9+ |

#### Feature Specs from Archive

**Events System:**
- 3 event types: Economic (GDP, CPI, rates), Political (elections, policy), Company (earnings, RNS, dividends, splits, M&A)
- 2 view modes: Calendar view (month grid with event dots) + List view (sortable table)
- Portfolio-aware: shows ETF membership % and total exposure for each event
- Column customization in list view
- Earnings X-Ray (future AI feature): set expectations, flag beat/miss, AI-powered outlook analysis

**Watchlists System:**
- Multiple themed watchlists: Growth, Dividend Aristocrats, Tech Leaders, Value Plays, ESG, Emerging Markets, Small Cap, Blue Chips, Momentum, Custom
- Market cap categories: Large (>$10B), Mid ($2B-$10B), Small (<$2B)
- AI Watchlist Generator: recommendations based on portfolio analysis, risk tolerance, sector preferences
- View modes: overview (card grid), detail (stock table), AI generator

**Asset Research Hub:**
- Universal search (stocks, ETFs, funds)
- Side-by-side comparison (up to 4 assets)
- Individual detail pages: overview, news, performance, holdings (ETFs), fundamentals (stocks)
- Quick actions: add to watchlist, add to portfolio, compare, export

**News System:**
- Multi-source: Reuters, Barron's, WSJ, MarketWatch (API: NewsAPI.org, Alpha Vantage, Finnhub)
- Subscription source handling (RSS, API key, OAuth)
- AI-powered filtering and categorization
- Sentiment analysis (positive/neutral/negative)
- Portfolio-contextualized relevance

---

### Business Rules

#### Pricing Tiers

**From MEMORY.md (confirmed, most recent):**
| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | 1 portfolio, 10 holdings, basic analytics, CSV import |
| Pro | 12/mo (GBP) | Unlimited portfolios, unlimited holdings, ETF look-through, alerts, overlap analysis, research hub, AI chatbot |

**From earlier docs (may evolve):**
| Tier | Price | Features |
|------|-------|---------|
| Free | $0 | 1 portfolio, basic features, CSV import |
| Pro | $9.99/mo | Unlimited portfolios, advanced analytics, alerts, AI assistant |
| Enterprise | $49.99/mo | Multi-user, adviser tools, white-label, API access |

#### Target Audience
- **Primary:** UK retail investors
- **Secondary:** US retail investors (phase 2)
- UK-specific: ISA/SIPP/LISA/GIA wrappers, GBP base currency, LSE listings
- Expertise range: "simple by default, advanced when needed"

#### Domain Model (Core Business Rules)
- **Hierarchy:** Portfolio > Section (Core/Satellite/Alternatives) > Theme > Holding
- **Budget system:** 3-tier (section, theme, account) with percentage preservation algorithm
- **Cash buffer:** Auto-adjusts when lockTotal=true to maintain portfolio total within +/-0.01
- **Dual calculations:** Live (market value using current prices) + Target (allocation planning using percentages)
- **3-tier caching** for calculated values
- **GBX handling:** UK stocks priced in pence - divide by 100 for GBP display
- **Two-way editing:** Editing Value back-solves Qty (`qty = value / price` when `price > 0`)
- **Include toggle:** Excluded rows ignored by totals, percentages, targets, breakdowns
- **CSV import:** 3 formats (spec, Interactive Investor, Hargreaves Lansdown); IDs regenerated on import
- **Draft portfolios:** Fork from live; highlight diffs in value, weights, fees, risk
- **Playground mode:** Snapshot/restore for safe experimentation

#### Non-Functional Requirements
- GDPR compliant: data minimization, export/delete, clear non-advice disclaimers
- Idempotent imports, recovery from partial loads, versioned portfolio states
- Portfolio of 5,000 lines (with look-through) loads in <2s (target)
- Keyboard navigation, readable contrasts, clear numerics
- <200ms for most operations
- Works offline (with sync when online)

#### Key Metrics / KPIs
| Area | Metric | Target |
|------|--------|--------|
| Technical | Data loss | Zero |
| Technical | Initial load | <2s |
| Technical | Operation latency | <200ms |
| Data | Accuracy | 99.9% |
| Data | Freshness | <1 hour |
| AI | Helpful responses | 80%+ |
| AI | Response time | <3s |
| Education | Module completion | 40%+ |
| Alerts | Adoption | 50%+ |
| Mobile | Mobile usage | 40%+ |
| Scale | Active users | 1,000+ |
| Scale | Paid conversion | 10%+ |
| Scale | 30-day retention | 60%+ |

#### Product Identity
- Name: Currently "Invorm" (temporary, not hardcoded)
- Landing page: Separate project at invest.app
- Dashboard: dashboard.invest.app
- Google Finance-like aesthetic: slick, simple, dark theme
- Mission: "Democratize investment intelligence" - bring Bloomberg-terminal-level insights to retail investors in an accessible format

---

## Summary of Key Design Decisions for Rebuild

1. **Dark theme is primary** - the entire UI is designed around dark backgrounds (#0a0a0a base) with white text and blue accent (#3b82f6)
2. **Glassmorphism for premium feel** - backdrop blur + transparent backgrounds on nav, modals, filter bars, premium cards
3. **Inline styles pattern** - dashboard uses CSSProperties objects, NOT CSS-in-JS; global styles in a single CSS file
4. **Material Symbols Outlined** for all icons (not icon library)
5. **Inter font** for all text
6. **1440px max-width** content area with 2rem padding
7. **Holdings grid is the centerpiece** - 1748 lines, dual mode, grouping, inline editing, GBX handling
8. **Allocation manager is deeply hierarchical** - sections > themes with drag-and-drop, progress bars, stacked bar charts
9. **Tab-based navigation** within pages (Research, Analysis) - not separate routes
10. **Portfolio switcher** as horizontal pill tabs, not sidebar
11. **All financial values in GBP** by default with `Intl.NumberFormat('en-GB')`
12. **6 keyframe animations** cover all motion needs: fadeIn, fadeInUp, slideInRight, pulse, glow, shimmer
13. **Transition standard:** 0.15s ease (default), 0.2s (cards), 0.3s cubic-bezier (rich)
