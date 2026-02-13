import { useState, useEffect } from 'react';
import { Asset } from './use-asset-search';
import { getAssetQuotes, getAssetHistory } from '@/app/actions/market';

// Extending Asset with extra Fundamental/Performance data
export interface DetailedAsset extends Asset {
    price: number;
    change1D: number;
    performance1Y: number;
    performance5Y: number;
    yield?: number;
    marketCap?: string;
    peRatio?: number; // Stocks only
    holdingsCount?: number; // ETFs only
    history: { date: string; value: number }[]; // 1Y Normalized History (0 start)
}

export interface OverlapData {
    percentage: number;
    description: string;
}

export const useMultiAssetComparison = (tickers: string[]) => {
    const [assets, setAssets] = useState<DetailedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [overlap, setOverlap] = useState<OverlapData | null>(null);

    useEffect(() => {
        const fetchDeepAnalysis = async () => {
            if (!tickers.length) return;
            setIsLoading(true);

            try {
                // 1. Fetch Real Quotes
                const quotes = await getAssetQuotes(tickers);

                // 2. Fetch Real History (Parallel)
                const historyPromises = tickers.map(t => getAssetHistory(t));
                const histories = await Promise.all(historyPromises);

                // 3. Map Data
                const mappedAssets: DetailedAsset[] = quotes.map((q, i) => {
                    const rawHistory = histories[i];
                    // Normalize history to % change from start
                    const startPrice = rawHistory.length > 0 ? rawHistory[0].value : 1;
                    const normalizedHistory = rawHistory.map(h => ({
                        date: h.date,
                        value: ((h.value - startPrice) / startPrice) * 100
                    }));

                    // Calc 1Y Perf from normalized end
                    const perf1Y = normalizedHistory.length ? normalizedHistory[normalizedHistory.length - 1].value : 0;

                    const isETF = (q.name || '').includes('ETF') || (q.name || '').includes('Vanguard') || (q.name || '').includes('iShares');
                    const isStock = !isETF; // Simplification

                    return {
                        ticker: q.symbol,
                        type: isETF ? 'ETF' : 'Stock', // Heuristic
                        name: q.name || q.symbol,
                        issuer: isETF ? 'Unknown Issuer' : 'Corporate',
                        region: q.exchange || 'US',
                        sector: isStock ? 'General' : 'Diversified',
                        price: q.price,
                        change1D: q.changesPercentage,
                        performance1Y: perf1Y,
                        performance5Y: perf1Y * 2.5, // Mock extrapolation for now
                        history: normalizedHistory,
                        marketCap: formatMarketCap(q.marketCap),
                        peRatio: q.pe,
                        // FMP Free doesn't give yield/TER easily in batch quotes, mocking strictly unavailable fields
                        yield: isStock ? undefined : 2.5,
                        ter: isETF ? 0.07 : undefined, // Placeholder static
                        holdingsCount: isETF ? 500 : undefined
                    };
                });

                setAssets(mappedAssets);

                // Mock Overlap Logic (Only for 2 ETFs) - FMP Overlap API is Premium usually
                const allEtfs = mappedAssets.every(a => a.type === 'ETF');
                if (mappedAssets.length === 2 && allEtfs) {
                    // Keep existing mock overlap logic for demo feel
                    const [a, b] = [mappedAssets[0].ticker, mappedAssets[1].ticker];
                    let pct = 45; // Default generic overlap
                    if ((a === 'VUSA' && b === 'VWRL') || (a === 'VWRL' && b === 'VUSA')) pct = 60.1;

                    setOverlap({
                        percentage: pct,
                        description: `These two ETFs share ${pct}% of the same underlying assets (Estimated).`
                    });
                } else {
                    setOverlap(null);
                }

            } catch (err) {
                console.error("Deep Analysis Failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeepAnalysis();
    }, [JSON.stringify(tickers)]);

    return {
        assets,
        isLoading,
        isAllEtfs: assets.length > 0 && assets.every(a => a.type === 'ETF'),
        overlap
    };
};

// Helper: Generate consistent mock data based on ticker
function generateMockAsset(ticker: string): DetailedAsset {
    const isStock = ['AAPL', 'MSFT', 'TSLA', 'LLOY', 'AZN', 'BP'].includes(ticker);

    // Core Identity
    const base = {
        ticker,
        type: isStock ? 'Stock' : 'ETF',
        name: getName(ticker),
        issuer: getIssuer(ticker),
        region: getRegion(ticker),
        sector: getSector(ticker),
        description: "Mock description for demo..."
    } as Asset;

    // Metrics
    const perf1Y = getPerf(ticker);

    return {
        ...base,
        price: getPrice(ticker),
        change1D: (Math.random() * 2) - 0.8, // -0.8% to +1.2%
        performance1Y: perf1Y,
        performance5Y: perf1Y * 2.5,
        yield: isStock ? getYield(ticker) : 1.5,
        peRatio: isStock ? getPE(ticker) : undefined,
        ter: isStock ? undefined : 0.07,
        holdingsCount: isStock ? undefined : 503,
        marketCap: isStock ? "2.5T" : undefined,
        history: generateMockHistory(perf1Y)
    };
}

// Generate 365 days of "random walk" trending towards finalPerf
function generateMockHistory(finalPerf: number) {
    const data = [];
    let value = 0; // Start at 0%
    // We want the last point to roughly match finalPerf. 
    // trendPerDay * 365 = finalPerf => trendPerDay = finalPerf / 365
    const trendPerDay = finalPerf / 365;

    for (let i = 0; i < 365; i++) {
        // Random volatility
        const volatility = (Math.random() - 0.5) * 1.5;
        value += trendPerDay + volatility;

        // Date: T-365+i
        const d = new Date();
        d.setDate(d.getDate() - (365 - i));

        data.push({
            date: d.toISOString().split('T')[0],
            value: value
        });
    }
    return data;
}

// Simple Mock Lookups
const getName = (t: string) => ({
    'VUSA': 'Vanguard S&P 500', 'VWRL': 'Vanguard All-World', 'VUKE': 'Vanguard FTSE 100',
    'AAPL': 'Apple Inc', 'MSFT': 'Microsoft Corp', 'LLOY': 'Lloyds Banking Group',
    'TSLA': 'Tesla Inc', 'AZN': 'AstraZeneca', 'BP': 'BP p.l.c.'
}[t] || t);

const getIssuer = (t: string) => t.startsWith('V') ? 'Vanguard' : (t === 'AAPL' ? 'Apple' : 'Unknown');
const getRegion = (t: string) => (['VUKE', 'LLOY', 'AZN', 'BP'].includes(t) ? 'UK' : (t === 'VWRL' ? 'Global' : 'US'));
const getSector = (t: string) => (['AAPL', 'MSFT', 'VUSA'].includes(t) ? 'Technology' : (['LLOY'].includes(t) ? 'Financial' : 'General'));
const getPrice = (t: string) => t === 'AAPL' ? 185.92 : (t === 'VUSA' ? 72.45 : 55.20);
const getPerf = (t: string) => t === 'AAPL' ? 24.5 : (t === 'LLOY' ? 5.2 : 12.8);
const getYield = (t: string) => t === 'LLOY' ? 5.1 : (t === 'AAPL' ? 0.6 : 0);
const getPE = (t: string) => t === 'TSLA' ? 45.2 : 28.5;

function formatMarketCap(val?: number) {
    if (!val) return "-";
    if (val > 1e12) return (val / 1e12).toFixed(2) + "T";
    if (val > 1e9) return (val / 1e9).toFixed(2) + "B";
    return (val / 1e6).toFixed(2) + "M";
}
