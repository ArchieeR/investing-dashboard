import { ExplorerView } from "@/components/views/ExplorerView";
import { fmp } from "@/services/data_ingestion/fmp_client";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
    let trendingAssets: import("@/services/data_ingestion/types/fmp.types").FMPMarketMover[] = [];
    try {
        trendingAssets = await fmp.getMostActives();
    } catch (error) {
        console.error("Failed to fetch trending assets:", error);
    }

    return (
        <div className="contain-layout space-y-6">
            <header className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Explorer</h1>
                    <p className="text-muted-foreground mt-1">
                        Look inside any ETF or Stock. Analyze holdings, overlap, and exposure.
                    </p>
                </div>
            </header>

            {/* Trending Row */}
            <div className="border-t pt-6">
                <ExplorerView trendingAssets={trendingAssets} />
            </div>
        </div>
    );
}
