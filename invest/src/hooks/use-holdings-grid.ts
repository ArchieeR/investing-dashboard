import { useState, useMemo, useEffect } from 'react';
import { Holding, GridHolding } from '@/types/portfolio';
import { SortingState } from '@tanstack/react-table';
import { usePortfolio } from "@/context/PortfolioContext";

export const useHoldingsGrid = () => {
    const { portfolios, activePortfolioId } = usePortfolio();
    const activePortfolio = useMemo(() =>
        portfolios.find(p => p.id === activePortfolioId) || portfolios[0]
        , [portfolios, activePortfolioId]);

    // Internal state for optimistic updates / sorting
    const [localHoldings, setLocalHoldings] = useState<GridHolding[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [grouping, setGrouping] = useState<string[]>(["section"]);

    // Sync with active portfolio changes
    useEffect(() => {
        if (activePortfolio?.holdings) {
            const mapped: GridHolding[] = activePortfolio.holdings.map(h => {
                const currentPrice = h.currentPrice || 0;
                const currentValue = h.quantity * currentPrice;
                return {
                    ...h,
                    currentValue,
                    allocationPercent: 0, // Recalculated below
                    sector: (h as any).sector || 'Uncategorized',
                    section: (h as any).section || 'Core',
                    targetPercent: 0,
                    theme: 'General'
                };
            });
            setLocalHoldings(mapped);
        }
    }, [activePortfolio]);

    // Total Portfolio Value
    const totalValue = useMemo(() =>
        localHoldings.reduce((sum, h) => sum + h.currentValue, 0)
        , [localHoldings]);

    // Enhanced Data with Allocation %
    const gridData = useMemo(() => {
        return localHoldings.map(h => ({
            ...h,
            allocationPercent: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0
        }));
    }, [localHoldings, totalValue]);

    // Update Handler
    const updateHolding = (id: string, field: keyof GridHolding, value: any) => {
        setLocalHoldings(prev => prev.map(h => {
            if (h.id !== id) return h;

            const updated = { ...h, [field]: value } as GridHolding;

            // Recalculate derived
            if (field === 'quantity' || field === 'currentPrice') {
                updated.currentValue = updated.quantity * (updated.currentPrice || 0);
            }

            return updated;
        }));
    };

    return {
        data: gridData,
        sorting,
        setSorting,
        grouping,
        setGrouping,
        updateHolding,
        totalValue
    };
};
