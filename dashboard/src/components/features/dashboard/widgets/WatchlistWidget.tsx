'use client';

// =============================================================================
// Watchlist Widget — live price mini-table
// =============================================================================

import React from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import type { WidgetConfig } from '@/types/widget-types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WatchlistWidgetProps {
    widget: WidgetConfig;
}

export function WatchlistWidget({ widget }: WatchlistWidgetProps) {
    const { derivedHoldings } = usePortfolio();
    const isCompact = widget.colSpan <= 1;

    // Show top holdings sorted by value as a quick watchlist
    const watchlist = [...derivedHoldings]
        .filter((dh) => dh.holding.ticker)
        .sort((a, b) => b.liveValue - a.liveValue)
        .slice(0, widget.rowSpan <= 1 ? 5 : widget.rowSpan <= 2 ? 8 : 12);

    if (watchlist.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No holdings to display
            </div>
        );
    }

    return (
        <div className="space-y-0.5 h-full overflow-y-auto">
            {watchlist.map((dh) => {
                const pct = dh.holding.dayChangePercent ?? 0;
                const isUp = pct > 0;
                const isDown = pct < 0;

                return (
                    <div
                        key={dh.holding.id}
                        className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-secondary/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono font-semibold text-[#22D3EE] truncate">
                                {dh.holding.ticker}
                            </span>
                            {!isCompact && (
                                <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                                    {dh.holding.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-foreground">
                                {dh.holding.livePrice
                                    ? `£${dh.holding.livePrice.toFixed(2)}`
                                    : `£${dh.holding.price.toFixed(2)}`}
                            </span>
                            <div
                                className={cn(
                                    'flex items-center gap-0.5 text-[10px] font-mono font-medium min-w-[50px] justify-end',
                                    isUp && 'text-[#22C55E]',
                                    isDown && 'text-destructive',
                                    !isUp && !isDown && 'text-muted-foreground',
                                )}
                            >
                                {isUp ? <TrendingUp className="size-2.5" /> : isDown ? <TrendingDown className="size-2.5" /> : <Minus className="size-2.5" />}
                                {pct >= 0 ? '+' : ''}
                                {pct.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
