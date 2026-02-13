import { Portfolio, Transaction } from "@/types/portfolio";
import { FMPHistoricalPrice, fmp } from "@/services/data_ingestion/fmp_client";
import { addDays, isSameDay, parseISO, compareAsc, startOfDay, subDays } from "date-fns";

export interface HistoryDataPoint {
    date: string;
    value: number;
    cash: number;
    invested: number;
}

export class HistoryGenerator {

    // Cache for historical prices to avoid refetching same ticker multiple times in a session
    private priceCache: Map<string, FMPHistoricalPrice[]> = new Map();

    async generateHistory(
        portfolio: Portfolio,
        days: number = 90
    ): Promise<HistoryDataPoint[]> {
        if (!portfolio.transactions || portfolio.transactions.length === 0) {
            return this.generateFlatHistory(portfolio.cashBalance, days);
        }

        // 1. Identify all unique tickers
        const tickers = Array.from(new Set(portfolio.transactions.map(t => t.ticker).filter(Boolean) as string[]));

        // 2. Fetch History for all tickers
        await this.prefetchPrices(tickers);

        // 3. Replay History
        const endDate = startOfDay(new Date());
        let currentDate = startOfDay(subDays(new Date(), days));

        const history: HistoryDataPoint[] = [];

        // Sim State
        let currentHoldings: Record<string, number> = {}; // Ticker -> Qty
        let currentCash = 0; // Tracking cash separately

        // Optimization: Sort transactions once
        const sortedTransactions = [...portfolio.transactions].sort((a, b) =>
            compareAsc(parseISO(a.date), parseISO(b.date))
        );

        while (compareAsc(currentDate, endDate) <= 0) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // A. Apply Transactions for this specific day
            const dailyTransactions = sortedTransactions.filter(t => t.date === dateStr);

            dailyTransactions.forEach(t => {
                if (t.type === 'BUY' && t.ticker && t.quantity && t.pricePerShare) {
                    currentHoldings[t.ticker] = (currentHoldings[t.ticker] || 0) + t.quantity;
                    // Assuming cash was deducted or this is a 'Deposit + Buy' event
                    // For Imported CSVs, we usually assume they are 'Buy with external cash', so we don't deduct mock cash
                }
                // Handle SELL, DEPOSIT, etc. later
            });

            // B. Calculate Value
            let investedValue = 0;
            Object.entries(currentHoldings).forEach(([ticker, qty]) => {
                const price = this.getPriceAtDate(ticker, dateStr);
                if (price) {
                    investedValue += (qty * price);
                }
            });

            history.push({
                date: dateStr,
                value: investedValue + currentCash,
                cash: currentCash,
                invested: investedValue
            });

            currentDate = addDays(currentDate, 1);
        }

        return history;
    }

    private generateFlatHistory(cash: number, days: number): HistoryDataPoint[] {
        const history: HistoryDataPoint[] = [];
        const endDate = new Date();
        for (let i = days; i >= 0; i--) {
            history.push({
                date: subDays(endDate, i).toISOString().split('T')[0],
                value: cash,
                cash: cash,
                invested: 0
            });
        }
        return history;
    }

    private async prefetchPrices(tickers: string[]) {
        const missingTickers = tickers.filter(t => !this.priceCache.has(t));
        if (missingTickers.length === 0) return;

        // In production, use batch endpoint if available, or parallel requests
        await Promise.all(missingTickers.map(async (ticker) => {
            try {
                const prices = await fmp.fetchHistoricalPriceFull(ticker);
                this.priceCache.set(ticker, prices);
            } catch (e) {
                console.error(`Failed to fetch history for ${ticker}`, e);
                this.priceCache.set(ticker, []); // Cache empty to avoid retry loop
            }
        }));
    }

    private getPriceAtDate(ticker: string, dateStr: string): number | null {
        const prices = this.priceCache.get(ticker);
        if (!prices) return null;

        // Find exact match
        const exact = prices.find(p => p.date === dateStr);
        if (exact) return exact.close;

        // Fallback: Find closest previous close (fill forward)
        // Optimization: prices are usually sorted desc date. 
        // We want the first price where price.date <= dateStr
        const closest = prices.find(p => p.date <= dateStr);
        return closest ? closest.close : null;
    }
}

export const historyEngine = new HistoryGenerator();
