"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ExposureData {
    name: string;
    value: number;
}

interface AssetChartsProps {
    sectors: ExposureData[];
    countries: ExposureData[];
}

export function AssetCharts({ sectors, countries }: AssetChartsProps) {
    if ((!sectors || sectors.length === 0) && (!countries || countries.length === 0)) {
        return null; // Or show empty state
    }

    return (
        <div className="space-y-8">
            {/* Sector Breakdown */}
            {sectors.length > 0 && (
                <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card/50 sm:shadow-sm">
                    <CardHeader>
                        <CardTitle>Sector Exposure</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sectors}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sectors.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {sectors.slice(0, 5).map((s, i) => (
                                <div key={s.name} className="flex items-center gap-1.5 text-sm font-medium">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span>{s.name} <span className="text-muted-foreground">({s.value.toFixed(1)}%)</span></span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Country Breakdown */}
            {countries.length > 0 && (
                <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card/50 sm:shadow-sm">
                    <CardHeader>
                        <CardTitle>Geographic Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countries} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
