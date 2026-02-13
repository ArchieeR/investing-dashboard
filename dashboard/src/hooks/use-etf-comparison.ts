import { useState, useEffect } from 'react';
import { useETFDetails } from './use-etf-details';
import { Asset } from './use-asset-search';

export interface OverlapData {
    percentage: number; // e.g., 45.5%
    sharedHoldingsCount: number;
    topCommonHoldings: {
        ticker: string;
        name: string;
        weightA: number;
        weightB: number;
    }[];
}

export const useETFComparison = (tickerA: string, tickerB: string) => {
    // In a real app, this would fetch from an endpoint that calculates intersection.
    // Here we will use our useETFDetails hook to get individual data and then "mock" the intersection logic
    // or simply return hardcoded interesting scenarios for demo purposes.

    // For V1 Demo, let's return hardcoded "interesting" overlaps for known pairs, 
    // and generic random ones for others.

    const [overlap, setOverlap] = useState<OverlapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { details: detailsA } = useETFDetails(tickerA);
    const { details: detailsB } = useETFDetails(tickerB);

    useEffect(() => {
        if (!tickerA || !tickerB) return;

        setIsLoading(true);

        // Simulate API delay
        const timer = setTimeout(() => {
            let mockOverlap = 0;
            let mockCount = 0;

            // Demo Logic: Known high overlap pairs
            if ((tickerA === 'VUSA' && tickerB === 'EQQQ') || (tickerA === 'EQQQ' && tickerB === 'VUSA')) {
                mockOverlap = 42.5; // S&P 500 & Nasdaq 100 have high overlap
                mockCount = 84;
            } else if ((tickerA === 'VUSA' && tickerB === 'VWRL') || (tickerA === 'VWRL' && tickerB === 'VUSA')) {
                mockOverlap = 60.1; // All-World contains S&P 500
                mockCount = 503;
            } else if ((tickerA === 'VUKE' && tickerB === 'VUSA')) {
                mockOverlap = 0; // UK vs US = 0 overlap
                mockCount = 0;
            } else {
                // Random default for unknown pairs
                mockOverlap = Math.floor(Math.random() * 20);
                mockCount = Math.floor(Math.random() * 10);
            }

            setOverlap({
                percentage: mockOverlap,
                sharedHoldingsCount: mockCount,
                topCommonHoldings: [
                    { ticker: "MSFT", name: "Microsoft Corp", weightA: 7.2, weightB: 8.1 },
                    { ticker: "AAPL", name: "Apple Inc", weightA: 6.8, weightB: 7.5 },
                    { ticker: "NVDA", name: "NVIDIA Corp", weightA: 5.1, weightB: 4.8 },
                ] // Just dummy common holdings for UI
            });
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [tickerA, tickerB]);

    return {
        assetA: detailsA, // Contains sector/country breakdown
        assetB: detailsB,
        overlap,
        isLoading
    };
};
