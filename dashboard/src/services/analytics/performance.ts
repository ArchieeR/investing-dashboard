import { Portfolio, Transaction, PortfolioHistoryPoint, TradeType } from "@/types/portfolio";
import { AssetPrice } from "@/services/data_ingestion/price_fetcher";
import { startOfDay, addDays, isSameDay, isAfter, isBefore } from "date-fns";

/**
 * Service to handle complex portfolio calculations.
 * Key Logic: Reconstructs "Cash" vs "Equity" over time to ensure selling assets
 * doesn't result in a graph drop.
 */
export class PortfolioAnalytics {

    /**
     * Reconstructs daily portfolio value from transactions and historical prices.
     * This is an expensive operation, usually run server-side or cached.
     * 
     * @param transactions List of all transactions sorted by date ASC
     * @param priceHistory Map of Ticker -> Array of {date, price}
     * @param initialCash Starting cash (usually 0 or initial deposit)
     * @param startDate Date to start the graph from
     * @param endDate Date to end the graph at (usually today)
     */
    calculatePortfolioHistory(
        transactions: Transaction[],
        // Simplified Price History Interface for this service
        priceHistory: Record<string, { date: string; price: number }[]>,
        initialCash: number = 0,
        startDate: Date,
        endDate: Date
    ): PortfolioHistoryPoint[] {
        const history: PortfolioHistoryPoint[] = [];
        let currentCash = initialCash;
        // Map Ticker -> Quantity
        const holdings: Record<string, number> = {};

        // Iterate day by day
        let currentDate = startOfDay(startDate);
        const end = startOfDay(endDate);

        while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // 1. Process Transactions for this day
            const dailyTx = transactions.filter(t => isSameDay(t.date, currentDate));

            dailyTx.forEach(tx => {
                this.applyTransaction(tx, holdings, (change) => {
                    currentCash += change;
                });
            });

            // 2. Calculate Equity Value
            let equityValue = 0;
            Object.entries(holdings).forEach(([ticker, qty]) => {
                if (qty === 0) return;

                // Find price for this day
                const prices = priceHistory[ticker] || [];
                // Simple finding logic: find exact match or last known price
                // Optimization: In real app, prices should be a Map or sorted array with robust lookup
                const dayPrice = prices.find(p => p.date === dateStr)?.price
                    || this.getLastKnownPrice(prices, dateStr)
                    || 0;

                equityValue += qty * dayPrice;
            });

            history.push({
                date: dateStr,
                value: equityValue + currentCash,
                invested: 0, // TODO: Calculate cost basis if needed
                cash: currentCash
            });

            currentDate = addDays(currentDate, 1);
        }

        return history;
    }

    private applyTransaction(tx: Transaction, holdings: Record<string, number>, updateCash: (amount: number) => void) {
        switch (tx.type) {
            case 'DEPOSIT':
                updateCash(tx.totalAmount);
                break;
            case 'WITHDRAW':
                updateCash(-tx.totalAmount);
                break;
            case 'BUY':
                // Cash goes DOWN, Holdings go UP
                updateCash(-tx.totalAmount);
                holdings[tx.ticker!] = (holdings[tx.ticker!] || 0) + (tx.quantity || 0);
                break;
            case 'SELL':
                // Cash goes UP, Holdings go DOWN
                updateCash(tx.totalAmount);
                holdings[tx.ticker!] = (holdings[tx.ticker!] || 0) - (tx.quantity || 0);
                break;
            case 'DIVIDEND':
                updateCash(tx.totalAmount);
                break;
        }
    }

    private getLastKnownPrice(prices: { date: string; price: number }[], targetDate: string): number {
        // Assuming prices are sorted by date ASC
        // Find the last price before or on targetDate
        // This is O(N), for production use binary search or map
        for (let i = prices.length - 1; i >= 0; i--) {
            if (prices[i].date <= targetDate) {
                return prices[i].price;
            }
        }
        return 0; // Fallback
    }

    /**
     * Normalizes a series of values to percentage change starting at 0%
     * Used for comparing different assets on the same graph
     */
    normalizeForComparison(dataPoints: number[]): number[] {
        if (dataPoints.length === 0) return [];
        const startValue = dataPoints[0];
        if (startValue === 0) return dataPoints.map(() => 0); // Avoid division by zero

        return dataPoints.map(val => ((val - startValue) / startValue) * 100);
    }
}

export const portfolioAnalytics = new PortfolioAnalytics();
