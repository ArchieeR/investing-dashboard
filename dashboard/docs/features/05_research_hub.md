# Feature Spec: Research Hub

## 1. Overview
The Research Hub centralizes efficient market intelligence. It replaces scattered news sources with a curated, AI-summarized stream of "Market Moving" events.

## 2. Core Data Pillars
### 2.1 Live News
*   **Sources:** Aggregated financial news (Bloomberg, Reuters via API/Scrapers).
*   **AI Value Add:** "Impact Analysis" - not just headlines, but *why* it matters to your portfolio.

### 2.2 Economic & Political Events (Macro)
*   **The "Macro Calendar":**
    *   Central Bank Rate Decisions (Fed, BoE, ECB).
    *   CPI / Inflation Prints.
    *   Geopolitical Updates (Elections, Sanctions).
*   **Visualization:** Timeline view with "High Impact" flags.

### 2.3 Corporate Events (Micro)
*   **Earnings Calendar:** Highlighting stocks in your portfolio or watchlist.
*   **Corporate Actions:** Dividends, Splits, Mergers.
*   **Analyst Upgrades/Downgrades.**

## 3. Implementation Details
For technical specifications, component props, and detailed design requirements, refer to the **Research Hub Implementation Skill**.

**Skill Location:** `.agent/skills/research_hub_implementation/SKILL.md`

### Core Components
*   **MacroCalendar:** Vertical timeline of economic events.
*   **NewsFeed:** Infinite scroll of curated financial news.
*   **EarningsRail:** Horizontal scroll of upcoming company reports.
*   **ImpactCard:** AI-generated summary of major market events.

> [!TIP]
> Use the [Research Hub Skill](../../.agent/skills/research_hub_implementation/SKILL.md) for detailed prop interfaces and design system rules.
