import { adminDb } from '@/lib/firebase/admin';
import { fmpClient } from '@/lib/fmp/client';
import { categorizeAsset } from './taxonomy';
import { fetchETFHoldings } from './providers';
import type {
  AssetDocument,
  ETFHoldingRecord,
  AssetFundamentals,
  AssetETFData,
} from '@/types/asset';

const ASSETS_COLLECTION = 'assets';
const HOLDINGS_SUBCOLLECTION = 'holdings';
const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

// -----------------------------------------------------------------------------
// Read
// -----------------------------------------------------------------------------

/** Get an asset from Firestore, populating from FMP if missing or stale */
export async function getAsset(ticker: string): Promise<AssetDocument | null> {
  const doc = await adminDb
    .collection(ASSETS_COLLECTION)
    .doc(ticker)
    .get();

  if (doc.exists) {
    const data = doc.data() as AssetDocument;
    // Check staleness
    const lastUpdated = data.lastUpdated instanceof Date
      ? data.lastUpdated
      : new Date(data.lastUpdated as unknown as string);
    if (Date.now() - lastUpdated.getTime() < STALE_MS) {
      return data;
    }
  }

  // Missing or stale — populate from FMP
  try {
    return await populateAssetFromFMP(ticker);
  } catch {
    return doc.exists ? (doc.data() as AssetDocument) : null;
  }
}

/** Batch read assets for a portfolio. Populates missing ones from FMP. */
export async function getPortfolioAssets(
  tickers: string[],
): Promise<Map<string, AssetDocument>> {
  const result = new Map<string, AssetDocument>();
  if (tickers.length === 0) return result;

  // Batch read from Firestore (max 10 per getAll call)
  const refs = tickers.map((t) => adminDb.collection(ASSETS_COLLECTION).doc(t));
  const chunks: (typeof refs)[] = [];
  for (let i = 0; i < refs.length; i += 10) {
    chunks.push(refs.slice(i, i + 10));
  }

  const missing: string[] = [];

  for (const chunk of chunks) {
    const docs = await adminDb.getAll(...chunk);
    for (const doc of docs) {
      if (doc.exists) {
        result.set(doc.id, doc.data() as AssetDocument);
      } else {
        missing.push(doc.id);
      }
    }
  }

  // Populate missing from FMP (parallel, but limited)
  const populatePromises = missing.map(async (ticker) => {
    try {
      const asset = await populateAssetFromFMP(ticker);
      result.set(ticker, asset);
    } catch {
      // Skip — asset not available
    }
  });
  await Promise.all(populatePromises);

  return result;
}

// -----------------------------------------------------------------------------
// Populate from FMP
// -----------------------------------------------------------------------------

/** Fetch asset data from FMP and write to Firestore */
export async function populateAssetFromFMP(ticker: string): Promise<AssetDocument> {
  // Fetch profile + quote in parallel. Key metrics only for non-ETFs.
  const [profile, quote] = await Promise.all([
    fmpClient.getProfile(ticker),
    fmpClient.getQuote(ticker),
  ]);

  if (!profile) {
    throw new Error(`FMP: No profile found for ${ticker}`);
  }

  // ETF info if applicable
  let etfInfo = null;
  let keyMetrics = null;
  if (profile.isEtf) {
    etfInfo = await fmpClient.getETFInfo(ticker);
  } else {
    const metrics = await fmpClient.getKeyMetrics(ticker, 'annual', 1);
    keyMetrics = metrics[0] ?? null;
  }

  // Classify
  const { category, subcategory } = categorizeAsset(profile, etfInfo);

  // Build fundamentals
  let fundamentals: AssetFundamentals | undefined;
  if (keyMetrics) {
    fundamentals = {
      pe: keyMetrics.peRatio ?? undefined,
      pb: keyMetrics.pbRatio ?? undefined,
      dividendYield: keyMetrics.dividendYield ?? undefined,
      roe: keyMetrics.roe ?? undefined,
      roa: keyMetrics.roa ?? undefined,
      debtToEquity: keyMetrics.debtToEquity ?? undefined,
      revenuePerShare: keyMetrics.revenuePerShare ?? undefined,
      netIncomePerShare: keyMetrics.netIncomePerShare ?? undefined,
      marketCap: keyMetrics.marketCap ?? undefined,
      enterpriseValue: keyMetrics.enterpriseValue ?? undefined,
    };
  }

  // Build ETF data
  let etfData: AssetETFData | undefined;
  if (etfInfo) {
    etfData = {
      issuer: etfInfo.etfCompany ?? '',
      ter: etfInfo.expenseRatio ?? 0,
      aum: etfInfo.aum ? formatAUM(etfInfo.aum) : undefined,
      replication: 'Unknown',
      domicile: etfInfo.domicile ?? undefined,
      inceptionDate: etfInfo.inceptionDate ?? undefined,
      distributionType: 'Unknown',
      distributionFrequency: undefined,
      holdingsCount: 0,
      indexTracked: undefined,
    };
  }

  const now = new Date();
  const asset: AssetDocument = {
    symbol: profile.symbol,
    name: profile.companyName,
    isin: profile.isin ?? undefined,
    exchange: profile.exchangeShortName,
    currency: profile.currency,
    category,
    subcategory,
    isEtf: profile.isEtf,
    isFund: profile.isFund ?? false,
    isActivelyTrading: profile.isActivelyTrading,
    description: profile.description ?? undefined,
    website: profile.website ?? undefined,
    logoUrl: profile.image ?? undefined,
    sector: profile.sector ?? undefined,
    industry: profile.industry ?? undefined,
    country: profile.country ?? undefined,
    ipoDate: profile.ipoDate ?? undefined,
    livePrice: quote?.price,
    dayChange: quote?.change,
    dayChangePercent: quote?.changePercentage,
    yearHigh: quote?.yearHigh,
    yearLow: quote?.yearLow,
    fundamentals,
    etfData,
    sources: ['fmp'],
    lastUpdated: now,
    lastPriceUpdate: quote ? now : undefined,
  };

  // Write to Firestore
  await adminDb
    .collection(ASSETS_COLLECTION)
    .doc(ticker)
    .set(serializeForFirestore(asset), { merge: true });

  return asset;
}

