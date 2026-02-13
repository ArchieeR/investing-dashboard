import { FMPMarketMover, FMPQuoteShort } from "@/services/data_ingestion/types/fmp.types";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrendingAssetsRowProps {
    assets: (FMPQuoteShort | FMPMarketMover)[];
    label?: string;
    className?: string;
}

export function TrendingAssetsRow({ assets, label = "Trending Assets", className }: TrendingAssetsRowProps) {
    if (!assets || assets.length === 0) return null;

    return (
        <div className={cn("w-full space-y-3", className)}>
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{label}</span>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {assets.map((asset) => {
                    const change = 'changesPercentage' in asset ? asset.changesPercentage : undefined;
                    const isPositive = change !== undefined ? change >= 0 : true;

                    return (
                        <Link
                            key={asset.symbol}
                            href={`/explorer/${asset.symbol}`}
                            className="flex-none w-[160px] p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold font-mono tracking-tight">{asset.symbol}</span>
                                <div className={cn(
                                    "p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                    isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-lg font-semibold tabular-nums">
                                    ${asset.price.toFixed(2)}
                                </span>
                                {change !== undefined && (
                                    <span className={cn("text-xs font-medium tabular-nums", isPositive ? "text-green-500" : "text-red-500")}>
                                        {isPositive ? "+" : ""}{change.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
