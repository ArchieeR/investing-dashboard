import type { AppState } from '../state/types';

/**
 * Serialize app state for JSON storage by converting Date objects to strings
 */
export function serializeAppState(state: AppState): AppState {
  return {
    ...state,
    portfolios: state.portfolios.map(portfolio => ({
      ...portfolio,
      createdAt: portfolio.createdAt instanceof Date ? portfolio.createdAt.toISOString() : portfolio.createdAt,
      updatedAt: portfolio.updatedAt instanceof Date ? portfolio.updatedAt.toISOString() : portfolio.updatedAt,
      holdings: portfolio.holdings.map(holding => ({
        ...holding,
        livePriceUpdated: holding.livePriceUpdated instanceof Date 
          ? holding.livePriceUpdated.toISOString() 
          : holding.livePriceUpdated
      }))
    }))
  };
}

/**
 * Deserialize app state by converting date strings back to Date objects
 */
export function deserializeAppState(state: any): AppState {
  return {
    ...state,
    portfolios: state.portfolios.map((portfolio: any) => ({
      ...portfolio,
      createdAt: typeof portfolio.createdAt === 'string' ? new Date(portfolio.createdAt) : portfolio.createdAt,
      updatedAt: typeof portfolio.updatedAt === 'string' ? new Date(portfolio.updatedAt) : portfolio.updatedAt,
      holdings: portfolio.holdings.map((holding: any) => ({
        ...holding,
        livePriceUpdated: typeof holding.livePriceUpdated === 'string' 
          ? new Date(holding.livePriceUpdated) 
          : holding.livePriceUpdated
      }))
    }))
  };
}