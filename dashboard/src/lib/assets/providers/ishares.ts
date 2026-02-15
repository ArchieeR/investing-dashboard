'use server';

import type { ETFHoldingRecord } from '@/types/asset';
import { parseCsvRow, parseNumber, stripBom } from '@/lib/domain/csv';

// iShares UK product IDs: {ticker} -> {productId, slug}
const ISHARES_PRODUCTS: Record<string, { productId: string; slug: string }> = {
  ISF: { productId: '251795', slug: 'ishares-core-ftse-100-ucits-etf-gbp-dist-fund' },
  IUKD: { productId: '251806', slug: 'ishares-uk-dividend-ucits-etf-gbp-dist-fund' },
  SWDA: { productId: '251882', slug: 'ishares-core-msci-world-ucits-etf-usd-acc-fund' },
  EIMI: { productId: '264659', slug: 'ishares-core-msci-em-imi-ucits-etf-usd-acc-fund' },
  IGLT: { productId: '251806', slug: 'ishares-core-uk-gilts-ucits-etf-gbp-dist-fund' },
  LQDE: { productId: '251813', slug: 'ishares-core-corp-bond-ucits-etf-gbp-dist-fund' },
  IITU: { productId: '280510', slug: 'ishares-sp-500-information-technology-sector-ucits-etf-usd-acc-fund' },
  CSUS: { productId: '476363', slug: 'ishares-sp-500-esg-ucits-etf-usd-acc-fund' },
  SUAS: { productId: '291407', slug: 'ishares-msci-acwi-ucits-etf-usd-acc-fund' },
};

function buildDownloadUrl(ticker: string): string | null {
  const product = ISHARES_PRODUCTS[ticker.toUpperCase()];
  if (!product) return null;

  return `https://www.ishares.com/uk/individual/en/products/${product.productId}/${product.slug}/?fileType=csv&fileName=${ticker.toUpperCase()}_holdings&dataType=fund`;
}

function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('ticker') || (lower.includes('name') && lower.includes('weight'))) {
      return i;
    }
  }
  return -1;
}

function parseISharesCsv(raw: string): ETFHoldingRecord[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => stripBom(l.trim()));

  const headerIndex = findHeaderRow(lines);
  if (headerIndex === -1) return [];

  const headerCells = parseCsvRow(lines[headerIndex]).map((c) => c.toLowerCase());

  const col = (name: string) => headerCells.findIndex((c) => c.includes(name));
  const tickerIdx = col('ticker');
  const nameIdx = col('name');
  const weightIdx = col('weight');
  const sharesIdx = col('shares');
  const mvIdx = col('market value');
  const sectorIdx = col('sector');
  const assetClassIdx = col('asset class');
  const currencyIdx = col('currency');
  const isinIdx = col('isin');

  if (nameIdx === -1 && tickerIdx === -1) return [];

  const holdings: ETFHoldingRecord[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const cells = parseCsvRow(line);
    if (cells.length < 2) continue;

    const weight = weightIdx !== -1 ? parseNumber(cells[weightIdx]) : 0;
    const name = nameIdx !== -1 ? cells[nameIdx] ?? '' : '';
    const ticker = tickerIdx !== -1 ? cells[tickerIdx] ?? '' : '';

    // Skip footer/summary rows
    if (!name && !ticker) continue;
    if (weight === 0 && !ticker) continue;

    holdings.push({
      ticker,
      name,
      weight,
      ...(isinIdx !== -1 && cells[isinIdx] ? { isin: cells[isinIdx] } : {}),
      ...(sharesIdx !== -1 ? { shares: parseNumber(cells[sharesIdx]) } : {}),
      ...(mvIdx !== -1 ? { marketValue: parseNumber(cells[mvIdx]) } : {}),
      ...(sectorIdx !== -1 && cells[sectorIdx] ? { sector: cells[sectorIdx] } : {}),
      ...(assetClassIdx !== -1 && cells[assetClassIdx] ? { assetClass: cells[assetClassIdx] } : {}),
      ...(currencyIdx !== -1 && cells[currencyIdx] ? { currency: cells[currencyIdx] } : {}),
    });
  }

  return holdings;
}

export async function fetchISharesHoldings(ticker: string): Promise<ETFHoldingRecord[]> {
  const url = buildDownloadUrl(ticker);
  if (!url) {
    throw new Error(`iShares: No product mapping for ticker "${ticker}"`);
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Invorm/1.0)',
      Accept: 'text/csv,text/plain,*/*',
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`iShares CSV download failed: ${res.status} ${res.statusText}`);
  }

  const csv = await res.text();
  const holdings = parseISharesCsv(csv);

  if (holdings.length === 0) {
    throw new Error(`iShares: No holdings parsed from CSV for ${ticker}`);
  }

  return holdings;
}

/** Check if a ticker has an iShares product mapping */
export function isISharesTicker(ticker: string): boolean {
  return ticker.toUpperCase() in ISHARES_PRODUCTS;
}
