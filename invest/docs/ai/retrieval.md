# Feature Spec: AI Structured Retrieval Strategy

## 1. Vision: "Precision over Hallucination"
This module defines how the AI Agent retrieves information. Unlike standard LLM interactions (which guess facts), this system uses **Structured Retrieval** (Tool Use) to query the database for absolute truth.

The AI is strictly prohibited from guessing portfolio weights, holdings, or prices. It must "look them up" using defined tools.

## 2. The "Hybrid Brain" Architecture

### A. Left Brain: The Deterministic Engine (Facts)
Used for queries like: *"Which ETF holds Rolls Royce?"* or *"What is my exposure to Tech?"*

* **Mechanism:** Direct Database Queries (Filtering/Aggregation).
* **Data Structure Requirement:**
    * **Searchable Indexes:** Complex objects (like ETF holdings) are flattened into simple arrays (e.g., `searchable_holdings: ['RR.L', 'TSLA']`) to allow fast filtering.
    * **Pre-computed Metadata:** Heavy math (like Sector Weighting) is calculated during data ingestion, not during the chat, so the AI simply reads a value rather than doing math.

* **Tool Behavior:** The AI recognizes a factual intent -> Selects the "Database Tool" -> Executes a structured filter -> Returns raw JSON.

### B. Right Brain: The Semantic Engine (Narrative)
Used for queries like: *"Why is the market down?"* or *"Summarize the latest Nvidia earnings."*

* **Mechanism:** RAG (Retrieval Augmented Generation) via Vector Search.
* **Tool Behavior:** The AI recognizes a research intent -> Selects the "Research Tool" -> Converts user query to vector -> Finds semantically similar documents in the Research Hub -> Synthesizes an answer.

## 3. The "Reverse Lookup" Pattern
A critical feature is the ability to find parents based on children (finding an ETF based on a stock inside it).

* **User Query:** *"I want exposure to Rolls Royce."*
* **System Logic:**
    1. **Identify Entity:** AI extracts `Rolls Royce` (Ticker: `RR.L`).
    2. **Tool Execution:** Calls `Find_ETFs_By_Holding('RR.L')`.
    3. **Database Action:** Queries the `assets` collection where `searchable_holdings` array contains `RR.L`.
    4. **Result:** Returns a list of parent ETFs.

## 4. Agent Workflow Summary
1. **Intercept:** AI receives user prompt.
2. **Router:** AI determines if the prompt requires **Facts** (Left Brain), **Research** (Right Brain), or **Both**.
3. **Retrieval:**
    * If Facts: Execute precise DB lookup.
    * If Research: Execute fuzzy Vector search.
4. **Synthesis:** Combine the retrieved data (Context) with the User's Portfolio (Personalization) to generate the final answer.
