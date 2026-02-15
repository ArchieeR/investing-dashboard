'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Layers, FolderOpen, Star } from 'lucide-react';
import { useMemo } from 'react';

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PortfolioHero() {
  const { derivedHoldings, totalValue, portfolio } = usePortfolio();

  const dayChange = useMemo(() => {
    let total = 0;
    for (const dh of derivedHoldings) {
      total += dh.dayChangeValue;
    }
    return total;
  }, [derivedHoldings]);

  const dayChangePercent = useMemo(() => {
    const manualTotal = derivedHoldings.reduce((sum, dh) => sum + dh.manualValue, 0);
    if (manualTotal <= 0) return 0;
    return (dayChange / manualTotal) * 100;
  }, [derivedHoldings, dayChange]);

  const topPerformer = useMemo(() => {
    let best: { ticker: string; pct: number } | null = null;
    for (const dh of derivedHoldings) {
      const pct = dh.holding.dayChangePercent ?? 0;
      if (!best || pct > best.pct) {
        best = { ticker: dh.holding.ticker, pct };
      }
    }
    return best;
  }, [derivedHoldings]);

  const isPositive = dayChange >= 0;
  const sectionCount = portfolio.lists.sections.length;
  const holdingsCount = derivedHoldings.length;

  return (
    <div className="rounded-lg bg-card border border-border p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-[#52525B] mb-1">Total Portfolio Value</p>
          <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
            {formatGBP(totalValue)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="size-4 text-[#22C55E]" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
            <span
              className={cn(
                'text-sm font-mono font-medium',
                isPositive ? 'text-[#22C55E]' : 'text-destructive',
              )}
            >
              {isPositive ? '+' : ''}
              {formatGBP(dayChange)} ({dayChangePercent >= 0 ? '+' : ''}
              {dayChangePercent.toFixed(2)}%)
            </span>
            <span className="text-xs text-[#52525B]">today</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5" />
            <span className="font-mono">{holdingsCount}</span>
            <span>holdings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FolderOpen className="size-3.5" />
            <span className="font-mono">{sectionCount}</span>
            <span>sections</span>
          </div>
          {topPerformer && topPerformer.pct !== 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="size-3.5 text-primary" />
              <span className="font-mono text-[#22D3EE]">{topPerformer.ticker}</span>
              <span
                className={cn(
                  'font-mono',
                  topPerformer.pct >= 0 ? 'text-[#22C55E]' : 'text-destructive',
                )}
              >
                {topPerformer.pct >= 0 ? '+' : ''}
                {topPerformer.pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
