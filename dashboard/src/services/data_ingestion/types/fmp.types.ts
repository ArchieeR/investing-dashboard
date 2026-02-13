import { z } from "zod";

// ============================================
// QUOTE SCHEMAS
// ============================================

export const FMPQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changesPercentage: z.number(),
  change: z.number(),
  dayLow: z.number(),
  dayHigh: z.number(),
  yearHigh: z.number(),
  yearLow: z.number(),
  marketCap: z.number(),
  priceAvg50: z.number().optional(),
  priceAvg200: z.number().optional(),
  volume: z.number(),
  avgVolume: z.number(),
  exchange: z.string(),
  open: z.number(),
  previousClose: z.number(),
  eps: z.number().nullable(),
  pe: z.number().nullable(),
  earningsAnnouncement: z.string().nullable(),
  sharesOutstanding: z.number(),
  timestamp: z.number(),
});
export type FMPQuote = z.infer<typeof FMPQuoteSchema>;

export const FMPQuoteShortSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});
export type FMPQuoteShort = z.infer<typeof FMPQuoteShortSchema>;

// ============================================
// PRICE CHANGE SCHEMAS
// ============================================

export const FMPPriceChangeSchema = z.object({
  symbol: z.string(),
  "1D": z.number().optional(),
  "5D": z.number().optional(),
  "1M": z.number().optional(),
  "3M": z.number().optional(),
  "6M": z.number().optional(),
  ytd: z.number().optional(),
  "1Y": z.number().optional(),
  "3Y": z.number().optional(),
  "5Y": z.number().optional(),
  "10Y": z.number().optional(),
  max: z.number().optional(),
});
export type FMPPriceChange = z.infer<typeof FMPPriceChangeSchema>;

// ============================================
// HISTORICAL DATA SCHEMAS
// ============================================

export const FMPHistoricalPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  adjClose: z.number(),
  volume: z.number(),
  unadjustedVolume: z.number().optional(),
  change: z.number(),
  changePercent: z.number(),
  vwap: z.number().optional(),
  label: z.string().optional(),
  changeOverTime: z.number().optional(),
});
export type FMPHistoricalPrice = z.infer<typeof FMPHistoricalPriceSchema>;

export const FMPHistoricalResponseSchema = z.object({
  symbol: z.string(),
  historical: z.array(FMPHistoricalPriceSchema),
});
export type FMPHistoricalResponse = z.infer<typeof FMPHistoricalResponseSchema>;

export const FMPIntradayPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type FMPIntradayPrice = z.infer<typeof FMPIntradayPriceSchema>;

// ============================================
// PROFILE & COMPANY SCHEMAS
// ============================================

export const FMPProfileSchema = z.object({
  symbol: z.string(),
  companyName: z.string(),
  currency: z.string(),
  cik: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  exchange: z.string(),
  exchangeShortName: z.string(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  country: z.string().optional(),
  fullTimeEmployees: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
  image: z.string().optional(),
  ipoDate: z.string().optional(),
  defaultImage: z.boolean().optional(),
  isEtf: z.boolean(),
  isActivelyTrading: z.boolean(),
  isFund: z.boolean().optional(),
  isAdr: z.boolean().optional(),
  description: z.string().optional(),
});
export type FMPProfile = z.infer<typeof FMPProfileSchema>;

// ============================================
// ETF SCHEMAS
// ============================================

export const FMPETFHoldingSchema = z.object({
  asset: z.string(),
  name: z.string().optional(),
  isin: z.string().optional(),
  cusip: z.string().optional(),
  shares: z.number(),
  weightPercentage: z.number(),
  marketValue: z.number().optional(),
  updated: z.string(),
});
export type FMPETFHolding = z.infer<typeof FMPETFHoldingSchema>;

export const FMPETFInfoSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  expenseRatio: z.number().optional(),
  aum: z.number().optional(),
  avgVolume: z.number().optional(),
  domicile: z.string().optional(),
  inceptionDate: z.string().optional(),
  etfCompany: z.string().optional(),
});
export type FMPETFInfo = z.infer<typeof FMPETFInfoSchema>;

export const FMPSectorWeightingSchema = z.object({
  sector: z.string(),
  weightPercentage: z.string(),
});
export type FMPSectorWeighting = z.infer<typeof FMPSectorWeightingSchema>;

