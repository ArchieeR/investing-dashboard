Portfolio Tool — Expanded & Refined Spec v0.3

**Status:** MVP Foundation Complete (~30% of vision) | Updated: November 8, 2025

Narrative

Managing a portfolio is hard due to fragmentation, hidden exposures, and inconsistent context. Multiple accounts, wrappers, and data sources create friction. ETFs mask underlying holdings and duplicate exposures. Research is siloed from holdings. AI can reason across sources, but it needs persistent, structured context that mirrors how humans keep a mental model steady during analysis.

Goal: Provide a single system of record and an AI-assisted workspace that keeps portfolio context constant across data, analysis, research, and decisions.

Outcome: Increase retail participation and portfolio quality by reducing cognitive load, improving visibility, and enabling repeatable decisions. Tie to dissertation themes: boosting retail investment participation and the wealth effect through education and technology.

**Current Implementation Status:**
- ✅ Core portfolio management (Section → Theme → Holdings hierarchy)
- ✅ Live pricing integration (Yahoo Finance)
- ✅ Multi-portfolio support with draft portfolios
- ✅ Target allocation & rebalancing logic
- ✅ Trade recording with cost basis tracking
- ✅ CSV import/export
- ❌ AI chatbot (not implemented)
- ❌ Education academy (not implemented)
- ❌ ETF look-through (not implemented)
- ❌ Backend infrastructure (frontend-only)
- ❌ Real research hub (mock UI only)

See `docs/CURRENT_STATE_ASSESSMENT.md` for detailed gap analysis.

⸻

Education

Objective: Build durable financial literacy that is directly linked to the user’s live portfolio.
	•	Academy (MVP-lite → Phase 2): Short courses with quizzes; concepts mapped to the user’s actual holdings (e.g., “Your ETF uses physical replication; here is what that means”).
	•	Interactive explainers: Indexing, ETFs, bonds, diversification, risk, fees, taxes, wrappers (ISA, SIPP, LISA, GIA). Include accumulation vs distributing share classes; currency hedging.
	•	News literacy: How to read RNS, earnings, macro releases. Bias detection checklists.
	•	Simulators: Rebalancing, glide‑paths by risk profile, contribution schedules, sequence‑of‑returns risk.
	•	Glossary + just‑in‑time hints: Hover definitions inside the app.

⸻

Technology

Principle: Constant context. The AI and UI share a live, normalised data model of accounts, holdings, transactions, exposures, preferences, and risk.
	•	Context Engine: Persistent profile + portfolio graph. Every feature reads/writes to this graph. Chat uses it by default.
	•	Offline‑first ingestion: CSV imports, broker exports; later: connectors. Idempotent loaders with deduplication.
	•	Unified identifiers: ISIN, Ticker, FIGI mapping; for ETFs: look‑through to constituents, refresh cadence stored per fund.
	•	Computation layer: Pricing, FX, benchmarks, index‑level stats, factor models, risk metrics, scenario runs.
	•	Permissions & audit: Versioned states, change logs, draft vs live.

⸻

Data management
	•	Holdings ledger: Positions by account and wrapper. Lot‑level tracking, cost basis, FX rate at fill time, fees.
	•	Transactions: Buys, sells, dividends, contributions, withdrawals, corporate actions, fees, transfers, cash interest.
	•	Market data: End‑of‑day prices (MVP), intraday later. FX, benchmarks, index levels.
	•	ETF look‑through: Constituents with weights, refresh schedule, domicile, replication method, securities lending, OCF, tracking difference.
	•	Derived metrics: Realised/unrealised P&L, TWRR/MWRR, IRR, drift, yield, effective fee rate, tax lots.
	•	Wrappers: ISA, SIPP, LISA, GIA, Cash ISA; wrapper rules kept in metadata.

⸻

Dashboard

Default, simple view with depth on demand.
	•	At a glance: Total value, day change, YTD, since‑inception, cash drag, fee drag.
	•	Breakdowns: By wrapper, account, portfolio, section (Core/Satellite/Alternatives), asset class, region, country, sector, currency.
	•	Multiple portfolios: Real, draft, and model. Switcher with clear labelling.
	•	Draft portfolios: Fork from live; highlight diffs in value, weights, fees, risk.
	•	Playground mode: Constraint‑aware edits, scenario toggles, instant metrics.

⸻

Editable view
	•	Isolation controls: Filter by account, section, theme, country, sector, asset class.
	•	What‑if editor: Type to set target weights; show required trades, estimated costs, tax flags.
	•	Rebalance tools: Pro‑rata, threshold‑based, cash‑only, tax‑aware heuristics.
	•	Constraints: Min/max weights, ESG tags, exclude list, liquidity guards.

