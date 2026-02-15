"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MacroEvent } from "@/types/intelligence";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MacroCalendarProps {
  events: MacroEvent[];
}

export function MacroCalendar({ events }: MacroCalendarProps) {
  const nowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nowRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, MacroEvent[]>();
    for (const e of events) {
      const day = e.time.split("T")[0] ?? e.time;
      const existing = map.get(day) ?? [];
      existing.push(e);
      map.set(day, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const nowDate = new Date().toISOString().split("T")[0];

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          Macro Calendar
        </h3>
        <p className="text-xs text-muted-foreground">
          No upcoming economic events.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 max-h-[600px] overflow-y-auto">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        Macro Calendar
      </h3>
      <div className="relative space-y-4">
        {/* Vertical timeline line */}
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

        {grouped.map(([day, dayEvents]) => {
          const isToday = day === nowDate;
          const isPast = day < (nowDate ?? "");

          return (
            <div key={day} className="relative">
              {isToday && (
                <div
                  ref={nowRef}
                  className="absolute -left-1 right-0 h-px bg-primary z-10"
                  style={{ top: -2 }}
                >
                  <span className="absolute -top-2.5 -left-1 text-[10px] font-bold text-primary">
                    NOW
                  </span>
                </div>
              )}
              <div className="ml-6 mb-1">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isToday
                      ? "text-primary"
                      : isPast
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground"
                  )}
                >
                  {formatDay(day)}
                </span>
              </div>
              {dayEvents.map((evt, i) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative flex items-start gap-3 ml-0 py-1.5"
                >
                  {/* Node */}
                  <div className="relative z-10 mt-1 flex-shrink-0">
                    <div
                      className={cn(
                        "rounded-full",
                        evt.impact === "high"
                          ? "w-3.5 h-3.5 bg-destructive animate-pulse"
                          : evt.impact === "medium"
                            ? "w-2.5 h-2.5 bg-yellow-500"
                            : "w-2 h-2 bg-muted-foreground/40"
                      )}
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs leading-snug truncate",
                        evt.impact === "high"
                          ? "text-destructive font-semibold"
                          : "text-foreground"
                      )}
                    >
                      {evt.title}
                    </p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{evt.category}</span>
                      {evt.actual && <span>Act: {evt.actual}</span>}
                      {evt.expected && <span>Est: {evt.expected}</span>}
                      {evt.previous && <span>Prev: {evt.previous}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
