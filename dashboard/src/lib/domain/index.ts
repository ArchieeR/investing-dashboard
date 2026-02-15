// =============================================================================
// Domain barrel export
// =============================================================================

export {
  CASH_BUFFER_NAME,
  CASH_BUFFER_PRICE,
  CASH_SECTION,
  IMPORTED_LABEL,
  createEmptyLists,
  createDefaultVisibleColumns,
  createEmptyPortfolio,
  createHolding,
  createInitialState,
  getActivePortfolio,
  generatePortfolioId,
  generateTradeId,
} from './factory';

export {
  calculateValue,
  calculateQtyFromValue,
  calculatePctOfTotal,
  calculateLiveDelta,
  calculateTargetDelta,
  roundToPennies,
  calculateValueForShare,
  calculateCashBufferQty,
  calculateProfitLoss,
  validatePercentage,
  safeDivide,
  getEffectivePrice,
} from './calculations';

export type {
  ValueInputs,
  LiveDeltaInput,
  LiveDeltaResult,
  TargetDeltaInput,
  TargetDeltaResult,
  ProfitLossInput,
  ProfitLossResult,
} from './calculations';

export {
  selectIncludedHoldings,
  selectTotalValue,
  selectTargetPortfolioValue,
  selectHoldingsWithDerived,
  selectBreakdownBySection,
  selectBreakdownByAccount,
  selectBreakdownByTheme,
  selectBudgetRemaining,
  calculateHoldingValue,
  calculateLivePortfolioTotals,
  calculateTargetHierarchy,
} from './selectors';

export type { HoldingDerived, BreakdownEntry, BudgetRemaining } from './selectors';

export {
  portfolioReducer,
  updateActivePortfolio,
  ensureCashPortfolio,
  applyBudgetsAndLock,
  adjustTotal,
  applyTradeToHolding,
} from './reducer';

export type { PortfolioAction } from './reducer';

export {
  holdingsToCsv,
  tradesToCsv,
  parseSpecCsv,
  parseInteractiveInvestorCsv,
  parseHlCsv,
  parseTradesCsv,
  parseHoldingsCsv,
  stripBom,
  parseCsvRow,
  normaliseBoolean,
  parseNumber,
  parseMoney,
  normaliseAssetType,
  escapeCsvValue,
} from './csv';

export type { HoldingCsvRow, TradeCsvRow } from './csv';

export {
  serializeAppState,
  deserializeAppState,
  loadState,
  saveState,
  clearState,
  STORAGE_KEY,
} from './persistence';

export {
  preserveChildPercentageRatios,
  getThemePercentagesInSection,
  getHoldingPercentagesInTheme,
  preserveThemeRatiosOnSectionChange,
  preserveHoldingRatiosOnThemeChange,
  calculateSectionCurrentPercent,
  calculateThemeCurrentPercent,
} from './budget-preservation';

export { cacheInvalidation } from './cache';
