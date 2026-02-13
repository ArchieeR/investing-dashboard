# Feature Spec: Chatbot (Analyst & Agent)

## 1. Overview
The Chatbot is the "Interface of the Future" for this portfolio. It evolves from a passive information retrieval system ("The Analyst") to an active portfolio manager ("The Agent").

## 2. Capabilities

### 2.1 Phase 1: The Analyst (Read-Only)
In this phase, the bot has **Read-Only** access to the user's data and external market data.

*   **Context Awareness:**
    *   *Input:* "How did the market drop affect me?"
    *   *Process:* Retrieve User Portfolio -> Fetch Daily Change for each holding -> Summarize impact.
    *   *Output:* "Your portfolio is down 1.2% (£450), primarily driven by a 5% drop in Tesla."
*   **Look-Through Intelligence:**
    *   *Input:* "Do I own NVIDIA?"
    *   *Process:* Check direct holdings -> Check ETF look-through data (BigQuery).
    *   *Output:* "You don't own NVDA directly/directly, but you have £500 exposure via your S&P 500 ETF (VUAG)."
*   **Market Queries:**
    *   "What is the current price of Apple?" (Uses Finance API).

### 2.2 Phase 2: The Agent (Write Access)
In this phase, the bot can propose and execute actions. **Explicit User Confirmation is always required.**

*   **Interactive Tickers:**
    *   Response Text: "Tesla (TSLA) is down..." -> `TSLA` is a clickable chip.
    *   Click Action: Opens stock details or "Quick Buy" modal.
*   **Commands:**
    *   *"Add 10 units of VUKE to my ISA."* -> Triggers `addTransactions` cloud function.
    *   *"Rebalance my Core section to 60%."* -> Calculates trades -> Presents confirmation modal ("Sell £X of Y, Buy £Z of A").

## 3. Technical Implementation

### AI Stack
*   **Orchestration:** Google Genkit.
*   **Model:** Gemini 2.5 Flash / 3 Pro (Multimodal).
*   **Tools (MCP-like for the Bot):**
    *   `getPortfolio(userId)`
    *   `getHoldings(portfolioId)`
    *   `getETFConstituents(ticker)`
    *   `executeTrade(draft)`

### Context Window Strategy
*   We cannot dump the entire DB into the context.
*   **RAG Strategy:**
    1.  User Query: "How is my *Tech* sector doing?"
    2.  Retrieval: Fetch only holdings tagged with 'Sector: Tech'.
    3.  Generation: Answer based on that subset.

## 4. UI/UX Requirements
*   **Persistent Visibility:** Chat is available via a Floating Action Button (FAB) or a dedicated sidebar, preserving context as the user navigates.
*   **Streaming Responses:** Text appears as it generates.
*   **Rich UI Components:** The bot renders Charts, Tables, and Stock Chips, not just Markdown text.

## 5. Retrieval Strategy
The Chatbot is the primary consumer of the [AI Structured Retrieval Strategy](06_ai_retrieval_strategy.md). It employs a "Hybrid Brain" approach:
*   **Left Brain (Facts):** Uses tools to query the quantitative Dashboard data (Weights, Prices).
*   **Right Brain (Narrative):** Uses tools to query the Research Hub (Sentiment, Summaries).
