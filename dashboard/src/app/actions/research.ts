"use server";

import { fmpClient } from "@/lib/fmp";
import { z } from "zod";
import {
  FMPEarningsCalendarSchema,
  FMPStockNewsSchema,
  FMPSectorPerformanceSchema,
  FMPMarketMoverSchema,
} from "@/lib/fmp";
import type { MacroEvent, NewsItem, EarningEvent } from "@/types/intelligence";

// =============================================================================
// Economic Calendar Schema (FMP /stable/economic-calendar)
// =============================================================================

const FMPEconomicEventSchema = z.object({
  event: z.string(),
  date: z.string(),
  country: z.string().optional(),
  actual: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
  change: z.number().nullable().optional(),
  changePercentage: z.number().nullable().optional(),
  estimate: z.string().nullable().optional(),
  impact: z.string().optional(),
});

type FMPEconomicEvent = z.infer<typeof FMPEconomicEventSchema>;

// =============================================================================
// Server Actions
// =============================================================================

export async function fetchMacroEvents(): Promise<MacroEvent[]> {
  try {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    const to = new Date(now);
    to.setDate(to.getDate() + 7);

    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

    const res = await fetch(
      `https://financialmodelingprep.com/stable/economic-calendar?from=${fromStr}&to=${toStr}&apikey=${process.env.FMP_API_KEY ?? ""}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const events = z.array(FMPEconomicEventSchema).safeParse(data);
    if (!events.success) return [];

    return events.data.map((e: FMPEconomicEvent, i: number) => ({
      id: `macro-${i}-${e.date}`,
      title: e.event,
      time: e.date,
      impact: mapImpact(e.impact),
      expected: e.estimate ?? undefined,
      previous: e.previous ?? undefined,
      actual: e.actual ?? undefined,
      category: e.country ?? "Global",
    }));
  } catch {
    return [];
  }
}

function mapImpact(impact?: string): "high" | "medium" | "low" {
  if (!impact) return "low";
  const lower = impact.toLowerCase();
  if (lower === "high" || lower.includes("high")) return "high";
  if (lower === "medium" || lower.includes("medium")) return "medium";
  return "low";
}

export async function fetchNews(
  tickers?: string[],
  page = 0
): Promise<NewsItem[]> {
  try {
    const symbols = tickers?.length ? tickers : ["AAPL", "MSFT", "GOOGL"];
    const data = await fmpClient.getStockNews(symbols, page, 20);
    const parsed = z.array(FMPStockNewsSchema).safeParse(data);
    if (!parsed.success) return [];

    return parsed.data.map((n, i) => ({
      id: `news-${i}-${n.publishedDate}`,
      title: n.title,
      summary: n.text.slice(0, 200),
      url: n.url,
      source: n.site,
      publishedAt: n.publishedDate,
      category: "Market",
      tickers: [n.symbol],
      imageUrl: n.image ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchEarnings(
  tickers?: string[]
): Promise<EarningEvent[]> {
  try {
    const now = new Date();
    const from = now.toISOString().split("T")[0];
    const to = new Date(now);
    to.setDate(to.getDate() + 14);
    const toStr = to.toISOString().split("T")[0];

    const data = await fmpClient.getEarningsCalendar(from, toStr);
    const parsed = z.array(FMPEarningsCalendarSchema).safeParse(data);
    if (!parsed.success) return [];

    let events = parsed.data;
    if (tickers?.length) {
      const tickerSet = new Set(tickers.map((t) => t.toUpperCase()));
      events = events.filter((e) => tickerSet.has(e.symbol.toUpperCase()));
    }

    return events.slice(0, 30).map((e) => ({
      ticker: e.symbol,
      company: e.symbol,
      date: e.date,
      time: e.time ?? "bmo",
      estimatedEPS: e.epsEstimated,
      actualEPS: e.eps,
      estimatedRevenue: e.revenueEstimated,
    }));
  } catch {
    return [];
  }
}

export async function fetchSectorPerformance() {
  try {
    const data = await fmpClient.getSectorPerformance();
    return z.array(FMPSectorPerformanceSchema).parse(data);
  } catch {
    return [];
  }
}

export async function fetchTopMovers() {
  try {
    const [gainers, losers, actives] = await Promise.all([
      fmpClient.getBiggestGainers(),
      fmpClient.getBiggestLosers(),
      fmpClient.getMostActives(),
    ]);
    const schema = z.array(FMPMarketMoverSchema);
    return {
      gainers: schema.parse(gainers).slice(0, 10),
      losers: schema.parse(losers).slice(0, 10),
      actives: schema.parse(actives).slice(0, 10),
    };
  } catch {
    return { gainers: [], losers: [], actives: [] };
  }
}
