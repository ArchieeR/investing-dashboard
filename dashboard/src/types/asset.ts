// =============================================================================
// Asset Database Types & Taxonomy
// =============================================================================

// -----------------------------------------------------------------------------
// Asset Classification (two-level taxonomy)
// -----------------------------------------------------------------------------

export type AssetCategory =
  | 'Equity ETF'
  | 'Active ETF'
  | 'Bond ETF'
  | 'Money Market'
  | 'Commodity ETC'
  | 'Real Estate ETF'
  | 'Multi-Asset ETF'
  | 'Stock'
  | 'Fund'
  | 'Bond'
  | 'Crypto'
  | 'Cash';

export type EquityETFSubcategory =
  | 'Broad Market'
  | 'Regional'
  | 'Country'
  | 'Sector'
  | 'Thematic'
  | 'Dividend'
  | 'Small Cap'
  | 'Smart Beta'
  | 'ESG';

export type ActiveETFSubcategory =
  | 'Equity Active'
  | 'Fixed Income Active'
  | 'Multi-Asset Active';

export type BondETFSubcategory =
  | 'Government'
  | 'Corporate'
  | 'High Yield'
  | 'Inflation-Linked'
  | 'Aggregate'
  | 'Short Duration'
  | 'EM Debt';

export type MoneyMarketSubcategory = 'GBP' | 'USD' | 'EUR';

export type CommodityETCSubcategory =
  | 'Broad Commodity'
  | 'Precious Metals'
  | 'Energy'
  | 'Agriculture'
  | 'Industrial Metals';

export type RealEstateETFSubcategory =
  | 'Global REIT'
  | 'Regional REIT'
  | 'Sector REIT';

export type MultiAssetETFSubcategory =
  | 'Balanced'
  | 'Growth'
  | 'Income'
  | 'Target Date';

export type StockSubcategory =
  | 'Large Cap'
  | 'Mid Cap'
  | 'Small Cap'
  | 'Micro Cap';

export type FundSubcategory = 'OEIC' | 'Investment Trust' | 'SICAV';

export type BondSubcategory = 'Gilt' | 'Corporate' | 'Index-Linked';

export type CryptoSubcategory = 'Bitcoin' | 'Ethereum' | 'Multi-Asset';

export type CashSubcategory = 'GBP Cash' | 'Currency';

export type AssetSubcategory =
  | EquityETFSubcategory
  | ActiveETFSubcategory
  | BondETFSubcategory
  | MoneyMarketSubcategory
  | CommodityETCSubcategory
  | RealEstateETFSubcategory
  | MultiAssetETFSubcategory
  | StockSubcategory
  | FundSubcategory
  | BondSubcategory
  | CryptoSubcategory
  | CashSubcategory;

/** Maps each category to its valid subcategories */
export const CATEGORY_SUBCATEGORIES: Record<AssetCategory, readonly string[]> = {
  'Equity ETF': ['Broad Market', 'Regional', 'Country', 'Sector', 'Thematic', 'Dividend', 'Small Cap', 'Smart Beta', 'ESG'],
  'Active ETF': ['Equity Active', 'Fixed Income Active', 'Multi-Asset Active'],
  'Bond ETF': ['Government', 'Corporate', 'High Yield', 'Inflation-Linked', 'Aggregate', 'Short Duration', 'EM Debt'],
  'Money Market': ['GBP', 'USD', 'EUR'],
  'Commodity ETC': ['Broad Commodity', 'Precious Metals', 'Energy', 'Agriculture', 'Industrial Metals'],
  'Real Estate ETF': ['Global REIT', 'Regional REIT', 'Sector REIT'],
  'Multi-Asset ETF': ['Balanced', 'Growth', 'Income', 'Target Date'],
  'Stock': ['Large Cap', 'Mid Cap', 'Small Cap', 'Micro Cap'],
  'Fund': ['OEIC', 'Investment Trust', 'SICAV'],
  'Bond': ['Gilt', 'Corporate', 'Index-Linked'],
  'Crypto': ['Bitcoin', 'Ethereum', 'Multi-Asset'],
  'Cash': ['GBP Cash', 'Currency'],
} as const;

