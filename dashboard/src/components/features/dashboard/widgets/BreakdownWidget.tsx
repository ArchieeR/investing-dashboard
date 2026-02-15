'use client';

// =============================================================================
// Breakdown Widget — sector/account/theme with dropdown, responsive pie/bar
// =============================================================================

import React, { useMemo, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { usePortfolio } from '@/context/PortfolioContext';
import type { WidgetConfig } from '@/types/widget-types';

interface BreakdownWidgetProps {
    widget: WidgetConfig;
}

type BreakdownMode = 'section' | 'account' | 'theme';

const COLORS = [
    '#22D3EE', '#A78BFA', '#F472B6', '#34D399',
    '#FBBF24', '#FB923C', '#60A5FA', '#C084FC',
    '#4ADE80', '#F87171', '#38BDF8', '#E879F9',
];

function formatGBP(value: number): string {
    if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `£${(value / 1_000).toFixed(1)}K`;
    return `£${value.toFixed(0)}`;
}

export function BreakdownWidget({ widget }: BreakdownWidgetProps) {
    const { bySection, byAccount, byTheme } = usePortfolio();
    const [mode, setMode] = useState<BreakdownMode>('section');

    const data = useMemo(() => {
        const source = mode === 'section' ? bySection : mode === 'account' ? byAccount : byTheme;
        return source.map((entry) => ({
            name: entry.label,
            value: entry.value,
            pct: entry.percentage,
        }));
    }, [mode, bySection, byAccount, byTheme]);

    const isCompact = widget.colSpan <= 1;
    const showBar = widget.colSpan >= 2 && widget.rowSpan >= 2;

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Mode selector */}
            <div className="flex items-center gap-1">
                {(['section', 'account', 'theme'] as BreakdownMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors capitalize ${mode === m
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                    No data
                </div>
            ) : (
                <div className="flex-1 flex gap-3 min-h-0">
                    {/* Pie chart — always shown */}
                    <div className={isCompact ? 'w-full' : 'w-1/2'} style={{ minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isCompact ? '45%' : '50%'}
                                    outerRadius={isCompact ? '80%' : '85%'}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                    formatter={(value: number | undefined) => [formatGBP(value ?? 0), 'Value']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar chart or legend — shown at larger sizes */}
                    {!isCompact && (
                        <div className="w-1/2 flex flex-col min-h-0">
                            {showBar ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data}
                                        layout="vertical"
                                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={60}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                            }}
                                            formatter={(value: number | undefined) => [formatGBP(value ?? 0), 'Value']}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {data.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                /* Legend list */
                                <div className="space-y-1 overflow-y-auto text-xs">
                                    {data.map((entry, i) => (
                                        <div key={entry.name} className="flex items-center gap-1.5">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                            <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
                                            <span className="font-mono text-foreground">{entry.pct.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