// -----------------------------------------------------------------------------
// ETF Holdings
// -----------------------------------------------------------------------------

/** Fetch and cache ETF holdings. Returns cached if fresh. */
export async function populateETFHoldings(
  ticker: string,
  issuer?: string,
): Promise<ETFHoldingRecord[]> {
  // Check if we have fresh holdings
  const assetDoc = await adminDb.collection(ASSETS_COLLECTION).doc(ticker).get();
  if (assetDoc.exists) {
    const data = assetDoc.data();
    const lastHoldings = data?.lastHoldingsUpdate;
    if (lastHoldings) {
      const ts = lastHoldings instanceof Date ? lastHoldings : new Date(lastHoldings);
      if (Date.now() - ts.getTime() < STALE_MS) {
        // Read from subcollection
        const snap = await adminDb
          .collection(ASSETS_COLLECTION)
          .doc(ticker)
          .collection(HOLDINGS_SUBCOLLECTION)
          .get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as ETFHoldingRecord);
        }
      }
    }
  }

  // Fetch from providers
  const { holdings, source } = await fetchETFHoldings(ticker, issuer);

  // Write holdings to subcollection (batch write)
  const batch = adminDb.batch();
  const holdingsRef = adminDb
    .collection(ASSETS_COLLECTION)
    .doc(ticker)
    .collection(HOLDINGS_SUBCOLLECTION);

  // Clear existing holdings first
  const existing = await holdingsRef.listDocuments();
  for (const doc of existing) {
    batch.delete(doc);
  }

  // Write new holdings
  for (const holding of holdings) {
    const docRef = holdingsRef.doc();
    batch.set(docRef, holding);
  }

  // Update asset doc metadata
  const now = new Date();
  batch.update(adminDb.collection(ASSETS_COLLECTION).doc(ticker), {
    lastHoldingsUpdate: now,
    'etfData.holdingsCount': holdings.length,
  });

  await batch.commit();

  return holdings;
}

/** Force refresh asset data from FMP regardless of staleness */
export async function refreshAsset(ticker: string): Promise<AssetDocument> {
  return populateAssetFromFMP(ticker);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatAUM(aum: number): string {
  if (aum >= 1e9) return `£${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `£${(aum / 1e6).toFixed(0)}M`;
  return `£${aum.toLocaleString()}`;
}

/** Convert Date objects to ISO strings for Firestore admin SDK */
function serializeForFirestore(asset: AssetDocument): Record<string, unknown> {
  return {
    ...asset,
    lastUpdated: asset.lastUpdated,
    lastPriceUpdate: asset.lastPriceUpdate ?? null,
    lastHoldingsUpdate: asset.lastHoldingsUpdate ?? null,
  };
}
