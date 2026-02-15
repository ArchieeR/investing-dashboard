# Deep Research: Financial Data Architecture for UK Portfolio Platform

## Context

I'm building a UK-focused portfolio intelligence platform (SaaS, £12/mo). The platform tracks ISA/SIPP/GIA holdings for UK investors — stocks, ETFs (especially UCITS/LSE-listed), bonds, funds.

I need two data layers:
1. **Live/delayed price feeds** — from a paid provider (exchange-licensed data)
2. **Everything else** — asset profiles, fundamentals, ETF holdings/constituents, descriptions, sector/industry, logos, etc. — gathered by our own AI-powered scraping and data-finding system

## What I Need You to Research

### Part 1: Cheapest Live Price Data Provider for UK/LSE

I ONLY need a provider for live or 15-min delayed price data. Nothing else. Research:

- What is the absolute cheapest way to get LSE stock/ETF prices commercially?
- Which providers offer price-only tiers (no fundamentals, no holdings)?
- Specific providers to evaluate:
  - **EODHD** — their cheapest tier that includes LSE prices ($19.99/mo EOD tier?)
  - **FMP** — their Premium tier ($59/mo) since UK data starts there
  - **Marketstack** — $9.99/mo with LSE coverage
  - **Twelve Data** — cheapest tier with LSE
  - **Alpha Vantage** — pricing for UK coverage
  - **Finnhub** — cheapest LSE access
  - **Apify** — Google Finance scraper (~$5/mo?) for delayed LSE prices
  - Any other ultra-cheap options I'm missing

For each, tell me:
- Exact monthly cost for the cheapest tier that includes LSE prices
- Real-time vs 15-min delay vs end-of-day
- Rate limits
- Commercial use allowed? (I'm charging users)
- GBX/GBp handling
- How many tickers can I query per day?

### Part 2: Building Our Own Asset Database with AI Scrapers

Instead of paying for profiles, fundamentals, ETF holdings etc. from an API, I want to build AI-powered agents that find this data from public sources. Research:

**A) Free Public Data Sources for Asset Information:**

1. **Company profiles & descriptions** — where can AI find:
   - Company name, description, sector, industry, country
   - Logo URLs
   - Website URLs
   - ISIN, exchange info
   - Sources: Companies House API (UK)? LSE website? FCA register? Wikipedia? Official company websites?

2. **Fundamentals (PE, PB, dividend yield, ROE, market cap):**
   - Are annual reports/filings publicly accessible and parseable?
   - Companies House filing data?
   - FCA/regulatory filings?
   - What free sources have structured fundamental data?

3. **ETF holdings/constituents (CRITICAL):**
   - iShares publishes daily CSV files for every ETF — confirm this is free and commercially usable
   - Vanguard — do they publish CSV/Excel holdings? Where?
   - SPDR (State Street) — same question
   - Invesco, Amundi, Xtrackers, L&G, HSBC — do they publish holdings?
   - What format (CSV, Excel, PDF)?
   - How frequently updated?
   - Are there any restrictions on commercial use of issuer-published holdings data?
   - Is there a comprehensive list of UK/UCITS ETF issuers and their data download URLs?

4. **ETF metadata (TER, AUM, domicile, replication method, distribution type):**
   - Where is this published? Issuer factsheets? KIID/KID documents?
   - Can AI extract structured data from PDF factsheets?
   - Are there any free structured sources (not justETF/Morningstar)?

5. **UK-specific data sources:**
   - Companies House API — what data is free?
   - FCA Financial Services Register — useful data?
   - Bank of England data — any relevant feeds?
   - HMRC ISA/SIPP rules data?
   - London Stock Exchange website — what's freely available?

**B) AI Scraping Architecture:**

1. What's the best approach for AI-powered data gathering?
   - LLM agents with web browsing (Gemini, GPT, Claude)?
   - Traditional scrapers with AI post-processing?
   - Hybrid approach?

2. What tools/frameworks exist for AI web scraping?
   - Apify + AI actors?
   - Browser automation (Playwright/Puppeteer) + LLM extraction?
   - Firecrawl, Crawl4AI, or similar AI scraping tools?
   - Google Custom Search API for finding data?

3. Legal considerations:
   - What UK/EU laws govern web scraping for commercial use?
   - GDPR implications for company data?
   - Copyright on financial data?
   - robots.txt compliance requirements?
   - Any relevant UK court cases on financial data scraping?

4. Data quality and freshness:
   - How do we ensure accuracy of AI-gathered data vs paid APIs?
   - What validation approaches work?
   - How frequently should different data types be refreshed?

**C) Specific Architecture Questions:**

1. If I use Gemini/Vertex AI (already in my stack) as my scraping AI:
   - Can Gemini browse the web and extract structured financial data?
   - What's the cost per asset to gather profile + fundamentals + ETF holdings?
   - How does Gemini's grounding with Google Search work for this?
   - Rate limits and practical throughput?

2. Could I use Google Custom Search API + Gemini to find and extract data?
   - Pricing of Custom Search API?
   - Is this more cost-effective than a financial data API?

3. What about using Genkit (Google's AI framework, already in my stack) to orchestrate:
   - Data discovery agents (find the right URL for a given ticker)
   - Data extraction agents (parse HTML/CSV/PDF into structured data)
   - Data validation agents (cross-reference multiple sources)

### Part 3: Cost Comparison

Compare the total cost of:

**Option A: Full paid API (e.g., EODHD All-In-One $99.99/mo)**
- Everything from one provider
- Simple integration
- Known quality

**Option B: Cheap price API + AI scrapers**
- Cheapest price-only provider (e.g., Marketstack $9.99/mo or EODHD $19.99/mo)
- AI/scraping for everything else
- Gemini API costs for scraping (estimate per 1000 assets)
- Infrastructure costs (storage, compute for scraping jobs)
- Developer time to build and maintain

**Option C: Hybrid**
- Mid-tier API for prices + basic profiles
- AI scrapers for ETF holdings and deep data
- Best of both worlds?

For each option, estimate:
- Monthly cost at 100 assets, 500 assets, 2000 assets
- Data quality/reliability (1-10)
- Maintenance burden (1-10, 10 = most work)
- Time to market
- Commercial licensing risk (1-10, 10 = most risky)

### Part 4: What Are Other UK Fintechs Doing?

- How do Freetrade, Trading 212, Nutmeg, Wealthify, InvestEngine get their data?
- Are any UK fintechs using AI-powered data gathering?
- What data providers are popular with UK fintech startups specifically?
- Is there a UK fintech data ecosystem I should know about?
- Any UK-specific data aggregators or open banking connections that provide investment data?

### Part 5: Recommendations

Based on all the above, give me:

1. **The single cheapest viable architecture** for a UK portfolio platform that needs:
   - Live/delayed prices for LSE stocks and ETFs
   - Asset profiles (name, sector, description, logo)
   - Fundamentals (PE, PB, yield, market cap)
   - ETF holdings for all major UCITS ETFs
   - Commercial use allowed

2. **The best AI-first architecture** that minimises paid API costs while maximising data quality

3. **Your honest assessment**: Is building AI scrapers actually cheaper than just paying for EODHD/FMP, once you factor in dev time, maintenance, and reliability?

## Output Format

Please structure your response with clear sections, comparison tables, and specific numbers (pricing, rate limits, costs). I need actionable data to make a decision, not generic advice.

For every claim about pricing or features, cite the source URL.
