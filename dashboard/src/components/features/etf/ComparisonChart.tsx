"use client";

import { DetailedAsset } from "@/hooks/use-multi-asset-comparison";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format } from "date-fns";

interface ComparisonChartProps {
    assets: DetailedAsset[];
}

const COLORS = [
    "hsl(var(--primary))",
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6"  // Violet
];

export function ComparisonChart({ assets }: ComparisonChartProps) {
    if (!assets.length || !assets[0].history) return null;

    // Transform Data for Recharts: { date: '...', VUSA: 1.2, AAPL: 5.4 }
    // Assumes history arrays are aligned for this demo.
    const chartData = assets[0].history.map((h, i) => {
        const point: any = { date: h.date };
        assets.forEach(asset => {
            if (asset.history?.[i]) {
                point[asset.ticker] = asset.history[i].value;
            }
        });
        return point;
    });

    return (
        <div className="h-[350px] w-full bg-card rounded-xl border p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">1 Year Normalized Return (%)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <XAxis
                        dataKey="date"
                        tickFormatter={(val) => format(new Date(val), "MMM")}
                        interval={30} // Show roughly monthly ticks
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}%`}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)"
                        }}
                        itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                        formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, '']}
                        labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    {assets.map((asset, index) => (
                        <Line
                            key={asset.ticker}
                            type="monotone"
                            dataKey={asset.ticker}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
