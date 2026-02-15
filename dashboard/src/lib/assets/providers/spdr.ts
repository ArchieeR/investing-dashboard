'use server';

import type { ETFHoldingRecord } from '@/types/asset';
import { parseNumber } from '@/lib/domain/csv';

// SPDR (State Street) UK ETF ticker -> slug for the holdings download URL.
// SSGA provides daily holdings as Excel (.xlsx). We parse with the xlsx (SheetJS) library.
// If xlsx is not installed this provider throws at runtime; the index cascade falls back to FMP.
//
// Dependency: `npm install xlsx`

const SPDR_PRODUCTS: Record<string, string> = {
  // Equity
  SPY5: 'spy5', // S&P 500
  SPXS: 'spxs', // S&P 500 (GBP hedged)
  SPPW: 'sppw', // S&P 500 ESG
  SWRD: 'swrd', // MSCI World
  SPYY: 'spyy', // Euro Stoxx 50
  SPYX: 'spyx', // S&P 500 ESG
  UKDV: 'ukdv', // S&P UK Dividend Aristocrats
  SPYD: 'spyd', // S&P Global Dividend Aristocrats
  ZPDW: 'zpdw', // MSCI World Small Cap
  // Fixed Income
  GLTY: 'glty', // Bloomberg UK Gilt
  UKCO: 'ukco', // Bloomberg UK Corporate Bond
  SYBZ: 'sybz', // Bloomberg Euro High Yield Bond
};

function buildDownloadUrl(ticker: string): string | null {
  const slug = SPDR_PRODUCTS[ticker.toUpperCase()];
  if (!slug) return null;
  return `https://www.ssga.com/library-content/products/fund-data/etfs/uk/holdings-daily-uk-en-${slug}.xlsx`;
}

// Minimal xlsx type surface to avoid requiring @types/xlsx at compile time
interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
}
interface XLSXModule {
  read(data: unknown, opts?: { type?: string }): XLSXWorkbook;
  utils: {
    sheet_to_json<T>(sheet: unknown, opts?: { defval?: string }): T[];
  };
}

async function loadXLSX(): Promise<XLSXModule> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('xlsx') as XLSXModule;
  } catch {
    throw new Error('SPDR provider requires the "xlsx" package. Install with: npm install xlsx');
  }
}

async function parseSPDRExcel(buffer: ArrayBuffer): Promise<ETFHoldingRecord[]> {
  const XLSX = await loadXLSX();

  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], {
    defval: '',
  });
  if (rows.length === 0) return [];

  // SSGA column names vary slightly. Normalise by lowercasing keys.
  const normalise = (row: Record<string, string>): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      out[k.toLowerCase().trim()] = typeof v === 'string' ? v.trim() : String(v);
    }
    return out;
  };

  const holdings: ETFHoldingRecord[] = [];

  for (const raw of rows) {
    const r = normalise(raw);

    const name = r['name'] || r['security name'] || r['holding name'] || '';
    const ticker = r['ticker'] || r['symbol'] || r['code'] || '';
    const weightStr = r['weight'] || r['weight (%)'] || r['% weight'] || r['percentage weight'] || '';
    const weight = parseNumber(weightStr);

    if (!name && !ticker) continue;

    holdings.push({
      ticker,
      name,
      weight,
      ...(r['isin'] ? { isin: r['isin'] } : {}),
      ...(r['shares'] || r['shares held']
        ? { shares: parseNumber(r['shares'] || r['shares held']) }
        : {}),
      ...(r['market value'] || r['notional value']
        ? { marketValue: parseNumber(r['market value'] || r['notional value']) }
        : {}),
      ...(r['sector'] ? { sector: r['sector'] } : {}),
      ...(r['asset class'] ? { assetClass: r['asset class'] } : {}),
      ...(r['currency'] || r['local currency']
        ? { currency: r['currency'] || r['local currency'] }
        : {}),
    });
  }

  return holdings;
}

export async function fetchSPDRHoldings(ticker: string): Promise<ETFHoldingRecord[]> {
  const url = buildDownloadUrl(ticker);
  if (!url) {
    throw new Error(`SPDR: No product mapping for ticker "${ticker}"`);
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Invorm/1.0)',
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`SPDR Excel download failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const holdings = await parseSPDRExcel(buffer);

  if (holdings.length === 0) {
    throw new Error(`SPDR: No holdings parsed from Excel for ${ticker}`);
  }

  return holdings;
}

/** Check if a ticker has a SPDR product mapping */
export function isSPDRTicker(ticker: string): boolean {
  return ticker.toUpperCase() in SPDR_PRODUCTS;
}
