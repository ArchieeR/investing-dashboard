import { fmp } from "@/services/data_ingestion/fmp_client";
import { TrendingAssetsRow } from "@/components/features/market/TrendingAssetsRow";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
    let trendingAssets: import("@/services/data_ingestion/types/fmp.types").FMPMarketMover[] = [];
    try {
        trendingAssets = await fmp.getMostActives();
    } catch (error) {
        console.error("Failed to fetch trending assets for Research Hub:", error);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Intelligence Feed</h1>
                <p className="text-muted-foreground">Automated insights and scrape results.</p>
            </div>

            <TrendingAssetsRow assets={trendingAssets} label="Market Movers" />

            <div className="grid gap-6">
                <div className="p-4 border rounded-lg bg-card text-card-foreground">
                    <h3 className="font-semibold mb-2">Market Impact Update</h3>
                    <p className="text-sm text-muted-foreground">No updates available yet.</p>
                </div>
            </div>
        </div>
    )
}
