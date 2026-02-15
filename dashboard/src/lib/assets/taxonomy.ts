import type { AssetCategory } from '@/types/asset';
import type { FMPProfile, FMPETFInfo } from '@/lib/fmp/schemas';

// Keywords used to infer subcategories from asset name/description
const BOND_KEYWORDS = ['bond', 'gilt', 'fixed income', 'treasury', 'credit', 'debt', 'corporate bond'];
const COMMODITY_KEYWORDS = ['commodity', 'gold', 'silver', 'platinum', 'oil', 'natural gas', 'agriculture', 'metals'];
const REAL_ESTATE_KEYWORDS = ['real estate', 'reit', 'property'];
const MONEY_MARKET_KEYWORDS = ['money market', 'liquidity', 'cash'];
const MULTI_ASSET_KEYWORDS = ['multi-asset', 'multi asset', 'balanced', 'lifestyle', 'target date'];

function nameContains(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/** Determine the top-level AssetCategory from FMP profile data */
export function categorizeAsset(
  profile: FMPProfile,
  etfInfo?: FMPETFInfo | null,
): { category: AssetCategory; subcategory: string } {
  const name = (profile.companyName ?? '').toLowerCase();
  const desc = (profile.description ?? '').toLowerCase();
  const combined = `${name} ${desc}`;

  // ETFs
  if (profile.isEtf) {
    // Check for non-equity ETF types first
    if (nameContains(combined, MONEY_MARKET_KEYWORDS)) {
      return { category: 'Money Market', subcategory: inferMoneyMarketSub(profile.currency) };
    }
    if (nameContains(combined, COMMODITY_KEYWORDS)) {
      return { category: 'Commodity ETC', subcategory: inferCommoditySub(combined) };
    }
    if (nameContains(combined, REAL_ESTATE_KEYWORDS)) {
      return { category: 'Real Estate ETF', subcategory: 'Global REIT' };
    }
    if (nameContains(combined, BOND_KEYWORDS)) {
      return { category: 'Bond ETF', subcategory: inferBondETFSub(combined) };
    }
    if (nameContains(combined, MULTI_ASSET_KEYWORDS)) {
      return { category: 'Multi-Asset ETF', subcategory: inferMultiAssetSub(combined) };
    }
    if (combined.includes('active')) {
      return { category: 'Active ETF', subcategory: 'Equity Active' };
    }

    // Default: Equity ETF
    return { category: 'Equity ETF', subcategory: inferEquityETFSub(combined, etfInfo) };
  }

  // Funds
  if (profile.isFund) {
    return { category: 'Fund', subcategory: inferFundSub(combined) };
  }

  // Stocks (default)
  return { category: 'Stock', subcategory: inferStockSub(profile) };
}

// -- Subcategory inference helpers --

function inferEquityETFSub(combined: string, etfInfo?: FMPETFInfo | null): string {
  if (combined.includes('dividend') || combined.includes('income')) return 'Dividend';
  if (combined.includes('small cap') || combined.includes('smallcap')) return 'Small Cap';
  if (combined.includes('esg') || combined.includes('sri') || combined.includes('sustainable')) return 'ESG';
  if (combined.includes('smart beta') || combined.includes('factor') || combined.includes('momentum') || combined.includes('value') || combined.includes('quality')) return 'Smart Beta';
  if (combined.includes('thematic') || combined.includes('clean energy') || combined.includes('cyber') || combined.includes('artificial intelligence') || combined.includes('blockchain') || combined.includes('water') || combined.includes('ageing') || combined.includes('robotics')) return 'Thematic';
  if (combined.includes('technology') || combined.includes('healthcare') || combined.includes('financials') || combined.includes('energy') || combined.includes('utilities') || combined.includes('consumer')) return 'Sector';

  // Try to determine Regional vs Country vs Broad
  if (combined.includes('world') || combined.includes('global') || combined.includes('acwi') || combined.includes('all-world') || combined.includes('all world')) return 'Broad Market';
  if (combined.includes('emerging') || combined.includes('europe') || combined.includes('asia') || combined.includes('pacific') || combined.includes('latin america')) return 'Regional';
  if (combined.includes('usa') || combined.includes('japan') || combined.includes('china') || combined.includes('india') || combined.includes('uk') || combined.includes('ftse 100') || combined.includes('s&p 500') || combined.includes('nasdaq')) return 'Country';

  return 'Broad Market';
}

function inferBondETFSub(combined: string): string {
  if (combined.includes('government') || combined.includes('gilt') || combined.includes('treasury') || combined.includes('sovereign')) return 'Government';
  if (combined.includes('high yield') || combined.includes('high-yield') || combined.includes('junk')) return 'High Yield';
  if (combined.includes('inflation') || combined.includes('tips') || combined.includes('linker')) return 'Inflation-Linked';
  if (combined.includes('short') || combined.includes('0-5') || combined.includes('1-3')) return 'Short Duration';
  if (combined.includes('emerging') || combined.includes('em debt')) return 'EM Debt';
  if (combined.includes('aggregate') || combined.includes('total bond')) return 'Aggregate';
  return 'Corporate';
}

function inferCommoditySub(combined: string): string {
  if (combined.includes('gold') || combined.includes('silver') || combined.includes('platinum') || combined.includes('palladium') || combined.includes('precious')) return 'Precious Metals';
  if (combined.includes('oil') || combined.includes('natural gas') || combined.includes('energy')) return 'Energy';
  if (combined.includes('agriculture') || combined.includes('wheat') || combined.includes('corn') || combined.includes('coffee')) return 'Agriculture';
  if (combined.includes('industrial') || combined.includes('copper') || combined.includes('zinc')) return 'Industrial Metals';
  return 'Broad Commodity';
}

function inferMultiAssetSub(combined: string): string {
  if (combined.includes('income')) return 'Income';
  if (combined.includes('growth')) return 'Growth';
  if (combined.includes('target')) return 'Target Date';
  return 'Balanced';
}

function inferMoneyMarketSub(currency: string): string {
  if (currency === 'EUR') return 'EUR';
  if (currency === 'USD') return 'USD';
  return 'GBP';
}

function inferFundSub(combined: string): string {
  if (combined.includes('investment trust') || combined.includes('plc')) return 'Investment Trust';
  if (combined.includes('sicav')) return 'SICAV';
  return 'OEIC';
}

function inferStockSub(profile: FMPProfile): string {
  // No marketCap in profile directly, but we can check description
  // This is a rough heuristic - proper classification needs market data
  const desc = (profile.description ?? '').toLowerCase();
  if (desc.includes('micro-cap') || desc.includes('micro cap')) return 'Micro Cap';
  if (desc.includes('small-cap') || desc.includes('small cap')) return 'Small Cap';
  if (desc.includes('mid-cap') || desc.includes('mid cap')) return 'Mid Cap';
  return 'Large Cap';
}
