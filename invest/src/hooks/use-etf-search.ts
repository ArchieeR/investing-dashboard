import { useState, useMemo } from 'react';

export interface ETF {
    ticker: string;
    name: string;
    issuer: string;
    region: string;
    sector: string; // Dominant sector
    ter: number; // Expense Ratio
    description: string;
}

const MOCK_ETFS: ETF[] = [
    {
        ticker: "VUSA",
        name: "Vanguard S&P 500 UCITS ETF",
        issuer: "Vanguard",
        region: "US",
        sector: "Technology", // Heavy tech weighting
        ter: 0.07,
        description: "Tracks the S&P 500 index. Low cost exposure to largest US companies."
    },
    {
        ticker: "VUKE",
        name: "Vanguard FTSE 100 UCITS ETF",
        issuer: "Vanguard",
        region: "UK",
        sector: "Financial",
        ter: 0.09,
        description: "Tracks the FTSE 100 index. Exposure to largest UK companies."
    },
    {
        ticker: "INRG",
        name: "iShares Global Clean Energy UCITS ETF",
        issuer: "BlackRock",
        region: "Global",
        sector: "Energy",
        ter: 0.65,
        description: "Exposure to companies involved in clean energy production and equipment."
    },
    {
        ticker: "EQQQ",
        name: "Invesco EQQQ NASDAQ-100 UCITS ETF",
        issuer: "Invesco",
        region: "US",
        sector: "Technology",
        ter: 0.30,
        description: "Tracks the Nasdaq-100 index. Heavy technology focus."
    },
    {
        ticker: "VWRL",
        name: "Vanguard FTSE All-World UCITS ETF",
        issuer: "Vanguard",
        region: "Global",
        sector: "General",
        ter: 0.22,
        description: "Tracks the performace of the FTSE All-World Index."
    },
    {
        ticker: "SMGB",
        name: "VanEck Semiconductor UCITS ETF",
        issuer: "VanEck",
        region: "US",
        sector: "Technology",
        ter: 0.35,
        description: "Tracks companies involved in semiconductor production."
    },
];

export const useETFSearch = () => {
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState({
        region: [] as string[],
        issuer: [] as string[],
        sector: [] as string[],
    });

    const results = useMemo(() => {
        return MOCK_ETFS.filter(etf => {
            // Text Search
            const matchesQuery = etf.ticker.toLowerCase().includes(query.toLowerCase()) ||
                etf.name.toLowerCase().includes(query.toLowerCase());

            // Filters
            const matchesRegion = filters.region.length === 0 || filters.region.includes(etf.region);
            const matchesIssuer = filters.issuer.length === 0 || filters.issuer.includes(etf.issuer);
            const matchesSector = filters.sector.length === 0 || filters.sector.includes(etf.sector);

            return matchesQuery && matchesRegion && matchesIssuer && matchesSector;
        });
    }, [query, filters]);

    // Derived Facet Counts
    const facets = useMemo(() => {
        const regions = new Set(MOCK_ETFS.map(e => e.region));
        const issuers = new Set(MOCK_ETFS.map(e => e.issuer));
        const sectors = new Set(MOCK_ETFS.map(e => e.sector));
        return {
            regions: Array.from(regions),
            issuers: Array.from(issuers),
            sectors: Array.from(sectors)
        };
    }, []);

    return {
        query,
        setQuery,
        filters,
        setFilters,
        results,
        facets
    };
};