⸻

Research
	•	News hub: Aggregates sources, tags by ticker/ISIN/sector/theme/country. User can whitelist/blacklist outlets.
	•	Holdings‑derived feed: Auto‑prioritises items that impact top exposures or upcoming events.
	•	Reading queue: Save, annotate, and attach to tickers, ETFs, or strategies.

⸻

ETF researcher
	•	Compare: Fees (OCF), replication, domicile, securities lending policy, tracking difference, distribution policy, currency/hedging, size/liquidity.
	•	Holdings side‑by‑side: Overlap matrix, top constituents, concentration metrics (Herfindahl‑Hirschman Index), MAG7 exposure.
	•	Performance: Since inception, drawdowns, volatility, tracking error vs benchmark.
	•	Documents: Factsheets, KIIDs/KIDs, methodology notes (links).

⸻

Stock researcher
	•	Basics: Price history, market cap, liquidity, valuation multiples.
	•	Quality: Profitability, leverage, cash flow stability.
	•	Risk: Beta, drawdown, factor exposures.
	•	Context: Which of your ETFs hold it and with what weight.

⸻

Events
	•	Holdings‑derived calendar: Earnings, dividends (ex/record/pay), RNS, index rebalances, ETF distributions, corporate actions.
	•	Macro: CPI, GDP, rates, payrolls; impact assessment notes.
	•	Political: Elections, policy votes; summary of potential market effects.
	•	Deep‑dive mode: Earnings + sentiment snapshot + price reaction summary.

⸻

Watchlists
	•	Custom lists for ETFs, stocks, themes. Quick add from research or news.
	•	Signals: price moves, volume spikes, exposure change in your portfolio.

⸻

Portfolio analytics
	•	Overview: Top holdings, concentration, exposures by region/country/sector/currency/asset type, factor tilt.
	•	Overlap analysis: Across ETFs and direct equities. Duplication heatmap.
	•	Risk & return: Volatility, beta, Sharpe, Sortino, max drawdown, VaR/ES (MVP simplified), tracking error vs chosen benchmark.
	•	Scenario tests: Historical stress windows and simple factor shocks.
	•	Factor view: Fama‑French style factors (later), momentum and quality proxies.
	•	Trade history & P&L: Realised/unrealised, since purchase, since sale, contribution analysis. What‑if not sold/bought.
	•	Tax helpers (informational): CGT allowance tracker, bed‑and‑ISA suggestions (non‑advisory), wash‑sale warnings (jurisdiction metadata).

⸻

Chatbot (constant context)
	•	Stateful assistant: Access to portfolio graph, risk profile, preferences, and research queue.
	•	Modes: Explain, compare, summarise, simulate, translate jargon, draft rebalancing plan.
	•	Safety: Citations for claims, clear non‑advice banner, controllable verbosity.

⸻

Account profile
	•	Risk profile: Questionnaire output with rationale; glide‑path template.
	•	AUM & wrappers: Account mapping and constraints.
	•	Expertise level: Tailors explanations and UI hints.
	•	Preferences: News sources, sectors, themes, ESG flags.
	•	Strategy: Core/Satellite ratio, rebalance cadence, benchmark, cash buffer policy.

⸻

Behaviours v2
	•	Nudges: drift beyond threshold, cash idle too long, fee drag rising, duplicate exposure spikes, contribution reminders.
	•	Anomaly detection: unusual turnover, outlier position sizing.
	•	Habit tracker: learning streaks, research read‑through, review cadence.

⸻

Alert system
	•	Threshold alerts: Price moves, weight drift, drawdown.
	•	Event‑driven: Earnings tomorrow for top exposures, new RNS for ≥X% holdings.
	•	Exposure alerts: ETF rebalances that affect top 20 constituents you hold.
	•	Digest options: Daily, weekly, or on‑event.

⸻

Non‑functional requirements
	•	Privacy & compliance: GDPR, data minimisation, export/delete, clear not‑advice disclaimers.
	•	Reliability: Idempotent imports, recovery from partial loads, versioned portfolio states.
	•	Performance: Portfolio of 5,000 lines including look‑through loads in <2s for key views (target).
	•	Accessibility: Keyboard navigation, readable contrasts, clear numerics.

⸻

Data model (MVP sketch)

