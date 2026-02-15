'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePortfolio } from '@/context/PortfolioContext';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowUpDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradeType } from '@/types/portfolio';

type SortField = 'date' | 'ticker' | 'price' | 'qty' | 'total';
type SortDir = 'asc' | 'desc';

export function TradeHistory() {
  const { portfolio, trades } = usePortfolio();
  const [typeFilter, setTypeFilter] = useState<TradeType | 'all'>('all');
  const [tickerFilter, setTickerFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const holdingsMap = useMemo(
    () => new Map(portfolio.holdings.map((h) => [h.id, h])),
    [portfolio.holdings],
  );

  const tickers = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      const h = holdingsMap.get(t.holdingId);
      if (h?.ticker) set.add(h.ticker);
    });
    return Array.from(set).sort();
  }, [trades, holdingsMap]);

  const filteredTrades = useMemo(() => {
    let result = trades.map((t) => {
      const holding = holdingsMap.get(t.holdingId);
      return {
        ...t,
        ticker: holding?.ticker ?? '',
        name: holding?.name ?? '',
        total: t.price * t.qty,
      };
    });

    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (tickerFilter !== 'all') {
      result = result.filter((t) => t.ticker === tickerFilter);
    }

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'date':
          return (a.date > b.date ? 1 : -1) * dir;
        case 'ticker':
          return a.ticker.localeCompare(b.ticker) * dir;
        case 'price':
          return (a.price - b.price) * dir;
        case 'qty':
          return (a.qty - b.qty) * dir;
        case 'total':
          return (a.total - b.total) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [trades, holdingsMap, typeFilter, tickerFilter, sortField, sortDir]);

  const stats = useMemo(() => {
    const buys = filteredTrades.filter((t) => t.type === 'buy');
    const sells = filteredTrades.filter((t) => t.type === 'sell');
    return {
      total: filteredTrades.length,
      buyCount: buys.length,
      buyValue: buys.reduce((s, t) => s + t.total, 0),
      sellCount: sells.length,
      sellValue: sells.reduce((s, t) => s + t.total, 0),
      net: buys.reduce((s, t) => s + t.total, 0) - sells.reduce((s, t) => s + t.total, 0),
    };
  }, [filteredTrades]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  if (trades.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No trades yet"
        description="Record your first trade to see your trade history here."
      />
    );
  }

  const fmt = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TradeType | 'all')}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tickerFilter} onValueChange={setTickerFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickers</SelectItem>
            {tickers.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="font-mono text-xs">{t}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Trades</p>
          <p className="text-lg font-mono font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Buys</p>
          <p className="text-lg font-mono font-semibold text-[#22C55E]">
            {stats.buyCount} <span className="text-xs">{fmt(stats.buyValue)}</span>
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Sells</p>
          <p className="text-lg font-mono font-semibold text-destructive">
            {stats.sellCount} <span className="text-xs">{fmt(stats.sellValue)}</span>
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3 col-span-2 md:col-span-2">
          <p className="text-xs text-muted-foreground">Net Investment</p>
          <p className={cn('text-lg font-mono font-semibold', stats.net >= 0 ? 'text-[#22C55E]' : 'text-destructive')}>
            {fmt(stats.net)}
          </p>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="date">Date</SortHeader>
              <SortHeader field="ticker">Ticker</SortHeader>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <SortHeader field="price">Price</SortHeader>
              <SortHeader field="qty">Qty</SortHeader>
              <SortHeader field="total">Total</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((t) => (
              <TableRow
                key={t.id}
                className={cn(
                  t.type === 'buy' ? 'bg-[#22C55E]/5' : 'bg-destructive/5',
                )}
              >
                <TableCell className="font-mono text-xs">{t.date}</TableCell>
                <TableCell className="font-mono text-xs text-cyan-400">{t.ticker}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{t.name}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-block rounded-[4px] px-2 py-0.5 text-xs font-medium',
                      t.type === 'buy'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {t.type.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-right">{fmt(t.price)}</TableCell>
                <TableCell className="font-mono text-xs text-right">{t.qty.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs text-right font-semibold">{fmt(t.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
