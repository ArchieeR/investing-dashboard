'use server';

import {
  getAsset,
  getPortfolioAssets,
  populateETFHoldings,
  refreshAsset,
} from '@/lib/assets';
import type {
  AssetDocument,
  ETFHoldingRecord,
  PortfolioContext,
  PortfolioContextHolding,
} from '@/types/asset';

// -----------------------------------------------------------------------------
// Basic asset access
// -----------------------------------------------------------------------------

/** Get full asset data for a ticker (auto-populates from FMP if needed) */
export async function getAssetData(ticker: string): Promise<AssetDocument | null> {
  try {
    return await getAsset(ticker);
  } catch (err) {
    console.error(`[actions/assets] getAssetData failed for ${ticker}:`, err);
    return null;
  }
}

/** Get ETF holdings for a ticker (auto-populates if needed) */
export async function getAssetHoldings(ticker: string): Promise<ETFHoldingRecord[]> {
  try {
    return await populateETFHoldings(ticker);
  } catch (err) {
    console.error(`[actions/assets] getAssetHoldings failed for ${ticker}:`, err);
    return [];
  }
}

/** Force refresh asset data from external sources */
export async function refreshAssetData(ticker: string): Promise<AssetDocument | null> {
  try {
    return await refreshAsset(ticker);
  } catch (err) {
    console.error(`[actions/assets] refreshAssetData failed for ${ticker}:`, err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Portfolio context for AI chat
// -----------------------------------------------------------------------------

interface HoldingInput {
  ticker: string;
  name: string;
  qty: number;
  price: number;
  avgCost?: number;
  account: string;
  dayChange?: number;
  dayChangePercent?: number;
}

/** Build structured portfolio context for the AI chatbot */
export async function getPortfolioContext(
  holdings: HoldingInput[],
): Promise<PortfolioContext> {
  const tickers = holdings.map((h) => h.ticker);
  const assetMap = await getPortfolioAssets(tickers);

  // Compute per-holding values
  const totalValue = holdings.reduce((sum, h) => sum + h.price * h.qty, 0);
  let totalCost = 0;
  let totalDayChange = 0;

  const contextHoldings: PortfolioContextHolding[] = holdings.map((h) => {
    const value = h.price * h.qty;
    const cost = (h.avgCost ?? h.price) * h.qty;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const dayChg = (h.dayChange ?? 0) * h.qty;
    const asset = assetMap.get(h.ticker);

    totalCost += cost;
    totalDayChange += dayChg;

    return {
      ticker: h.ticker,
      name: h.name,
      category: asset?.category ?? 'Stock',
      qty: h.qty,
      value,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      pnl,
      pnlPct,
      dayChange: dayChg,
      account: h.account,
    };
  });

  // Account breakdown
  const accountMap = new Map<string, { value: number; cost: number; dayChange: number }>();
  for (const h of holdings) {
    const value = h.price * h.qty;
    const cost = (h.avgCost ?? h.price) * h.qty;
    const dayChg = (h.dayChange ?? 0) * h.qty;
    const existing = accountMap.get(h.account) ?? { value: 0, cost: 0, dayChange: 0 };
    accountMap.set(h.account, {
      value: existing.value + value,
      cost: existing.cost + cost,
      dayChange: existing.dayChange + dayChg,
    });
  }
  const accountBreakdown = [...accountMap.entries()].map(([account, data]) => ({
    account,
    value: data.value,
    pnl: data.value - data.cost,
    pnlPct: data.cost > 0 ? ((data.value - data.cost) / data.cost) * 100 : 0,
  }));

  // Look-through: aggregate underlying ETF holdings weighted by portfolio weight
  const underlyingMap = new Map<string, { name: string; totalWeight: number }>();
  const sectorMap = new Map<string, number>();
  const countryMap = new Map<string, number>();

  for (const h of holdings) {
    const asset = assetMap.get(h.ticker);
    const holdingWeight = totalValue > 0 ? (h.price * h.qty) / totalValue : 0;

    if (asset?.isEtf) {
      // Fetch ETF holdings for look-through
      try {
        const etfHoldings = await populateETFHoldings(h.ticker, asset.etfData?.issuer);
        for (const eh of etfHoldings) {
          const effectiveWeight = (eh.weight / 100) * holdingWeight * 100;
          const existing = underlyingMap.get(eh.ticker) ?? { name: eh.name, totalWeight: 0 };
          underlyingMap.set(eh.ticker, {
            name: eh.name || existing.name,
            totalWeight: existing.totalWeight + effectiveWeight,
          });
          if (eh.sector) {
            sectorMap.set(eh.sector, (sectorMap.get(eh.sector) ?? 0) + effectiveWeight);
          }
        }
      } catch {
        // ETF holdings unavailable — skip look-through for this holding
      }
    } else {
      // Direct stock — add to underlying as itself
      const existing = underlyingMap.get(h.ticker) ?? { name: h.name, totalWeight: 0 };
      underlyingMap.set(h.ticker, {
        name: h.name,
        totalWeight: existing.totalWeight + holdingWeight * 100,
      });
      if (asset?.sector) {
        sectorMap.set(asset.sector, (sectorMap.get(asset.sector) ?? 0) + holdingWeight * 100);
      }
      if (asset?.country) {
        countryMap.set(asset.country, (countryMap.get(asset.country) ?? 0) + holdingWeight * 100);
      }
    }
  }

  // Sort and take top 20
  const topExposures = [...underlyingMap.entries()]
    .map(([ticker, data]) => ({ ticker, name: data.name, totalWeight: data.totalWeight }))
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, 20);

  const sectorExposure = [...sectorMap.entries()]
    .map(([sector, weight]) => ({ sector, weight }))
    .sort((a, b) => b.weight - a.weight);

  const countryExposure = [...countryMap.entries()]
    .map(([country, weight]) => ({ country, weight }))
    .sort((a, b) => b.weight - a.weight);

  const totalPnL = totalValue - totalCost;

  return {
    holdings: contextHoldings,
    totalValue,
    totalPnL,
    totalPnLPct: totalCost > 0 ? (totalPnL / totalCost) * 100 : 0,
    dayChange: totalDayChange,
    dayChangePct: totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0,
    accountBreakdown,
    topExposures,
    sectorExposure,
    countryExposure,
  };
}
