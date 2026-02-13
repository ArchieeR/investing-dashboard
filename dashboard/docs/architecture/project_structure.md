# Project Structure & Architecture

**Last Updated:** Jan 2026
**Framework:** Next.js 16 (App Router)

## 1. High-Level Taxonomy
We generally follow a **Feature-First** architecture. Components are grouped by the "Domain" they belong to, rather than their technical type (e.g. we avoid a giant `components/forms` folder in favor of `components/features/auth/LoginForm`).

```
src/
├── app/                    # Next.js App Router (Pages & Layouts)
│   ├── (auth)/             # Route Group: Isolated Auth Layout
│   └── (dashboard)/        # Route Group: Main App Shell (Navbar, Sidebar)
├── components/
│   ├── ui/                 # Primitives (Buttons, Cards, Inputs - Shadcn)
│   ├── layout/             # Global Shell (Navbar, Footer, ThemeToggle)
│   ├── features/           # Domain-Specific Components
│   └── shared/             # Reusable Business Components (TickerBadge, AssetIcon)
├── lib/                    # Utilities, Helpers, Constants
├── services/               # API Clients, Data Fetching, Backend Logic
└── types/                  # TypeScript Definitions
```

## 2. Page Map (App Router)

### 🔐 Authentication Group `(auth)`
*Layout:* `src/app/(auth)/layout.tsx` (Centered, simplified, no navbar).
*   `/login`: `src/app/(auth)/login/page.tsx`
*   `/register`: `src/app/(auth)/register/page.tsx`

### 💻 Dashboard Group `(dashboard)`
*Layout:* `src/app/(dashboard)/layout.tsx` (Sticky Navbar, Max-Width Container).
*   `/`: **Dashboard (Playground)**
    *   *Path:* `src/app/(dashboard)/page.tsx`
    *   *Purpose:* Day-to-day management. Excel-style grid.
*   `/analytics`: **Analytics Dashboard**
    *   *Path:* `src/app/(dashboard)/analytics/page.tsx`
    *   *Purpose:* Performance metrics, Risk (Sharpe/Beta), Overlap matrix.
*   `/explorer`: **Asset Explorer**
    *   *Path:* `src/app/(dashboard)/explorer/page.tsx`
    *   *Purpose:* ETF Research, "Look-Through" analysis, Search.
*   `/research`: **Research Hub**
    *   *Path:* `src/app/(dashboard)/research/page.tsx`
    *   *Purpose:* News feed, Economic Calendar, Corporate Events.
*   `/chat`: **AI Agent**
    *   *Path:* `src/app/(dashboard)/chat/page.tsx`
    *   *Purpose:* Full-screen conversation mode.

## 3. Component Directory Map

### `src/components/layout`
*   `Navbar.tsx`: Top navigation bar.
*   `UserNav.tsx`: Profile dropdown.

### `src/components/features` (The "Brains")

| Folder | Domain | Key Components |
| :--- | :--- | :--- |
| **`dashboard`** | Portfolio Managment | `PlaygroundGrid`, `AllocationManager`, `PortfolioSummary`, `TradeHistoryDrawer` |
| **`analytics`** | Deep Dive Stats | `RiskMetrics`, `OverlapMatrix`, `ExposureBreakdown`, `PerformanceAttribution` |
| **`explorer`** | Research Engine | `SearchOmnibox`, `LookThroughVisualizer`, `EtfAttribution`, `AssetCard` |
| **`research`** | News & Events | `MacroCalendar`, `NewsFeed`, `ImpactCard`, `CorporateEvents` |
| **`chat`** | AI Interface | `ChatInterface`, `AgentSidebar` |

### `src/components/shared`
*   `TickerBadge.tsx`: Standardized chip for assets (e.g. `$NVDA`).
*   `TrendIndicator.tsx`: Green/Red arrow helpers.
*   `AssetLogo.tsx`: Wrapper for fetching logos from FMP.

## 4. Key Architectural Patterns
*   **Layered Services:** Components do NOT fetch data directly if complex. They call `src/services/` (which handles caching/error logic), or use a specific Hook.
*   **Optimistic UI:** The Dashboard Grid must update instantly on edit, syncing to the backend in the background.