Entities
	•	User: id, locale, timezone, expertise, preferences
	•	Account: id, user_id, wrapper_type {ISA|SIPP|LISA|GIA|CashISA}, provider, currency
	•	Portfolio: id, user_id, name, type {live|draft|model}, parent_portfolio_id
	•	Position: id, portfolio_id, instrument_id, quantity, avg_cost_ccy, currency
	•	Transaction: id, account_id, instrument_id, type, quantity, price_ccy, fees, fx_rate, timestamp
	•	Instrument: id, type {ETF|Equity|Bond|Cash|Crypto}, ISIN, ticker, name, currency
	•	Constituent: instrument_id (ETF), child_instrument_id, weight, as_of
	•	Price: instrument_id, date_time, price, currency
	•	Event: instrument_id, type {earnings|dividend|rns|rebalance|macro|political}, date_time, metadata
	•	NewsItem: id, source, published_at, tickers[], summary, url, sentiment

Derived tables/jobs
	•	ExposureSnapshot: portfolio_id, as_of, region/country/sector/currency weights
	•	OverlapMatrix: portfolio_id, as_of, pairwise overlaps
	•	RiskMetrics: portfolio_id, as_of, vol, beta, sharpe, drawdown

⸻

UX notes
	•	Clear Core/Satellite labelling. Quick toggles to view only Core/Satellite/Alternatives.
	•	Diff highlighting between live and draft. Tooltips with plain‑language explanations.
	•	Inline calculators for contributions and rebalancing.

⸻

Integrations (staged)
	•	MVP: CSV imports for major UK brokers; manual entries.
	•	Phase 2: Aggregators/Open Finance connectors where available.
	•	Market data: Free end‑of‑day, upgrade path to paid intraday.

⸻

Monetisation
	•	Free tier: 1 live portfolio, basic analytics, CSV import.
	•	Pro: unlimited portfolios, ETF look‑through, alerts, overlap analysis, research hub.
	•	Enterprise/Adviser: multi‑client views, compliance exports, white‑labelling.

⸻

KPIs
	•	DAU/WAU, retained days 7/30/90.
	•	Portfolio coverage: % holdings with look‑through, % events captured.
	•	Education engagement: module completion, quiz scores, reduction in support queries.
	•	Actionability: rebalances executed in app, drafts created, alerts acknowledged.

⸻

Roadmap

**MVP (COMPLETED)** ✅
	•	✅ Data ingestion (CSV), holdings ledger, transactions, basic pricing/FX
	•	✅ Dashboard with key breakdowns, multiple portfolios, draft fork + diff
	•	✅ Editable view with target weights and simple rebalance proposals
	•	❌ ETF look‑through for top funds (NOT IMPLEMENTED)
	•	❌ Events calendar (MOCK UI ONLY)
	•	❌ News hub (MOCK UI ONLY)
	•	❌ Chatbot (NOT IMPLEMENTED)

**Phase 1: Foundation (Next 8-12 weeks)** 🚧
	•	Backend infrastructure (Node.js + PostgreSQL)
	•	User authentication & multi-user support
	•	Real market data integration (Finnhub/Alpha Vantage)
	•	ETF look-through MVP (top 20 ETFs, manual entry)
	•	Basic overlap analysis
	•	Real events calendar with API integration
	•	Real news hub with API integration

**Phase 2: Intelligence (Weeks 13-24)** 🎯
	•	AI chatbot MVP with Google Gemini integration
	•	Constant context engine for portfolio reasoning
	•	Advanced analytics: volatility, beta, Sharpe/Sortino, basic VaR
	•	Benchmark comparison (FTSE 100, S&P 500)
	•	Alerts system (price, drift, events)
	•	Tax helpers, CGT allowance tracker, bed‑and‑ISA suggestions
	•	Education Academy v1 with 10-15 core modules

**Phase 3: Scale (Weeks 25-36)** 🚀
	•	Full ETF look-through automation (100+ ETFs)
	•	Factor analysis (Fama-French)
	•	Scenario engine & stress testing
	•	Monte Carlo retirement planner and glide‑paths
	•	Broker connector integrations (Open Finance)
	•	Mobile app (PWA → Native)
	•	Collaborative features, adviser workspace
	•	Intraday data, deeper KIIDs/KIDs ingestion

⸻

Open questions
	•	Which brokers to prioritise for CSV templates?
	•	Minimum viable set of ETFs for look‑through at launch?
	•	Benchmarks per user or per portfolio?
	•	Preferred research sources whitelist to seed?

⸻

Glossary
	•	Look‑through: Mapping ETF holdings to underlying securities to compute true exposures.
	•	Tracking difference: Fund return minus index return over a period.
	•	OCF: Ongoing Charges Figure.
	•	Drift: Deviation from target weight.
	•	TWRR/MWRR: Time‑weighted vs money‑weighted returns.