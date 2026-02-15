import { describe, it, expect } from 'vitest';
import { serializeAppState, deserializeAppState, STORAGE_KEY } from './persistence';
import { createInitialState, createHolding } from './factory';

describe('STORAGE_KEY', () => {
  it('has expected value', () => {
    expect(STORAGE_KEY).toBe('portfolio-manager-state');
  });
});

describe('serializeAppState', () => {
  it('converts Date objects to ISO strings', () => {
    const state = createInitialState();
    const serialized = serializeAppState(state);

    // Dates are cast to strings at runtime but typed as Date
    const createdAt = serialized.portfolios[0].createdAt as unknown as string;
    expect(typeof createdAt).toBe('string');
    expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves non-date fields', () => {
    const state = createInitialState();
    const serialized = serializeAppState(state);
    expect(serialized.activePortfolioId).toBe(state.activePortfolioId);
    expect(serialized.portfolios.length).toBe(state.portfolios.length);
  });

  it('serializes livePriceUpdated on holdings', () => {
    const state = createInitialState();
    const holding = { ...createHolding(), livePriceUpdated: new Date('2024-01-15T12:00:00Z') };
    state.portfolios[0].holdings.push(holding);

    const serialized = serializeAppState(state);
    const serializedHolding = serialized.portfolios[0].holdings[0];
    const livePriceUpdated = serializedHolding.livePriceUpdated as unknown as string;
    expect(typeof livePriceUpdated).toBe('string');
  });
});

describe('deserializeAppState', () => {
  it('converts ISO strings back to Date objects', () => {
    const raw = {
      portfolios: [
        {
          id: 'p1',
          name: 'Test',
          type: 'actual',
          createdAt: '2024-01-15T12:00:00.000Z',
          updatedAt: '2024-01-15T12:00:00.000Z',
          holdings: [],
          lists: { sections: [], themes: [], accounts: [], themeSections: {} },
          settings: {
            currency: 'GBP',
            lockTotal: false,
            enableLivePrices: true,
            livePriceUpdateInterval: 10,
            visibleColumns: {},
          },
          budgets: { sections: {}, accounts: {}, themes: {} },
          trades: [],
        },
      ],
      activePortfolioId: 'p1',
      playground: { enabled: false },
      filters: {},
    };

    const deserialized = deserializeAppState(raw);
    expect(deserialized.portfolios[0].createdAt).toBeInstanceOf(Date);
    expect(deserialized.portfolios[0].updatedAt).toBeInstanceOf(Date);
  });

  it('handles livePriceUpdated in holdings', () => {
    const raw = {
      portfolios: [
        {
          id: 'p1',
          name: 'Test',
          type: 'actual',
          createdAt: new Date(),
          updatedAt: new Date(),
          holdings: [
            {
              id: 'h1',
              name: 'VWRL',
              ticker: 'VWRL.L',
              price: 100,
              qty: 10,
              include: true,
              section: 'Core',
              theme: 'All',
              assetType: 'ETF',
              exchange: 'LSE',
              account: 'ISA',
              livePriceUpdated: '2024-01-15T12:00:00.000Z',
            },
          ],
          lists: { sections: [], themes: [], accounts: [], themeSections: {} },
          settings: {
            currency: 'GBP',
            lockTotal: false,
            enableLivePrices: true,
            livePriceUpdateInterval: 10,
            visibleColumns: {},
          },
          budgets: { sections: {}, accounts: {}, themes: {} },
          trades: [],
        },
      ],
      activePortfolioId: 'p1',
      playground: { enabled: false },
      filters: {},
    };

    const deserialized = deserializeAppState(raw);
    expect(deserialized.portfolios[0].holdings[0].livePriceUpdated).toBeInstanceOf(Date);
  });
});

describe('round-trip serialization', () => {
  it('serialize then deserialize returns equivalent state', () => {
    const state = createInitialState();
    const serialized = serializeAppState(state);
    const json = JSON.parse(JSON.stringify(serialized));
    const deserialized = deserializeAppState(json);

    expect(deserialized.activePortfolioId).toBe(state.activePortfolioId);
    expect(deserialized.portfolios.length).toBe(state.portfolios.length);
    expect(deserialized.portfolios[0].createdAt).toBeInstanceOf(Date);
    expect(deserialized.portfolios[0].name).toBe(state.portfolios[0].name);
  });
});
