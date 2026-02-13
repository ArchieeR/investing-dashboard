// =============================================================================
// State Serialization - Handles Date <-> string conversion for JSON persistence
// Ported from _portfolio-reference/src/utils/serializeState.ts
// =============================================================================

import type { AppState } from '@/types/portfolio';

export function serializeAppState(state: AppState): AppState {
  return {
    ...state,
    portfolios: state.portfolios.map((portfolio) => ({
      ...portfolio,
      createdAt:
        portfolio.createdAt instanceof Date
          ? (portfolio.createdAt.toISOString() as unknown as Date)
          : portfolio.createdAt,
      updatedAt:
        portfolio.updatedAt instanceof Date
          ? (portfolio.updatedAt.toISOString() as unknown as Date)
          : portfolio.updatedAt,
      holdings: portfolio.holdings.map((holding) => ({
        ...holding,
        livePriceUpdated:
          holding.livePriceUpdated instanceof Date
            ? (holding.livePriceUpdated.toISOString() as unknown as Date)
            : holding.livePriceUpdated,
      })),
    })),
  };
}

export function deserializeAppState(state: unknown): AppState {
  const raw = state as Record<string, unknown>;
  const portfolios = raw.portfolios as Array<Record<string, unknown>>;

  return {
    ...(raw as unknown as AppState),
    portfolios: portfolios.map((portfolio) => ({
      ...(portfolio as unknown as AppState['portfolios'][number]),
      createdAt:
        typeof portfolio.createdAt === 'string'
          ? new Date(portfolio.createdAt)
          : (portfolio.createdAt as Date),
      updatedAt:
        typeof portfolio.updatedAt === 'string'
          ? new Date(portfolio.updatedAt)
          : (portfolio.updatedAt as Date),
      holdings: (portfolio.holdings as Array<Record<string, unknown>>).map((holding) => ({
        ...(holding as unknown as AppState['portfolios'][number]['holdings'][number]),
        livePriceUpdated:
          typeof holding.livePriceUpdated === 'string'
            ? new Date(holding.livePriceUpdated)
            : (holding.livePriceUpdated as Date | undefined),
      })),
    })),
  };
}
