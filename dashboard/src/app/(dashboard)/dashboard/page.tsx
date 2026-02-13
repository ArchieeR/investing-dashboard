"use client";

import { PerformanceGraph } from "@/components/dashboard/PerformanceGraph";
import { PlaygroundGrid } from "@/components/dashboard/grid/PlaygroundGrid";
import { PortfolioSwitcher } from "@/components/dashboard/PortfolioSwitcher";
import { addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/chart-utils";
import { CSVUploadDialog } from "@/components/features/import/CSVUploadDialog";
import { usePortfolio } from "@/context/PortfolioContext";
import { useEffect, useState, useMemo } from "react";
import { historyEngine } from "@/services/analytics/history_engine";

export default function DashboardPage() {
    const { portfolios, activePortfolioId, refreshPrices } = usePortfolio();
    const [timeRange, setTimeRange] = useState("1M");
    // History Engine Integration
    const [graphData, setGraphData] = useState<any[]>([]);

    const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];

    // Trigger price refresh on mount/portfolio switch
    useEffect(() => {
        refreshPrices();
    }, [activePortfolioId]);

    // Load History
    useEffect(() => {
        const loadHistory = async () => {
            if (activePortfolio) {
                // Generate 90 days of history by default for now
                const history = await historyEngine.generateHistory(activePortfolio, 90);
                setGraphData(history);
            }
        };
        loadHistory();
    }, [activePortfolio]);

    const currentTotal = graphData.length > 0 ? graphData[graphData.length - 1].value : 0;
    const startTotal = graphData.length > 0 ? graphData[0].value : 0;
    const totalChange = currentTotal - startTotal;
    const totalChangePercent = startTotal > 0 ? (totalChange / startTotal) * 100 : 0;

    if (!activePortfolio) return <div className="p-8 text-muted-foreground">Loading portfolio...</div>;

    return (
        <div className="min-h-screen bg-black/95 text-foreground flex flex-col font-sans selection:bg-primary/20">
            {/* Top: Portfolio Switcher */}
            <PortfolioSwitcher />

            <div className="flex-1 space-y-8 p-8 max-w-[1600px] mx-auto w-full">

                {/* Header Section: Value & Gains */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-medium tracking-tight text-white mb-4">{activePortfolio.name}</h1>
                    <div className="flex items-baseline gap-4">
                        <span className="text-6xl font-light tracking-tighter text-white">
                            {formatCurrency(currentTotal)}
                        </span>
                        <div className={`flex items-center gap-2 text-xl font-medium tracking-tight ${totalChange >= 0 ? 'text-[#4de6a8]' : 'text-red-500'}`}>
                            <span>{totalChange >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%</span>
                            <span>{totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}</span>
                            <span className="text-muted-foreground text-sm font-normal ml-1">Total</span>
                        </div>
                    </div>
                    <p className="text-sm text-neutral-400 mt-2">
                        {activePortfolio.holdings.length} Positions • {activePortfolio.currency} • Disclaimer
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12">

                    {/* Left Column: Chart Area */}
                    <div className="space-y-6">
                        {/* Time Range Selector */}
                        <div className="flex justify-start">
                            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                                <TabsList className="bg-transparent p-0 gap-6 h-auto">
                                    {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map((range) => (
                                        <TabsTrigger
                                            key={range}
                                            value={range}
                                            className="px-0 py-0 text-sm font-medium text-neutral-500 data-[state=active]:text-white data-[state=active]:bg-transparent hover:text-neutral-300 transition-colors bg-transparent shadow-none"
                                        >
                                            {range}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* The Graph Itself - Clean, no border */}
                        <PerformanceGraph data={graphData} className="h-[450px] border-none shadow-none bg-transparent" />
                    </div>

                    {/* Right Column: Highlights Card */}
                    <div className="space-y-6">
                        <Card className="bg-[#1c1c1e] border-none shadow-2xl rounded-2xl overflow-hidden min-h-[400px]">
                            <CardHeader className="pb-2 pt-6 px-6">
                                <CardTitle className="text-lg font-medium text-white">Portfolio highlights</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 px-6 pb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#231818] rounded-xl border border-red-500/10">
                                        <div className="text-[10px] font-bold tracking-wider text-[#ff453a] uppercase mb-1 opacity-80">Day Gain</div>
                                        <div className="text-[#ff453a] text-xl font-bold mb-1">-£73.92</div>
                                        <div className="text-[#ff453a] text-xs font-medium">↓ 1.20%</div>
                                    </div>
                                    <div className="p-4 bg-[rgba(30,50,40,0.5)] rounded-xl border border-[#30d158]/10">
                                        <div className="text-[10px] font-bold tracking-wider text-[#30d158] uppercase mb-1 opacity-80">Total Gain</div>
                                        <div className="text-[#30d158] text-xl font-bold mb-1">+£1,304.71</div>
                                        <div className="text-[#30d158] text-xs font-medium">↑ 27.17%</div>
                                    </div>
                                </div>

                                {/* Asset Allocation Bar */}
                                <div className="space-y-4 pt-2">
                                    {/* The Bar */}
                                    <div className="h-1.5 w-full bg-[#2c2c2e] rounded-full overflow-hidden flex">
                                        <div className="h-full bg-[#0a84ff]" style={{ width: '57.6%', boxShadow: '0 0 10px rgba(10, 132, 255, 0.5)' }} /> {/* ETFs - Electric Blue */}
                                        <div className="h-full bg-[#5e5ce6]" style={{ width: '42.4%' }} /> {/* Stocks - Purple/Indigo */}
                                    </div>

                                    {/* The Legend/Values */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#0a84ff]" />
                                                <span className="font-medium text-neutral-300">57.6% ETFs</span>
                                            </div>
                                            <span className="text-white tabular-nums font-medium">£3,514.56</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#5e5ce6]" />
                                                <span className="font-medium text-neutral-300">42.4% stocks</span>
                                            </div>
                                            <span className="text-white tabular-nums font-medium">£2,591.61</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom: Investments Grid */}
                <div className="space-y-6 pt-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="secondary" className="rounded-full px-6 py-2 h-9 text-sm font-medium bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] border-none">
                                Investments <span className="ml-2 text-neutral-400">2</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-transparent px-0 font-normal">Sort by price</Button>
                            <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-transparent px-0 font-normal">Visualize</Button>
                            <div className="w-px h-4 bg-neutral-800 mx-2" />
                            <CSVUploadDialog>
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-9 font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                    + Add Investment
                                </Button>
                            </CSVUploadDialog>
                        </div>
                    </div>

                    <PlaygroundGrid />
                </div>
            </div>
        </div>
    )
}
