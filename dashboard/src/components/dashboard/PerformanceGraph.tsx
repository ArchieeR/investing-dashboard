"use client";

import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { calculatePercentageChange, formatValueChange } from "@/lib/chart-utils";

interface DataPoint {
    date: string;
    value: number;
    cash: number;
}

interface PerformanceGraphProps {
    data: DataPoint[];
    onTimeRangeChange?: (range: string) => void;
    className?: string; // Standard Prop
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: DataPoint;
        color: string;
    }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-popover/90 border border-border rounded-lg p-3 shadow-xl backdrop-blur-sm">
                <p className="text-muted-foreground text-sm font-medium mb-2">
                    {format(parseISO(label!), 'MMM d, yyyy')}
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-8 min-w-[120px]">
                        <span className="text-sm text-muted-foreground">Portfolio Value</span>
                        <span className="text-sm font-bold font-mono">
                            ${data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function PerformanceGraph({ data, className }: PerformanceGraphProps) {
    const [selectStart, setSelectStart] = useState<string | null>(null);
    const [selectEnd, setSelectEnd] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    // Calculate performance for selected period if actively selecting
    const selectionPerformance = useMemo(() => {
        if (!selectStart || !selectEnd) return null;

        let START_DATE = selectStart;
        let END_DATE = selectEnd;

        // Ensure chronological order
        if (START_DATE > END_DATE) {
            [START_DATE, END_DATE] = [END_DATE, START_DATE];
        }

        const startPoint = data.find(d => d.date === START_DATE);
        const endPoint = data.find(d => d.date === END_DATE);

        if (!startPoint || !endPoint) return null;

        const diff = endPoint.value - startPoint.value;
        const percent = calculatePercentageChange(endPoint.value, startPoint.value);

        return {
            diff,
            percent,
            startValue: startPoint.value,
            endValue: endPoint.value,
            startDate: START_DATE,
            endDate: END_DATE
        };
    }, [selectStart, selectEnd, data]);

    return (
        <Card className={cn("w-full border rounded-xl shadow-sm bg-card h-full", className)}>
            <CardContent className="p-0">
                <div className="relative h-[300px] w-full select-none" style={{ userSelect: 'none' }}>

                    {/* Measurement Overlay when Active */}
                    {selectionPerformance && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border rounded-full px-4 py-1.5 shadow-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-muted-foreground font-medium">
                                {format(parseISO(selectionPerformance.startDate), 'MMM d')} - {format(parseISO(selectionPerformance.endDate), 'MMM d')}
                            </span>
                            <div className="h-4 w-px bg-border" />
                            <span className={cn("font-bold tabular-nums", selectionPerformance.diff >= 0 ? "text-green-500" : "text-red-500")}>
                                {selectionPerformance.diff >= 0 ? "+" : ""}{selectionPerformance.percent.toFixed(2)}%
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                ({formatValueChange(selectionPerformance.endValue, selectionPerformance.startValue)})
                            </span>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            onMouseDown={(e) => {
                                if (e && e.activeLabel) {
                                    setSelectStart(e.activeLabel as string);
                                    setIsSelecting(true);
                                    setSelectEnd(null); // Reset end on new click
                                }
                            }}
                            onMouseMove={(e) => {
                                if (isSelecting && e && e.activeLabel) {
                                    setSelectEnd(e.activeLabel as string);
                                }
                            }}
                            onMouseUp={() => {
                                setIsSelecting(false);
                                // Sticky selection: don't clear immediately so user can read it
                                // Click again to clear is handled by onMouseDown new start
                            }}
                            onMouseLeave={() => {
                                setIsSelecting(false);
                                setSelectStart(null);
                                setSelectEnd(null);
                            }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.4} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                                stroke="var(--muted-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={40}
                                dy={10}
                            />
                            <YAxis
                                hide={true} // Hide Y Axis for cleaner look similar to Google Finance
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#2563eb" // CSS Var Primary usually, selecting specific blue for now
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={500}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                            />

                            {/* Reference Area for Selection Highlight */}
                            {selectStart && selectEnd ? (
                                <ReferenceArea
                                    x1={selectStart}
                                    x2={selectEnd}
                                    strokeOpacity={0.3}
                                    fill="#2563eb"
                                    fillOpacity={0.1}
                                />
                            ) : null}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
