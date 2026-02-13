# Project Portfolio: High-Level Overview

## 1. Vision
**"The Second Brain for Investors."**
Portfolio is a professional-grade workspace designed to replace complex Excel spreadsheets. It combines the fluidity of a spreadsheet with automated intelligence, evolving from a passive tracker into an active AI Agent capable of managing wealth.

## 2. Core Value Proposition
1.  **Glass-Box Transparency:** Unlike brokers that hide what's inside an ETF, Portfolio offers "Look-Through" analysis, revealing true exposure (e.g., "You own 7% NVIDIA via your S&P 500 fund").
2.  **Hybrid Intelligence:**
    *   **Phase 1 (Analyst):** Context-aware answers ("How did the rate hike affect *my* Tech stocks?").
    *   **Phase 2 (Agent):** Actionable commands ("Rebalance my portfolio", "Buy 10 units").
3.  **Proprietary Data:** We build our own "Asset Universe" using FMP and Apify, ensuring we aren't reliant on slow third-party widgets.

## 3. Key Modules
*   **The Dashboard:** A high-density, Excel-style "Playground" for tracking and planning. Features an "Allocation Manager" for hierarchical targets (Sections -> Themes).
*   **ETF Explorer:** A research engine for transparency. Features proprietary "Look-Through" data.
*   **The Chatbot:** A persistent sidekick. Starts as an Analyst, upgrades to an Agent.
*   **Intelligence Feed:** Automated scraping of ETF issuer sites and premium news/earnings summaries.

## 4. Technology Stack
*   **Frontend:** Next.js 16 (App Router), Tailwind v4, Shadcn UI.
*   **Backend:** Firebase (Firestore, Cloud Functions Gen 2).
*   **Data Strategy:** (See `docs/data/strategy.md`)
    *   **Hybrid Model:** FMP (Global/US backbone) + **Smart Poller** (Europe/UCITS specialist layer).
    *   **Intelligence Feed:** Automated "Smart Poller" engine for UCITS data (See `docs/ai/intelligence_feed.md`).
    *   **Universal Schema:** Uniform data format for all assets.
    *   **Overlap Engine:** SQL-based exposure calculation.
*   **AI Engine:** Google Genkit + Vertex AI (Gemini 2.5/3.0).

## 5. User Personas
*   **The Aggregator:** Consolidates multiple accounts (ISA, SIPP) into one view.
*   **The Researcher:** Obsessed with exposure and underlying assets.
*   **The Automator:** Wants the AI to handle rebalancing and monitoring.
