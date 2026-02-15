import { genkit, z } from "genkit";
import { openAICompatible, compatOaiModelRef } from "@genkit-ai/compat-oai";
import { NextRequest, NextResponse } from "next/server";
import { z as z4 } from "zod";
import { fmpClient } from "@/lib/fmp";
import { logger } from "@/services/logging";

// =============================================================================
// Genkit Setup — DeepSeek V3 via Azure Foundry (lazy init)
// Reads DEEPSEEK_API_KEY and DEEPSEEK_BASE_URL from env at runtime
// =============================================================================

const DEEPSEEK_MODEL = compatOaiModelRef({
  name: "deepseek/DeepSeek-V3.2",
});

let _ai: ReturnType<typeof genkit> | null = null;

function getAI() {
  if (!_ai) {
    _ai = genkit({
      plugins: [
        openAICompatible({
          name: "deepseek",
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: process.env.DEEPSEEK_BASE_URL,
        }),
      ],
    });
  }
  return _ai;
}

// =============================================================================
// Tool Definitions (lazy — registered on first call)
// =============================================================================

let _tools: ReturnType<typeof registerTools> | null = null;

function registerTools(ai: ReturnType<typeof genkit>) {
  const getQuoteTool = ai.defineTool(
    {
      name: "getQuote",
      description: "Get the current stock/ETF quote including price, change, market cap",
      inputSchema: z.object({ symbol: z.string().describe("Ticker symbol e.g. AAPL") }),
      outputSchema: z.object({
        symbol: z.string(),
        price: z.number(),
        change: z.number(),
        changePercent: z.number(),
        marketCap: z.number(),
        volume: z.number(),
      }).nullable(),
    },
    async ({ symbol }) => {
      const q = await fmpClient.getQuote(symbol);
      if (!q) return null;
      return {
        symbol: q.symbol,
        price: q.price,
        change: q.change,
        changePercent: q.changePercentage,
        marketCap: q.marketCap,
        volume: q.volume,
      };
    }
  );

  const getProfileTool = ai.defineTool(
    {
      name: "getProfile",
      description: "Get company/ETF profile including description, sector, industry",
      inputSchema: z.object({ symbol: z.string() }),
      outputSchema: z.object({
        symbol: z.string(),
        name: z.string(),
        sector: z.string().optional(),
        industry: z.string().optional(),
        description: z.string().optional(),
        isEtf: z.boolean(),
        exchange: z.string(),
      }).nullable(),
    },
    async ({ symbol }) => {
      const p = await fmpClient.getProfile(symbol);
      if (!p) return null;
      return {
        symbol: p.symbol,
        name: p.companyName,
        sector: p.sector ?? undefined,
        industry: p.industry ?? undefined,
        description: p.description ?? undefined,
        isEtf: p.isEtf,
        exchange: p.exchange,
      };
    }
  );

  const getKeyMetricsTool = ai.defineTool(
    {
      name: "getKeyMetrics",
      description: "Get key financial metrics: PE, P/B, dividend yield, ROE, debt/equity",
      inputSchema: z.object({
        symbol: z.string(),
        period: z.enum(["annual", "quarterly"]).optional(),
      }),
      outputSchema: z.array(z.object({
        date: z.string(),
        peRatio: z.number().nullable(),
        pbRatio: z.number().optional(),
        dividendYield: z.number().nullable(),
        roe: z.number().optional(),
        debtToEquity: z.number().nullable(),
        currentRatio: z.number().optional(),
      })),
    },
    async ({ symbol, period }) => {
      const data = await fmpClient.getKeyMetrics(symbol, period ?? "annual", 2);
      return data.map((m) => ({
        date: m.date,
        peRatio: m.peRatio,
        pbRatio: m.pbRatio,
        dividendYield: m.dividendYield,
        roe: m.roe,
        debtToEquity: m.debtToEquity,
        currentRatio: m.currentRatio,
      }));
    }
  );

  const getSectorPerformanceTool = ai.defineTool(
    {
      name: "getSectorPerformance",
      description: "Get today's sector performance across the market",
      inputSchema: z.object({}),
      outputSchema: z.array(z.object({
        sector: z.string(),
        changesPercentage: z.string(),
      })),
    },
    async () => {
      return await fmpClient.getSectorPerformance();
    }
  );

  return { getQuoteTool, getProfileTool, getKeyMetricsTool, getSectorPerformanceTool };
}

function getTools() {
  const ai = getAI();
  if (!_tools) {
    _tools = registerTools(ai);
  }
  return { ai, ..._tools };
}

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You are "The Analyst", an AI portfolio intelligence assistant for Invormed — a UK-focused investment platform.

Your responsibilities:
- Answer questions about stocks, ETFs, sectors, and market conditions
- Provide fundamental analysis using real-time financial data via your tools
- Help users understand their portfolio composition and risk
- Explain financial concepts clearly for retail investors

Guidelines:
- Always use your tools to fetch live data rather than relying on training data
- Present numbers clearly with appropriate formatting (e.g. $1.2B, 15.3%)
- Be concise but thorough
- When discussing UK investments, consider ISA/SIPP wrapper implications
- Handle GBX (pence) vs GBP conversions when relevant
- Never provide specific buy/sell recommendations - present analysis and let users decide

IMPORTANT: You are not a financial advisor. Always remind users that your analysis is informational only and not financial advice.`;

// =============================================================================
// Request Schema
// =============================================================================

const ChatRequestSchema = z4.object({
  message: z4.string().min(1).max(2000),
  history: z4.array(z4.object({
    role: z4.enum(["user", "assistant"]),
    content: z4.string(),
  })).optional(),
  portfolioSummary: z4.string().optional(),
});

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { message, history, portfolioSummary } = parsed.data;
    const { ai, getQuoteTool, getProfileTool, getKeyMetricsTool, getSectorPerformanceTool } = getTools();

    // Build conversation history for context
    const messages = (history ?? []).map((m) => ({
      role: m.role as "user" | "model",
      content: [{ text: m.content }],
    }));

    // Add portfolio context to system prompt if available
    const systemPrompt = portfolioSummary
      ? `${SYSTEM_PROMPT}\n\nCurrent Portfolio Summary:\n${portfolioSummary}`
      : SYSTEM_PROMPT;

    const response = await ai.generate({
      model: DEEPSEEK_MODEL,
      system: systemPrompt,
      messages: [
        ...messages,
        { role: "user" as const, content: [{ text: message }] },
      ],
      tools: [getQuoteTool, getProfileTool, getKeyMetricsTool, getSectorPerformanceTool],
    });

    return NextResponse.json({ response: response.text });
  } catch (error) {
    logger.error("research-hub", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
