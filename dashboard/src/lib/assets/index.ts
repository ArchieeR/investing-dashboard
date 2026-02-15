// Asset database barrel exports
export {
  getAsset,
  getPortfolioAssets,
  populateAssetFromFMP,
  populateETFHoldings,
  refreshAsset,
} from './service';

export { categorizeAsset } from './taxonomy';

export { fetchETFHoldings } from './providers';
export type { ETFHoldingsResult, HoldingsSource } from './providers';
