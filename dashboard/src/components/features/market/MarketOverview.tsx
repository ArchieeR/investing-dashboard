"use client";

import type { FMPSectorPerformance, FMPMarketMover } from "@/lib/fmp";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import Link from "next/link";

interface MarketOverviewProps {
  sectors: FMPSectorPerformance[];
  gainers: FMPMarketMover[];
  losers: FMPMarketMover[];
  actives: FMPMarketMover[];
}

export function MarketOverview({
  sectors,
  gainers,
  losers,
  actives,
}: MarketOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Sector Performance */}
      {sectors.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Sector Performance
          </h3>
          <div className="space-y-2">
            {sectors.map((s, i) => {
              const pct = parseFloat(s.changesPercentage);
              const isPositive = pct >= 0;
              const maxAbs = Math.max(
                ...sectors.map((x) => Math.abs(parseFloat(x.changesPercentage)))
              );
              const barWidth = maxAbs > 0 ? (Math.abs(pct) / maxAbs) * 100 : 0;

              return (
                <motion.div
                  key={s.sector}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground w-32 truncate flex-shrink-0">
                    {s.sector}
                  </span>
                  <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isPositive ? "bg-green-500/60" : "bg-red-500/60"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-medium w-16 text-right",
                      isPositive ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {pct.toFixed(2)}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Movers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoverPanel
          title="Top Gainers"
          icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />}
          movers={gainers}
          colorClass="text-green-400"
        />
        <MoverPanel
          title="Top Losers"
          icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          movers={losers}
          colorClass="text-red-400"
        />
        <MoverPanel
          title="Most Active"
          icon={<Activity className="w-3.5 h-3.5 text-primary" />}
          movers={actives}
          colorClass="text-foreground"
        />
      </div>
    </div>
  );
}

function MoverPanel({
  title,
  icon,
  movers,
  colorClass,
}: {
  title: string;
  icon: React.ReactNode;
  movers: FMPMarketMover[];
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-2">
        {movers.slice(0, 8).map((m) => {
          const isPositive = m.changesPercentage >= 0;
          return (
            <Link
              key={m.symbol}
              href={`/explorer/${m.symbol}`}
              className="flex items-center justify-between py-1 hover:bg-muted/20 rounded px-1 -mx-1 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono font-bold text-[#22D3EE]">
                  {m.symbol}
                </span>
                <span className="text-[10px] text-muted-foreground ml-2 truncate">
                  {m.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono">${m.price.toFixed(2)}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-medium",
                    isPositive ? "text-green-400" : "text-red-400",
                    colorClass
                  )}
                >
                  {isPositive ? "+" : ""}
                  {m.changesPercentage.toFixed(2)}%
                </span>
              </div>
            </Link>
          );
        })}
        {movers.length === 0 && (
          <p className="text-xs text-muted-foreground">No data available.</p>
        )}
      </div>
    </div>
  );
}
