"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ETF } from "@/hooks/use-etf-search";
import { useETFDetails } from "@/hooks/use-etf-details";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

interface ETFDetailViewProps {
    etf: ETF | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ETFDetailView({ etf, open, onOpenChange }: ETFDetailViewProps) {
    // In a real app, we would fetch based on etf?.ticker
    // The hook will return default data for now if ticker is missing
    const { details, isLoading } = useETFDetails(etf?.ticker || "");

    if (!etf) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-2xl font-bold">{etf.name}</DialogTitle>
                        <Badge variant="outline" className="text-lg font-mono">{etf.ticker}</Badge>
                    </div>
                    <DialogDescription className="text-base mt-2">
                        {etf.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    <StatBox label="Issuer" value={etf.issuer} />
                    <StatBox label="Region" value={etf.region} />
                    <StatBox label="Sector" value={etf.sector} />
                    <StatBox label="Expense Ratio" value={`${etf.ter.toFixed(2)}%`} />
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-8 py-6">
                    {/* LEFT: Holdings Table */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Top 10 Holdings
                            <Badge variant="secondary" className="text-xs">Glass Box</Badge>
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left">
                                        <th className="p-3 font-medium text-muted-foreground">Asset</th>
                                        <th className="p-3 font-medium text-muted-foreground text-right">Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.holdings.map((h, i) => (
                                        <tr key={h.ticker} className="border-t last:border-0 hover:bg-muted/20">
                                            <td className="p-3">
                                                <div className="font-medium">{h.ticker}</div>
                                                <div className="text-xs text-muted-foreground">{h.name}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {h.weight.toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: Charts */}
                    <div className="space-y-8">
                        {/* Sector Breakdown */}
                        <div className="h-[250px]">
                            <h3 className="font-semibold text-lg mb-2 text-center">Sector Breakdown</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={details.sectors}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {details.sectors.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-2 text-xs mt-2">
                                {details.sectors.slice(0, 4).map((s, i) => (
                                    <div key={s.name} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span>{s.name} ({s.value}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Country Breakdown */}
                        <div className="h-[200px]">
                            <h3 className="font-semibold text-lg mb-2 text-center">Country Exposure</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={details.countries} layout="vertical" margin={{ left: 40 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-muted/30 p-3 rounded-lg border">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
            <div className="text-lg font-semibold mt-1">{value}</div>
        </div>
    );
}
