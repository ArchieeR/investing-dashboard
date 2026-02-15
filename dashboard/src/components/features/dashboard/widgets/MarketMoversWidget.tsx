'use client';

// =============================================================================
// Market Movers Widget — top gainers/losers/most active
// =============================================================================

import React, { useState } from 'react';
import type { WidgetConfig } from '@/types/widget-types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface MarketMoversWidgetProps {
    widget: WidgetConfig;
}

type MoverTab = 'gainers' | 'losers' | 'active';

// Placeholder data — to be replaced by real API
const PLACEHOLDER_MOVERS = {
    gainers: [
        { ticker: 'NVDA', name: 'NVIDIA Corp', price: 892.45, change: 4.2 },
        { ticker: 'SMCI', name: 'Super Micro', price: 785.20, change: 3.8 },
        { ticker: 'ARM', name: 'ARM Holdings', price: 156.30, change: 3.1 },
        { ticker: 'META', name: 'Meta Platforms', price: 485.60, change: 2.7 },
        { ticker: 'AVGO', name: 'Broadcom', price: 1340.80, change: 2.3 },
    ],
    losers: [
        { ticker: 'INTC', name: 'Intel Corp', price: 31.45, change: -3.5 },
        { ticker: 'BA', name: 'Boeing Co', price: 198.20, change: -2.8 },
        { ticker: 'PFE', name: 'Pfizer Inc', price: 26.80, change: -2.4 },
        { ticker: 'PYPL', name: 'PayPal', price: 62.30, change: -2.1 },
        { ticker: 'DIS', name: 'Walt Disney', price: 98.40, change: -1.8 },
    ],
    active: [
        { ticker: 'TSLA', name: 'Tesla Inc', price: 245.60, change: 1.2 },
        { ticker: 'AAPL', name: 'Apple Inc', price: 187.30, change: -0.3 },
        { ticker: 'AMZN', name: 'Amazon.com', price: 178.90, change: 0.8 },
        { ticker: 'MSFT', name: 'Microsoft', price: 415.20, change: 0.5 },
        { ticker: 'GOOGL', name: 'Alphabet Inc', price: 142.80, change: -0.2 },
    ],
};

export function MarketMoversWidget({ widget }: MarketMoversWidgetProps) {
    const [tab, setTab] = useState<MoverTab>('gainers');
    const isCompact = widget.colSpan <= 1 && widget.rowSpan <= 1;
    const movers = PLACEHOLDER_MOVERS[tab].slice(0, isCompact ? 3 : 5);

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Tab selector */}
            <div className="flex items-center gap-1">
                {(['gainers', 'losers', 'active'] as MoverTab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full transition-colors capitalize flex items-center gap-1',
                            tab === t
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                        )}
                    >
                        {t === 'gainers' && <TrendingUp className="size-2.5" />}
                        {t === 'losers' && <TrendingDown className="size-2.5" />}
                        {t === 'active' && <BarChart3 className="size-2.5" />}
                        {t}
                    </button>
                ))}
            </div>

            {/* Movers list */}
            <div className="flex-1 space-y-0.5 overflow-y-auto">
                {movers.map((mover) => (
                    <div
                        key={mover.ticker}
                        className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-secondary/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono font-semibold text-[#22D3EE]">
                                {mover.ticker}
                            </span>
                            {!isCompact && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {mover.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-foreground">
                                ${mover.price.toFixed(2)}
                            </span>
                            <span
                                className={cn(
                                    'text-[10px] font-mono font-medium min-w-[45px] text-right',
                                    mover.change >= 0 ? 'text-[#22C55E]' : 'text-destructive',
                                )}
                            >
                                {mover.change >= 0 ? '+' : ''}
                                {mover.change.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-muted-foreground/40 text-center">
                Sample data — API integration pending
            </p>
        </div>
    );
}
