"use client";

import type { EarningEvent } from "@/types/intelligence";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface EarningsRailProps {
  events: EarningEvent[];
  portfolioTickers?: string[];
}

export function EarningsRail({
  events,
  portfolioTickers = [],
}: EarningsRailProps) {
  const tickerSet = new Set(portfolioTickers.map((t) => t.toUpperCase()));

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Upcoming Earnings
        </h3>
        <p className="text-xs text-muted-foreground">
          No upcoming earnings reports.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">
          Upcoming Earnings
        </h3>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {events.map((evt, i) => {
          const isHolding = tickerSet.has(evt.ticker.toUpperCase());
          return (
            <motion.div
              key={`${evt.ticker}-${evt.date}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex-none w-48 p-3 rounded-lg bg-card border",
                isHolding ? "border-primary" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg font-bold text-[#22D3EE]">
                  {evt.ticker}
                </span>
                {isHolding && (
                  <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    HELD
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mb-1">
                {evt.company}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>{formatDate(evt.date)}</span>
                <span className="uppercase">{evt.time}</span>
              </div>
              {evt.estimatedEPS != null && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Est. EPS: ${evt.estimatedEPS.toFixed(2)}
                </p>
              )}
              {evt.impliedMove && (
                <p className="text-[10px] text-yellow-500 mt-0.5">
                  Implied Move: {evt.impliedMove}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
