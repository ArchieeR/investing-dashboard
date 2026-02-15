"use client";

import type {
  MacroEvent,
  NewsItem,
  EarningEvent,
  ImpactEvent,
} from "@/types/intelligence";
import { MacroCalendar } from "./MacroCalendar";
import { NewsFeed } from "./NewsFeed";
import { EarningsRail } from "./EarningsRail";
import { ImpactCard } from "./ImpactCard";

interface ResearchHubProps {
  macroEvents: MacroEvent[];
  newsItems: NewsItem[];
  earningEvents: EarningEvent[];
  impactEvent?: ImpactEvent | null;
  portfolioTickers?: string[];
  onLoadMoreNews?: (page: number) => Promise<NewsItem[]>;
}

export function ResearchHub({
  macroEvents,
  newsItems,
  earningEvents,
  impactEvent,
  portfolioTickers,
  onLoadMoreNews,
}: ResearchHubProps) {
  return (
    <div className="space-y-4">
      {impactEvent && <ImpactCard event={impactEvent} />}

      <EarningsRail events={earningEvents} portfolioTickers={portfolioTickers} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MacroCalendar events={macroEvents} />
        </div>
        <div className="lg:col-span-2">
          <NewsFeed
            initialItems={newsItems}
            portfolioTickers={portfolioTickers}
            onLoadMore={onLoadMoreNews}
          />
        </div>
      </div>
    </div>
  );
}
