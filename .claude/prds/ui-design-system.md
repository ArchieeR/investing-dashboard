---
name: ui-design-system
description: Swiss Precision dark theme design system with design tokens, component catalog, animations, typography, responsive rules, and Shadcn/UI integration.
status: backlog
created: 2026-02-13T10:51:08Z
updated: 2026-02-13T11:07:20Z
---

# PRD: UI Design System — Swiss Precision

## Executive Summary

This PRD defines the complete design system for the portfolio intelligence platform. The visual language is **Swiss Precision** — a dark, data-dense, typographically rigorous aesthetic inspired by Swiss design principles and financial terminal UIs. It uses Space Grotesk for headlines, JetBrains Mono for data/labels, and system-ui for body text. The primary accent is **Orange (#FF6B00)** against a near-black background (#0C0C0C). The system is built on Tailwind CSS v4, Shadcn/UI + Radix, and Framer Motion for scroll-triggered animations.

## Problem Statement

Financial data platforms must present dense numerical information clearly without visual fatigue. The design must communicate trustworthiness (dark, professional aesthetic), enable quick scanning of gains/losses (semantic colour coding), and work equally well on desktop for data-heavy editing and on mobile for monitoring. The system must bridge from the existing dashboard reference (CSS custom properties + inline CSSProperties) to the target stack (Tailwind v4 + Shadcn/UI), establishing a unified visual language across marketing pages and the dashboard app.

## User Stories

### US-1: Consistent Visual Language
**As a** user,
**I want** all screens to share the same dark theme, colour palette, and interaction patterns,
**So that** the application feels professional and cohesive.

**Acceptance Criteria:**
- All backgrounds derive from `#0C0C0C` (page) / `#141414` (cards) / `#1A1A1A` (hover)
- Primary accent is Orange (`#FF6B00`)
- Gains are always `#22C55E`, losses are always `#EF4444`
- All components use semantic Tailwind classes (e.g., `bg-background`, `text-foreground`), never hardcoded hex in dashboard components (marketing pages may use hardcoded tokens during prototyping)
- Border radius: `rounded-[4px]` for buttons/inputs, `rounded-lg` for cards
- Borders: `border-[#27272A]` (Zinc-800)

### US-2: Readable Financial Data
**As a** user scanning portfolio data,
**I want** numbers, percentages, and currency values to be instantly readable,
**So that** I can make quick investment decisions.

**Acceptance Criteria:**
- Tickers use `JetBrains Mono` in Cyan (`#22D3EE`) for instant recognition
- Data values use `JetBrains Mono` for tabular alignment
- Day change uses green (`#22C55E`) for positive, red (`#EF4444`) for negative
- Currency formatting: GBP uses `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`
- GBX displays as `{amount}p` with 0 decimal places
- Table headers: mono font, `text-[#52525B]`, `font-medium`
- Progress bars: orange fill (`#FF6B00`) on zinc track (`#27272A`)

### US-3: Mobile-First Responsive Design
**As a** mobile user,
**I want to** monitor my portfolio on my phone,
**So that** I can check positions anywhere.

**Acceptance Criteria:**
- All layouts start mobile-first (`w-full`, `flex-col`) and expand with breakpoints
- Primary breakpoints: `md:` (768px), `lg:` (1024px)
- Touch targets minimum `h-10` (40px) or `h-12` (48px) on mobile
- Minimum container padding: `px-6` on all viewports
- Navigation items collapse to Sheet/Drawer on mobile
- Maximum content width: `max-w-[1200px]` with `px-6` padding
- 12-column grid (`grid-cols-12`) for layout composition

### US-4: Smooth Scroll-Triggered Animations
**As a** user,
**I want** subtle fade-in animations as content enters the viewport,
**So that** the interface feels responsive and polished.

**Acceptance Criteria:**
- Sections fade in using Framer Motion `useInView` with `once: true`
- Default entrance: opacity 0 → 1, duration 0.6s, ease "easeOut"
- Staggered children: 0.08-0.12s delay per item
- Progress bars animate width from 0 to target on scroll (`whileInView`)
- SVG chart lines animate `pathLength` from 0 → 1
- Table rows fade in with 0.05s stagger
- No translateY on entrance (opacity-only for Swiss precision aesthetic)
- All animations respect `prefers-reduced-motion`

## Functional Requirements

### FR-1: Theme Tokens (Design Palette)

#### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#0C0C0C` | Page/body background |
| `--bg-card` | `#141414` | Card surfaces, panels |
| `--bg-card-hover` | `#1A1A1A` | Card/row hover state |
| `--bg-elevated` | `#0C0C0C` | Chat window headers, code blocks |
| `--bg-features` | `#0A1A0A` | Features section (subtle green tint) |

#### Text Colours (Zinc Scale)
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#E4E4E7` | Headings, primary content (zinc-200) |
| `--text-secondary` | `#A1A1AA` | Body text, descriptions (zinc-400) |
| `--text-muted` | `#52525B` | Labels, placeholders, timestamps (zinc-600) |
| `--text-accent` | `#FF6B00` | Feature labels, highlights |

#### Accent / Semantic Colours
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#FF6B00` | Primary buttons, CTAs, feature labels, progress bars |
| `--accent-primary-hover` | `#FF6B00/90` | Primary hover (90% opacity) |
| `--semantic-positive` | `#22C55E` | Gains, positive changes, portfolio line |
| `--semantic-negative` | `#EF4444` | Losses, errors, delete actions |
| `--semantic-ticker` | `#22D3EE` | Ticker symbols (cyan) |
| `--semantic-warning` | `#F59E0B` | Caution, approaching targets |

#### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `#27272A` | Card borders, table dividers, nav border |
| `--border-subtle` | `#27272A/50` | Inner table row borders |
| `--border-hover` | `#52525B` | Border hover state |

#### Shadows
Minimal shadow usage — Swiss Precision relies on borders and background contrast for depth, not drop shadows. Use sparingly for elevated overlays only:
| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` |

#### Border Radius
| Usage | Value | Tailwind |
|-------|-------|----------|
| Buttons, inputs, badges | `4px` | `rounded-[4px]` |
| Cards, panels, tables | `0.5rem` | `rounded-lg` |
| Chat bubbles | `1rem` | `rounded-2xl` |
| Progress bar tracks | `9999px` | `rounded-full` |

### FR-2: Typography

**Three-font system:**

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| Headlines | Space Grotesk | sans-serif | Page titles, section headings, nav logo |
| Mono/Data | JetBrains Mono | monospace | Tickers, values, labels, metrics, table headers |
| Body | system-ui | -apple-system, sans-serif | Paragraphs, descriptions, nav links, buttons |

**Font Loading:** Google Fonts link in layout.tsx for Space Grotesk (400-700) and JetBrains Mono (400-700). Body uses system fonts (no loading penalty).

**Tailwind mapping:**
- `font-sans` → system-ui (body default)
- `font-mono` → JetBrains Mono
- Headlines use inline `style={{ fontFamily: font.headline }}` until CSS variables are wired

| Size | Value | Usage |
|------|-------|-------|
| xs | `0.625rem` (10px) | Micro labels (uppercase tracking-widest) |
| sm | `0.875rem` (14px) | Body text, table cells, buttons, nav links |
| base | `1rem` (16px) | Section descriptions |
| lg | `1.125rem` (18px) | Card titles, nav logo |
| xl | `1.25rem` (20px) | Sub-section headings |
| 2xl | `1.5rem` (24px) | Section headings, card values |
| 3xl-4xl | `1.875-2.25rem` | Page section headings |
| 5xl-6xl | `3-3.75rem` | Hero title (responsive: `text-5xl lg:text-6xl`) |

**Font Weights:** 400 (body), 500 (metric values, table cells), 600 (section headings, nav links), 700 (hero title, card values, section titles).

**Heading Style:** `font-bold tracking-tight` for the precision look.

**Micro-labels:** `text-[10px] font-semibold uppercase tracking-widest` with mono font (used for "TRUE EXPOSURE", feature numbers).

### FR-3: Layout Architecture

**Grid System:** 12-column grid (`grid-cols-12`) with `gap-6`. Content area: `max-w-[1200px] mx-auto px-6`.

**Marketing Page Layout:**
- Navigation (fixed, h-16, z-50, backdrop-blur-md, `bg-[#0C0C0C]/90`)
- Hero: 12-col grid (6-col text + 5-col dashboard card from col-8)
- Ticker strip: full-width overflow with CSS `ticker-scroll` animation
- Metrics strip: 4-col grid (`grid-cols-2 md:grid-cols-4`)
- Feature panels: 12-col grid (4-col text + 7-col visual, alternating sides)
- Pricing: 3-col equal grid (`grid-cols-1 md:grid-cols-3`)
- Footer: 4-col grid (`grid-cols-2 md:grid-cols-4`)

**Dashboard Layout:**
- Navigation (sticky, 64px, z-50, glassmorphism)
- Main Content: `max-w-[1200px]` centered
- Portfolio page: PortfolioSwitcher → PortfolioHero → HoldingsGrid → AllocationManager → PortfolioBreakdown
- Research page: Tabbed container
- Settings page: Sidebar (250px) + Content (800px max)

**Navigation Pattern:**
```
nav: fixed top-0, bg-[#0C0C0C]/90 backdrop-blur-md border-b border-[#27272A]
  inner: max-w-[1200px] px-6 h-16 flex items-center justify-between
  logo: text-lg font-bold tracking-tight, Space Grotesk
  links: text-sm text-[#A1A1AA] hover:text-[#E4E4E7]
  cta: bg-[#FF6B00] text-[#0C0C0C] rounded-[4px] px-4 py-2
```

### FR-4: Component Catalog

#### Marketing Components
1. **FadeSection** — Scroll-triggered opacity fade using Framer Motion `useInView`. Props: children, className, delay.
2. **TickerStrip** — Infinite horizontal scroll of ticker symbols with CSS animation. Cyan tickers, green/red changes.
3. **DashboardCard** — Hero preview card showing portfolio value, mini SVG chart, holdings list.
4. **PricingCard** — Tier card with feature list, highlighted variant gets orange left border + "POPULAR" badge.
5. **AIChat** — Bubble-style chat interface. User messages: orange bubbles right-aligned. AI messages: bordered dark bubbles left-aligned. Window header with traffic light dots.

#### Dashboard Components (20+)
6. **HoldingsGrid** — Dual mode (monitor/editor), grouping, inline editing, GBX handling
7. **AllocationManager** — Collapsible, 2 tabs, hierarchical sections > themes, progress bars
8. **PortfolioBreakdown** — Collapsible, 4 tabs, SVG pie charts
9. **PortfolioChart** — SVG line chart with area fill, time period selector
10. **PortfolioSwitcher** — Horizontal pill tabs
11. **PortfolioActions** — Icon buttons (Add, Trade, Rebalance)
12. **MetricsGrid** — Auto-fit grid, data cards with mono values
13. **FilterBar** — Glassmorphism, filter chips, search input
14. **TradeHistory** — Sortable table with filters
15. **PortfolioExposureAnalysis** — ETF look-through, treemap visualization
16. **ColumnSettings** — Modal checkbox grid
17. **SettingsPanel** — Sidebar nav + content area
18. **Toast** — Fixed bottom-right, z-50, auto-dismiss 5s
19. **SkeletonLoader** — Shimmer animation variants
20. **EmptyState** — Centered: icon, title, description, action buttons
21. **InsightsPanel** — Three-card grid, budget inputs

### FR-5: Animations

**Primary Framework:** Framer Motion (not CSS keyframes for content animations).

| Pattern | Implementation | Timing |
|---------|---------------|--------|
| Section fade-in | `useInView` + opacity 0→1 | 0.6s easeOut |
| Staggered list | Children with `delay: i * 0.08` | 0.6s per item |
| Table row reveal | `whileInView={{ opacity: 1 }}` | 0.3s, 0.05s stagger |
| Progress bar fill | `whileInView={{ width }}` | 0.8s easeOut |
| Chart line draw | `whileInView={{ pathLength: 1 }}` | 1.5s easeOut |
| Hero entrance | `animate={{ opacity: 1 }}` | 0.6s, 0.15s stagger |

**CSS Animations (marketing only):**
| Animation | Usage |
|-----------|-------|
| `ticker-scroll` | Infinite horizontal ticker strip, 40s linear |
| `float1/2/3` | Mesh gradient background blobs (if used) |

**Transitions:** Default `transition-colors duration-200` for hover states. `duration-150` for table row hover.

### FR-6: Focus & Accessibility

```css
*:focus-visible {
  outline: 2px solid #FF6B00;
  outline-offset: 2px;
  border-radius: 4px;
}
input:focus {
  border-color: #FF6B00;
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
}
```

Semantic colour coding always paired with text/icon indicators (not colour alone).

### FR-7: Iconography

**Library:** `lucide-react` (only approved icon library).
**Usage:** Strategic, not decorative. Default `stroke-2` or `stroke-[1.5]`.
**Common icons:** Plus, Trash, Edit, X, MoreVertical, Eye, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Settings, User, LogOut, LineChart, BarChart, Search, Filter, GripVertical.

### FR-8: Card Pattern

```
container: bg-[#141414] border border-[#27272A] rounded-lg
  padding: p-5 or p-6
  header: mono font, text-[10px] uppercase tracking-widest text-[#52525B]
  value: mono font, text-2xl font-bold text-[#E4E4E7]
  list items: border-b border-[#27272A], py-3
  hover: bg-[#1A1A1A] transition-colors duration-150
```

### FR-9: Table Pattern

```
container: bg-[#141414] border border-[#27272A] rounded-lg overflow-hidden
  thead: border-b border-[#27272A]
    th: px-4 py-3 font-medium text-[#52525B] mono font
  tbody:
    tr: border-b border-[#27272A]/50 hover:bg-[#1A1A1A]
    td: px-4 py-3
      ticker: text-[#22D3EE] mono font
      name: text-[#A1A1AA]
      value: text-[#E4E4E7] mono font
      positive: text-[#22C55E]
      negative: text-[#EF4444]
      drift-warning: text-[#FF6B00]
```

### FR-10: Button Patterns

| Variant | Classes |
|---------|---------|
| Primary CTA | `bg-[#FF6B00] text-[#0C0C0C] font-semibold text-sm px-6 py-3 rounded-[4px] hover:bg-[#FF6B00]/90` |
| Secondary/Ghost | `border border-[#27272A] text-[#A1A1AA] font-medium text-sm px-6 py-3 rounded-[4px] hover:border-[#52525B] hover:text-[#E4E4E7]` |
| Icon button | `h-10 w-10 flex items-center justify-center rounded-[4px] hover:bg-[#1A1A1A]` |

### FR-11: Scrollbar Styling

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #141414; border-radius: 4px; }
::-webkit-scrollbar-thumb { background: #52525B; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #71717A; }
```

### FR-12: Shadcn/UI Integration

- `globals.css` defines CSS custom properties for Shadcn theming
- `--radius` set to `0.5rem` (cards use `rounded-lg`)
- Always check `src/components/ui/` before building custom components
- Use `clsx` and `tailwind-merge` for conditional class composition
- Avoid `style={{}}` unless truly dynamic (like font-family during migration)
- Import pattern: `import { Button } from "@/components/ui/button"`
- Radix Primitives underneath Shadcn for accessibility

### FR-13: Holdings Grid Dual-Mode Specification

**Monitor Mode Columns:** ticker, name, livePrice, qty, dayChange, dayChangePercent, liveValue.

**Editor Mode Columns:** section, theme, assetType, name, ticker, exchange, account, livePrice, qty, liveValue, pctOfTheme, targetPct, targetDelta, include, actions.

**Interactions:** Click header to sort (asc/desc toggle), click cell for inline edit, Tab/Enter to confirm, Escape to cancel, actions dropdown per row, collapsible group headers, filter dropdowns in toolbar.

### FR-14: Feature Label Pattern

```
text-xs text-[#FF6B00] uppercase tracking-widest mb-4
font: JetBrains Mono
format: "Feature 01", "AI Assistant", etc.
```

Used as section eyebrow above feature headings.

## Non-Functional Requirements

- **NFR-1:** All interactive elements meet WCAG 2.1 AA contrast ratios against dark backgrounds
- **NFR-2:** All animations respect `prefers-reduced-motion` media query
- **NFR-3:** Page renders without layout shift (CLS < 0.1) with skeleton loading
- **NFR-4:** Total CSS payload < 50KB gzipped
- **NFR-5:** Font loading uses `display: swap` to prevent invisible text
- **NFR-6:** Touch targets minimum 40px on mobile devices
- **NFR-7:** Consistent 60fps animations on modern devices

## Technical Specification

### Styling Architecture
- **Global:** `globals.css` defines CSS custom properties, Tailwind config, and utility classes
- **Components:** Tailwind utility classes via `className`, composed with `clsx` + `tailwind-merge`
- **Dynamic:** Framer Motion for scroll-triggered and complex animations
- **Migration path:** Inline `style={{ fontFamily }}` during prototyping → CSS custom properties → Tailwind theme extension

### File Locations
| File | Purpose |
|------|---------|
| `src/app/globals.css` | Theme tokens, Tailwind config, global styles |
| `src/components/ui/` | Shadcn/Radix primitives (do not edit logic) |
| `src/components/features/` | Feature-specific components |
| `src/components/marketing/` | Marketing page components (FadeSection, TickerStrip, etc.) |
| `src/components/layout/` | Navigation, page shells |

## Success Criteria

1. Design token parity: all CSS custom properties map to Swiss Precision palette
2. Component parity: dashboard components render with Swiss Precision tokens
3. Marketing page: Swiss Precision landing page uses extracted reusable components
4. Mobile responsive: all pages usable at 375px width without horizontal scroll
5. Animation performance: all Framer Motion animations run at 60fps
6. Accessibility audit: zero critical WCAG 2.1 AA violations

## Constraints & Assumptions

- Dark theme only (no light theme in scope)
- Orange accent (`#FF6B00`) is the immutable brand colour
- Three-font system: Space Grotesk (headlines), JetBrains Mono (data), system-ui (body)
- `lucide-react` is the only approved icon library
- No CSS-in-JS libraries (styled-components, emotion) — only Tailwind + Shadcn
- Maximum content width: 1200px with 24px (1.5rem) side padding
- Framer Motion is the approved animation library

## Out of Scope

- Light theme / theme switching
- Custom colour theme selection by users
- Print stylesheet
- RTL language support
- Complex drag-and-drop animations (Framer Motion handles this separately)

## Dependencies

- **Tailwind CSS v4** — utility-first CSS framework
- **Shadcn/UI** — pre-built Radix-based components
- **Framer Motion** — animation library for scroll-triggered transitions
- **lucide-react** — icon library
- **Space Grotesk** — Google Fonts (headlines)
- **JetBrains Mono** — Google Fonts (data/monospace)
- **Core Domain** (PRD: core-domain) — for HoldingDerived type definitions driving grid display