// -----------------------------------------------------------------------------
// ETF Holding Record (individual constituent of an ETF)
// -----------------------------------------------------------------------------

export interface ETFHoldingRecord {
  ticker: string;
  name: string;
  isin?: string;
  weight: number; // percentage, e.g. 6.8
  shares?: number;
  marketValue?: number;
  sector?: string;
  assetClass?: string;
  currency?: string;
}

// -----------------------------------------------------------------------------
// Asset Document (the full shared asset record in Firestore)
// -----------------------------------------------------------------------------

export type ReplicationMethod = 'Physical' | 'Synthetic' | 'Unknown';
export type DistributionType = 'Accumulating' | 'Distributing' | 'Unknown';

export interface AssetETFData {
  issuer: string;
  ter: number; // total expense ratio as percentage, e.g. 0.07
  aum?: string; // formatted, e.g. "£32.4B"
  replication: ReplicationMethod;
  domicile?: string;
  inceptionDate?: string;
  distributionType: DistributionType;
  distributionFrequency?: string;
  holdingsCount: number;
  indexTracked?: string;
}

export interface AssetFundamentals {
  pe?: number;
  pb?: number;
  dividendYield?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  revenuePerShare?: number;
  netIncomePerShare?: number;
  marketCap?: number;
  enterpriseValue?: number;
}

export interface AssetDocument {
  // Identity
  symbol: string;
  name: string;
  isin?: string;
  exchange: string;
  currency: string;

  // Classification
  category: AssetCategory;
  subcategory: string;
  isEtf: boolean;
  isFund: boolean;
  isActivelyTrading: boolean;

  // Profile
  description?: string;
  website?: string;
  logoUrl?: string;
  sector?: string;
  industry?: string;
  country?: string;
  ipoDate?: string;

  // Pricing (latest snapshot)
  livePrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  yearHigh?: number;
  yearLow?: number;

  // Fundamentals (stocks)
  fundamentals?: AssetFundamentals;

  // ETF-specific data
  etfData?: AssetETFData;

  // Metadata
  sources: string[]; // e.g. ['fmp', 'ishares-csv']
  lastUpdated: Date;
  lastPriceUpdate?: Date;
  lastHoldingsUpdate?: Date;
}

// -----------------------------------------------------------------------------
// Filter dimensions (for screener/search UI)
// -----------------------------------------------------------------------------

export interface AssetFilterDimensions {
  category?: AssetCategory;
  subcategory?: string;
  region?: string;
  country?: string;
  sector?: string;
  issuer?: string;
  indexTracked?: string;
  replication?: ReplicationMethod;
  distributionType?: DistributionType;
  domicile?: string;
  terMin?: number;
  terMax?: number;
  aumMin?: number;
  aumMax?: number;
}

// -----------------------------------------------------------------------------
// Portfolio context for AI chat (structured summary)
// -----------------------------------------------------------------------------

export interface PortfolioContextHolding {
  ticker: string;
  name: string;
  category: AssetCategory;
  qty: number;
  value: number;
  weight: number; // % of portfolio
  pnl: number;
  pnlPct: number;
  dayChange: number;
  account: string;
}

export interface PortfolioContext {
  holdings: PortfolioContextHolding[];
  totalValue: number;
  totalPnL: number;
  totalPnLPct: number;
  dayChange: number;
  dayChangePct: number;
  accountBreakdown: { account: string; value: number; pnl: number; pnlPct: number }[];
  topExposures: { ticker: string; name: string; totalWeight: number }[];
  sectorExposure: { sector: string; weight: number }[];
  countryExposure: { country: string; weight: number }[];
}
