"use client";

import { DetailedAsset } from "@/hooks/use-multi-asset-comparison";
import { Badge } from "@/components/ui/badge";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiAssetTableProps {
    assets: DetailedAsset[];
}

export function MultiAssetTable({ assets }: MultiAssetTableProps) {
    if (!assets.length) return null;

    return (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            {/* Sticky Header Column */}
                            <th className="p-4 text-left font-medium text-muted-foreground w-[200px] min-w-[150px] sticky left-0 bg-muted/30 backdrop-blur-sm z-10 border-r">
                                Asset
                            </th>
                            {assets.map((asset) => (
                                <th key={asset.ticker} className="p-4 text-center min-w-[140px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <Badge variant="outline" className="font-mono">{asset.ticker}</Badge>
                                        <span className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-[120px]">
                                            {asset.name}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {/* Core Data */}
                        <MetricRow label="Type" assets={assets} render={(a) => <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>} />
                        <MetricRow label="Region" assets={assets} render={(a) => a.region} />
                        <MetricRow label="Sector" assets={assets} render={(a) => a.sector} />

                        {/* Performance */}
                        <tr className="bg-muted/10"><td colSpan={assets.length + 1} className="p-2 px-4 text-xs font-semibold text-muted-foreground">Performance</td></tr>
                        <MetricRow label="Price" assets={assets} render={(a) => `$${a.price.toFixed(2)}`} />
                        <MetricRow label="1D Change" assets={assets}
                            render={(a) => <span className={cn(a.change1D >= 0 ? "text-green-600" : "text-red-600")}>{a.change1D > 0 ? "+" : ""}{a.change1D.toFixed(2)}%</span>}
                        />
                        <MetricRow label="1Y Return" assets={assets}
                            render={(a) => <span className="font-medium text-green-600">+{a.performance1Y.toFixed(1)}%</span>}
                        />
                        <MetricRow label="5Y Return" assets={assets}
                            render={(a) => <span className="font-medium text-green-600">+{a.performance5Y.toFixed(1)}%</span>}
                        />

                        {/* Fundamentals (Conditional) */}
                        <tr className="bg-muted/10"><td colSpan={assets.length + 1} className="p-2 px-4 text-xs font-semibold text-muted-foreground">Fundamentals</td></tr>
                        <MetricRow label="Yield" assets={assets} render={(a) => a.yield ? `${a.yield.toFixed(2)}%` : <Minus className="w-3 h-3 opacity-20 mx-auto" />} />
                        <MetricRow label="Expense Ratio" assets={assets} render={(a) => a.ter ? `${a.ter.toFixed(2)}%` : <Minus className="w-3 h-3 opacity-20 mx-auto" />} />
                        <MetricRow label="P/E Ratio" assets={assets} render={(a) => a.peRatio ? a.peRatio.toFixed(1) : <Minus className="w-3 h-3 opacity-20 mx-auto" />} />
                        <MetricRow label="Market Cap" assets={assets} render={(a) => a.marketCap || <Minus className="w-3 h-3 opacity-20 mx-auto" />} />
                        <MetricRow label="Holdings" assets={assets} render={(a) => a.holdingsCount || <Minus className="w-3 h-3 opacity-20 mx-auto" />} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Helper component to render a row for N assets
function MetricRow({ label, assets, render }: { label: string, assets: DetailedAsset[], render: (a: DetailedAsset) => React.ReactNode }) {
    return (
        <tr className="hover:bg-muted/5 transition-colors">
            <td className="p-4 font-medium sticky left-0 bg-background border-r z-10">
                {label}
            </td>
            {assets.map((asset) => (
                <td key={asset.ticker} className="p-4 text-center">
                    {render(asset)}
                </td>
            ))}
        </tr>
    );
}
