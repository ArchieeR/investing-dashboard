import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts"; // Recharts is client-side only usually... we might need a client wrapper for charts.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmp } from "@/services/data_ingestion/fmp_client";
import { FMPProfile, FMPQuote } from "@/services/data_ingestion/types/fmp.types";
import { notFound } from "next/navigation";
import { AssetCharts } from "@/components/features/etf/AssetCharts"; // We need to extract charts to client component

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
    const { ticker } = await params;
    const symbol = ticker.toUpperCase();

    // 1. Fetch Profile & Quote in parallel
    const [profile, quote] = await Promise.all([
        fmp.getProfile(symbol),
        fmp.getQuote(symbol)
    ]);

    if (!profile) {
        return notFound();
    }

    const isETF = profile.isEtf || profile.isFund;

    // 2. If ETF, fetch holdings/sectors/countries
    let holdings = [];
    let sectors = [];
    let countries = [];

    if (isETF) {
        const [h, s, c] = await Promise.all([
            fmp.getETFHoldings(symbol),
            fmp.getETFSectorWeightings(symbol),
            fmp.getETFCountryWeightings(symbol)
        ]);
        holdings = h;
        sectors = s.map(item => ({ name: item.sector, value: parseFloat(item.weightPercentage.replace('%', '')) }));
        countries = c.map(item => ({ name: item.country, value: parseFloat(item.weightPercentage.replace('%', '')) }));
    }

    // Format for charts (Client Component)
    const chartData = {
        sectors: sectors.slice(0, 6), // Top 6
        countries: countries.slice(0, 6) // Top 6
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Hero */}
            <div className="flex flex-col gap-4">
                <Link href="/explorer">
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Explorer
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold tracking-tight">{profile.companyName}</h1>
                            <Badge variant="secondary" className="text-lg">{symbol}</Badge>
                            {isETF && <Badge variant="outline">ETF</Badge>}
                        </div>
                        <div className="flex items-baseline gap-4 mt-2">
                            <span className="text-3xl font-bold">${profile.price}</span>
                            {quote && (
                                <span className={quote.changesPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                                    {quote.changesPercentage > 0 ? "+" : ""}{quote.changesPercentage.toFixed(2)}%
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-muted-foreground mt-2 max-w-3xl line-clamp-2">
                            {profile.description}
                        </p>
                    </div>
                </div>
                <Separator />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Holdings (If ETF) or Key Stats (If Stock) */}
                <Card className="h-full border-0 shadow-none bg-transparent sm:border sm:rounded-xl sm:bg-card/50 sm:shadow-sm">
                    <CardHeader>
                        <CardTitle>{isETF ? "Top Holdings" : "Key Statistics"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        {isETF ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="text-left">
                                            <th className="p-4 font-medium text-muted-foreground">Asset</th>
                                            <th className="p-4 font-medium text-muted-foreground text-right w-[100px]">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.slice(0, 10).map((h, i) => (
                                            <tr key={h.asset + i} className="border-t last:border-0 hover:bg-muted/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-primary">{h.asset}</div>
                                                    <div className="text-muted-foreground">{h.name || h.asset}</div>
                                                </td>
                                                <td className="p-4 text-right font-mono font-medium">
                                                    {h.weightPercentage.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                        {holdings.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="p-6 text-center text-muted-foreground">
                                                    No holdings data available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <StatItem label="Market Cap" value={`$${(profile.mktCap / 1e9).toFixed(2)}B`} />
                                <StatItem label="Exchange" value={profile.exchangeShortName} />
                                <StatItem label="Industry" value={profile.industry || "N/A"} />
                                <StatItem label="Sector" value={profile.sector || "N/A"} />
                                <StatItem label="Employees" value={profile.fullTimeEmployees || "N/A"} />
                                <StatItem label="CEO" value={profile.ceo || "N/A"} />
                                <StatItem label="Beta" value={profile.beta?.toFixed(2) || "N/A"} />
                                <StatItem label="Vol. Avg" value={(profile.volAvg / 1e6).toFixed(2) + "M"} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* RIGHT: Visuals (Charts) - Only for ETFs mainly, or Generic for stocks */}
                <div className="space-y-8">
                    {isETF ? (
                        <AssetCharts sectors={chartData.sectors} countries={chartData.countries} />
                    ) : (
                        <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card/50 sm:shadow-sm">
                            <CardHeader>
                                <CardTitle>About {profile.companyName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {profile.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
        </div>
    )
}
