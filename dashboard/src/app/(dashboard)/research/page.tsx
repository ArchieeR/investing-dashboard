import {
  fetchMacroEvents,
  fetchNews,
  fetchEarnings,
  fetchSectorPerformance,
  fetchTopMovers,
} from "@/app/actions/research";
import { ResearchHub } from "@/components/features/intelligence/ResearchHub";
import { MarketOverview } from "@/components/features/market/MarketOverview";
import { AIChat } from "@/components/features/chat/AIChat";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const [macroEvents, newsItems, earningEvents, sectors, movers] =
    await Promise.all([
      fetchMacroEvents(),
      fetchNews(),
      fetchEarnings(),
      fetchSectorPerformance(),
      fetchTopMovers(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Hub</h1>
        <p className="text-muted-foreground">
          Market intelligence, earnings, and AI analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          <ResearchHub
            macroEvents={macroEvents}
            newsItems={newsItems}
            earningEvents={earningEvents}
          />
          <MarketOverview
            sectors={sectors}
            gainers={movers.gainers}
            losers={movers.losers}
            actives={movers.actives}
          />
        </div>

        {/* AI Chat Sidebar */}
        <div className="xl:col-span-1">
          <div className="sticky top-20">
            <AIChat />
          </div>
        </div>
      </div>
    </div>
  );
}
