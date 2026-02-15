"use client";

import type { ImpactEvent } from "@/types/intelligence";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ImpactCardProps {
  event: ImpactEvent | null;
}

export function ImpactCard({ event }: ImpactCardProps) {
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-gradient-to-br from-card to-background p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground mb-2">
            {event.title}
          </h3>
          <ul className="space-y-1 mb-3">
            {event.keyPoints.map((point, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground flex items-start gap-1.5"
              >
                <span className="text-primary mt-0.5">-</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {event.marketReaction.map((r, i) => {
              const isPositive = r.change.startsWith("+");
              return (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium",
                    isPositive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {r.asset} {r.change}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
