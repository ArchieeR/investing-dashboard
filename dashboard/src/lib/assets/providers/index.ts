'use server';

import type { ETFHoldingRecord } from '@/types/asset';
import { fetchISharesHoldings, isISharesTicker } from './ishares';
import { fetchSPDRHoldings, isSPDRTicker } from './spdr';
import { fetchFMPHoldings } from './fmp';

export type HoldingsSource = 'ishares-csv' | 'spdr-xlsx' | 'fmp';

export interface ETFHoldingsResult {
  holdings: ETFHoldingRecord[];
  source: HoldingsSource;
}

export async function fetchETFHoldings(
  ticker: string,
  issuer?: string,
): Promise<ETFHoldingsResult> {
  const useIShares =
    isISharesTicker(ticker) ||
    (issuer && /ishares|blackrock/i.test(issuer));

  const useSPDR =
    isSPDRTicker(ticker) ||
    (issuer && /spdr|state\s*street/i.test(issuer));

  // 1. Try iShares CSV
  if (useIShares) {
    try {
      const holdings = await fetchISharesHoldings(ticker);
      return { holdings, source: 'ishares-csv' };
    } catch (err) {
      console.warn(`[ETF providers] iShares failed for ${ticker}, trying next:`, err);
    }
  }

  // 2. Try SPDR Excel
  if (useSPDR) {
    try {
      const holdings = await fetchSPDRHoldings(ticker);
      return { holdings, source: 'spdr-xlsx' };
    } catch (err) {
      console.warn(`[ETF providers] SPDR failed for ${ticker}, trying next:`, err);
    }
  }

  // 3. FMP fallback (universal)
  try {
    const holdings = await fetchFMPHoldings(ticker);
    return { holdings, source: 'fmp' };
  } catch (err) {
    console.error(`[ETF providers] FMP failed for ${ticker}:`, err);
    throw new Error(`No ETF holdings available for ${ticker}`);
  }
}
