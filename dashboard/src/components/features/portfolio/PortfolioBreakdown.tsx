'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import type { BreakdownEntry } from '@/lib/domain/selectors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';

const COLORS = [
  '#FF6B00', '#22C55E', '#22D3EE', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#84CC16',
];

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface PieChartProps {
  data: BreakdownEntry[];
}

function PieChart({ data }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const segments = useMemo(() => {
    const result: Array<{ offset: number; length: number; color: string; label: string }> = [];
    let cumulative = 0;
    const circumference = 2 * Math.PI * 40;

    data.forEach((entry, i) => {
      if (total <= 0) return;
      const pct = entry.value / total;
      const length = pct * circumference;
      result.push({
        offset: cumulative,
        length,
        color: COLORS[i % COLORS.length],
        label: entry.label,
      });
      cumulative += length;
    });
    return result;
  }, [data, total]);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const circumference = 2 * Math.PI * 40;

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
      <svg viewBox="0 0 100 100" className="size-40 shrink-0 -rotate-90">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {data.map((entry, i) => (
          <div key={entry.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-foreground">{entry.label}</span>
            <span className="ml-auto font-mono text-muted-foreground shrink-0">
              {formatGBP(entry.value)}
            </span>
            <span className="font-mono text-[#52525B] w-12 text-right shrink-0">
              {entry.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortfolioBreakdown() {
  const { bySection, byAccount, byTheme, portfolio } = usePortfolio();

  const byAssetType = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const h of portfolio.holdings) {
      if (!h.include) continue;
      const price = h.livePrice ?? h.price;
      const value = price * h.qty;
      map.set(h.assetType, (map.get(h.assetType) ?? 0) + value);
      total += value;
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio.holdings]);

  return (
    <Tabs defaultValue="sections">
      <TabsList>
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="themes">Themes</TabsTrigger>
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
      </TabsList>
      <TabsContent value="sections" className="mt-4">
        <PieChart data={bySection} />
      </TabsContent>
      <TabsContent value="themes" className="mt-4">
        <PieChart data={byTheme} />
      </TabsContent>
      <TabsContent value="accounts" className="mt-4">
        <PieChart data={byAccount} />
      </TabsContent>
      <TabsContent value="asset-types" className="mt-4">
        <PieChart data={byAssetType} />
      </TabsContent>
    </Tabs>
  );
}
