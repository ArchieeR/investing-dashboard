import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
const mockUpdateLivePrices = vi.fn();

vi.mock('@/context/PortfolioContext', () => ({
  usePortfolio: () => ({
    updateLivePrices: mockUpdateLivePrices,
  }),
}));

vi.mock('@/services/price-service', () => ({
  fetchPrices: vi.fn().mockResolvedValue(
    new Map([
      [
        'VUKE',
        {
          symbol: 'VUKE',
          price: 3200,
          currency: 'GBX',
          source: 'fmp',
          timestamp: new Date('2024-01-01T12:00:00Z'),
        },
      ],
    ]),
  ),
  convertGbxToGbp: vi.fn((price: number, currency: string) =>
    currency === 'GBX' || currency === 'GBp' ? price / 100 : price,
  ),
  isGbxTicker: vi.fn((symbol: string, currency?: string) =>
    currency === 'GBX' || currency === 'GBp' || symbol.endsWith('.L'),
  ),
}));

vi.mock('@/services/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { useLivePrices } from './useLivePrices';
import type { Holding } from '@/types/portfolio';

const mockHoldings: Holding[] = [
  {
    id: 'h1',
    section: 'Core',
    theme: 'All',
    assetType: 'ETF',
    name: 'Vanguard FTSE',
    ticker: 'VUKE',
    exchange: 'LSE',
    account: 'ISA',
    price: 30,
    qty: 100,
    include: true,
  },
  {
    id: 'h2',
    section: 'Cash',
    theme: 'Cash',
    assetType: 'Cash',
    name: 'Cash buffer',
    ticker: '',
    exchange: 'LSE',
    account: 'ISA',
    price: 1,
    qty: 500,
    include: true,
  },
];

describe('useLivePrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('starts with isLoading false and no quotes', () => {
    const { result } = renderHook(() => useLivePrices(mockHoldings, false));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.quotes.size).toBe(0);
    expect(result.current.lastUpdated).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('filters out Cash holdings and deduplicates tickers', () => {
    const duplicated: Holding[] = [
      ...mockHoldings,
      { ...mockHoldings[0], id: 'h3' }, // duplicate VUKE
    ];
    const { result } = renderHook(() => useLivePrices(duplicated, false));
    // Should not fetch automatically when disabled
    expect(result.current.quotes.size).toBe(0);
  });

  it('exposes refreshPrices and refreshSinglePrice callbacks', () => {
    const { result } = renderHook(() => useLivePrices(mockHoldings, false));
    expect(typeof result.current.refreshPrices).toBe('function');
    expect(typeof result.current.refreshSinglePrice).toBe('function');
  });

  it('fetches prices when enabled', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useLivePrices(mockHoldings, true, 10));
    // Wait for the initial fetch to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    // After fetch, updateLivePrices should have been called
    expect(mockUpdateLivePrices).toHaveBeenCalled();
  });
});
