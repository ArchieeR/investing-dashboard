'use server';

import type { ETFHoldingRecord } from '@/types/asset';
import { fmpClient } from '@/lib/fmp/client';

export async function fetchFMPHoldings(ticker: string): Promise<ETFHoldingRecord[]> {
  const raw = await fmpClient.getETFHoldings(ticker);

  return raw.map((h) => ({
    ticker: h.asset,
    name: h.name ?? h.asset,
    weight: h.weightPercentage,
    shares: h.shares,
    ...(h.isin ? { isin: h.isin } : {}),
    ...(h.marketValue ? { marketValue: h.marketValue } : {}),
  }));
}
