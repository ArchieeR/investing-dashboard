"use client";

import { useMemo, useState } from "react";
import type { FMPETFHolding } from "@/lib/fmp";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface HoldingExposure {
  etf: string;
  weight: number;
}

interface AggregatedHolding {
  symbol: string;
  name: string;
  totalWeight: number;
  exposures: HoldingExposure[];
}

interface ETFLookThroughProps {
  /** Map of ETF ticker -> its holdings */
  holdingsByETF: Record<string, FMPETFHolding[]>;
  /** Portfolio ETF weights (ticker -> portfolio weight %) */
  etfWeights?: Record<string, number>;
}

export function ETFLookThrough({ holdingsByETF, etfWeights }: ETFLookThroughProps) {
  const [search, setSearch] = useState("");

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedHolding>();

    for (const [etf, holdings] of Object.entries(holdingsByETF)) {
      const portfolioWeight = etfWeights?.[etf] ?? 1;

      for (const h of holdings) {
        const key = h.asset.toUpperCase();
        const existing = map.get(key) ?? {
          symbol: h.asset,
          name: h.name ?? h.asset,
          totalWeight: 0,
          exposures: [],
        };

        const adjustedWeight = h.weightPercentage * (portfolioWeight / 100);
        existing.totalWeight += adjustedWeight;
        existing.exposures.push({ etf, weight: h.weightPercentage });
        map.set(key, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalWeight - a.totalWeight);
  }, [holdingsByETF, etfWeights]);

  const filtered = useMemo(() => {
    if (!search) return aggregated;
    const q = search.toLowerCase();
    return aggregated.filter(
      (h) =>
        h.symbol.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q)
    );
  }, [aggregated, search]);

  const etfList = Object.keys(holdingsByETF);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            ETF Look-Through
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {aggregated.length} holdings across {etfList.length} ETFs
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter holdings..."
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium text-muted-foreground">Symbol</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Name</th>
              <th className="text-right p-2 font-medium text-muted-foreground">Total Wt.</th>
              {etfList.map((etf) => (
                <th
                  key={etf}
                  className="text-right p-2 font-medium text-muted-foreground font-mono"
                >
                  {etf}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((h) => (
              <tr
                key={h.symbol}
                className="border-t border-border hover:bg-muted/10 transition-colors"
              >
                <td className="p-2 font-mono font-bold text-[#22D3EE]">
                  {h.symbol}
                </td>
                <td className="p-2 text-foreground truncate max-w-[200px]">
                  {h.name}
                </td>
                <td className="p-2 text-right font-mono font-medium">
                  {h.totalWeight.toFixed(2)}%
                </td>
                {etfList.map((etf) => {
                  const exposure = h.exposures.find((e) => e.etf === etf);
                  return (
                    <td
                      key={etf}
                      className={cn(
                        "p-2 text-right font-mono",
                        exposure ? "text-foreground" : "text-muted-foreground/30"
                      )}
                    >
                      {exposure ? `${exposure.weight.toFixed(2)}%` : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No holdings found.
          </p>
        )}
      </div>
    </div>
  );
}
