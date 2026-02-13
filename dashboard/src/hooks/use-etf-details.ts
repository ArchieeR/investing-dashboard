// Types for the "Glass Box" data
export interface ETFHolding {
    ticker: string;
    name: string;
    weight: number;
}

export interface ExposureData {
    name: string;
    value: number; // Percent
}

export interface ETFDetails {
    holdings: ETFHolding[];
    sectors: ExposureData[];
    countries: ExposureData[];
}

// Mock Data Store
const MOCK_DETAILS: Record<string, ETFDetails> = {
    "VUSA": {
        holdings: [
            { ticker: "MSFT", name: "Microsoft Corp", weight: 7.2 },
            { ticker: "AAPL", name: "Apple Inc", weight: 6.8 },
            { ticker: "NVDA", name: "NVIDIA Corp", weight: 5.1 },
            { ticker: "AMZN", name: "Amazon.com Inc", weight: 3.4 },
            { ticker: "META", name: "Meta Platforms", weight: 2.1 },
            { ticker: "GOOGL", name: "Alphabet Class A", weight: 1.9 },
            { ticker: "GOOG", name: "Alphabet Class C", weight: 1.7 },
            { ticker: "BRK.B", name: "Berkshire Hathaway", weight: 1.6 },
            { ticker: "LLY", name: "Eli Lilly & Co", weight: 1.4 },
            { ticker: "AVGO", name: "Broadcom Inc", weight: 1.3 },
        ],
        sectors: [
            { name: "Information Tech", value: 32.4 },
            { name: "Financials", value: 12.4 },
            { name: "Health Care", value: 11.9 },
            { name: "Consumer Disc", value: 10.5 },
            { name: "Communication", value: 9.2 },
            { name: "Industrials", value: 8.1 },
        ],
        countries: [
            { name: "United States", value: 98.4 },
            { name: "Ireland", value: 1.2 },
            { name: "Other", value: 0.4 },
        ]
    },
    // Default fallback for others
    "DEFAULT": {
        holdings: [
            { ticker: "TOP1", name: "Top Holding 1", weight: 5.5 },
            { ticker: "TOP2", name: "Top Holding 2", weight: 4.2 },
            { ticker: "TOP3", name: "Top Holding 3", weight: 3.8 },
            { ticker: "TOP4", name: "Top Holding 4", weight: 3.1 },
            { ticker: "TOP5", name: "Top Holding 5", weight: 2.5 },
        ],
        sectors: [
            { name: "Technology", value: 25 },
            { name: "Financials", value: 20 },
            { name: "Healthcare", value: 15 },
            { name: "Other", value: 40 },
        ],
        countries: [
            { name: "Global", value: 100 }
        ]
    }
};

export const useETFDetails = (ticker: string) => {
    // Simulate API delay
    // const { data, error, isLoading } ...

    const details = MOCK_DETAILS[ticker] || MOCK_DETAILS["DEFAULT"];

    return {
        details,
        isLoading: false,
        error: null
    };
};
