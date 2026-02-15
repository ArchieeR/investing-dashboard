"use client";

import { useMemo } from "react";
import type { FMPETFHolding } from "@/lib/fmp";
import { cn } from "@/lib/utils";

interface ETFOverlapProps {
  /** Map of ETF ticker -> its holdings */
  holdingsByETF: Record<string, FMPETFHolding[]>;
}

interface CommonHolding {
  symbol: string;
  name: string;
  etfs: { etf: string; weight: number }[];
  combinedWeight: number;
}

export function ETFOverlap({ holdingsByETF }: ETFOverlapProps) {
  const etfList = Object.keys(holdingsByETF);

  const overlapMatrix = useMemo(() => {
    // Build symbol sets per ETF
    const symbolSets: Record<string, Set<string>> = {};
    for (const [etf, holdings] of Object.entries(holdingsByETF)) {
      symbolSets[etf] = new Set(holdings.map((h) => h.asset.toUpperCase()));
    }

    // Calculate pairwise overlap
    const matrix: Record<string, Record<string, number>> = {};
    for (const a of etfList) {
      matrix[a] = {};
      for (const b of etfList) {
        if (a === b) {
          matrix[a][b] = 100;
          continue;
        }
        const setA = symbolSets[a];
        const setB = symbolSets[b];
        if (!setA || !setB || setA.size === 0) {
          matrix[a][b] = 0;
          continue;
        }
        let overlap = 0;
        for (const sym of setA) {
          if (setB.has(sym)) overlap++;
        }
        matrix[a][b] = (overlap / setA.size) * 100;
      }
    }
    return matrix;
  }, [holdingsByETF, etfList]);

  const commonHoldings = useMemo(() => {
    const holdingMap = new Map<string, CommonHolding>();

    for (const [etf, holdings] of Object.entries(holdingsByETF)) {
      for (const h of holdings) {
        const key = h.asset.toUpperCase();
        const existing = holdingMap.get(key) ?? {
          symbol: h.asset,
          name: h.name ?? h.asset,
          etfs: [],
          combinedWeight: 0,
        };
        existing.etfs.push({ etf, weight: h.weightPercentage });
        existing.combinedWeight += h.weightPercentage;
        holdingMap.set(key, existing);
      }
    }

    return Array.from(holdingMap.values())
      .filter((h) => h.etfs.length > 1)
      .sort((a, b) => b.combinedWeight - a.combinedWeight);
  }, [holdingsByETF]);

  if (etfList.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-xs text-muted-foreground text-center">
          Add at least 2 ETFs to your portfolio to see overlap analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heatmap Matrix */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Overlap Heatmap
        </h3>
        <table className="text-xs">
          <thead>
            <tr>
              <th className="p-2" />
              {etfList.map((etf) => (
                <th
                  key={etf}
                  className="p-2 font-mono font-bold text-[#22D3EE] text-center"
                >
                  {etf}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {etfList.map((rowEtf) => (
              <tr key={rowEtf}>
                <td className="p-2 font-mono font-bold text-[#22D3EE]">
                  {rowEtf}
                </td>
                {etfList.map((colEtf) => {
                  const pct = overlapMatrix[rowEtf]?.[colEtf] ?? 0;
                  return (
                    <td
                      key={colEtf}
                      className="p-2 text-center font-mono"
                      style={{ backgroundColor: overlapColor(pct) }}
                    >
                      {pct.toFixed(0)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Common Holdings Table */}
      {commonHoldings.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Common Holdings ({commonHoldings.length})
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Symbol
                  </th>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-center p-2 font-medium text-muted-foreground">
                    In ETFs
                  </th>
                  <th className="text-right p-2 font-medium text-muted-foreground">
                    Combined Wt.
                  </th>
                </tr>
              </thead>
              <tbody>
                {commonHoldings.slice(0, 50).map((h) => (
                  <tr
                    key={h.symbol}
                    className="border-t border-border hover:bg-muted/10"
                  >
                    <td className="p-2 font-mono font-bold text-[#22D3EE]">
                      {h.symbol}
                    </td>
                    <td className="p-2 text-foreground truncate max-w-[200px]">
                      {h.name}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {h.etfs.map((e) => (
                          <span
                            key={e.etf}
                            className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                          >
                            {e.etf} ({e.weight.toFixed(1)}%)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono font-medium">
                      {h.combinedWeight.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function overlapColor(pct: number): string {
  if (pct >= 80) return "rgba(239, 68, 68, 0.3)";
  if (pct >= 60) return "rgba(239, 68, 68, 0.2)";
  if (pct >= 40) return "rgba(245, 158, 11, 0.2)";
  if (pct >= 20) return "rgba(245, 158, 11, 0.1)";
  if (pct > 0) return "rgba(34, 197, 94, 0.1)";
  return "transparent";
}
