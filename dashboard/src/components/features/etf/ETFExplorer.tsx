"use client";

import { useMemo, useState } from "react";
import type { FMPETFInfo, FMPQuote } from "@/lib/fmp";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ETFData {
  info: FMPETFInfo;
  quote?: FMPQuote;
}

interface ETFExplorerProps {
  etfs: ETFData[];
}

type RegionFilter = "all" | "US" | "EU" | "UK" | "Global";
type ExpenseFilter = "all" | "low" | "medium" | "high";

export function ETFExplorer({ etfs }: ETFExplorerProps) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [expense, setExpense] = useState<ExpenseFilter>("all");

  const filtered = useMemo(() => {
    return etfs.filter((e) => {
      const q = search.toLowerCase();
      if (
        q &&
        !e.info.symbol.toLowerCase().includes(q) &&
        !e.info.name.toLowerCase().includes(q)
      )
        return false;

      if (region !== "all") {
        const domicile = (e.info.domicile ?? "").toLowerCase();
        if (region === "US" && !domicile.includes("us") && !domicile.includes("united states"))
          return false;
        if (region === "EU" && !domicile.includes("eu") && !domicile.includes("ireland") && !domicile.includes("luxembourg"))
          return false;
        if (region === "UK" && !domicile.includes("uk") && !domicile.includes("united kingdom"))
          return false;
      }

      if (expense !== "all" && e.info.expenseRatio != null) {
        if (expense === "low" && e.info.expenseRatio > 0.2) return false;
        if (expense === "medium" && (e.info.expenseRatio <= 0.2 || e.info.expenseRatio > 0.5))
          return false;
        if (expense === "high" && e.info.expenseRatio <= 0.5) return false;
      }

      return true;
    });
  }, [etfs, search, region, expense]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ETFs..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <FilterPill
            label="Region"
            options={["all", "US", "EU", "UK", "Global"]}
            value={region}
            onChange={(v) => setRegion(v as RegionFilter)}
          />
          <FilterPill
            label="TER"
            options={["all", "low", "medium", "high"]}
            value={expense}
            onChange={(v) => setExpense(v as ExpenseFilter)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {filtered.map((etf, i) => (
          <motion.div
            key={etf.info.symbol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Link
              href={`/explorer/${etf.info.symbol}`}
              className="block p-4 rounded-lg border border-border bg-card hover:-translate-y-1 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-bold text-[#22D3EE]">
                    {etf.info.symbol}
                  </span>
                  {etf.info.etfCompany && (
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {etf.info.etfCompany}
                    </span>
                  )}
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-semibold text-foreground line-clamp-2 mb-3">
                {etf.info.name}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                {etf.info.expenseRatio != null && (
                  <Stat label="TER" value={`${(etf.info.expenseRatio * 100).toFixed(2)}%`} />
                )}
                {etf.info.aum != null && (
                  <Stat label="AUM" value={formatAUM(etf.info.aum)} />
                )}
                {etf.info.domicile && (
                  <Stat label="Domicile" value={etf.info.domicile} />
                )}
                {etf.info.inceptionDate && (
                  <Stat label="Inception" value={etf.info.inceptionDate} />
                )}
              </div>
              {etf.quote && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <span className="text-sm font-mono font-medium">
                    ${etf.quote.price.toFixed(2)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      etf.quote.changePercentage >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {etf.quote.changePercentage >= 0 ? "+" : ""}
                    {etf.quote.changePercentage.toFixed(2)}%
                  </span>
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No ETFs match your filters.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function FilterPill({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {o === "all" ? "All" : o}
        </option>
      ))}
    </select>
  );
}

function formatAUM(aum: number): string {
  if (aum >= 1e12) return `$${(aum / 1e12).toFixed(1)}T`;
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(1)}M`;
  return `$${aum.toLocaleString()}`;
}
