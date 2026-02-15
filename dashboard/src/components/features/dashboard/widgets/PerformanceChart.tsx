'use client';

// =============================================================================
// Performance Chart Widget — responsive chart based on widget size
// =============================================================================

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { usePortfolio } from '@/context/PortfolioContext';
import type { WidgetConfig } from '@/types/widget-types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceChartWidgetProps {
    widget: WidgetConfig;
}

// Generate placeholder historical data based on current portfolio value
function generatePlaceholderData(currentValue: number, days: number = 30) {
    const data = [];
    const now = new Date();
    let value = currentValue * 0.92; // start ~8% lower

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        // Random walk towards current value
        const noise = (Math.random() - 0.45) * currentValue * 0.015;
        const drift = ((currentValue - value) / (i + 1)) * 0.5;
        value = Math.max(value + noise + drift, currentValue * 0.85);

        data.push({
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            value: Math.round(value * 100) / 100,
        });
    }
    // Ensure last point is the actual current value
    data[data.length - 1].value = currentValue;
    return data;
}

function formatCompactGBP(value: number): string {
    if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `£${(value / 1_000).toFixed(1)}K`;
    return `£${value.toFixed(0)}`;
}

function formatGBP(value: number): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function PerformanceChartWidget({ widget }: PerformanceChartWidgetProps) {
    const { totalValue, derivedHoldings } = usePortfolio();

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

    const data = useMemo(() => generatePlaceholderData(totalValue), [totalValue]);

    const isPositive = dayChange >= 0;
    const isCompact = widget.colSpan <= 2 && widget.rowSpan <= 1;
    const isMedium = !isCompact && widget.colSpan <= 3;

    // Compact sparkline view
    if (isCompact) {
        return (
            <div className="flex flex-col gap-1 h-full">
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-mono text-foreground">
                        {formatCompactGBP(totalValue)}
                    </span>
                    <span
                        className={cn(
                            'text-xs font-mono font-medium',
                            isPositive ? 'text-[#22C55E]' : 'text-destructive',
                        )}
                    >
                        {isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%
                    </span>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="chartGradientCompact" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? '#22C55E' : '#EF4444'}
                                strokeWidth={1.5}
                                fill="url(#chartGradientCompact)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // Full / medium chart view
    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Header stats */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">Portfolio Value</p>
                    <p className="text-xl font-bold font-mono text-foreground">
                        {formatGBP(totalValue)}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
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
                        {isPositive ? '+' : ''}{formatGBP(dayChange)} ({dayChangePercent >= 0 ? '+' : ''}
                        {dayChangePercent.toFixed(2)}%)
                    </span>
                    <span className="text-xs text-muted-foreground">today</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: isMedium ? 0 : 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="chartGradientFull" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={isPositive ? '#22C55E' : '#EF4444'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {!isMedium && (
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        )}
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                            interval={isMedium ? 6 : 4}
                        />
                        {!isMedium && (
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompactGBP}
                                width={50}
                            />
                        )}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(value: number | undefined) => [formatGBP(value ?? 0), 'Value']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? '#22C55E' : '#EF4444'}
                            strokeWidth={2}
                            fill="url(#chartGradientFull)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Placeholder note */}
            <p className="text-[10px] text-muted-foreground/50 text-center">
                Simulated data — historical tracking coming soon
            </p>
        </div>
    );
}
