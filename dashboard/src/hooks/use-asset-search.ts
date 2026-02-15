"use client";

import { useState, useEffect, useMemo } from "react";
import { searchAssets } from "@/app/actions/market";

export type AssetType = 'ETF' | 'Stock' | 'Crypto' | 'Index';

export interface Asset {
    ticker: string;
    type: AssetType;
    name: string;
    issuer: string;
    region: string;
    sector: string;
    description?: string;
    ter?: number;
}

// Fallback Mock Data (Optional, but good for robust dev)
const MOCK_ASSETS: Asset[] = [];

export const useAssetSearch = (activeTab: string = 'all') => {
    const [query, setQuery] = useState("");
    const [currentResults, setCurrentResults] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [filters, setFilters] = useState({
        region: [] as string[],
        issuer: [] as string[],
        sector: [] as string[],
    });

    useEffect(() => {
        const fetchAssets = async () => {
            if (!query || query.length < 2) {
                setCurrentResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Call Server Action
                const data = await searchAssets(query);

                // Map to Asset interface
                const mapped: Asset[] = data.map(d => ({
                    ticker: d.ticker,
                    type: 'Stock' as AssetType,
                    name: d.name,
                    issuer: d.issuer || 'Unknown',
                    region: d.region || 'US',
                    sector: d.sector || 'General',
                    description: d.name,
                }));
                setCurrentResults(mapped);
            } catch (err) {
                console.error("Search Action Failed", err);
                setCurrentResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchAssets, 400);
        return () => clearTimeout(timer);
    }, [query]);

    // Local Filtering on the Fetch Results (if desired) or just return raw results
    // For now, let's just return the fetch results directly as FMP search is broad.
    // But we might want to filter by ActiveTab still if the user wants to narrow down.

    const filteredResults = useMemo(() => {
        let res = currentResults;

        // 1. Tab Filter
        if (activeTab === 'etfs') {
            res = res.filter(a => a.type === 'ETF');
        } else if (activeTab === 'uk_equities') {
            res = res.filter(a => a.type === 'Stock' && (a.region === 'UK' || a.region === 'LSE'));
        } else if (activeTab === 'us_equities') {
            res = res.filter(a => a.type === 'Stock' && (a.region === 'US' || a.region === 'NASDAQ' || a.region === 'NYSE'));
        }

        // 2. Facet Filters
        if (filters.region.length > 0) {
            res = res.filter(a => filters.region.includes(a.region));
        }
        if (filters.issuer.length > 0) {
            res = res.filter(a => filters.issuer.includes(a.issuer));
        }
        if (filters.sector.length > 0) {
            res = res.filter(a => filters.sector.includes(a.sector));
        }

        return res;
    }, [currentResults, activeTab, filters]);

    // Derived Facets (from current results)
    const facets = useMemo(() => {
        const regions = new Set(currentResults.map(e => e.region));
        const issuers = new Set(currentResults.map(e => e.issuer));
        const sectors = new Set(currentResults.map(e => e.sector));
        return {
            regions: Array.from(regions),
            issuers: Array.from(issuers),
            sectors: Array.from(sectors)
        };
    }, [currentResults]);

    return {
        query,
        setQuery,
        filters,
        setFilters,
        results: filteredResults,
        facets,
        isLoading
    };
};
