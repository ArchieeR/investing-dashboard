"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAssetSearch } from "@/hooks/use-asset-search";
import { ETFSearchSidebar } from "@/components/features/etf/ETFSearchSidebar";
import { AssetGrid } from "@/components/features/etf/ETFGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TrendingAssetsRow } from "@/components/features/market/TrendingAssetsRow";
import { FMPMarketMover } from "@/services/data_ingestion/types/fmp.types";

interface ExplorerViewProps {
    trendingAssets?: FMPMarketMover[];
}

export function ExplorerView({ trendingAssets = [] }: ExplorerViewProps) {
    const [activeTab, setActiveTab] = useState("etfs");
    const { query, setQuery, filters, setFilters, results, facets } = useAssetSearch(activeTab);

    // Basic check: if query has text or filters are active (logic depends on your filter object structure)
    // Assuming 'filters' is an object where keys exist if active
    const isSearchingOrFiltering = query.length > 0 || Object.keys(filters).length > 0;

    return (
        <Tabs defaultValue="etfs" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-[600px] mb-6">
                <TabsTrigger value="all">All Assets</TabsTrigger>
                <TabsTrigger value="etfs">ETFs</TabsTrigger>
                <TabsTrigger value="uk_equities">UK Equities</TabsTrigger>
                <TabsTrigger value="us_equities">US Equities</TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="relative max-w-2xl mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Search ${activeTab === 'all' ? 'Market' : activeTab.replace('_', ' ').toUpperCase()}...`}
                    className="pl-9 h-11 text-lg bg-card"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Trending Row - Only show when NOT searching/filtering */}
            {!isSearchingOrFiltering && trendingAssets.length > 0 && (
                <div className="mb-8">
                    <TrendingAssetsRow assets={trendingAssets} label="Trending Now" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
                <aside className="hidden md:block sticky top-20">
                    <ETFSearchSidebar
                        facets={facets}
                        filters={filters}
                        setFilters={setFilters}
                    />
                </aside>

                <main>
                    <div className="mb-4 text-sm text-muted-foreground font-medium">
                        Showing {results.length} results
                    </div>
                    {/* 
                        We don't need TabsContent for separate grids because the hook handles filtering.
                        We use Tabs just as a UI controller for the 'activeTab' state.
                    */}
                    <TabsContent value="all" className="mt-0"><AssetGrid assets={results} /></TabsContent>
                    <TabsContent value="etfs" className="mt-0"><AssetGrid assets={results} /></TabsContent>
                    <TabsContent value="uk_equities" className="mt-0"><AssetGrid assets={results} /></TabsContent>
                    <TabsContent value="us_equities" className="mt-0"><AssetGrid assets={results} /></TabsContent>
                </main>
            </div>
        </Tabs>
    );
}
