import Papa from 'papaparse';
import { Holding } from '@/types/portfolio';

interface CSVRow {
    Ticker?: string;
    Symbol?: string;
    Quantity?: string;
    Shares?: string;
    Cost?: string;
    AvgCost?: string;
    [key: string]: string | undefined;
}

export interface ParseResult {
    holdings: Omit<Holding, 'id'>[];
    errors: string[];
}

export const parsePortfolioCSV = (file: File): Promise<ParseResult> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const holdings: Omit<Holding, 'id'>[] = [];
                const errors: string[] = [];

                results.data.forEach((row: any, index) => {
                    // Normalization logic for different CSV headers
                    const ticker = row['Ticker'] || row['Symbol'] || row['Stock'];
                    const quantity = parseFloat(row['Quantity'] || row['Shares'] || row['Qty'] || '0');
                    const cost = parseFloat(row['AvgCost'] || row['Cost'] || row['Price'] || '0');
                    const date = row['Date'] || row['Time'] || new Date().toISOString().split('T')[0];

                    if (!ticker || !quantity) {
                        errors.push(`Row ${index + 1}: Missing Ticker or Quantity`);
                        return;
                    }

                    // For now, attaching the date to a custom property we'll check in context if needed
                    // Or we assume the context will use this as transaction date (logic added in Context)
                    // We need to return this date field up or modify Holding type temporarily in parse result?
                    // NOTE: Holding interface doesn't have date. We'll add it to 'ParseResult' structure explicitly or cheat by adding it to Holding extended.

                    holdings.push({
                        ticker: ticker.toUpperCase(),
                        assetType: 'EQUITY',
                        quantity: quantity,
                        avgCost: isNaN(cost) ? 0 : cost,
                        currency: 'USD',
                        source: 'MANUAL',
                        // @ts-ignore - temporary hack to pass date through for History Engine
                        date: date
                    });
                });

                resolve({ holdings, errors });
            },
            error: (error) => {
                resolve({ holdings: [], errors: [error.message] });
            }
        });
    });
};