export const FMPCountryWeightingSchema = z.object({
  country: z.string(),
  weightPercentage: z.string(),
});
export type FMPCountryWeighting = z.infer<typeof FMPCountryWeightingSchema>;

// ============================================
// SEARCH SCHEMAS
// ============================================

export const FMPSearchResultSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  currency: z.string().optional(),
  stockExchange: z.string().optional(),
  exchangeShortName: z.string().optional(),
});
export type FMPSearchResult = z.infer<typeof FMPSearchResultSchema>;

// ============================================
// KEY METRICS SCHEMAS
// ============================================

export const FMPKeyMetricsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  period: z.string(),
  revenuePerShare: z.number().optional(),
  netIncomePerShare: z.number().optional(),
  operatingCashFlowPerShare: z.number().optional(),
  freeCashFlowPerShare: z.number().optional(),
  cashPerShare: z.number().optional(),
  bookValuePerShare: z.number().optional(),
  marketCap: z.number().optional(),
  enterpriseValue: z.number().optional(),
  peRatio: z.number().nullable(),
  priceToSalesRatio: z.number().optional(),
  pbRatio: z.number().optional(),
  evToSales: z.number().optional(),
  enterpriseValueOverEBITDA: z.number().optional(),
  evToOperatingCashFlow: z.number().optional(),
  evToFreeCashFlow: z.number().optional(),
  earningsYield: z.number().optional(),
  freeCashFlowYield: z.number().optional(),
  debtToEquity: z.number().nullable(),
  debtToAssets: z.number().optional(),
  currentRatio: z.number().optional(),
  dividendYield: z.number().nullable(),
  payoutRatio: z.number().optional(),
  roic: z.number().optional(),
  roe: z.number().optional(),
  roa: z.number().optional(),
});
export type FMPKeyMetrics = z.infer<typeof FMPKeyMetricsSchema>;

// ============================================
// NEWS SCHEMAS
// ============================================

export const FMPStockNewsSchema = z.object({
  symbol: z.string(),
  publishedDate: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  site: z.string(),
  text: z.string(),
  url: z.string(),
});
export type FMPStockNews = z.infer<typeof FMPStockNewsSchema>;

// ============================================
// ANALYST SCHEMAS
// ============================================

export const FMPPriceTargetConsensusSchema = z.object({
  symbol: z.string(),
  targetHigh: z.number(),
  targetLow: z.number(),
  targetConsensus: z.number(),
  targetMedian: z.number(),
});
export type FMPPriceTargetConsensus = z.infer<typeof FMPPriceTargetConsensusSchema>;

export const FMPGradesConsensusSchema = z.object({
  symbol: z.string(),
  strongBuy: z.number(),
  buy: z.number(),
  hold: z.number(),
  sell: z.number(),
  strongSell: z.number(),
  consensus: z.string(),
});
export type FMPGradesConsensus = z.infer<typeof FMPGradesConsensusSchema>;

// ============================================
// CALENDAR SCHEMAS
// ============================================

export const FMPEarningsCalendarSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  eps: z.number().nullable(),
  epsEstimated: z.number().nullable(),
  time: z.string().optional(),
  revenue: z.number().nullable(),
  revenueEstimated: z.number().nullable(),
  fiscalDateEnding: z.string().optional(),
  updatedFromDate: z.string().optional(),
});
export type FMPEarningsCalendar = z.infer<typeof FMPEarningsCalendarSchema>;

export const FMPDividendCalendarSchema = z.object({
  date: z.string(),
  label: z.string().optional(),
  symbol: z.string(),
  dividend: z.number(),
  recordDate: z.string().optional(),
  paymentDate: z.string().optional(),
  declarationDate: z.string().optional(),
});
export type FMPDividendCalendar = z.infer<typeof FMPDividendCalendarSchema>;

// ============================================
// MARKET OVERVIEW SCHEMAS
// ============================================

export const FMPSectorPerformanceSchema = z.object({
  sector: z.string(),
  changesPercentage: z.string(),
});
export type FMPSectorPerformance = z.infer<typeof FMPSectorPerformanceSchema>;

export const FMPMarketMoverSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  change: z.number(),
  price: z.number(),
  changesPercentage: z.number(),
});
export type FMPMarketMover = z.infer<typeof FMPMarketMoverSchema>;
