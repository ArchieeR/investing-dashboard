import { fmpClient } from "@/lib/fmp";
import { fetchTopMovers } from "@/app/actions/research";
import { MarketOverview } from "@/components/features/market/MarketOverview";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const [movers, sectors] = await Promise.all([
    fetchTopMovers(),
    fmpClient.getSectorPerformance(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Market Explorer</h1>
        <p className="text-muted-foreground mt-1">
          Look inside any ETF or Stock. Analyze holdings, overlap, and exposure.
        </p>
      </header>

      <MarketOverview
        sectors={sectors}
        gainers={movers.gainers}
        losers={movers.losers}
        actives={movers.actives}
      />
    </div>
  );
}
